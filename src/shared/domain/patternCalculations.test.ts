import { describe, expect, it } from 'vitest';
import type { Project } from '../../entities/project/types';
import { calculateBasicSweater } from './patternCalculations';

const project: Project = {
  id: 'p1',
  ownerId: null,
  title: 'Test',
  garmentType: 'basic_sweater_bottom_up',
  gauge: { stitchesPer10cm: 22, rowsPer10cm: 30 },
  construction: {
    autoShoulder: false,
    armholeMode: 'simple',
    manualArmholeScheme: '',
  },
  measurements: {
    bustCm: 96,
    waistCm: 74,
    hipsCm: 102,
    easeCm: 8,
    easeBustCm: 4,
    easeWaistCm: 2,
    easeHipsCm: 4,
    bodyLengthCm: 58,
    armholeDepthCm: 20,
    armholeDecreaseStitchesPerSide: 8,
    shoulderWidthCm: 12,
    neckWidthCm: 18,
    frontNeckWidthCm: 18,
    frontNeckDepthCm: 9,
    backNeckWidthCm: 16,
    backNeckDepthCm: 3,
    distanceFromStartToWaistCm: 42,
    distanceFromWaistToHipsCm: 18,
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
    expect(result.back.armholeShaping.rows).toEqual([2, 4, 6, 8, 10, 12, 14, 16]);
    expect(result.back.rowsAfterArmholeShaping).toBe(44);
    expect(result.front.neckCenterBindOffStitches).toBe(24);
    expect(result.front.neckDecreaseStitchesPerSide).toBe(8);
    expect(result.front.neckShaping.rows).toEqual([3, 7, 10, 14, 17, 20, 24, 27]);
    expect(result.front.neckStartRow).toBe(147);
    expect(result.back.shoulderStitches).toBe(26);
    expect(result.back.backNeckStitches).toBe(35);
    expect(result.back.backNeckDepthRows).toBe(9);
    expect(result.sleeve.wristStitches).toBe(48);
    expect(result.sleeve.upperArmStitches).toBe(81);
    expect(result.sleeve.sleeveRows).toBe(120);
    expect(result.back.instruction[0]).toBe('Наберите 114 п.');
    expect(result.front.instruction.some((step) => step.includes('Закройте средние 24 п.'))).toBe(true);
    expect(result.sleeve.instruction.some((step) => step.includes('прибавляйте'))).toBe(true);
  });

  it('adds human-readable warnings for unusual measurements', () => {
    const result = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        sleeveLengthCm: 78,
        wristCircumferenceCm: 11,
        armholeDepthCm: 36,
      },
    });

    expect(result.warnings.some((warning) => warning.includes('Длина рукава больше 75 см'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('Обхват запястья меньше 12 см'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('Глубина проймы'))).toBe(true);
  });

  it('warns when shoulders and back neck do not fit after armhole decreases', () => {
    const result = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        shoulderWidthCm: 22,
        backNeckWidthCm: 20,
      },
    });

    expect(result.warnings).toContain('Плечи и горловина не помещаются в ширину детали. Уменьшите ширину плеча или горловины.');
    expect(result.fieldWarnings.shoulderWidthCm?.[0]).toContain('Плечи и горловина не помещаются');
    expect(result.fieldWarnings.backNeckWidthCm?.[0]).toContain('Плечи и горловина не помещаются');
  });

  it('warns when front neck starts at or before armhole', () => {
    const result = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        frontNeckDepthCm: 24,
      },
    });

    expect(result.warnings.some((warning) => warning.includes('Горловина начинается одновременно с проймой'))).toBe(true);
    expect(result.fieldWarnings.frontNeckDepthCm?.[0]).toContain('Горловина начинается');
    expect(result.fieldWarnings.armholeDepthCm?.[0]).toContain('Горловина начинается');
  });

  it('warns when armhole shaping is too small or too large', () => {
    const small = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        armholeDecreaseStitchesPerSide: 2,
      },
    });
    const large = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        armholeDecreaseStitchesPerSide: 16,
      },
    });

    expect(small.fieldWarnings.armholeDecreaseStitchesPerSide?.[0]).toContain('очень маленькие');
    expect(large.fieldWarnings.armholeDecreaseStitchesPerSide?.[0]).toContain('съедают слишком много');
  });

  it('warns when sleeve does not expand', () => {
    const result = calculateBasicSweater({
      ...project,
      measurements: {
        ...project.measurements,
        wristCircumferenceCm: 30,
        upperArmCircumferenceCm: 28,
      },
    });

    expect(result.sleeve.shaping.rows).toEqual([]);
    expect(result.warnings.some((warning) => warning.includes('Верх рукава не шире запястья'))).toBe(true);
    expect(result.fieldWarnings.upperArmCircumferenceCm?.[0]).toContain('Верх рукава не шире запястья');
  });

  it('auto-selects shoulder stitches from available top width', () => {
    const result = calculateBasicSweater({
      ...project,
      construction: {
        ...project.construction,
        autoShoulder: true,
      },
    });

    expect(result.back.leftShoulderStitches + result.back.rightShoulderStitches + result.back.backNeckStitches).toBe(
      result.back.castOnStitches - result.back.armholeDecreaseStitchesPerSide * 2,
    );
    expect(result.calculationSheet.some((section) => section.title === 'Расчетный лист')).toBe(false);
  });

  it('uses manual armhole scheme and warns when sum differs', () => {
    const result = calculateBasicSweater({
      ...project,
      construction: {
        ...project.construction,
        armholeMode: 'manual',
        manualArmholeScheme: '3-2-1',
      },
    });

    expect(result.back.armholeScheme.map((item) => item.stitches)).toEqual([3, 2, 1]);
    expect(result.back.armholeSchemeSum).toBe(6);
    expect(result.constructionWarnings.manualArmholeScheme?.[0]).toContain('Ручная схема проймы дает 6 п.');
  });
});
