// QA script — run against a running build: npm run build && npm start, then BASE=http://localhost:3000 node scripts/qa/mobile.cjs
// Needs Playwright with Chromium (npx playwright install chromium) — not a project dependency.
const { chromium } = require('playwright');
const OUT = process.env.OUT || '.'; const BASE = (process.env.BASE || 'http://localhost:3000');
const pages = ['/', '/catalog', '/catalog/main-courses', '/cart', '/checkout', '/login', '/orders', '/admin', '/admin/orders', '/admin/customers', '/admin/products', '/admin/promotions', '/no-such-page', '/checkout/confirmation/nope'];
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 360, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 760 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(BASE + '/catalog');
    // seed cart via UI: add first 3 products, click + twice on first
    await p.locator('button:has-text("הוספה לסל")').nth(0).click({ force: true });
    await p.locator('button:has-text("הוספה לסל")').nth(1).click({ force: true });
    await p.locator('button[aria-label^="הוספת"]').first().click({ force: true });
    await p.evaluate(() => localStorage.setItem('sk_auth_user', JSON.stringify({ email: 'admin@superkai.co.il', name: 'מנהל', role: 'admin', provider: 'password' })));
    for (const path of pages) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const off = [];
        for (const el of document.querySelectorAll('body *')) {
          const rc = el.getBoundingClientRect();
          if (rc.width === 0) continue;
          if (rc.right > vw + 1 || rc.left < -1) {
            // skip if an ancestor clips overflow
            let a = el.parentElement, clipped = false;
            while (a && a !== document.body) { const s = getComputedStyle(a); if (/(hidden|auto|scroll|clip)/.test(s.overflowX)) { clipped = true; break; } a = a.parentElement; }
            if (!clipped) off.push(`${el.tagName}.${(el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0,60)} [${Math.round(rc.left)},${Math.round(rc.right)}] "${(el.textContent||'').trim().slice(0,30)}"`);
          }
        }
        const small = [];
        for (const el of document.querySelectorAll('button, a, input, select')) {
          const rc = el.getBoundingClientRect();
          if (rc.width && rc.height && (rc.height < 32 || rc.width < 32) && getComputedStyle(el).visibility !== 'hidden') small.push(`${el.tagName} ${Math.round(rc.width)}x${Math.round(rc.height)} "${(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,25)}"`);
        }
        return { sw: document.documentElement.scrollWidth, vw, off: off.slice(0, 8), small: [...new Set(small)].slice(0, 10) };
      });
      console.log(`[${w}] ${path} scrollW=${r.sw} vw=${r.vw}${r.sw > r.vw ? ' **HSCROLL**' : ''}`);
      r.off.forEach(o => console.log('   off:', o));
      if (w === 360) r.small.forEach(o => console.log('   small-target:', o));
      if (w === 360) await p.screenshot({ path: `${OUT}/m360${path.replace(/\//g, '_') || '_home'}.png`, fullPage: path !== '/' });
    }
    await ctx.close();
  }
  await b.close();
})();
