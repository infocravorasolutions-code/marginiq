const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'], // Has all permissions
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'dashboard.view', 'products.view', 'products.create', 'products.update', 'products.delete',
    'inventory.view', 'inventory.manage', 'orders.view', 'orders.manage',
    'settlements.view', 'settlements.import', 'settlements.reconcile',
    'reports.view', 'reports.create', 'reports.export', 'reports.delete',
    'alerts.view', 'alerts.manage', 'pricing.view', 'pricing.manage',
    'users.view', 'users.manage', 'settings.view', 'settings.manage',
    'comments.manage', 'feeRules.manage'
  ],
  MANAGER: [
    'dashboard.view', 'products.view', 'inventory.view', 'inventory.manage',
    'orders.view', 'orders.manage', 'settlements.view', 'settlements.import',
    'reports.view', 'reports.create', 'reports.export',
    'alerts.view', 'alerts.manage', 'pricing.view',
    'comments.manage', 'feeRules.manage'
  ],
  ANALYST: [
    'dashboard.view', 'products.view', 'inventory.view', 'orders.view',
    'settlements.view', 'reports.view', 'reports.create', 'reports.export',
    'alerts.view', 'pricing.view'
  ],
  VIEWER: [
    'dashboard.view', 'products.view', 'reports.view', 'orders.view', 'settlements.view', 'inventory.view', 'alerts.view'
  ],
  USER: [
    'dashboard.view', 'products.view', 'reports.view', 'orders.view', 'settlements.view', 'inventory.view', 'alerts.view'
  ]
};

export class PermissionService {
  static hasPermission(role: string, permission: string): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes('*')) return true;
    
    // Check exact match
    if (permissions.includes(permission)) return true;
    
    // Check wildcard match (e.g. products.*)
    const [resource] = permission.split('.');
    return permissions.includes(`${resource}.*`);
  }
}
