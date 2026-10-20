import { describe, expect, it } from 'vitest';
import { applyReelWords, DEMO_RECEIPTS, REEL_DEFAULTS, REEL_H, REEL_W, reelTimeline, reelWords } from './tutorialReelSpecs';

describe('automatic tutorial reel privacy', () => {
  it('ignores legacy uploaded receipts and user-positioned taps', () => {
    const reel = applyReelWords(REEL_DEFAULTS[0], { steps: [{ screenshot: 'private/receipt.png', tap: { x: .9, y: .2 }, caption: 'legacy' }] });
    expect(reel.steps).toEqual(REEL_DEFAULTS[0].steps);
    expect(JSON.stringify(reel)).not.toContain('private/receipt.png');
  });
  it('accepts words but cannot replace demo scenes, receipt data or count', () => {
    const reel = applyReelWords(REEL_DEFAULTS[0], { version: 2, steps: [{ caption: 'Check this receipt', scene: 'bank', receipt: 999, count: 99 }], account: 'private-account' });
    expect(reel.steps[0]).toEqual({ ...REEL_DEFAULTS[0].steps[0], caption: 'Check this receipt' });
    expect(JSON.stringify(reelWords(reel))).not.toContain('private-account');
    expect(Object.keys(reelWords(reel).steps[0])).toEqual(['caption']);
  });
  it('uses the requested sample merchant and total in a 1080 × 1920 reel', () => {
    expect(DEMO_RECEIPTS[0].merchant).toBe('Massy Stores');
    expect(JSON.stringify(DEMO_RECEIPTS)).not.toMatch(/hi-?lo/i);
    expect(DEMO_RECEIPTS[0].total).toBe('TT$214.50');
    expect([REEL_W, REEL_H]).toEqual([1080, 1920]);
  });
  it('shows both ways to add a receipt: upload from photos, then snap with the camera', () => {
    const kinds = REEL_DEFAULTS[1].steps.map(s => s.scene);
    expect(kinds.indexOf('photos')).toBeGreaterThan(-1);
    expect(kinds.indexOf('camera')).toBeGreaterThan(kinds.indexOf('photos'));
  });
  it('finishes the second reel at three scans, counted during reading before saving', () => {
    const scenes = reelTimeline(REEL_DEFAULTS[1]).scenes;
    expect(scenes.filter(s => s.step.scene === 'reading').map(s => s.step.count)).toEqual([2, 3]);
    expect(scenes[scenes.length - 1].step.count).toBe(3);
    expect(reelTimeline(REEL_DEFAULTS[1]).duration).toBeCloseTo(27.8);
  });
});