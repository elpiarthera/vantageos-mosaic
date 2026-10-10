#!/usr/bin/env python3
# =============================================================================
# VENDORED from skill mosaic-cross-runtime-subpath-coverage-check (B-PR1, PR #20).
# Canonical source = VantageRegistry get_skill_content
#   (name=mosaic-cross-runtime-subpath-coverage-check).
# Keep in sync — do not edit logic here without updating the skill.
#
# DEVIATION FROM CANONICAL (documented, must be reconciled upstream):
#   The canonical check.py assumes a CATEGORY-PREFIXED subpath layout
#   (e.g. "./forms/react", "./forms/preact"). vantageos-mosaic ships a
#   RUNTIME-PREFIXED layout instead (e.g. "./react/forms", "./preact/forms",
#   with dist at dist/react/forms.js / dist/preact/forms.js — see
#   scripts/verify-build-parity.sh Gate 1 and package.json exports).
#   Running the canonical script verbatim on this repo yields a FALSE-POSITIVE
#   FAIL (all categories "not-in-exports-map") because it inspects keys that
#   do not exist here, and — critically — it would NOT have caught the real
#   v0.3.0 GA blocker, which was about MISSING ./react/<cat> + ./preact/<cat>
#   entries (runtime-prefixed).
#   The FIRST adaptation below is the subpath construction order
#   (RUNTIME_PREFIXED toggle). The rest — discovery, EXCLUDED_KEYS,
#   --min-bytes, --ga-mode, --json — is unchanged apart from the SECOND DEVIATION below.
#   Tracking: flag back to skill owner so the skill gains a --layout flag
#   (runtime-prefixed | category-prefixed) and this vendored copy can return
#   to verbatim.
#
# SECOND DEVIATION (fail-closed; the canonical skill v1.0.0 has the same defects, reported
# upstream, registry NOT edited from here):
#   - exit codes: 0 pass, 1 coverage gap, 2 an input could not be read (package root,
#     package.json, registry, built entries, empty category set). The canonical skill leaves the
#     abort exit code unspecified and downgrades a missing registry to a WARNING.
#   - default --package-root is the package this script lives in, not "packages/mosaic" relative
#     to the working directory (the canonical default is cwd-relative).
#   - the registry cross-check never skips: PyYAML absent -> built-in reader; registry absent ->
#     exit 2 unless --skip-registry-check is passed explicitly.
# =============================================================================
"""
mosaic-cross-runtime-subpath-coverage-check — check.py
Reference implementation for skill mosaic-cross-runtime-subpath-coverage-check v1.0.0

Usage:
  python3 check.py [--package-root <path>] [--registry <path>]
                   [--ga-mode] [--json] [--min-bytes <N>]

Exit code: 0 if pass, 1 if fail or error.

Skill canonical source: VantageRegistry (get_skill_content name=mosaic-cross-runtime-subpath-coverage-check)
Mission: k57b6d1b  Parent task: k17by79cyj0010p5tphwbyhr9d88jf6n
Hook consumer (B-PR2): k173xamrbhy85at4wdseh80t4988k8f5
CI consumer (B-PR3): this repo, .github/workflows/ci.yml "Gate 4 — Cross-runtime subpath coverage"
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import NoReturn, Optional

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


# Exit codes: 0 = pass, 1 = a genuine coverage failure, 2 = an input the check could not read.
# The two are distinct on purpose: an unreadable input must never look like a pass, and must not be
# confused with a real gap. Every unreadable-input path goes through die().
EXIT_FAIL = 1
EXIT_UNREADABLE = 2


def die(what: str) -> "NoReturn":
    print(f"ERROR: {what}. Aborting (exit {EXIT_UNREADABLE}).", file=sys.stderr)
    sys.exit(EXIT_UNREADABLE)


# Default package root: the package this script lives in (scripts/ is one level below it),
# never the working directory.
DEFAULT_PACKAGE_ROOT = Path(__file__).resolve().parent.parent

# Categories that are NOT component categories even if they look like bare subpaths
EXCLUDED_KEYS = {".", "./react", "./preact", "./tokens", "./server", "./registry.yaml"}

# DEVIATION (see header): vantageos-mosaic exports are runtime-prefixed
# (./react/<cat>, ./preact/<cat>). The canonical skill assumes category-prefixed
# (./<cat>/react). When True, subpaths are built as "./<runtime>/<cat>".
RUNTIME_PREFIXED = True


def _subpath(cat: str, runtime: str) -> str:
    if RUNTIME_PREFIXED:
        return f"./{runtime}/{cat}"
    return f"./{cat}/{runtime}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify Mosaic cross-runtime subpath coverage (bare → /react + /preact)"
    )
    parser.add_argument(
        "--package-root",
        default=str(DEFAULT_PACKAGE_ROOT),
        help="Path to the Mosaic package root containing package.json and dist/ "
        "(default: the package this script lives in, whatever the working directory)",
    )
    parser.add_argument(
        "--registry",
        default=None,
        help="Path to registry YAML (default: <package-root>/registry/index.yaml)",
    )
    parser.add_argument(
        "--skip-registry-check",
        action="store_true",
        help="Do not cross-check the registry (explicit opt-out; a missing registry is otherwise exit 2)",
    )
    parser.add_argument(
        "--ga-mode",
        action="store_true",
        help="Suppress wildcard exports (* keys) and treat only explicit subpaths",
    )
    parser.add_argument(
        "--json",
        dest="json_output",
        action="store_true",
        help="Emit raw JSON to stdout instead of human-readable summary",
    )
    parser.add_argument(
        "--min-bytes",
        type=int,
        default=50,
        help="Minimum file size in bytes to consider a dist file non-empty (default: 50)",
    )
    return parser.parse_args()


def resolve_package_root(raw_path: str) -> Path:
    p = Path(raw_path).resolve()
    if not p.exists():
        die(f"Package root not found at {p}")
    pkg_json = p / "package.json"
    if not pkg_json.is_file():
        die(f"package.json not found at {pkg_json}")
    return p


def load_exports(package_root: Path) -> dict:
    pkg_json = package_root / "package.json"
    try:
        with pkg_json.open() as f:
            data = json.load(f)
    except (OSError, ValueError) as err:
        die(f"could not read {pkg_json}: {err}")
    exports = data.get("exports") if isinstance(data, dict) else None
    if not isinstance(exports, dict):
        die(f"{pkg_json} has no readable \"exports\" map")
    return exports


def discover_categories(exports: dict, ga_mode: bool) -> list[str]:
    """Return bare-import category names (e.g. 'forms' from './forms')."""
    categories = []
    for key in exports:
        if key in EXCLUDED_KEYS:
            continue
        if not key.startswith("./"):
            continue
        suffix = key[2:]  # strip "./"
        if "/" in suffix:
            continue  # not a bare key
        if ga_mode and "*" in suffix:
            continue  # wildcard — skip in ga-mode
        categories.append(suffix)
    return sorted(categories)


def load_registry(registry_path: Path) -> set:
    """
    Category names declared in the registry YAML. Reads the file itself (no PyYAML needed: the
    registry shape is `components:` -> items with a `category:` line), so the cross-check can
    never be silently skipped. An unreadable registry is exit 2.
    """
    if not registry_path.is_file():
        die(f"registry not found at {registry_path} (pass --skip-registry-check to opt out)")
    try:
        text = registry_path.read_text(encoding="utf-8")
    except OSError as err:
        die(f"could not read registry {registry_path}: {err}")
    if HAS_YAML:
        try:
            data = yaml.safe_load(text)
        except yaml.YAMLError as err:
            die(f"registry {registry_path} is not valid YAML: {err}")
        components = (data or {}).get("components", []) if isinstance(data, dict) else []
        return {c["category"] for c in components if isinstance(c, dict) and "category" in c}
    return set(re.findall(r"(?m)^\s+category:\s*[\"']?([\w-]+)[\"']?\s*$", text))


def count_exported_symbols(text: str) -> int:
    """
    Count the symbols a built ESM/d.ts entry exports. Zero means the entry is a
    shell: byte size cannot tell (a sourcemap comment alone exceeds --min-bytes).

    Export forms recognised (the ES module export grammar, closed set):
      export { a, b as c }            (also `export { a } from "x"`, `export type { T }`)
      export * from "x"  /  export * as ns from "x"
      export [declare] const|let|var|function|class|interface|type|enum|namespace|abstract|async NAME
      export default ...
    `export {}` (no names) counts 0. Anything else counts 0 and the entry is
    reported by name: the check fails closed, it never skips an entry it cannot read.
    """
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)//.*$", "", text)
    n = 0
    for m in re.finditer(r"\bexport\s+(?:type\s+)?\{([^}]*)\}", text):
        n += len([x for x in m.group(1).split(",") if x.strip()])
    n += len(re.findall(r"\bexport\s*\*", text))
    n += len(re.findall(
        r"\bexport\s+(?:declare\s+)?(?:default\b|const\b|let\b|var\b|function\b|class\b|"
        r"interface\b|type\b\s+\w|enum\b|namespace\b|abstract\b|async\b)",
        text,
    ))
    return n


def check_file(exports: dict, exports_key: str, package_root: Path, min_bytes: int):
    """
    Check one exports key (e.g. './react/forms').
    Returns a reason string if it fails, or None if it passes.
    """
    if exports_key not in exports:
        return "not-in-exports-map"
    entry = exports[exports_key]
    # Prefer 'import' field; fall back to 'module' then 'require'
    dist_rel = entry.get("import") or entry.get("module") or entry.get("require")
    if not dist_rel:
        return "no-import-field"
    dist_abs = (package_root / dist_rel).resolve()
    if not dist_abs.exists():
        return "file-not-found"
    size = dist_abs.stat().st_size
    if size < min_bytes:
        return f"file-empty"
    # Content, not presence: consumers import symbols. Check BOTH surfaces they
    # resolve through the exports map: the runtime entry ("import") and the type
    # entry ("types"). A populated entry must export >= 1 symbol on each.
    types_rel = entry.get("types")
    if not types_rel:
        return "no-types-field"
    types_abs = (package_root / types_rel).resolve()
    if not types_abs.exists():
        return f"types-file-not-found ({types_rel})"
    for rel, path in ((dist_rel, dist_abs), (types_rel, types_abs)):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as err:
            die(f"could not read built entry {path}: {err}")
        if count_exported_symbols(text) == 0:
            return f"exports-zero-symbols ({rel})"
    return None


def run_check(
    package_root: Path,
    registry_path: Optional[Path],
    ga_mode: bool,
    min_bytes: int,
) -> dict:
    exports = load_exports(package_root)
    categories = discover_categories(exports, ga_mode)
    if not categories:
        die(f"no bare category exports found in {package_root / 'package.json'} (nothing to check would pass vacuously)")
    registry_categories = load_registry(registry_path) if registry_path is not None else None

    missing = []

    # Step 4 — verify each bare-export category
    for cat in categories:
        for runtime in ("react", "preact"):
            subpath = _subpath(cat, runtime)
            reason = check_file(exports, subpath, package_root, min_bytes)
            if reason:
                missing.append({
                    "component": cat,
                    "subpath": subpath,
                    "reason": reason,
                })

    # Step 5 — registry cross-check
    if registry_categories is not None:
        for rcat in sorted(registry_categories):
            checks = (
                (f"./{rcat}", "registry-declared-no-bare-export"),
                (_subpath(rcat, "react"), "registry-declared-no-react-export"),
                (_subpath(rcat, "preact"), "registry-declared-no-preact-export"),
            )
            for subpath, reason in checks:
                # Check if this is already in missing (dedup)
                already = any(
                    m["component"] == rcat and m["subpath"] == subpath
                    for m in missing
                )
                if already:
                    continue
                if subpath not in exports:
                    missing.append({
                        "component": rcat,
                        "subpath": subpath,
                        "reason": reason,
                    })

    return {
        "pass": len(missing) == 0,
        "missing": missing,
    }


def emit_human(result: dict, package_root: Path, registry_path: Optional[Path], categories_count: int) -> None:
    print("Mosaic cross-runtime subpath coverage check")
    print(f"Package root : {package_root}")
    print(f"Registry     : {registry_path if registry_path is not None else '(skipped by --skip-registry-check)'}")
    print(f"Categories   : {categories_count} bare exports found")
    print()
    if result["pass"]:
        print(f"PASS (0 missing entries)")
        print()
        print(f"All {categories_count} categories have /react and /preact counterparts exporting at least one symbol.")
    else:
        n = len(result["missing"])
        print(f"FAIL ({n} missing {'entry' if n == 1 else 'entries'})")
        print()
        print("Missing entries:")
        for m in result["missing"]:
            comp = m["component"]
            sub = m["subpath"]
            reason = m["reason"]
            print(f"  [{comp:<14}] {sub:<30} — {reason}")


def main() -> None:
    args = parse_args()
    package_root = resolve_package_root(args.package_root)

    registry_path: Optional[Path]
    if args.skip_registry_check:
        registry_path = None
    elif args.registry:
        registry_path = Path(args.registry).resolve()
    else:
        registry_path = package_root / "registry" / "index.yaml"
        if not registry_path.exists():
            registry_path = package_root / "registry.yaml"

    exports = load_exports(package_root)
    categories = discover_categories(exports, args.ga_mode)

    result = run_check(package_root, registry_path, args.ga_mode, args.min_bytes)

    if args.json_output:
        print(json.dumps(result, indent=2))
    else:
        emit_human(result, package_root, registry_path, len(categories))

    sys.exit(0 if result["pass"] else EXIT_FAIL)


if __name__ == "__main__":
    main()
