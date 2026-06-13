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
#   The ONLY adaptation below is the subpath construction order
#   (RUNTIME_PREFIXED toggle). All other logic — discovery, EXCLUDED_KEYS,
#   --min-bytes, --ga-mode, --json, registry cross-check — is unchanged.
#   Tracking: flag back to skill owner so the skill gains a --layout flag
#   (runtime-prefixed | category-prefixed) and this vendored copy can return
#   to verbatim.
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
import sys
from pathlib import Path
from typing import Optional

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


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
        default="packages/mosaic",
        help="Path to the Mosaic package root containing package.json and dist/",
    )
    parser.add_argument(
        "--registry",
        default=None,
        help="Path to registry YAML (default: <package-root>/registry/index.yaml)",
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
        print(f"ERROR: Package root not found at {p}. Aborting.", file=sys.stderr)
        sys.exit(1)
    pkg_json = p / "package.json"
    if not pkg_json.exists():
        print(f"ERROR: package.json not found at {pkg_json}. Aborting.", file=sys.stderr)
        sys.exit(1)
    return p


def load_exports(package_root: Path) -> dict:
    pkg_json = package_root / "package.json"
    with pkg_json.open() as f:
        data = json.load(f)
    return data.get("exports", {})


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


def load_registry(registry_path: Path) -> Optional[set]:
    """Return set of category names from registry YAML, or None if unavailable."""
    if not registry_path.exists():
        print(
            f"WARNING: registry not found at {registry_path} — skipping registry cross-check (Step 5)",
            file=sys.stderr,
        )
        return None
    if not HAS_YAML:
        print(
            "WARNING: PyYAML not installed — skipping registry cross-check (Step 5). "
            "Install with: pip install pyyaml",
            file=sys.stderr,
        )
        return None
    with registry_path.open() as f:
        data = yaml.safe_load(f)
    components = data.get("components", [])
    return {c["category"] for c in components if "category" in c}


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
    return None


def run_check(
    package_root: Path,
    registry_path: Path,
    ga_mode: bool,
    min_bytes: int,
) -> dict:
    exports = load_exports(package_root)
    categories = discover_categories(exports, ga_mode)
    registry_categories = load_registry(registry_path)

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


def emit_human(result: dict, package_root: Path, registry_path: Path, categories_count: int) -> None:
    print("Mosaic cross-runtime subpath coverage check")
    print(f"Package root : {package_root}")
    print(f"Registry     : {registry_path}")
    print(f"Categories   : {categories_count} bare exports found")
    print()
    if result["pass"]:
        print(f"PASS (0 missing entries)")
        print()
        print(f"All {categories_count} categories have non-empty /react and /preact counterparts.")
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

    if args.registry:
        registry_path = Path(args.registry).resolve()
    else:
        registry_path = package_root / "registry" / "index.yaml"
        if not registry_path.exists():
            fallback = package_root / "registry.yaml"
            if fallback.exists():
                registry_path = fallback

    exports = load_exports(package_root)
    categories = discover_categories(exports, args.ga_mode)

    result = run_check(package_root, registry_path, args.ga_mode, args.min_bytes)

    if args.json_output:
        print(json.dumps(result, indent=2))
    else:
        emit_human(result, package_root, registry_path, len(categories))

    sys.exit(0 if result["pass"] else 1)


if __name__ == "__main__":
    main()
