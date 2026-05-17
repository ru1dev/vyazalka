import { describe, expect, it } from 'vitest';
import type { Project } from '../../entities/project/types';
import { createSleevelessDressPatternPieces } from '../../features/patternDiagram/createSleevelessDressPatternPieces';
import { calculateSleevelessDress } from './sleevelessDressCalculations';

const project: Project = {
  id: 'dress-1',
  ownerId: null,
  title: 'Dress',
  garmentType: 'sleeveless_dress',
  gauge: { stitchesPer10cm: 22, rowsPer10cm: 30 },
  construction: {
    autoShoulder: true,
    armholeMode: 'classic',
    manualArmholeScheme: '',
  },
  decorativeZones: [
    {
      id: 'zone-1',
      pieceId: 'front',
      kind: 'diamond',
      startRow: 90,
      heightRows: 54,
      widthStitches: 36,
      label: 'узор',
    },
  ],
  measurements: {
    bustCm: 96,
    waistCm: 74,
    hipsCm: 102,
    easeCm: 0,
    easeBustCm: 4,
    easeWaistCm: 2,
    easeHipsCm: 4,
    bodyLengthCm: 90,
    armholeDepthCm: 20,
    armholeDecreaseStitchesPerSide: 8,
    shoulderWidthCm: 9,
    neckWidthCm: 18,
    frontNeckWidthCm: 18,
    frontNeckDepthCm: 10,
    backNeckWidthCm: 16,
    backNeckDepthCm: 3,
    distanceFromStartToWaistCm: 42,
    distanceFromWaistToHipsCm: 18,
    sleeveLengthCm: 0,
    wristCircumferenceCm: 0,
    upperArmCircumferenceCm: 0,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
};

describe('calculateSleevelessDress', () => {
  it('calculates bust, waist and hips levels', () => {
    const result = calculateSleevelessDress(project);

    expect(result.front.castOnStitches).toBe(117);
    expect(result.front.waistStitches).toBe(84);
    expect(result.front.bustStitches).toBe(110);
    expect(result.front.rowsToWaist).toBe(126);
    expect(result.front.rowsToArmhole).toBe(210);
    expect(result.front.armholeRows).toBe(60);
  });

  it('distributes waist shaping rows', () => {
    const result = calculateSleevelessDress(project);

    expect(result.front.hipsToWaistShaping.totalDelta).toBe(33);
    expect(result.front.hipsToWaistShaping.rows.length).toBeGreaterThan(0);
    expect(result.front.waistToBustShaping.totalDelta).toBe(26);
    expect(result.front.waistToBustShaping.rows[0]).toBeGreaterThan(result.front.rowsToWaist);
  });

  it('maps dress pieces and decorative zones for the diagram', () => {
    const result = calculateSleevelessDress(project);
    const pieces = createSleevelessDressPatternPieces(result, project.decorativeZones);

    expect(pieces).toHaveLength(2);
    expect(pieces[0].shape).toBe('dressBody');
    expect(pieces[1].id).toBe('front');
    expect(pieces[1].decorativeZones?.[0]).toMatchObject({ kind: 'diamond', label: 'узор' });
  });
});
