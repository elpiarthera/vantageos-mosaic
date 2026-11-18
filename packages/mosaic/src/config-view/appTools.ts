/**
 * MCP Apps "app tools" for the config view: a CONSTANT set of tools the model can call while a list
 * is open, to sort, filter and select it and to hand the selection to the view's row action.
 *
 * Constant means constant: names, titles, descriptions and schemas never depend on the view (a
 * change would re-ask the user's approval). What changes (columns, counts, selection) travels in
 * the RESULTS, as a text block. A recoverable mistake (unknown column, unknown key) is a normal
 * result saying what to change, never an error.
 *
 * Everything is optional for the host: a host that never calls the tools, or cannot take the
 * handlers, leaves the view exactly as it was.
 */
import {
  type ListHandle,
  type ListInfo,
  type ListRegistry,
  type OpenOutcome,
  createListRegistry,
} from "../components/display/ConfigList.control.js";
import { type HostAppLike, updateModelContext } from "../host/host-context.js";
import { textBlock } from "../host/model-context.js";
import type { MosaicLocale } from "../i18n/strings.js";

export { createListRegistry };
export type { ListRegistry };

/** The slice of the ext-apps `App` the tools use (handlers are optional: a host may refuse them). */
export interface ToolsApp {
  onlisttools?: unknown;
  oncalltool?: unknown;
  getHostContext?(): { locale?: string } | undefined;
  updateModelContext?: unknown;
}

interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: Record<string, unknown>;
}

const str = (description: string) => ({ type: "string", description });
const obj = (properties: Record<string, unknown>, required: string[]) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

/** Constant across views and locales. One-line first description: EN then FR, under 200 chars. */
export const LIST_TOOLS: readonly ToolDef[] = Object.freeze([
  {
    name: "list_sort",
    title: "Sort list / Trier la liste",
    description:
      "Sort the open list by a column (ids: list_describe). / Trie la liste ouverte selon une colonne (ids : list_describe).",
    inputSchema: obj(
      {
        column: str("Column id, as given by list_describe / Identifiant de colonne"),
        direction: { type: "string", enum: ["asc", "desc"], description: "asc or desc" },
      },
      ["column", "direction"],
    ),
    annotations: { destructiveHint: false },
  },
  {
    name: "list_filter",
    title: "Filter list / Filtrer la liste",
    description:
      "Keep the rows whose column contains a value (no case, no accents). / Garde les lignes dont la colonne contient une valeur (sans casse ni accents).",
    inputSchema: obj(
      {
        column: str("Column id, as given by list_describe / Identifiant de colonne"),
        value: str("Text to look for in the displayed cell / Texte recherché"),
      },
      ["column", "value"],
    ),
    annotations: { destructiveHint: false },
  },
  {
    name: "list_clear_filter",
    title: "Clear filter / Effacer le filtre",
    description: "Remove the filter on the open list. / Retire le filtre de la liste ouverte.",
    inputSchema: obj({}, []),
    annotations: { destructiveHint: false },
  },
  {
    name: "list_select",
    title: "Select rows / Sélectionner des lignes",
    description:
      "Select rows of the open list by key (replaces the selection). / Sélectionne des lignes par clé (remplace la sélection).",
    inputSchema: obj(
      {
        keys: {
          type: "array",
          items: { type: "string" },
          description:
            "Row keys from list_describe (the list's row key, else the 0-based displayed index) / Clés des lignes",
        },
      },
      ["keys"],
    ),
    annotations: { destructiveHint: false },
  },
  {
    name: "list_clear_selection",
    title: "Clear selection / Vider la sélection",
    description: "Unselect every row of the open list. / Désélectionne toutes les lignes.",
    inputSchema: obj({}, []),
    annotations: { destructiveHint: false },
  },
  {
    name: "list_describe",
    title: "Describe list / Décrire la liste",
    description:
      "Describe the open list: columns, rows shown, sort, filter, selection. / Décrit la liste ouverte : colonnes, lignes, tri, filtre, sélection.",
    inputSchema: obj({}, []),
    annotations: { readOnlyHint: true },
  },
  {
    name: "list_open_selected",
    title: "Open selected rows / Ouvrir la sélection",
    description:
      "Run the row action of the view on each selected row. / Lance l'action de ligne de la vue sur chaque ligne sélectionnée.",
    inputSchema: obj(
      {
        action: str(
          "Tool name of the row action, needed only when the view declares several / Nom de l'outil de l'action",
        ),
      },
      [],
    ),
    annotations: { destructiveHint: false, openWorldHint: true },
  },
]);

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });

