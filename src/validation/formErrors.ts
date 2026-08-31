import type { ZodType } from 'zod';

/**
 * Pattern B: schema validation for the forms that keep their state in
 * `useState` instead of react-hook-form.
 *
 * The four bespoke forms (`ModelFormModal`, `RouteFormModal`,
 * `WarehouseGridEditorModal`, and the corrugation layer grid) never call
 * `register`, so `useModalForm`'s resolver cannot reach them. They already own
 * a single `error: string | null` banner, so this returns a ready-to-display
 * string rather than a per-field map: giving them a field map would mean
 * rewriting each form's rendering, which is a bigger change than this batch is
 * allowed to make.
 *
 * Returns `null` when the payload is valid, so a caller reads:
 *
 * ```ts
 * const problem = firstIssue(createModelSchema(t), payload);
 * if (problem) { setError(problem); return; }
 * ```
 *
 * Only the FIRST issue is shown, deliberately: the banner is one line, and a
 * joined list of five messages is less useful than the first thing to fix.
 */
export function firstIssue<T>(
  schema: ZodType<T, unknown>,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? null;
}

/**
 * Every issue, keyed by the field it belongs to — for a pattern-B form that
 * DOES have somewhere to put per-field messages. Nested paths are joined with
 * dots so a layer error reads `layers.1.paperClassUuid`, matching what the API
 * returns for the same mistake.
 */
export function issuesByField<T>(
  schema: ZodType<T, unknown>,
  value: unknown
): Record<string, string> | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  const map: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const key = issue.path.map(String).join('.') || '_';
    if (!(key in map)) map[key] = issue.message;
  });
  return map;
}
