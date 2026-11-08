import { test, expect } from '@playwright/test';

/**
 * WCAG 2.5.5 (Target Size Level AAA) & WCAG 2.2 (Target Size Minimum Level AA)
 * Mandate: Minimum touch target size of 44px × 44px for primary mobile interaction points.
 */

test.describe('WCAG 44px Interaction Target Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Emulate mobile portrait viewport (iPhone 14 / standard campus mobile device)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
  });

  test('BuyerTabBar: All navigation tabs meet or exceed 44px × 44px touch bounding box', async ({ page }) => {
    const tabs = ['discover', 'saved', 'profile'];
    for (const tab of tabs) {
      const tabButton = page.locator(`#buyer-tab-${tab}`);
      await expect(tabButton).toBeVisible();
      const box = await tabButton.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('VendorLoginModal: Close button, inputs, unlock CTA and keypad meet 44px minimum target', async ({ page }) => {
    // Open Vendor Login modal
    await page.locator('.discovery-brand').click();
    const modal = page.locator('[role="dialog"][aria-labelledby="vendor-login-title"]');
    await expect(modal).toBeVisible();

    // 1. Verify Close button (X)
    const closeBtn = modal.locator('button[aria-label*="Close login"], button[aria-label*="మూసివేయండి"]');
    await expect(closeBtn).toBeVisible();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);

    // 2. Verify Store Code Input & Unlock button
    const storeCodeInput = modal.locator('#store-code-input');
    await expect(storeCodeInput).toBeVisible();
    const inputHeight = (await storeCodeInput.boundingBox())?.height ?? 0;
    expect(inputHeight).toBeGreaterThanOrEqual(44);

    const unlockBtn = modal.locator('button[type="submit"]');
    const unlockBox = await unlockBtn.boundingBox();
    expect(unlockBox).not.toBeNull();
    expect(unlockBox!.height).toBeGreaterThanOrEqual(44);

    // 3. Advance to PIN Deck with store code
    await storeCodeInput.fill('MITS');
    await page.waitForTimeout(300);

    // 4. Verify 4 PIN Digit Inputs
    const pinInputs = modal.locator('input[type="password"]');
    await expect(pinInputs).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const pinBox = await pinInputs.nth(i).boundingBox();
      expect(pinBox).not.toBeNull();
      expect(pinBox!.width).toBeGreaterThanOrEqual(44);
      expect(pinBox!.height).toBeGreaterThanOrEqual(44);
    }

    // 5. Verify On-screen Keypad buttons
    const keypadButtons = modal.locator('.tactile-numpad button, .grid button');
    const keypadCount = await keypadButtons.count();
    for (let i = 0; i < keypadCount; i++) {
      const btnBox = await keypadButtons.nth(i).boundingBox();
      if (btnBox) {
        expect(btnBox.width).toBeGreaterThanOrEqual(44);
        expect(btnBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('3D Architectural Map & Geospatial Tracker: Floating controls meet 44px targets', async ({ page }) => {
    // Open Campus Map
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-campus-tracker'));
    });
    
    // In case open-campus-tracker isn't triggered, click the canteen map CTA if visible
    const mapTrigger = page.locator('button:has-text("Map"), button[aria-label*="map"], button:has-text("క్యాంపస్")').first();
    if (await mapTrigger.isVisible()) {
      await mapTrigger.click();
    }

    const mapModal = page.locator('[role="dialog"][aria-label="Campus Pedestrian Path Tracker"]');
    if (await mapModal.isVisible()) {
      // 1. Verify Recenter Button
      const recenterBtn = mapModal.locator('button[aria-label*="Recenter"]');
      if (await recenterBtn.isVisible()) {
        const recenterBox = await recenterBtn.boundingBox();
        expect(recenterBox).not.toBeNull();
        expect(recenterBox!.width).toBeGreaterThanOrEqual(44);
        expect(recenterBox!.height).toBeGreaterThanOrEqual(44);
      }

      // 2. Verify Zoom In & Out Buttons
      const zoomInBtn = mapModal.locator('button[aria-label*="Zoom in"]');
      if (await zoomInBtn.isVisible()) {
        const zoomInBox = await zoomInBtn.boundingBox();
        expect(zoomInBox).not.toBeNull();
        expect(zoomInBox!.width).toBeGreaterThanOrEqual(44);
        expect(zoomInBox!.height).toBeGreaterThanOrEqual(44);
      }

      const zoomOutBtn = mapModal.locator('button[aria-label*="Zoom out"]');
      if (await zoomOutBtn.isVisible()) {
        const zoomOutBox = await zoomOutBtn.boundingBox();
        expect(zoomOutBox).not.toBeNull();
        expect(zoomOutBox!.width).toBeGreaterThanOrEqual(44);
        expect(zoomOutBox!.height).toBeGreaterThanOrEqual(44);
      }

      // 3. Verify View Menu Bottom CTA
      const viewMenuBtn = mapModal.locator('button:has-text("View Menu"), button:has-text("మెనూ చూడండి")');
      if (await viewMenuBtn.isVisible()) {
        const viewMenuBox = await viewMenuBtn.boundingBox();
        expect(viewMenuBox).not.toBeNull();
        expect(viewMenuBox!.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
