import { describe, expect, it, vi } from 'vitest';
import { requirePermission } from '../src/modules/admins/admin-auth.middleware.js';

describe('admin authorization', () => {
  it('blocks employees with a temporary password before checking permissions', () => {
    const middleware = requirePermission('employees.view');
    const next = vi.fn();
    middleware({ admin: { accountType: 'EMPLOYEE', mustChangePassword: true }, adminPermissions: ['employees.view'] }, {}, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403, code: 'PASSWORD_CHANGE_REQUIRED' });
  });

  it('allows an employee who has changed their password and has permission', () => {
    const middleware = requirePermission('employees.view');
    const next = vi.fn();
    middleware({ admin: { accountType: 'EMPLOYEE', mustChangePassword: false }, adminPermissions: ['employees.view'] }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('allows super admins without explicit permission entries', () => {
    const middleware = requirePermission('audit_logs.view');
    const next = vi.fn();
    middleware({ admin: { accountType: 'SUPER_ADMIN' }, adminPermissions: [] }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });
});
