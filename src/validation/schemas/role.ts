import { z } from 'zod';
import { boolean, optionalText, requiredText, Translate } from '../fields';
import type { RoleProfileType } from '../../types';

/**
 * B7 schema — the entity B3 deliberately deferred here.
 *
 * Bounds read from `information_schema.columns` on the live schema
 * (2026-08-30) (AMENDMENT A1):
 *   roles.name                   varchar(200) NOT NULL, UNIQUE ("companyId", name)
 *   roles.profileType            varchar(50)  NOT NULL, default 'general'
 *   roles.hasAccessToAllMachines boolean      NOT NULL, default true
 *   roles.isProtected            boolean      NOT NULL, default false
 *
 * WHY `profileType` IS NOT AN ENUM HERE, which is the whole reason B3 punted it:
 *
 * The obvious rule is `oneOf(t, label, PROFILE_TYPES)` — the modal's dropdown
 * has exactly five options and the TS type is a five-member union. But the B3
 * sign-off recorded that 10 of 62 rows in `traffic_production` carry a
 * `profileType` that is in NEITHER the dropdown NOR the server's list. An enum
 * would make those ten roles unsavable: open one, press save, get a validation
 * error on a field the user never touched — the Risk 2 failure this program is
 * supposed to prevent.
 *
 * That claim CANNOT BE RE-VERIFIED FROM THIS MACHINE. The database reachable
 * here is a local dev copy whose 16 roles use only the five known values, and
 * `traffic_production` is not reachable. Between a recorded observation of real
 * production data and a clean-room local database, the recorded observation
 * wins: the rule stays a bounded `varchar(50)` text check, which is what the
 * COLUMN enforces anyway.
 *
 * There is no CHECK constraint on this column — unlike `users.role`, which has
 * one and is therefore safe to enumerate. Adding the enum is a follow-up that
 * needs a production data check first, and a decision about the ten rows.
 *
 * `isProtected` is deliberately absent: it is a real NOT NULL column that
 * guards built-in roles from edits, and neither modal exposes it. A rule for a
 * field the form cannot set would be dead weight.
 *
 * `companyId` is injected by the API from the caller's token (L-009).
 */

const NAME_MAX = 200;
/** The column width. NOT an enum — see the header. */
const PROFILE_TYPE_MAX = 50;

export const createRoleSchema = (t: Translate) =>
  z.object({
    name: requiredText(t, t('roles.name'), NAME_MAX),
    /**
     * Bounded text at RUNTIME (so the ten out-of-list production rows stay
     * editable), typed as the union at COMPILE time because `CreateRoleForm`
     * already declares it that way and the rest of the app is built on that.
     * The cast records the tension rather than resolving it: the type says five
     * values, the column says any varchar(50), and the data reportedly says
     * something in between. Resolving it needs the production check this
     * machine cannot run.
     */
    profileType: optionalText(
      t,
      t('roles.profileType'),
      PROFILE_TYPE_MAX
    ) as unknown as z.ZodType<RoleProfileType | undefined, unknown>,
    hasAccessToAllMachines: boolean(),
  });

export const editRoleSchema = (t: Translate) =>
  createRoleSchema(t)
    .partial()
    .extend({ name: requiredText(t, t('roles.name'), NAME_MAX) });

export type CreateRoleSchema = z.infer<ReturnType<typeof createRoleSchema>>;