/** One sentence per language; the view's locale picks, `en` when no view is open. */
const pickText = (locale: MosaicLocale, en: string, fr: string) => (locale === "fr" ? fr : en);

function describeState(i: ListInfo): string {
  const l = i.locale;
  const sort = i.sort
    ? `${i.sort.key} ${i.sort.direction}`
    : pickText(l, "none (source order)", "aucun (ordre d'origine)");
  const filter = i.filter
    ? `${i.filter.column} ${pickText(l, "contains", "contient")} "${i.filter.value}"`
    : pickText(l, "none", "aucun");
  const sel = i.selected.length > 0 ? i.selected.join(", ") : pickText(l, "none", "aucune");
  return pickText(
    l,
    `List "${i.title}" (tool ${i.tool}): ${i.shown} of ${i.loaded} loaded rows shown. Sort: ${sort}. Filter: ${filter}. Selected (${i.selected.length}): ${sel}.`,
    `Liste « ${i.title} » (outil ${i.tool}) : ${i.shown} lignes affichées sur ${i.loaded} chargées. Tri : ${sort}. Filtre : ${filter}. Sélection (${i.selected.length}) : ${sel}.`,
  );
}

const MAX_ROWS_LISTED = 50;

function describeFull(i: ListInfo): string {
  const l = i.locale;
  const cols = i.columns.map((c) => `${c.key} = ${c.header}`).join("; ");
  const rows = i.rows
    .slice(0, MAX_ROWS_LISTED)
    .map((r) => `${r.key}: ${r.label}`)
    .join("\n");
  const more =
    i.rows.length > MAX_ROWS_LISTED
      ? `\n${pickText(l, `(+${i.rows.length - MAX_ROWS_LISTED} more)`, `(+${i.rows.length - MAX_ROWS_LISTED} de plus)`)}`
      : "";
  return [
    describeState(i),
    pickText(l, `Columns (id = header): ${cols}.`, `Colonnes (id = en-tête) : ${cols}.`),
    pickText(
      l,
      `More pages exist on the server: ${i.hasMore ? "yes (the person loads them with the view's button)" : "no"}.`,
      `D'autres pages existent côté serveur : ${i.hasMore ? "oui (la personne les charge avec le bouton de la vue)" : "non"}.`,
    ),
    i.keyed
      ? pickText(l, "Row keys (key: first column):", "Clés de ligne (clé : première colonne) :")
      : pickText(
          l,
          "Row keys are the 0-based displayed index (key: first column):",
          "Les clés sont l'index affiché à partir de 0 (clé : première colonne) :",
        ),
    `${rows}${more}`,
  ].join("\n");
}

const validColumns = (i: ListInfo) => i.columns.map((c) => c.key).join(", ");

function unknownColumn(i: ListInfo, column: string): ToolResult {
  return ok(
    pickText(
      i.locale,
      `Unknown column "${column}". Nothing changed. Valid column ids: ${validColumns(i)}.`,
      `Colonne inconnue « ${column} ». Rien n'a changé. Identifiants valides : ${validColumns(i)}.`,
    ),
  );
}

function noList(app: ToolsApp): ToolResult {
  const fr = app.getHostContext?.()?.locale?.toLowerCase().startsWith("fr");
  return ok(
    fr
      ? "Aucune liste n'est ouverte dans cette vue. Rien n'a été modifié."
      : "No list is open in this view. Nothing was changed.",
  );
}

function badArgs(locale: MosaicLocale, expected: string): ToolResult {
  return ok(
    pickText(
      locale,
      `Missing or invalid arguments. Expected: ${expected}.`,
      `Arguments manquants ou invalides. Attendu : ${expected}.`,
    ),
  );
}

