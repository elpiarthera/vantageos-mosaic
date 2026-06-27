# @vantageos/mosaic-i18n

[![npm version](https://img.shields.io/npm/v/@vantageos/mosaic-i18n)](https://www.npmjs.com/package/@vantageos/mosaic-i18n)
[![License: FSL-1.1-Apache-2.0](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-blue)](LICENSE)

**FR+EN locale resources and react-i18next wiring for `@vantageos/mosaic`.** Bilingual by design — ships French and English out of the box, with override support for any string at runtime.

---

## 1. Hero & Positioning

`@vantageos/mosaic-i18n` is the **internationalization layer** of the VantageOS Mosaic design system. It provides:

- Curated FR+EN JSON locale files for all `@vantageos/mosaic` components
- `initMosaicI18n()` — one-call setup wired to `react-i18next`
- `mergeMosaicTranslations()` — runtime override for custom string overrides
- Typed `MosaicLocale` — union `"en" | "fr"` for compile-time locale safety
- Tree-shakeable ESM + CJS dual build

This package is a peer of `@vantageos/mosaic-blocks`. For the full component library, see [`@vantageos/mosaic-blocks`](https://www.npmjs.com/package/@vantageos/mosaic-blocks).

---

## 2. Why This Package (vs DIY i18next setup)

| | mosaic-i18n | Manual i18next | react-intl |
|---|---|---|---|
| FR+EN mosaic strings pre-bundled | Yes | No | No |
| One-line init | Yes | No | No |
| Runtime override (no rebuild) | Yes | Requires custom setup | No |
| Type-safe locale union | Yes | No | Partial |
| Tree-shakeable (ESM) | Yes | Depends | No |
| 0 runtime dependencies beyond peer deps | Yes | N/A | No |

If you use `@vantageos/mosaic-blocks`, you need this package to get localized ARIA labels, validation messages, and UI strings in both FR and EN.

---

## 3. Install

```bash
pnpm add @vantageos/mosaic-i18n
```

### Peer dependencies

| Package | Min version | Required |
|---|---|---|
| `i18next` | `^25.0.0` | Yes |
| `react-i18next` | `15.5.2` | Yes |

```bash
pnpm add @vantageos/mosaic-i18n i18next react-i18next
```

---

## 4. Quick Start (30 seconds)

```tsx
// app/layout.tsx or _app.tsx — initialize once at root
import { initMosaicI18n } from "@vantageos/mosaic-i18n";

initMosaicI18n("fr"); // or "en" — defaults to "en" if omitted

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
```

That is all. All `@vantageos/mosaic` components will now render in French.

---

## 5. Configuration

### Initialization options

```ts
import { initMosaicI18n, type MosaicLocale } from "@vantageos/mosaic-i18n";

// Signature
function initMosaicI18n(defaultLocale?: MosaicLocale): i18n;
// MosaicLocale = "en" | "fr"

// Default — English
initMosaicI18n();

// French
initMosaicI18n("fr");
```

`initMosaicI18n` is idempotent — safe to call multiple times. Only the first call initializes the i18next instance. Returns the configured `i18n` instance for chaining.

### Using with an existing i18next instance

If your app already uses i18next, merge the mosaic namespace manually:

```ts
import i18next from "i18next";
import en from "@vantageos/mosaic-i18n/locales/en.json";
import fr from "@vantageos/mosaic-i18n/locales/fr.json";

// Add mosaic namespace to your existing instance
i18next.addResourceBundle("en", "mosaic", en, true, false);
i18next.addResourceBundle("fr", "mosaic", fr, true, false);
```

---

## 6. Component Catalogue Summary

This package ships locale strings for **all `@vantageos/mosaic` components**. Key namespace groups:

| Component group | Namespace keys | Example |
|---|---|---|
| ConfirmDialog | `ConfirmDialog.button.*`, `ConfirmDialog.aria.*` | `button.confirm`, `button.cancel` |
| TableView | `TableView.pagination.*`, `TableView.empty.*` | `pagination.next`, `empty.message` |
| ProgressBar | `ProgressBar.aria.*`, `ProgressBar.error.*` | `aria.label` |
| TokenDisplayOnceModal | `TokenDisplayOnceModal.title`, `TokenDisplayOnceModal.body.*` | — |
| StatusBadge | `StatusBadge.aria.*` | `aria.label` |
| Forms | `Forms.validation.*`, `Forms.placeholder.*` | `validation.required` |

Full key reference: `@vantageos/mosaic-i18n/locales/en.json` and `@vantageos/mosaic-i18n/locales/fr.json`.

For component docs and import paths, see [`@vantageos/mosaic-blocks` → docs/components-catalog.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/components-catalog.md).

---

## 7. Auth Integration

Not applicable for this package directly — `@vantageos/mosaic-i18n` does not ship auth components.

Auth-related locale strings (sign-in labels, RBAC role names, org switcher text) are consumed by `@vantageos/mosaic-blocks`. Initialize `mosaic-i18n` before rendering auth components to get localized output. See [`@vantageos/mosaic-blocks` → docs/auth.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/auth.md) for the full auth integration guide.

---

## 8. Mobile-First

Not applicable for this package directly — `@vantageos/mosaic-i18n` is framework-agnostic locale data with no rendering layer.

Mobile-specific UI strings (e.g., `AdaptiveNavigation` drawer labels, `AdaptiveModal` close buttons) are included in the locale files and will render correctly when the corresponding `@vantageos/mosaic-blocks` components are used. See [`@vantageos/mosaic-blocks` → docs/mobile-first.md](https://github.com/vantageos-agency/mosaic-blocks/blob/main/docs/mobile-first.md).

---

## 9. i18n — Core Features

### Language switching at runtime

```tsx
import { i18n } from "@vantageos/mosaic-i18n";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n: reactI18n } = useTranslation();

  return (
    <div>
      <button type="button" onClick={() => reactI18n.changeLanguage("fr")}>
        Français
      </button>
      <button type="button" onClick={() => reactI18n.changeLanguage("en")}>
        English
      </button>
    </div>
  );
}
```

### Overriding individual strings

```ts
import i18next from "i18next";

// Override a single string at runtime — no rebuild needed
i18next.addResourceBundle(
  "fr",
  "mosaic",
  { "ConfirmDialog": { "button": { "confirm": "Valider" } } },
  true,   // deep merge
  true,   // override
);
```

### Direct locale file import (non-React environments)

```ts
import en from "@vantageos/mosaic-i18n/locales/en.json";
import fr from "@vantageos/mosaic-i18n/locales/fr.json";

// Use raw JSON in any context — vanilla JS, Node.js scripts, test fixtures
console.log(en.ConfirmDialog.button.confirm); // "Confirm"
console.log(fr.ConfirmDialog.button.confirm); // "Confirmer"
```

---

## 10. Theming

Not applicable for this package — theming is handled by `@vantageos/mosaic-tokens`. See [Section 17 — Credits](#17-credits).

---

## 11. TypeScript

`@vantageos/mosaic-i18n` ships full TypeScript declarations:

```ts
import type { MosaicLocale } from "@vantageos/mosaic-i18n";

// MosaicLocale = "en" | "fr"
function setAppLanguage(locale: MosaicLocale) {
  initMosaicI18n(locale);
}
```

The locale JSON files are typed via TypeScript's `resolveJsonModule`. If you import locale files directly, enable:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

---

## 12. Examples

### Example 1 — Next.js App Router with French default

```tsx
// app/layout.tsx
import { initMosaicI18n } from "@vantageos/mosaic-i18n";

// Call at module level — runs once on server startup
initMosaicI18n("fr");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

### Example 2 — Runtime locale switch (user preference)

```tsx
"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { type MosaicLocale } from "@vantageos/mosaic-i18n";

const LOCALES: MosaicLocale[] = ["fr", "en"];
const LABELS: Record<MosaicLocale, string> = { fr: "Français", en: "English" };

export function LocaleSwitcher() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState<MosaicLocale>("fr");

  function handleChange(locale: MosaicLocale) {
    setCurrent(locale);
    i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
  }

  return (
    <div className="flex gap-2">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={current === locale}
          onClick={() => handleChange(locale)}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
```

### Example 3 — Adding a custom locale (extend FR)

```ts
import { initMosaicI18n } from "@vantageos/mosaic-i18n";
import i18next from "i18next";

initMosaicI18n("fr");

// Add app-specific strings to the same "mosaic" namespace
i18next.addResourceBundle(
  "fr",
  "mosaic",
  {
    "MyApp": {
      "welcome": "Bienvenue sur MonApp",
      "logout": "Se déconnecter",
    },
  },
  true,
  false,
);
```

---

## 13. Browser Support

This package is a pure JS module with no DOM dependencies. It runs in:

- All modern browsers (Chrome 111+, Firefox 113+, Safari 15.4+)
- Node.js 18+
- Edge Runtime (Next.js middleware)
- Cloudflare Workers

---

## 14. Versioning & Changelog

| Version | Notes |
|---|---|
| `0.1.1` | Current — FSL license, README complete, keywords |
| `0.1.0` | Initial publish — FR+EN locale files, initMosaicI18n |

See [CHANGELOG.md](../../CHANGELOG.md) at monorepo root for full history.

---

## 15. Contributing

This package lives in the `packages/mosaic-i18n/` directory of the [vantageos-mosaic monorepo](https://github.com/elpiarthura/vantageos-mosaic).

To contribute locale additions or fixes:

1. Edit `src/locales/en.json` and `src/locales/fr.json` in tandem — never add a key to one without the other
2. Run `pnpm build` to verify TypeScript compiles
3. Open a PR with a clear description of the added/modified keys and their component context

For structural changes to `initMosaicI18n` or new exports, open an issue first to discuss the API impact.

---

## 16. License

`@vantageos/mosaic-i18n` is licensed under the **Functional Source License, Version 1.1, Apache 2.0 Future License** (`FSL-1.1-Apache-2.0`).

- Free for non-production use, research, and evaluation
- Commercial use requires a valid VantageOS license
- Converts to Apache 2.0 after 2 years from each release

Full license: [LICENSE](LICENSE)

---

## 17. Credits

`@vantageos/mosaic-i18n` is part of the VantageOS Mosaic design system family:

- [`@vantageos/mosaic-blocks`](https://www.npmjs.com/package/@vantageos/mosaic-blocks) — React composed UI blocks (consumes this package)
- [`@vantageos/mosaic-tokens`](https://www.npmjs.com/package/@vantageos/mosaic-tokens) — OKLCH design tokens

Upstream locale strings were originally authored for the **anydebate** production SaaS and extracted as part of the mosaic-absorb mission.

Built on:
- [i18next](https://www.i18next.com/) — internationalization framework
- [react-i18next](https://react.i18next.com/) — React bindings
- [VantageOS](https://vantageos.com/) — parent design system

---

*Orchestrator: Gamma — VantageOS Team | 2026-06-27*
