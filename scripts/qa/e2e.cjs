// QA script — run against a running build: npm run build && npm start, then BASE=http://localhost:3000 node scripts/qa/e2e.cjs
// Needs Playwright with Chromium (npx playwright install chromium) — not a project dependency.
const { chromium } = require('playwright');
const B = (process.env.BASE || 'http://localhost:3000');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  // 1. guest browses catalog freely
  await p.goto(B + '/catalog', { waitUntil: 'networkidle' });
  const cards = await p.locator('article').count();
  ok(cards >= 70 && cards <= 80, `catalog shows ${cards} products without login`);
  ok(!(await p.url()).includes('/login'), 'no login redirect while browsing');
  // 2. stepper 0.25 increments on a KG product
  const kgBtn = p.locator('button:has-text("הוספה לסל"):has-text("0.25")').first();
  const title = await p.locator('article', { has: kgBtn }).first().locator('h3').innerText();
  const card = p.locator('article', { has: p.locator('h3', { hasText: title }) }).first();
  await kgBtn.click({ force: true });
  const seen = [];
  for (let i = 0; i < 3; i++) {
    seen.push(await card.locator('[aria-live="polite"]').innerText());
    await card.locator('button[aria-label^="הוספת"]').click({ force: true });
  }
  seen.push(await card.locator('[aria-live="polite"]').innerText());
  ok(JSON.stringify(seen) === JSON.stringify(['0.25 ק״ג', '0.50 ק״ג', '0.75 ק״ג', '1.00 ק״ג']), `KG stepper: ${seen.join(' → ')} (${title})`);
  await card.locator('button[aria-label^="הפחתת"]').click({ force: true });
  ok((await card.locator('[aria-live="polite"]').innerText()) === '0.75 ק״ג', 'minus goes back one quarter');
  // 3. cart: proceed as guest → login with next
  await p.goto(B + '/cart', { waitUntil: 'networkidle' });
  const href = await p.locator('a:has-text("המשך לקופה")').getAttribute('href');
  ok(href === '/login?next=%2Fcheckout', `guest checkout link → ${href}`);
  // direct /checkout as guest is gated
  await p.goto(B + '/checkout', { waitUntil: 'networkidle' });
  ok(await p.locator('text=כמעט סיימנו').count() === 1, 'direct /checkout as guest shows login gate');
  await p.locator('a:has-text("התחברות")').last().click();
  await p.waitForURL(/\/login\?next=/);
  ok(true, 'gate links to /login?next=/checkout');
  await p.fill('#login-email', 'qa-customer@example.com');
  await p.fill('#login-password', 'password123');
  await p.locator('form button[type=submit]').click();
  await p.waitForURL(B + '/checkout', { timeout: 10000 });
  ok(true, 'after login → back on /checkout');
  ok(await p.locator('text=' + title).count() > 0, 'cart persisted across login');
  // 4. open redirect guard
  const p2 = await ctx.newPage();
  await p2.goto(B + '/login?next=//evil.com', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(800);
  ok(p2.url().startsWith(B), `open redirect blocked → ${p2.url()}`);
  await p2.close();
  // 5. delivery fee under 150 ₪, then place a PICKUP order with the demo card
  const total = await p.locator('aside dl').innerText();
  ok(total.includes('25.00'), 'sub-150 ₪ delivery cart charges 25 ₪');
  await p.fill('#phone', '050-1234567');
  await p.locator('[role=radio]:has-text("איסוף עצמי")').click();
  ok((await p.locator('aside dl').innerText()).includes('חינם'), 'pickup is free');
  await p.fill('#cardNumber', '4111 1111 1111 1111');
  await p.fill('#cardExpiry', '12/29');
  await p.fill('#cardCvv', '123');
  await p.fill('#cardId', '123456782');
  await p.locator('button[type=submit]').last().click();
  await p.waitForURL(/\/checkout\/confirmation\//, { timeout: 15000 });
  await p.locator('text=ההזמנה התקבלה').waitFor({ timeout: 10000 });
  ok(true, 'order paid (demo) → confirmation page ' + new URL(p.url()).pathname);
  // 6. routing aliases (as a fresh guest)
  const g = await b.newContext(); const gp = await g.newPage();
  for (const [from, to] of [['/signup', '/login?mode=signup'], ['/register', '/login?mode=signup'], ['/account', '/orders'], ['/menu', '/catalog']]) {
    await gp.goto(B + from, { waitUntil: 'networkidle' });
    const u = new URL(gp.url());
    ok(u.pathname + u.search === to, `${from} → ${u.pathname}${u.search}`);
  }
  await b.close();
})().catch(e => { console.log('FAIL exception', e.message.split('\n')[0]); process.exit(1); });
