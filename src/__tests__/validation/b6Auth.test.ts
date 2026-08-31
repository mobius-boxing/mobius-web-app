import i18n from '../../i18n/config';
import type { Translate } from '../../validation/fields';
import { editUserSchema, USER_ROLES } from '../../validation/schemas/user';
import { inviteUserSchema } from '../../validation/schemas/invitation';
import {
  loginSchema,
  resetPasswordSchema,
} from '../../validation/schemas/auth';

const t = i18n.t.bind(i18n) as unknown as Translate;

type Schema = {
  safeParse: (value: unknown) => {
    success: boolean;
    data?: Record<string, unknown>;
    error?: { issues: Array<{ path: unknown[]; message: string }> };
  };
};

const issues = (schema: Schema, value: unknown): string[] => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('expected the payload to be rejected');
  return (result.error?.issues ?? []).map((i) => String(i.path[0]));
};

const parse = (schema: Schema, value: unknown): Record<string, unknown> => {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      'expected the payload to be accepted, got: ' +
        JSON.stringify(result.error?.issues)
    );
  }
  return result.data as Record<string, unknown>;
};

const user = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  role: 'admin',
  isActive: true,
};

/**
 * B6 — users, invitations and the three auth pages.
 *
 * The auth pages were ALREADY validated before this batch, so their cases here
 * are regression guards on a conversion, not new rules: any behaviour change is
 * a bug.
 */
describe('user schema', () => {
  it('accepts a valid user through the edit schema', () => {
    expect(parse(editUserSchema(t), user)).toMatchObject(user);
  });

  /**
   * The role list is the CHECK constraint's own array. Postgres rejects
   * anything else with a 23514, so the client list and the constraint must not
   * drift.
   */
  it('mirrors the users_role_check constraint exactly', () => {
    expect([...USER_ROLES]).toEqual(['member', 'admin', 'superAdmin']);
    USER_ROLES.forEach((role) => {
      expect(parse(editUserSchema(t), { ...user, role }).role).toBe(role);
    });
    expect(issues(editUserSchema(t), { ...user, role: 'owner' })).toEqual([
      'role',
    ]);
  });

  /** Blank means "leave the current password alone", not "set an empty one". */
  it('treats a blank password as unchanged but bounds a typed one', () => {
    expect(parse(editUserSchema(t), { ...user, password: '' }).password)
      .toBeUndefined();
    expect(issues(editUserSchema(t), { ...user, password: 'short' })).toEqual([
      'password',
    ]);
    expect(
      parse(editUserSchema(t), { ...user, password: 'longenough1' }).password
    ).toBe('longenough1');
  });

  it('rejects a malformed email', () => {
    expect(issues(editUserSchema(t), { ...user, email: 'ada@' })).toEqual([
      'email',
    ]);
  });

  it('requires both names, which are NOT NULL columns', () => {
    expect(
      issues(editUserSchema(t), { ...user, firstName: '  ', lastName: '' }).sort()
    ).toEqual(['firstName', 'lastName']);
  });

  it('shares the role constraint with the invitation schema', () => {
    const invite = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'member',
    };
    expect(parse(inviteUserSchema(t), invite)).toMatchObject(invite);
    expect(issues(inviteUserSchema(t), { ...invite, role: 'owner' })).toEqual([
      'role',
    ]);
  });
});

describe('auth schemas (converted, not changed)', () => {
  it('keeps login requiring both fields', () => {
    expect(
      parse(loginSchema(t), { email: 'a@b.co', password: 'x' })
    ).toMatchObject({ email: 'a@b.co' });
    expect(issues(loginSchema(t), { email: '', password: '' }).sort()).toEqual([
      'email',
      'password',
    ]);
  });

  const good = { newPassword: 'Password1', confirmPassword: 'Password1' };

  it('keeps the reset-password strength rule verbatim', () => {
    expect(parse(resetPasswordSchema(t), good)).toEqual(good);
    // no uppercase, no digit → the pattern rule fires
    expect(
      issues(resetPasswordSchema(t), {
        newPassword: 'password',
        confirmPassword: 'password',
      })
    ).toEqual(['newPassword']);
    expect(
      issues(resetPasswordSchema(t), {
        newPassword: 'Pass1',
        confirmPassword: 'Pass1',
      })
    ).toEqual(['newPassword']);
  });

  /**
   * The first cross-field rule in the program. `path` matters: without it the
   * message lands on the object root, where no input can render it.
   */
  it('reports a mismatch ON the confirm field, not at the root', () => {
    const result = resetPasswordSchema(t).safeParse({
      newPassword: 'Password1',
      confirmPassword: 'Password2',
    });
    expect(result.success).toBe(false);
    const issue = (result as { error: { issues: Array<{ path: unknown[] }> } })
      .error.issues[0];
    expect(issue.path).toEqual(['confirmPassword']);
  });
});
