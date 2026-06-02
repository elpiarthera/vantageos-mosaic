# Mosaic Docs

## Canonical standard

The authoritative architecture standard for `@vantageos/mosaic` lives in this
folder: **[mosaic-architecture-standard-v1.md](./mosaic-architecture-standard-v1.md)**
(v1.1, 18 sections, 720 lines).

It is synchronised from the ElPi Corp resources tree
(`elpi-corp/resources/references/mosaic-architecture-standard-v1.md`,
commit `5917976`) and broadcast fleet-wide via the VantageRegistry template:

- **VR templateId:** `jx7f8ab2r64pa8drnjp9jkn17s87xp5d`
- **Broadcaster:** Omega (fleet broadcast queue)

## How to consume

When building or reviewing a Mosaic component, treat the standard doc as
authoritative for: stack pins, validation patterns, 6-category taxonomy,
registry contract, streaming chunk schema, naming conventions, TDD discipline,
i18n, a11y, bundle budget, npm publishing, CI gates, override markers.

Conformance is verified per release by the `mosaic-spec-reviewer` skill
(Gamma fleet).
