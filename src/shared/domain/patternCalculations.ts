import type { CalculationResult, Project } from '../../entities/project/types';
import { cmToRows, cmToStitches, deriveGauge } from './gauge';
import { calculateShapingPlan } from './shaping';

export function calculateBasicSweater(project: Project): CalculationResult {
  const warnings = ['Расчет является вспомогательным. Перед вязанием проверьте образец и конструкцию изделия.'];
  const gaugeDerived = deriveGauge(project.gauge);
  const m = project.measurements;

  validateMeasurements(project);

  const totalCircumference = m.bustCm + m.easeCm;
  const frontWidth = totalCircumference / 2;
  const backWidth = totalCircumference / 2;
  const rowsToArmhole = cmToRows(m.bodyLengthCm - m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const armholeRows = cmToRows(m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const wristStitches = cmToStitches(m.wristCircumferenceCm, gaugeDerived.stitchesPerCm);
  const upperArmStitches = cmToStitches(m.upperArmCircumferenceCm, gaugeDerived.stitchesPerCm);
  const sleeveRows = cmToRows(m.sleeveLengthCm, gaugeDerived.rowsPerCm);
  const sleeveShaping = calculateShapingPlan({
    mode: 'increase',
    startStitches: wristStitches,
    targetStitches: upperArmStitches,
    totalRows: sleeveRows,
    sides: 'both',
  });

  return {
    gaugeDerived,
    formulas: [
      `Обхват груди ${m.bustCm} см + свобода ${m.easeCm} см = ${totalCircumference} см.`,
      `${totalCircumference} / 2 = ${frontWidth} см на перед и ${backWidth} см на спинку.`,
      `${frontWidth} x ${gaugeDerived.stitchesPerCm} = ${cmToStitches(frontWidth, gaugeDerived.stitchesPerCm)} петель переда.`,
      `${backWidth} x ${gaugeDerived.stitchesPerCm} = ${cmToStitches(backWidth, gaugeDerived.stitchesPerCm)} петель спинки.`,
    ],
    back: {
      widthCm: backWidth,
      castOnStitches: cmToStitches(backWidth, gaugeDerived.stitchesPerCm),
      rowsToArmhole,
      armholeRows,
    },
    front: {
      widthCm: frontWidth,
      castOnStitches: cmToStitches(frontWidth, gaugeDerived.stitchesPerCm),
      rowsToArmhole,
      armholeRows,
      neckStitches: cmToStitches(m.neckWidthCm, gaugeDerived.stitchesPerCm),
      neckDepthRows: cmToRows(m.frontNeckDepthCm, gaugeDerived.rowsPerCm),
    },
    sleeve: {
      wristStitches,
      upperArmStitches,
      sleeveRows,
      shaping: sleeveShaping,
    },
    warnings: [...warnings, ...sleeveShaping.warnings],
  };
}

export function validateMeasurements(project: Project): void {
  const measurements = Object.entries(project.measurements);
  const invalid = measurements.find(([, value]) => !Number.isFinite(value) || value <= 0);

  if (invalid) {
    throw new Error('Все мерки должны быть положительными числами.');
  }

  if (project.measurements.bodyLengthCm <= project.measurements.armholeDepthCm) {
    throw new Error('Длина изделия должна быть больше глубины проймы.');
  }
}
