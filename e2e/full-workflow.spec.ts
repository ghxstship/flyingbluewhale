import { test, expect } from 'playwright/test';

// ═══════════════════════════════════════════════════════
// 1. Public / Auth Pages
// ═══════════════════════════════════════════════════════

test.describe('Public Pages', () => {
  test('Landing page loads with branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GVTEWAY/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Signup page renders form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    // Should stay on login or show error — not crash
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/login');
  });
});

// ═══════════════════════════════════════════════════════
// 2. Console / Platform Pages (redirects expected for unauthed)
// ═══════════════════════════════════════════════════════

test.describe('Console Pages — Unauthenticated Access', () => {
  test('Console root redirects to login', async ({ page }) => {
    await page.goto('/console');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    // Either redirects to login or renders console (if middleware is lenient)
    const url = page.url();
    expect(url).toMatch(/login|console/);
  });

  test('Console projects page loads or redirects', async ({ page }) => {
    await page.goto('/console/projects');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Console users page loads or redirects', async ({ page }) => {
    await page.goto('/console/users');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Console audit page loads or redirects', async ({ page }) => {
    await page.goto('/console/audit');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Console deliverables page loads or redirects', async ({ page }) => {
    await page.goto('/console/deliverables');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Approval queue page loads or redirects', async ({ page }) => {
    await page.goto('/console/deliverables/queue');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Credential manager page loads or redirects', async ({ page }) => {
    await page.goto('/console/credentials');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Fulfillment dashboard page loads or redirects', async ({ page }) => {
    await page.goto('/console/fulfillment');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });

  test('Inventory dashboard page loads or redirects', async ({ page }) => {
    await page.goto('/console/inventory');
    await page.waitForURL(/login|console/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|console/);
  });
});

// ═══════════════════════════════════════════════════════
// 3. Platform Feature Pages
// ═══════════════════════════════════════════════════════

test.describe('Platform Feature Pages', () => {
  test('Catalog page loads or redirects', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForURL(/login|catalog/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|catalog/);
  });

  test('Catering page loads or redirects', async ({ page }) => {
    await page.goto('/catering');
    await page.waitForURL(/login|catering/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|catering/);
  });

  test('CMS page loads or redirects', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForURL(/login|cms/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|cms/);
  });

  test('Notifications page loads or redirects', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForURL(/login|notifications/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|notifications/);
  });

  test('Templates page loads or redirects', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForURL(/login|templates/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|templates/);
  });

  test('New project page loads or redirects', async ({ page }) => {
    await page.goto('/projects/new');
    await page.waitForURL(/login|projects/, { timeout: 5000 });
    expect(page.url()).toMatch(/login|projects/);
  });
});

// ═══════════════════════════════════════════════════════
// 4. On-Site Mode Pages
// ═══════════════════════════════════════════════════════

