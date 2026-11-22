// QA script — run against a running build: npm run build && npm start, then BASE=http://localhost:3000 node scripts/qa/crawl.cjs
// Needs Playwright with Chromium (npx playwright install chromium) — not a project dependency.
const { chromium } = require('playwright');
const B = (process.env.BASE || 'http://localhost:3000');
(async () => {
  const b = await chromium.launch();
  for (const role of ['guest', 'admin']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto(B + '/');
    if (role === 'admin') await p.evaluate(() => localStorage.setItem('sk_auth_user', JSON.stringify({ email: 'admin@superkai.co.il', name: 'מנהל', role: 'admin', provider: 'password' })));
    const seen = new Set(), queue = ['/'], bad = [], errors = [];
    p.on('pageerror', (e) => errors.push(`${p.url()}: ${e.message.slice(0, 120)}`));
    while (queue.length) {
      const path = queue.shift();
      if (seen.has(path)) continue; seen.add(path);
      const res = await p.goto(B + path, { waitUntil: 'networkidle' }).catch((e) => null);
      await p.waitForTimeout(250);
      const status = res ? res.status() : 'ERR';
      const is404 = await p.locator('text=המנה הזו לא בתפריט').count();
      if (status >= 400 || is404) bad.push(`${status} ${path}${is404 ? ' (404 page)' : ''}`);
      const links = await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
      for (const h of links) {
        if (!h || !h.startsWith('/') || h.startsWith('//')) continue;
        const clean = h.split('#')[0] || '/';
        if (!seen.has(clean) && !queue.includes(clean)) queue.push(clean);
      }
    }
    console.log(`[${role}] crawled ${seen.size} URLs: ${[...seen].join(' ')}`);
    console.log(`[${role}] broken: ${bad.length ? bad.join(', ') : 'none'}`);
    console.log(`[${role}] JS errors: ${errors.length ? errors.slice(0,5).join(' | ') : 'none'}`);
    await ctx.close();
  }
  await b.close();
})();
