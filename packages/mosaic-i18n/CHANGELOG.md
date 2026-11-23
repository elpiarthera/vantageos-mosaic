# Changelog

All notable changes to `@vantageos/mosaic-i18n` are documented in this file.

## [0.1.2] — 2026-11-23

### Fixed

- `react-i18next` and `i18next` are now optional peers (`peerDependenciesMeta`). A consumer that only reads the locale JSON files (for example an MCP server) no longer installs react through `react-i18next`. / `react-i18next` et `i18next` deviennent des peers optionnels : un consommateur qui lit seulement les fichiers de locale n'installe plus react.
