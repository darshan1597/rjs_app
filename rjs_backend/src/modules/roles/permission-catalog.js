const PERMISSIONS = Object.freeze([
  'dashboard.view',
  'employees.view', 'employees.create', 'employees.update', 'employees.disable', 'employees.assign_roles',
  'roles.view', 'roles.create', 'roles.update', 'roles.delete',
  'customers.view', 'customers.update', 'customers.suspend',
  'drivers.view', 'drivers.review', 'drivers.approve', 'drivers.request_changes', 'drivers.reject', 'drivers.suspend',
  'vehicles.view', 'vehicles.review', 'vehicles.approve', 'vehicles.reject', 'vehicles.update_categories',
  'bookings.view', 'bookings.assign', 'bookings.reassign', 'bookings.cancel', 'bookings.override_status',
  'pricing.view', 'pricing.update',
  'packages.view', 'packages.create', 'packages.update', 'packages.publish', 'packages.archive',
  'payments.view', 'payments.refund', 'wallets.adjust',
  'payouts.view', 'payouts.process', 'payouts.hold',
  'support.view', 'support.assign', 'support.reply', 'support.resolve',
  'reports.view', 'reports.export',
  'settings.view', 'settings.update', 'audit_logs.view',
]);

export { PERMISSIONS };
