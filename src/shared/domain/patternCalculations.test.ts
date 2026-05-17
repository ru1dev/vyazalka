import { describe, expect, it } from 'vitest';
import type { Project } from '../../entities/project/types';
import { calculateBasicSweater } from './patternCalculations';

const project: Project = {
  id: 'p1',
  ownerId: null,
  title: 'Test',
  garmentType: 'basic_sweater_bottom_up',
  gauge: { stitchesPer10cm: 22, rowsPer10cm: 30 },
  measurements: {
    bustCm: 96,
    easeCm: 8,
    bodyLengthCm: 58,
    armholeDepthCm: 20,
    neckWidthCm: 18,
    frontNeckDepthCm: 9,
    sleeveLengthCm: 40,
    wristCircumferenceCm: 22,
    upperArmCircumferenceCm: 37,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
};

describe('calculateBasicSweater', () => {
  it('calculates back, front and sleeve', () => {
    const result = calculateBasicSweater(project);

    expect(result.back.castOnStitches).toBe(114);
    expect(result.front.castOnStitches).toBe(114);
    expect(result.back.rowsToArmhole).toBe(114);
    expect(result.back.armholeRows).toBe(60);
    expect(result.front.neckStitches).toBe(40);
    expect(result.front.neckDepthRows).toBe(27);
    expect(result.sleeve.wristStitches).toBe(48);
    expect(result.sleeve.upperArmStitches).toBe(81);
    expect(result.sleeve.sleeveRows).toBe(120);
  });
});