function openText(i: ListInfo, o: OpenOutcome): string {
  const l = i.locale;
  switch (o.kind) {
    case "none-selected":
      return pickText(
        l,
        "No row is selected. Call list_select first.",
        "Aucune ligne n'est sélectionnée. Appelez d'abord list_select.",
      );
    case "no-action":
      return pickText(
        l,
        "This view declares no row action. Nothing was run.",
        "Cette vue ne déclare aucune action de ligne. Rien n'a été lancé.",
      );
    case "choose":
      return pickText(
        l,
        `This view declares several row actions. Pass "action" as one of: ${o.tools.join(", ")}. Nothing was run.`,
        `Cette vue déclare plusieurs actions de ligne. Passez « action » parmi : ${o.tools.join(", ")}. Rien n'a été lancé.`,
      );
    case "unknown":
      return pickText(
        l,
        `"${o.asked}" is not a row action of this view. Valid actions: ${o.tools.join(", ")}. Nothing was run.`,
        `« ${o.asked} » n'est pas une action de ligne de cette vue. Actions valides : ${o.tools.join(", ")}. Rien n'a été lancé.`,
      );
    case "done": {
      const failed =
        o.failed.length > 0
          ? pickText(
              l,
              ` Failed for keys: ${o.failed.join(", ")}.`,
              ` Échec pour les clés : ${o.failed.join(", ")}.`,
            )
          : "";
      return pickText(
        l,
        `Ran ${o.tool} on ${o.ok} selected row(s); the view shows the last result.${failed}`,
        `${o.tool} lancé sur ${o.ok} ligne(s) sélectionnée(s) ; la vue affiche le dernier résultat.${failed}`,
      );
    }
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** Tells the model the new state without waiting for a list_describe. Never throws, never blocks. */
function pushContext(app: ToolsApp, info: ListInfo): void {
  if (typeof app.updateModelContext !== "function") return;
  try {
    const sent = updateModelContext(app as unknown as HostAppLike, {
      content: [textBlock(describeState(info), { background: true })],
    });
    Promise.resolve(sent).catch(() => {});
  } catch {
    // The host refused the update: the tool result already carries the state.
  }
}

async function runTool(
  app: ToolsApp,
  registry: ListRegistry,
  name: string,
  args: unknown,
): Promise<ToolResult> {
  if (!LIST_TOOLS.some((t) => t.name === name)) {
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
  const handle: ListHandle | undefined = registry.current();
  if (!handle) return noList(app);
  const a = isRecord(args) ? args : {};
  const before = handle.info();
  const l = before.locale;
  // Each branch returns the state AFTER its change, read back from the handle.
  const done = (): ToolResult => {
    const after = handle.info();
    pushContext(app, after);
    return ok(describeState(after));
  };
  switch (name) {
    case "list_sort": {
      if (typeof a.column !== "string" || (a.direction !== "asc" && a.direction !== "desc")) {
        return badArgs(l, '{ column: string, direction: "asc" | "desc" }');
      }
      if (!before.columns.some((c) => c.key === a.column)) return unknownColumn(before, a.column);
      handle.setSort({ key: a.column, direction: a.direction });
      return done();
    }
    case "list_filter": {
      if (typeof a.column !== "string" || typeof a.value !== "string") {
        return badArgs(l, "{ column: string, value: string }");
      }
      if (!before.columns.some((c) => c.key === a.column)) return unknownColumn(before, a.column);
      handle.setFilter({ column: a.column, value: a.value });
      return done();
    }
    case "list_clear_filter":
      handle.setFilter(undefined);
      return done();
    case "list_select": {
      if (!Array.isArray(a.keys) || !a.keys.every((k) => typeof k === "string")) {
        return badArgs(l, "{ keys: string[] }");
      }
      const { unknown } = handle.select(a.keys as string[]);
      const after = handle.info();
      pushContext(app, after);
      const note =
        unknown.length > 0
          ? pickText(
              l,
              ` Unknown keys ignored: ${unknown.join(", ")} (see list_describe for the valid keys).`,
              ` Clés inconnues ignorées : ${unknown.join(", ")} (voir list_describe).`,
            )
          : "";
      return ok(describeState(after) + note);
    }
    case "list_clear_selection":
      handle.select([]);
      return done();
    case "list_describe":
      return ok(describeFull(before));
    default: {
      // list_open_selected
      if (a.action !== undefined && typeof a.action !== "string") {
        return badArgs(l, "{ action?: string }");
      }
      const outcome = await handle.openSelected(a.action as string | undefined);
      return ok(openText(before, outcome));
    }
  }
}

/**
 * Registers the constant tools on the app. Call BEFORE `connect()`. Never throws: a host that cannot
 * take the handlers gets a view that works as it always did.
 */
export function registerListTools(app: ToolsApp, registry: ListRegistry): void {
  try {
    app.onlisttools = async () => ({ tools: LIST_TOOLS });
    app.oncalltool = async (params: { name: string; arguments?: unknown }) => {
      try {
        return await runTool(app, registry, params.name, params.arguments);
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: (e as Error).message }] };
      }
    };
  } catch {
    // No tools capability on this host: nothing to register, the view is unaffected.
  }
}
