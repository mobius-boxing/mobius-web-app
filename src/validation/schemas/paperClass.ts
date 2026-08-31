import { z } from 'zod';
import { code, requiredText, Translate } from '../fields';

/**
 * B7 schema — one of the two entities the B2 sign-off pulled out of the
 * templated sweep.
 *
 * Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   paper_classes.code varchar(50)  NOT NULL, UNIQUE (code) — GLOBAL, not per company
 *   paper_classes.name varchar(255) NOT NULL
 *
 * WHY THIS WAS NOT A B2 FILE: both modals embed a `DualListSelector<PaperSupply>`
 * managing a `papers: uuid[]` many-to-many through `paper_class_papers`. That
 * list is `useState`, not a registered field, so a templated two-field sweep
 * would have made the entity look finished while leaving the relationship
 * unvalidated. It stays out of this schema for the same reason the corrugation
 * layer grid does: the rules that matter for it are about the JOIN rows, and
 * the server owns those.
 *
 * These modals were also 2 of the 6 files with hardcoded ENGLISH validation
 * copy. That is what this file fixes: both rules now come from the shared
 * Spanish `validation.*` namespace.
 *
 * The unique index is GLOBAL, so a 23505 here is cross-tenant.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const CODE_MAX = 50;
const NAME_MAX = 255;

export const createPaperClassSchema = (t: Translate) =>
  z.object({
    code: code(t, CODE_MAX, t('paperClasses.code')),
    name: requiredText(t, t('paperClasses.name'), NAME_MAX),
  });

export const editPaperClassSchema = (t: Translate) =>
  createPaperClassSchema(t)
    .partial()
    .extend({
      code: code(t, CODE_MAX, t('paperClasses.code')),
      name: requiredText(t, t('paperClasses.name'), NAME_MAX),
    });

export type CreatePaperClassSchema = z.infer<
  ReturnType<typeof createPaperClassSchema>
>;