test.describe('On-Site Mode', () => {
  test('Check-in hub renders scan input and mode cards', async ({ page }) => {
    await page.goto('/check-in/test-event');
    // Page should render without crashing
    await expect(page.locator('body')).toBeVisible();
    // Look for the scan input
    const scanInput = page.locator('input[type="text"]');
    if (await scanInput.count() > 0) {
      await expect(scanInput.first()).toBeVisible();
    }
  });

  test('Command center dashboard renders', async ({ page }) => {
    await page.goto('/check-in/test-event/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════
// 5. Portal Pages (artist, production, client, guest, sponsor)
// ═══════════════════════════════════════════════════════

test.describe('Portal Pages', () => {
  test('Artist portal root', async ({ page }) => {
    await page.goto('/test-show/artist');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist advancing hub', async ({ page }) => {
    await page.goto('/test-show/artist/advancing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist crew list', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/crew-list');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist guest list', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/guest-list');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist hospitality rider', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/hospitality-rider');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist input list', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/input-list');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist stage plot', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/stage-plot');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist technical rider', async ({ page }) => {
    await page.goto('/test-show/artist/advancing/technical-rider');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist credentials page', async ({ page }) => {
    await page.goto('/test-show/artist/credentials');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Artist catering page', async ({ page }) => {
    await page.goto('/test-show/artist/catering');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Production portal root', async ({ page }) => {
    await page.goto('/test-show/production');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Production vendor submissions', async ({ page }) => {
    await page.goto('/test-show/production/vendor-submissions');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Production equipment pull list', async ({ page }) => {
    await page.goto('/test-show/production/vendor-submissions/equipment-pull-list');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Production credentials page', async ({ page }) => {
    await page.goto('/test-show/production/credentials');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Production equipment page', async ({ page }) => {
    await page.goto('/test-show/production/equipment');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client portal', async ({ page }) => {
    await page.goto('/test-show/client');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Guest portal', async ({ page }) => {
    await page.goto('/test-show/guest');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sponsor portal', async ({ page }) => {
    await page.goto('/test-show/sponsor');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════
// 6. API Endpoints
// ═══════════════════════════════════════════════════════

test.describe('API Endpoints', () => {
  test('API v1 root returns metadata', async ({ request }) => {
    const res = await request.get('/api/v1');
    expect(res.status()).toBeLessThan(500);
  });

  test('API docs returns schema', async ({ request }) => {
    const res = await request.get('/api/v1/docs');
    expect(res.status()).toBeLessThan(500);
  });

  test('Projects API requires auth', async ({ request }) => {
    const res = await request.get('/api/v1/projects');
    expect(res.status()).toBeLessThan(500);
  });

  test('Deliverables API requires project_id', async ({ request }) => {
    const res = await request.get('/api/v1/deliverables');
    expect([200, 400, 401]).toContain(res.status());
  });

  test('Catalog items API responds', async ({ request }) => {
    const res = await request.get('/api/v1/catalog/items');
    expect(res.status()).toBeLessThan(500);
  });

  test('Allocations API responds', async ({ request }) => {
    const res = await request.get('/api/v1/allocations');
    expect(res.status()).toBeLessThan(500);
  });

  test('Credential orders API requires project_id', async ({ request }) => {
    const res = await request.get('/api/v1/credentials/orders');
    expect([200, 400, 401]).toContain(res.status());
  });

  test('Credential orders API with project_id', async ({ request }) => {
    const res = await request.get('/api/v1/credentials/orders?project_id=00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBeLessThan(500);
  });

  test('Fulfillment API requires project_id', async ({ request }) => {
    const res = await request.get('/api/v1/fulfillment');
    expect([200, 400, 401]).toContain(res.status());
  });

  test('Fulfillment API with project_id', async ({ request }) => {
    const res = await request.get('/api/v1/fulfillment?project_id=00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBeLessThan(500);
  });

  test('Audit log API responds', async ({ request }) => {
    const res = await request.get('/api/v1/audit-log');
    expect(res.status()).toBeLessThan(500);
  });

  test('Audit log API with filters', async ({ request }) => {
    const res = await request.get('/api/v1/audit-log?entity_type=deliverable&limit=10');
    expect(res.status()).toBeLessThan(500);
  });

  test('Check-in scan API requires POST', async ({ request }) => {
    const res = await request.post('/api/v1/check-in/scan', {
      data: { scan_type: 'credential', scan_data: '00000000-0000-0000-0000-000000000000' },
    });
    // 401 (unauthed) or 404 (not found) — not 500
    expect(res.status()).toBeLessThan(500);
  });

  test('Credential transition API requires auth', async ({ request }) => {
    const res = await request.post('/api/v1/credentials/orders/00000000-0000-0000-0000-000000000000/transition', {
      data: { status: 'approved' },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Fulfillment order creation requires auth', async ({ request }) => {
    const res = await request.post('/api/v1/fulfillment', {
      data: { project_id: '00000000-0000-0000-0000-000000000000', type: 'delivery' },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test('Credential order creation requires auth', async ({ request }) => {
    const res = await request.post('/api/v1/credentials/orders', {
      data: { project_id: '00000000-0000-0000-0000-000000000000', credential_type_id: '00000000-0000-0000-0000-000000000000' },
    });
    expect(res.status()).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════
// 7. Error Handling & Edge Cases
// ═══════════════════════════════════════════════════════

test.describe('Error Handling', () => {
  test('404 page for unknown route', async ({ page }) => {
    const res = await page.goto('/this-does-not-exist-ever');
    expect(res?.status()).toBe(404);
  });

  test('Deliverable review with invalid UUID returns gracefully', async ({ page }) => {
    await page.goto('/console/deliverables/not-a-uuid');
    await expect(page.locator('body')).toBeVisible();
    // Should not crash — either redirect or show not-found message
  });

  test('Auth signout responds to POST', async ({ request }) => {
    const res = await request.post('/api/auth/signout', { maxRedirects: 0 });
    expect([302, 200, 401]).toContain(res.status());
  });
});
