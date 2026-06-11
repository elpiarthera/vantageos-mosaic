"use client";

import type { ReactElement } from "react";
import {
  type ArrayPath,
  type FieldArrayWithId,
  type FieldValues,
  type FieldArray as RhfFieldArray,
  useFieldArray as useRhfFieldArray,
} from "react-hook-form";
import {
  buildListAriaLabel,
  buildRemoveAriaLabel,
} from "../../../../components/forms/FieldArray.logic.js";
import { useMosaicFormContext } from "./FormProvider.js";

// ─── Hook: thin RHF wrapper ───────────────────────────────────────────────────

export interface UseFieldArrayOptions<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
> {
  name: TName;
  /**
   * Optional control override. When omitted, `useFieldArray` reads control
   * from the surrounding `<FormProvider>`, mirroring `FormField`'s contract.
   */
  // biome-ignore lint/suspicious/noExplicitAny: bridging FormProvider's erased generic to RHF control
  control?: any;
}

/**
 * Public return type for `useFieldArray` — mirrors RHF's native return
 * (`fields`, `append`, `remove`, `move`, `swap`, plus `insert`, `prepend`,
 * `replace`, `update` for advanced cases).
 */
export type UseFieldArrayReturn<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
> = ReturnType<typeof useRhfFieldArray<TValues, TName, "id">>;

/**
 * Thin wrapper around RHF's `useFieldArray`. Reads `control` from the
 * surrounding `<FormProvider>` when not provided, mirroring `FormField`.
 * Exposes `{ fields, append, remove, move, swap }` and the rest of RHF's
 * native return for advanced cases (insert, prepend, replace, update).
 */
export function useFieldArray<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
>({ name, control }: UseFieldArrayOptions<TValues, TName>) {
  const ctx = useMosaicFormContext() as unknown as { control: unknown };
  const resolvedControl = control ?? ctx.control;
  return useRhfFieldArray<TValues, TName, "id">({
    // biome-ignore lint/suspicious/noExplicitAny: bridging erased generic
    control: resolvedControl as any,
    name: name as never,
  });
}

// ─── Component: render-prop wrapper ───────────────────────────────────────────

export interface FieldArrayRenderItemArgs<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
> {
  field: FieldArrayWithId<TValues, TName, "id">;
  index: number;
}

export interface FieldArrayControls<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
> {
  fields: ReadonlyArray<FieldArrayWithId<TValues, TName, "id">>;
  append: (value: RhfFieldArray<TValues, TName> | RhfFieldArray<TValues, TName>[]) => void;
  remove: (index?: number | number[]) => void;
  move: (from: number, to: number) => void;
  swap: (a: number, b: number) => void;
}

export interface FieldArrayProps<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
> {
  name: TName;
  /**
   * Render-prop called for each item. Receives the RHF field (with stable
   * `.id`), the current index, and the controls bag for inline buttons.
   */
  children: (
    args: FieldArrayRenderItemArgs<TValues, TName>,
    controls: FieldArrayControls<TValues, TName>,
  ) => ReactElement;
  /** Override the default `aria-label` on the list root. */
  ariaLabel?: string;
}

/**
 * Render-prop wrapper around RHF's `useFieldArray`. Reads control from the
 * surrounding `<FormProvider>`. Emits an a11y-compliant `role="list"` shell
 * with `role="listitem"` rows keyed by RHF's stable `field.id` (NOT array
 * index — required for stable React reconciliation across move/remove).
 */
export function FieldArray<
  TValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TValues> = ArrayPath<TValues>,
>({ name, children, ariaLabel }: FieldArrayProps<TValues, TName>) {
  const ctx = useMosaicFormContext() as unknown as { control: unknown };
  const { fields, append, remove, move, swap } = useRhfFieldArray<TValues, TName, "id">({
    // biome-ignore lint/suspicious/noExplicitAny: bridging erased generic
    control: ctx.control as any,
    name: name as never,
  });
  const controls: FieldArrayControls<TValues, TName> = {
    fields: fields as ReadonlyArray<FieldArrayWithId<TValues, TName, "id">>,
    append,
    remove,
    move,
    swap,
  };
  return (
    <ul
      aria-label={ariaLabel ?? buildListAriaLabel(name as string)}
      style={{ listStyle: "none", padding: 0, margin: 0 }}
    >
      {fields.map((field, index) => (
        <li
          key={field.id}
          data-mosaic-fieldarray-item
          data-mosaic-fieldarray-name={name as string}
          data-mosaic-fieldarray-index={index}
        >
          {children(
            {
              field: field as FieldArrayWithId<TValues, TName, "id">,
              index,
            },
            controls,
          )}
        </li>
      ))}
    </ul>
  );
}

// Re-export a11y helpers so consumers can label their Add/Remove buttons
// consistently with the runtime defaults.
export { buildListAriaLabel, buildRemoveAriaLabel };
