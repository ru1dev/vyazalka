import { describe, expect, it } from 'vitest';
import { calculateShapingPlan } from './shaping';

describe('calculateShapingPlan', () => {
  it('distributes increases on both sides evenly', () => {
    const plan = calculateShapingPlan({
      mode: 'increase',
      startStitches: 48,
      targetStitches: 82,
      totalRows: 120,
      sides: 'both',
    });

    expect(plan.totalDelta).toBe(34);
    expect(plan.actionsTotal).toBe(17);
    expect(plan.actionsPerSide).toBe(17);
    expect(plan.rows).toEqual([7, 14, 21, 28, 35, 42, 49, 56, 64, 71, 78, 85, 92, 99, 106, 113, 120]);
  });

  it('distributes decreases on one side', () => {
    const plan = calculateShapingPlan({
      mode: 'decrease',
      startStitches: 50,
      targetStitches: 44,
      totalRows: 24,
      sides: 'left',
    });

    expect(plan.totalDelta).toBe(6);
    expect(plan.actionsTotal).toBe(6);
    expect(plan.rows).toEqual([4, 8, 12, 16, 20, 24]);
  });

  it('warns when both sides have odd total delta', () => {
    const plan = calculateShapingPlan({
      mode: 'increase',
      startStitches: 48,
      targetStitches: 81,
      totalRows: 120,
      sides: 'both',
    });

    expect(plan.warnings.some((warning) => warning.includes('не делится ровно'))).toBe(true);
  });

  it('warns when actions exceed rows and duplicates are removed', () => {
    const plan = calculateShapingPlan({
      mode: 'increase',
      startStitches: 10,
      targetStitches: 30,
      totalRows: 5,
      sides: 'left',
    });

    expect(plan.rows.length).toBeLessThan(plan.actionsTotal);
    expect(plan.warnings.some((warning) => warning.includes('больше количества рядов'))).toBe(true);
  });

  it('validates mode direction', () => {
    expect(() =>
      calculateShapingPlan({
        mode: 'increase',
        startStitches: 20,
        targetStitches: 10,
        totalRows: 10,
        sides: 'both',
      }),
    ).toThrow('Для прибавок');
  });
});
