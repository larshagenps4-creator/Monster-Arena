const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

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
  await page.waitForTimeout(250);
}

// Measures the visible feet/stance anchor, not the center of transparent
// padding or asymmetric wings/tails. The ring center is the center of ::before.
async function measureAlignment(page) {
  return page.evaluate(() => ['playerSprite', 'enemySprite'].map(id => {
    const sprite = document.getElementById(id);
    const img = sprite.querySelector('.battle-art');
    const spriteRect = sprite.getBoundingClientRect();
    const imageRect = img.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let minY = canvas.height, maxY = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 40) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    const anchorTop = Math.max(minY, Math.floor(maxY - (maxY - minY + 1) * 0.22));
    let weightedX = 0, weight = 0;
    for (let y = anchorTop; y <= maxY; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha > 40) { weightedX += x * alpha; weight += alpha; }
      }
    }
    const anchorX = weightedX / Math.max(1, weight);
    const anchorBottom = maxY + 1;
    const ringStyle = getComputedStyle(sprite, '::before');
    const ringWidth = parseFloat(ringStyle.width);
    const ringHeight = parseFloat(ringStyle.height);
    const ringCenterX = spriteRect.left + spriteRect.width / 2;
    const ringCenterY = spriteRect.bottom;
    const visibleAnchorX = imageRect.left + (anchorX / canvas.width) * imageRect.width;
    const visibleBottomY = imageRect.top + (anchorBottom / canvas.height) * imageRect.height;

    return {
      position: id,
      monster: img.alt,
      ringCenter: { x: ringCenterX, y: ringCenterY, width: ringWidth, height: ringHeight },
      visibleFootAnchor: { x: visibleAnchorX, y: visibleBottomY },
      horizontalOffset: visibleAnchorX - ringCenterX,
      verticalOffset: visibleBottomY - ringCenterY,
      horizontalTolerance: ringWidth * 0.035,
      verticalTolerance: ringHeight * 0.12,
      loaded: img.complete && img.naturalWidth > 0
    };
  }));
}

function assertCentered(measurements) {
  for (const m of measurements) {
    expect(m.loaded, `${m.monster} (${m.position}) image must load`).toBe(true);
    expect(
      Math.abs(m.horizontalOffset),
      `${m.monster} (${m.position}) horizontal foot-anchor offset: ${m.horizontalOffset.toFixed(1)}px; allowed ±${m.horizontalTolerance.toFixed(1)}px`
    ).toBeLessThanOrEqual(m.horizontalTolerance);
    expect(
      Math.abs(m.verticalOffset),
      `${m.monster} (${m.position}) foot-to-ring-center offset: ${m.verticalOffset.toFixed(1)}px; allowed ±${m.verticalTolerance.toFixed(1)}px`
    ).toBeLessThanOrEqual(m.verticalTolerance);
  }
}

test('all 14 monsters are visually centered in their rings in both arena positions at iPhone size', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  const report = [];

  for (let i = 0; i < monsters.length; i++) {
    await openTestBattle(page, i, 0);
    const measurements = await measureAlignment(page);
    report.push({ player: monsters[i], enemy: monsters[0], measurements });
    assertCentered(measurements);
    await page.screenshot({ path: `test-results/arena-player-${String(i).padStart(2, '0')}-${monsters[i]}.png`, fullPage: true });
  }

  for (let i = 0; i < monsters.length; i++) {
    await openTestBattle(page, 0, i);
    const measurements = await measureAlignment(page);
    report.push({ player: monsters[0], enemy: monsters[i], measurements });
    assertCentered(measurements);
    await page.screenshot({ path: `test-results/arena-enemy-${String(i).padStart(2, '0')}-${monsters[i]}.png`, fullPage: true });
  }

  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/arena-alignment-report.json', JSON.stringify(report, null, 2));
  expect(browserErrors, 'browser JavaScript errors').toEqual([]);
});
