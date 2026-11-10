const { test, expect } = require('@playwright/test');

const monsters = [
  'Blattling', 'Glutfünkchen', 'Tropfli', 'Blitzling', 'Eisling',
  'Schattilly', 'Drakli', 'Naturion', 'Pyronox', 'Aqualor',
  'Voltaran', 'Frostor', 'Umbrax', 'Dracurion'
];

async function openTestBattle(page, playerIndex, enemyIndex) {
  await page.goto('/');
  await page.locator('[data-tab="testarena"]').click();
  await expect(page.locator('#testPlayerSelect')).toBeVisible();
  await page.locator('#testPlayerSelect').selectOption(String(playerIndex));
  await page.locator('#testEnemySelect').selectOption(String(enemyIndex));
  await page.getByRole('button', { name: /Testkampf starten/i }).click();
  await expect(page.locator('.battle-scene.test-battle')).toBeVisible();
  await expect(page.locator('#playerSprite .battle-art')).toHaveAttribute('alt', monsters[playerIndex]);
  await expect(page.locator('#enemySprite .battle-art')).toHaveAttribute('alt', monsters[enemyIndex]);
  await page.waitForFunction(() => [...document.querySelectorAll('.battle-scene .battle-art')].every(img => img.complete && img.naturalWidth > 0));
  await page.waitForTimeout(150);
}

test('all 14 monsters render in both arena positions at iPhone size', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  const geometry = [];

  for (let i = 0; i < monsters.length; i++) {
    await openTestBattle(page, i, 0);
    const data = await page.evaluate(() => {
      const scene = document.querySelector('.battle-scene');
      return ['playerSprite', 'enemySprite'].map(id => {
        const el = document.getElementById(id);
        const img = el.querySelector('.battle-art');
        const ring = getComputedStyle(el, '::before');
        const rect = el.getBoundingClientRect();
        return {
          id, monster: img.alt, loaded: img.complete && img.naturalWidth > 0,
          spriteBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          ringWidth: ring.width, ringHeight: ring.height, ringContent: ring.content,
          imageWidth: getComputedStyle(img).width, imageHeight: getComputedStyle(img).height
        };
      });
    });
    geometry.push({ player: monsters[i], enemy: monsters[0], data });
    await page.screenshot({ path: `test-results/arena-player-${String(i).padStart(2,'0')}-${monsters[i]}.png`, fullPage: true });
  }

  for (let i = 0; i < monsters.length; i++) {
    await openTestBattle(page, 0, i);
    await page.screenshot({ path: `test-results/arena-enemy-${String(i).padStart(2,'0')}-${monsters[i]}.png`, fullPage: true });
  }

  await page.evaluate(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'arena-geometry.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, geometry);

  expect(browserErrors, 'browser JavaScript errors').toEqual([]);
});
