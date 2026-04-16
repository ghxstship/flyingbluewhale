/**
 * GVTEWAY — Definitive E2E Browser Workflow Test
 *
 * Tests EVERY page and workflow end-to-end in a real Chromium browser.
 * Takes screenshots at each step and reports pass/fail for every assertion.
 *
 * Usage: npx tsx scripts/e2e-browser-test.ts
 */

import { chromium, type Page, type Browser } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'e2e-screenshots');
const CREDENTIALS = { email: 'dev@gvteway.test', password: 'Test1234!' };

let pass = 0;
let fail = 0;
const failures: string[] = [];

function ok(label: string, condition: boolean, detail?: string) {
  if (condition) {
    pass++;
    console.log(`  ✅ ${label}${detail ? ': ' + detail : ''}`);
  } else {
    fail++;
    const msg = `${label}${detail ? ': ' + detail : ''}`;
    console.log(`  ❌ ${msg}`);
    failures.push(msg);
  }
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

async function run() {
  // Setup
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   GVTEWAY — E2E BROWSER WORKFLOW TEST SUITE       ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // ═══════════════════════════════════════════════════════
  // 1. PUBLIC PAGES
  // ═══════════════════════════════════════════════════════
  console.log('LANDING PAGE ─────────────────────────────');
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '01_landing');
  ok('Landing page loads', (await page.title()).includes('GVTEWAY'));
  ok('Shows tagline', !!(await page.textContent('body'))?.includes('Universal Production Advancing'));
  ok('Shows feature cards', (await page.locator('text=Unified Catalog').count()) > 0);
  ok('Has login link', (await page.locator('a[href="/login"], a:has-text("Login"), a:has-text("Sign In")').count()) > 0);

  // ═══════════════════════════════════════════════════════
  // 2. LOGIN PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nLOGIN PAGE ───────────────────────────────');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '02_login');
  ok('Login page loads', !!(await page.textContent('body'))?.includes('Sign In'));
  ok('Has email field', (await page.locator('#email, input[name="email"]').count()) > 0);
  ok('Has password field', (await page.locator('#password, input[name="password"]').count()) > 0);
  ok('Has submit button', (await page.locator('button[type="submit"]').count()) > 0);
  ok('Has magic link toggle', !!(await page.textContent('body'))?.includes('magic link'));
  ok('Has signup link', (await page.locator('a[href="/signup"]').count()) > 0);

  // ═══════════════════════════════════════════════════════
  // 3. SIGNUP PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nSIGNUP PAGE ──────────────────────────────');
  await page.goto(`${BASE}/signup`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '03_signup');
  ok('Signup page loads', !!(await page.textContent('body'))?.includes('Create Account'));
  ok('Has name field', (await page.locator('input[name="name"]').count()) > 0);
  ok('Has email field', (await page.locator('input[name="email"]').count()) > 0);
  ok('Has password field', (await page.locator('input[name="password"]').count()) > 0);
  ok('Has org field', (await page.locator('input[name="organization"]').count()) > 0);

  // ═══════════════════════════════════════════════════════
  // 4. LOGIN FLOW (actual auth)
  // ═══════════════════════════════════════════════════════
  console.log('\nLOGIN FLOW ───────────────────────────────');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"], #email', CREDENTIALS.email);
  await page.fill('input[name="password"], #password', CREDENTIALS.password);
  await screenshot(page, '04_login_filled');
  await page.click('button[type="submit"]');
  // Wait for redirect to /console
  try {
    await page.waitForURL('**/console**', { timeout: 10000 });
    ok('Login redirects to /console', true);
  } catch {
    // Might stay on login with error or redirect elsewhere
    const currentUrl = page.url();
    const body = await page.textContent('body') || '';
    if (body.includes('error') || body.includes('Error')) {
      ok('Login redirects to /console', false, 'Got error: ' + body.substring(0, 100));
    } else {
      ok('Login redirects to /console', false, 'Ended up at: ' + currentUrl);
    }
  }
  await screenshot(page, '05_post_login');

  // ═══════════════════════════════════════════════════════
  // 5. CONSOLE PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nCONSOLE ──────────────────────────────────');
  await page.goto(`${BASE}/console`);
  await page.waitForLoadState('networkidle');
  // Wait for hydration — RSC pages need time to render
  await page.waitForTimeout(2000);
  await screenshot(page, '06_console');
  ok('Console loads (not redirected)', !page.url().includes('/login'));
  ok('Shows user info', (await page.locator('text=dev@gvteway.test').count()) > 0 || (await page.locator('text=DEVELOPER').count()) > 0);
  ok('Shows dashboard stats', (await page.locator('text=CATALOG ITEMS').count()) > 0 || (await page.locator('text=Catalog Items').count()) > 0 || (await page.locator('text=350').count()) > 0);
  ok('Has sign-out button', (await page.locator('text=SIGN OUT').count()) > 0 || (await page.locator('text=Sign Out').count()) > 0);

  // ═══════════════════════════════════════════════════════
  // 6. CATALOG PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nCATALOG ──────────────────────────────────');
  await page.goto(`${BASE}/catalog`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '07_catalog');
  const catalogBody = await page.textContent('body') || '';
  ok('Catalog loads', !page.url().includes('/login'));
  ok('Shows catalog groups', catalogBody.includes('Audio') || catalogBody.includes('Lighting') || catalogBody.includes('Staging') || catalogBody.includes('Backline'));
  ok('Shows item count', /\d+ items/i.test(catalogBody) || /\d+ total/i.test(catalogBody) || catalogBody.includes('CDJ') || catalogBody.includes('212'));

  // ═══════════════════════════════════════════════════════
  // 7. CONSOLE PAGES (Projects, Deliverables, Users, Audit)
  // ═══════════════════════════════════════════════════════
  console.log('\nCONSOLE SUBPAGES ─────────────────────────');

  await page.goto(`${BASE}/console/projects`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '08_projects');
  ok('Projects page loads', !page.url().includes('/login'));
  const projBody = await page.textContent('body') || '';
  ok('Shows project data', projBody.includes('iii Joints') || projBody.includes('Salvage'));

  await page.goto(`${BASE}/console/deliverables`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '09_deliverables');
  ok('Deliverables page loads', !page.url().includes('/login'));

  await page.goto(`${BASE}/console/users`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '10_users');
  ok('Users page loads', !page.url().includes('/login'));

  await page.goto(`${BASE}/console/audit`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '11_audit');
  ok('Audit page loads', !page.url().includes('/login'));

  // ═══════════════════════════════════════════════════════
  // 8. CATERING PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nCATERING ─────────────────────────────────');
  await page.goto(`${BASE}/catering`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '12_catering');
  ok('Catering page loads', !page.url().includes('/login'));

  // ═══════════════════════════════════════════════════════
  // 9. NOTIFICATIONS PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nNOTIFICATIONS ────────────────────────────');
  await page.goto(`${BASE}/notifications`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '13_notifications');
  ok('Notifications page loads', !page.url().includes('/login'));
  const notifBody = await page.textContent('body') || '';
  ok('Shows templates section', notifBody.includes('template') || notifBody.includes('Template'));

  // ═══════════════════════════════════════════════════════
  // 10. CMS PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nCMS ──────────────────────────────────────');
  await page.goto(`${BASE}/cms`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '14_cms');
  ok('CMS page loads', !page.url().includes('/login'));

  // ═══════════════════════════════════════════════════════
  // 11. TEMPLATES PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nTEMPLATES ────────────────────────────────');
  await page.goto(`${BASE}/templates`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '15_templates');
  const tplBody = await page.textContent('body') || '';
  ok('Templates page loads', !page.url().includes('/login'));
  ok('Shows project templates', tplBody.includes('Multi-Stage') || tplBody.includes('Festival'));
  ok('Shows submission templates', tplBody.includes('DJ Standard') || tplBody.includes('technical rider'));

  // ═══════════════════════════════════════════════════════
  // 12. PROJECT CREATION WIZARD
  // ═══════════════════════════════════════════════════════
  console.log('\nPROJECT CREATION ─────────────────────────');
  await page.goto(`${BASE}/projects/new`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '16_project_new');
  ok('Project creation page loads', !page.url().includes('/login'));

  // ═══════════════════════════════════════════════════════
  // 13. PORTAL PAGES — ARTIST TRACK
  // ═══════════════════════════════════════════════════════
  console.log('\nPORTAL: ARTIST TRACK ─────────────────────');
  await page.goto(`${BASE}/iii-joints-2026/artist`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '17_artist_portal');
  const artistBody = await page.textContent('body') || '';
  ok('Artist portal loads', artistBody.includes('Artist Portal') || artistBody.includes('artist'));

  // Navigate to advancing hub
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '18_advancing_hub');
  const advBody = await page.textContent('body') || '';
  ok('Advancing hub loads', advBody.includes('Advancing') || advBody.includes('deliverable'));
  ok('Shows deliverable types', advBody.includes('Technical Rider') || advBody.includes('Hospitality'));

  // Technical Rider page
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/technical-rider`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '19_technical_rider');
  const techBody = await page.textContent('body') || '';
  ok('Tech rider loads', techBody.includes('Technical Rider'));
  ok('Shows backline items', techBody.includes('CDJ') || techBody.includes('DJM') || techBody.includes('Confirm'));
  ok('Has submit button', (await page.locator('button:has-text("Submit")').count()) > 0);
  ok('Has quantity inputs', (await page.locator('input[type="number"]').count()) > 0);

  // Hospitality Rider page
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/hospitality-rider`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '20_hospitality_rider');
  const hospBody = await page.textContent('body') || '';
  ok('Hospitality rider loads', hospBody.includes('Hospitality'));
  ok('Shows form sections', hospBody.includes('Dressing') || hospBody.includes('Beverages') || hospBody.includes('Food'));
  ok('Has toggle switches', (await page.locator('button[aria-label]').count()) > 0);

  // Crew List page
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/crew-list`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '21_crew_list');
  const crewBody = await page.textContent('body') || '';
  ok('Crew list loads', crewBody.includes('Crew List'));
  ok('Shows crew member form', crewBody.includes('Full Name') || crewBody.includes('Role'));
  ok('Has Add Person button', (await page.locator('button:has-text("Add Person")').count()) > 0);

  // ═══════════════════════════════════════════════════════
  // 14. PORTAL PAGES — OTHER TRACKS
  // ═══════════════════════════════════════════════════════
  console.log('\nPORTAL: OTHER TRACKS ─────────────────────');

  await page.goto(`${BASE}/iii-joints-2026/production`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '22_production_portal');
  const prodBody = await page.textContent('body') || '';
  ok('Production portal loads', prodBody.includes('PRODUCTION PORTAL') || prodBody.includes('Production Portal') || prodBody.includes('Venue Specs') || prodBody.includes('III JOINTS'));

  await page.goto(`${BASE}/iii-joints-2026/client`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '23_client_portal');
  const clientBody = await page.textContent('body') || '';
  ok('Client portal loads', clientBody.includes('CLIENT PORTAL') || clientBody.includes('Client Portal') || clientBody.includes('Project Overview') || clientBody.includes('III JOINTS'));

  await page.goto(`${BASE}/iii-joints-2026/sponsor`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '24_sponsor_portal');
  const sponsorBody = await page.textContent('body') || '';
  ok('Sponsor portal loads', sponsorBody.includes('SPONSOR PORTAL') || sponsorBody.includes('Sponsor Portal') || sponsorBody.includes('Activation') || sponsorBody.includes('III JOINTS'));

  await page.goto(`${BASE}/iii-joints-2026/guest`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '25_guest_portal');
  const guestBody = await page.textContent('body') || '';
  ok('Guest portal loads', guestBody.includes('GUEST') || guestBody.includes('Guest Portal') || guestBody.includes('Guest') || guestBody.includes('III JOINTS'));

  // ═══════════════════════════════════════════════════════
  // 15. API DOCS PAGE
  // ═══════════════════════════════════════════════════════
  console.log('\nAPI DOCS ─────────────────────────────────');
  await page.goto(`${BASE}/api/v1/docs`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, '26_api_docs');
  const apiBody = await page.textContent('body') || '';
  ok('API docs load', apiBody.includes('GVTEWAY API'));
  ok('Shows endpoints', apiBody.includes('/api/v1/projects') && apiBody.includes('/api/v1/catalog'));

  // ═══════════════════════════════════════════════════════
  // 16. API ENDPOINT TESTS (live authenticated)
  // ═══════════════════════════════════════════════════════
  console.log('\nAPI ENDPOINTS (authenticated) ────────────');

  // GET /api/v1/projects
  let resp = await page.goto(`${BASE}/api/v1/projects`);
  let json = await resp?.json().catch(() => null);
  ok('GET /api/v1/projects', resp?.status() === 200 && json?.data?.length > 0, `${json?.data?.length} projects`);

  // GET /api/v1/catalog/items
  resp = await page.goto(`${BASE}/api/v1/catalog/items`);
  json = await resp?.json().catch(() => null);
  ok('GET /api/v1/catalog/items', resp?.status() === 200 && json?.data?.length > 0, `${json?.data?.length} items`);

  // GET /api/v1/deliverables (needs project_id)
  resp = await page.goto(`${BASE}/api/v1/deliverables?project_id=a0000001-0000-0000-0000-111101005000`);
  json = await resp?.json().catch(() => null);
  ok('GET /api/v1/deliverables', resp?.status() === 200);

  // GET /api/v1 (OpenAPI spec)
  resp = await page.goto(`${BASE}/api/v1`);
  json = await resp?.json().catch(() => null);
  ok('GET /api/v1 (OpenAPI)', resp?.status() === 200 && json?.openapi);

  // ═══════════════════════════════════════════════════════
  // 17. INTERACTIVE WORKFLOW: FILL TECHNICAL RIDER
  // ═══════════════════════════════════════════════════════
  console.log('\nINTERACTIVE: TECH RIDER FORM ─────────────');
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/technical-rider`);
  await page.waitForLoadState('networkidle');

  // Fill in quantities for backline items
  const qtyInputs = page.locator('input[type="number"]');
  const qtyCount = await qtyInputs.count();
  if (qtyCount > 0) {
    // Set first 3 items to qty 1-3
    for (let i = 0; i < Math.min(qtyCount, 3); i++) {
      await qtyInputs.nth(i).fill(String(i + 1));
    }
    ok('Fill backline quantities', true, `${Math.min(qtyCount, 3)} items set`);
  }

  // Change action for first item to "override"
  const selects = page.locator('select');
  const selectCount = await selects.count();
  if (selectCount > 0) {
    await selects.first().selectOption('override');
    ok('Change action to override', true);
  }

  // Fill custom requirements
  const customTextarea = page.locator('textarea');
  if (await customTextarea.count() > 0) {
    await customTextarea.first().fill('Need booth monitors at ear level. Extra power strip for laptop.');
    ok('Fill custom requirements', true);
  }
  await screenshot(page, '27_tech_rider_filled');

  // ═══════════════════════════════════════════════════════
  // 18. INTERACTIVE: HOSPITALITY RIDER FORM
  // ═══════════════════════════════════════════════════════
  console.log('\nINTERACTIVE: HOSPITALITY RIDER ───────────');
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/hospitality-rider`);
  await page.waitForLoadState('networkidle');

  // Toggle switches
  const toggles = page.locator('button[aria-label]');
  const toggleCount = await toggles.count();
  if (toggleCount > 0) {
    for (let i = 0; i < Math.min(toggleCount, 5); i++) {
      await toggles.nth(i).click();
    }
    ok('Toggle hospitality options', true, `${Math.min(toggleCount, 5)} toggled`);
  }

  // Fill number fields
  const numInputs = page.locator('input[type="number"]');
  const numCount = await numInputs.count();
  if (numCount > 0) {
    await numInputs.first().fill('12');
    ok('Set beverage quantities', true);
  }

  // Fill text fields
  const textInputs = page.locator('input[type="text"]');
  if (await textInputs.count() > 0) {
    await textInputs.first().fill('Vegan, no nuts');
    ok('Set dietary restrictions', true);
  }

  await screenshot(page, '28_hospitality_filled');

  // ═══════════════════════════════════════════════════════
  // 19. INTERACTIVE: CREW LIST FORM
  // ═══════════════════════════════════════════════════════
  console.log('\nINTERACTIVE: CREW LIST FORM ──────────────');
  await page.goto(`${BASE}/iii-joints-2026/artist/advancing/crew-list`);
  await page.waitForLoadState('networkidle');

  // Fill crew member forms
  const nameInputs = page.locator('input[placeholder="Full name"]');
  if (await nameInputs.count() > 0) {
    await nameInputs.first().fill('DJ TestBot');
    ok('Fill crew member name', true);
  }

  const emailInputs = page.locator('input[type="email"]');
  if (await emailInputs.count() > 0) {
    await emailInputs.first().fill('testbot@example.com');
    ok('Fill crew member email', true);
  }

  const phoneInputs = page.locator('input[type="tel"]');
  if (await phoneInputs.count() > 0) {
    await phoneInputs.first().fill('+1 (555) 123-4567');
    ok('Fill crew member phone', true);
  }

  await screenshot(page, '29_crew_list_filled');

  // ═══════════════════════════════════════════════════════
  // 20. PROTECTED ROUTE GUARD (unauthenticated)
  // ═══════════════════════════════════════════════════════
  console.log('\nROUTE GUARD (unauthenticated) ────────────');
  // Create a new context without auth cookies
  const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const anonPage = await anonContext.newPage();

  for (const route of ['/console', '/catalog', '/console/projects', '/catering', '/notifications']) {
    await anonPage.goto(`${BASE}${route}`);
    await anonPage.waitForLoadState('networkidle');
    const finalUrl = anonPage.url();
    ok(`${route} redirects to login`, finalUrl.includes('/login'), finalUrl);
  }

  await anonContext.close();

  // ═══════════════════════════════════════════════════════
  // 21. SIGN OUT FLOW
  // ═══════════════════════════════════════════════════════
  console.log('\nSIGN OUT FLOW ────────────────────────────');
  await page.goto(`${BASE}/console`);
  await page.waitForLoadState('networkidle');
  const signOutBtn = page.locator('button:has-text("Sign Out")');
  if (await signOutBtn.count() > 0) {
    await signOutBtn.click();
    try {
      await page.waitForURL('**/', { timeout: 5000 });
      ok('Sign out redirects to landing', true);
    } catch {
      ok('Sign out redirects to landing', page.url() === `${BASE}/` || page.url().includes('/login'));
    }
    await screenshot(page, '30_post_signout');
  } else {
    ok('Sign out button exists', false, 'Not found on console');
  }

  // Verify session is cleared
  await page.goto(`${BASE}/console`);
  await page.waitForLoadState('networkidle');
  ok('Console redirects after signout', page.url().includes('/login'));

  // ═══════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════
  await browser.close();

  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${pass} PASSED | ${fail} FAILED${fail === 0 ? ' | 🏆 ALL GREEN' : ''}  ║`);
  console.log('╚═══════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  ⚠️  ' + f));
  }

  console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log(`   ${fs.readdirSync(SCREENSHOT_DIR).length} screenshots captured`);

  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
