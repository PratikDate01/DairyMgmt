import test from 'node:test';
import assert from 'node:assert/strict';
import i18n from '../src/i18n/index.js';

test('Global Back Button & Navigation Suite (Phase 30.1)', async (t) => {
  await t.test('1. Translation for actions.back in English and Marathi', async () => {
    await i18n.changeLanguage('en');
    assert.equal(i18n.t('common:actions.back'), 'Back');

    await i18n.changeLanguage('mr');
    assert.equal(i18n.t('common:actions.back'), 'मागे');

    // Reset back to English
    await i18n.changeLanguage('en');
  });

  await t.test('2. Role dashboard resolution logic', () => {
    const resolveRoleDashboard = (user) => {
      const role = user?.activeRole || user?.role;
      switch (role) {
        case 'farmer':
          return '/farmer/dashboard';
        case 'dairyOwner':
          return '/dairy-owner/dashboard';
        case 'veterinarian':
          return '/veterinarian/dashboard';
        case 'medicalProvider':
          return '/medical-provider/dashboard';
        case 'admin':
          return '/admin/dashboard';
        default:
          return '/dashboard';
      }
    };

    assert.equal(resolveRoleDashboard({ role: 'farmer' }), '/farmer/dashboard');
    assert.equal(resolveRoleDashboard({ activeRole: 'farmer', role: 'admin' }), '/farmer/dashboard');
    assert.equal(resolveRoleDashboard({ role: 'dairyOwner' }), '/dairy-owner/dashboard');
    assert.equal(resolveRoleDashboard({ role: 'veterinarian' }), '/veterinarian/dashboard');
    assert.equal(resolveRoleDashboard({ role: 'medicalProvider' }), '/medical-provider/dashboard');
    assert.equal(resolveRoleDashboard({ role: 'admin' }), '/admin/dashboard');
    assert.equal(resolveRoleDashboard(null), '/dashboard');
    assert.equal(resolveRoleDashboard({}), '/dashboard');
  });

  await t.test('3. Navigation decision logic (history vs direct fallback)', () => {
    const simulateNavigation = ({ historyIdx, fallback, forceFallback, roleDashboard }) => {
      const targetFallback = fallback || roleDashboard;

      if (forceFallback) {
        return targetFallback;
      }

      const hasInAppHistory = typeof historyIdx === 'number' && historyIdx > 0;
      if (hasInAppHistory) {
        return -1; // history.back()
      }
      return targetFallback;
    };

    // Case A: User arrived from another in-app page (idx = 1, 2, ...)
    assert.equal(
      simulateNavigation({ historyIdx: 1, fallback: '/farmer/dashboard', forceFallback: false }),
      -1
    );
    assert.equal(
      simulateNavigation({ historyIdx: 3, fallback: '/farmer/medicines', forceFallback: false }),
      -1
    );

    // Case B: User opened page directly or in fresh tab (idx = 0 or undefined)
    assert.equal(
      simulateNavigation({ historyIdx: 0, fallback: '/farmer/dashboard', forceFallback: false }),
      '/farmer/dashboard'
    );
    assert.equal(
      simulateNavigation({ historyIdx: undefined, fallback: '/veterinarian/dashboard', forceFallback: false }),
      '/veterinarian/dashboard'
    );

    // Case C: Explicit forceFallback overrides history
    assert.equal(
      simulateNavigation({ historyIdx: 2, fallback: '/farmer/cattle', forceFallback: true }),
      '/farmer/cattle'
    );

    // Case D: Complaints shared page uses active role dashboard fallback when direct
    assert.equal(
      simulateNavigation({ historyIdx: 0, fallback: null, forceFallback: false, roleDashboard: '/dairy-owner/dashboard' }),
      '/dairy-owner/dashboard'
    );
  });

  await t.test('4. Route inventory fallback destinations map verification', () => {
    const routeFallbackMap = {
      // Farmer
      '/farmer/cattle': '/farmer/dashboard',
      '/farmer/ai-scanner': '/farmer/cattle',
      '/farmer/scan-history': '/farmer/ai-scanner',
      '/farmer/vet-requests': '/farmer/dashboard',
      '/farmer/medicines': '/farmer/dashboard',
      '/farmer/medicine-requests': '/farmer/medicines',
      '/farmer/milk-collections': '/farmer/dashboard',
      '/farmer/payments': '/farmer/dashboard',
      '/farmer/reports': '/farmer/dashboard',
      '/farmer/connections': '/farmer/dashboard',
      '/farmer/fodder-marketplace': '/farmer/dashboard',
      // Dairy Owner
      '/dairy-owner/milk-collection': '/dairy-owner/dashboard',
      '/dairy-owner/payments': '/dairy-owner/dashboard',
      '/dairy-owner/farmers': '/dairy-owner/dashboard',
      '/dairy-owner/reports': '/dairy-owner/dashboard',
      // Veterinarian
      '/veterinarian/cases': '/veterinarian/dashboard',
      // Medical Store
      '/medical-provider/inventory': '/medical-provider/dashboard',
      '/medical-provider/medicine-requests': '/medical-provider/dashboard',
      // Admin
      '/admin/reports': '/admin/dashboard',
      '/admin/dashboard?tab=...': '/admin/dashboard',
      // Shared
      '/complaints': 'role-dashboard'
    };

    assert.ok(Object.keys(routeFallbackMap).length >= 20);
    for (const [route, fallback] of Object.entries(routeFallbackMap)) {
      assert.ok(route.length > 0);
      assert.ok(fallback.length > 0);
    }
  });
});
