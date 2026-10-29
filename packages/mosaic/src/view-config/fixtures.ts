/**
 * Sample view configs and payloads: the two filled examples of the view-config schema
 * (list_tenant_contracts, get_condominium) with a matching tool payload each. Test and demo
 * material only; nothing here is shipped as a default.
 */

export const LIST_CONFIG = {
  schemaVersion: 1,
  tool: "list_tenant_contracts",
  kind: "list",
  title: { en: "Tenant contracts", fr: "Contrats locataires" },
  dataPath: "contracts",
  rowKey: "id",
  columns: [
    {
      id: "reference",
      path: "reference",
      label: { en: "Reference", fr: "Référence" },
      sortable: true,
    },
    {
      id: "kind",
      path: "kind",
      label: { en: "Type", fr: "Type" },
      format: {
        type: "enum",
        map: {
          Bail: { en: "Lease", fr: "Bail" },
          Vacant: { en: "Vacant", fr: "Vacant" },
          Candidat: { en: "Candidate", fr: "Candidat" },
        },
      },
    },
    {
      id: "tenant",
      path: "tenant_name",
      label: { en: "Tenant", fr: "Locataire" },
      sortable: true,
    },
    {
      id: "lots",
      path: "lots",
      label: { en: "Lots", fr: "Lots" },
      format: { type: "join", joinPath: "number", separator: ", " },
    },
    {
      id: "start",
      path: "start",
      label: { en: "Start", fr: "Début" },
      format: { type: "date" },
      sortable: true,
    },
    {
      id: "end",
      path: "end",
      label: { en: "End", fr: "Fin" },
      format: { type: "date" },
      sortable: true,
    },
    {
      id: "rent",
      path: "rent_ttc",
      label: { en: "Rent incl. VAT", fr: "Loyer TTC" },
      format: { type: "money", currency: "EUR" },
      align: "end",
      sortable: true,
    },
    {
      id: "signed",
      path: "is_signed",
      label: { en: "Signed", fr: "Signé" },
      format: { type: "boolean" },
    },
  ],
  defaultSort: { column: "start", direction: "desc" },
  paging: {
    cursorPath: "nextCursor",
    exhaustedPath: "exhausted",
    truncatedPath: "truncated",
    cursorArg: "cursor",
    limitArg: "limit",
    pageSize: 20,
  },
  rowActions: [
    {
      tool: "get_rental_situation",
      args: { lease_id: "$row.id" },
      label: { en: "Rental situation", fr: "Situation locative" },
    },
  ],
  emptyMessage: {
    en: "No contract matches these filters.",
    fr: "Aucun contrat ne correspond à ces filtres.",
  },
} as const;

export const LIST_PAYLOAD = {
  contracts: [
    {
      id: "c1",
      reference: "BAIL-001",
      kind: "Bail",
      tenant_name: "Dupont",
      lots: [{ number: "A1" }, { number: "B2" }],
      start: "2024-05-01",
      end: "2027-04-30",
      rent_ttc: 1234.5,
      is_signed: true,
    },
    {
      id: "c2",
      reference: "BAIL-002",
      kind: "Vacant",
      tenant_name: "Martin",
      lots: [{ number: "C3" }],
      start: "2025-01-15",
      end: null,
      rent_ttc: 800,
      is_signed: false,
    },
  ],
  nextCursor: "cur-2",
  exhausted: false,
  truncated: false,
} as const;

export const DETAIL_CONFIG = {
  schemaVersion: 1,
  tool: "get_condominium",
  kind: "detail",
  title: { en: "Condominium", fr: "Copropriété" },
  dataPath: "condominiums",
  sections: [
    {
      id: "identity",
      title: { en: "Identity", fr: "Identité" },
      fields: [
        { path: "title", label: { en: "Name", fr: "Nom" } },
        { path: "address.street", label: { en: "Street", fr: "Voie" } },
        { path: "address.postal_code", label: { en: "Postal code", fr: "Code postal" } },
        { path: "address.city", label: { en: "City", fr: "Ville" } },
      ],
    },
    {
      id: "figures",
      title: { en: "Figures", fr: "Chiffres" },
      fields: [
        {
          path: "co_owners_count",
          label: { en: "Co-owners", fr: "Copropriétaires" },
          format: { type: "number" },
        },
        {
          path: "treasury_balance",
          label: { en: "Treasury balance", fr: "Solde de trésorerie" },
          format: { type: "money", currency: "EUR" },
        },
        {
          path: "ratio",
          label: { en: "Occupancy", fr: "Occupation" },
          format: { type: "percent" },
        },
      ],
    },
    {
      id: "mandate",
      title: { en: "Mandate", fr: "Mandat" },
      fields: [
        { path: "mandate.number", label: { en: "Number", fr: "Numéro" } },
        {
          path: "mandate.start",
          label: { en: "Start", fr: "Début" },
          format: { type: "date" },
        },
      ],
    },
    {
      id: "lots",
      title: { en: "Lots", fr: "Lots" },
      table: {
        path: "lots_listed",
        columns: [
          { id: "code", path: "code", label: { en: "Code", fr: "Code" } },
          { id: "type", path: "type", label: { en: "Type", fr: "Type" } },
          {
            id: "area",
            path: "living_area_m2",
            label: { en: "Living area (m²)", fr: "Surface habitable (m²)" },
            format: { type: "number" },
            align: "end",
          },
        ],
      },
    },
  ],
  rowActions: [
    {
      tool: "list_co_owners",
      args: { condominium_id: "$.id" },
      label: { en: "Co-owners", fr: "Copropriétaires" },
    },
    {
      tool: "list_syndic_mandates",
      args: { building_id: "$.id" },
      label: { en: "Syndic mandates", fr: "Mandats de syndic" },
      disabled: true,
    },
  ],
} as const;

export const DETAIL_PAYLOAD = {
  condominiums: [
    {
      id: "k1",
      title: "Résidence des Lilas",
      address: { street: "12 rue des Lilas", postal_code: "75020", city: "Paris" },
      co_owners_count: 42,
      treasury_balance: "15234.80",
      ratio: 87.5,
      mandate: { number: "M-77", start: "2023-01-01" },
      lots_listed: [
        { code: "A1", type: "Apartment", living_area_m2: 54.2 },
        { code: "P7", type: "Parking", living_area_m2: null },
      ],
    },
  ],
} as const;
