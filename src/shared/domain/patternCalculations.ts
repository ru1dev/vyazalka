import type { CalculationResult, Project, ShapingPlan } from '../../entities/project/types';
import { cmToRows, cmToStitches, deriveGauge } from './gauge';
import { calculateShapingPlan } from './shaping';

const FRONT_NECK_CENTER_BIND_OFF_PERCENT = 0.6;

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
  const backCastOnStitches = cmToStitches(backWidth, gaugeDerived.stitchesPerCm);
  const frontCastOnStitches = cmToStitches(frontWidth, gaugeDerived.stitchesPerCm);
  const shoulderStitches = cmToStitches(m.shoulderWidthCm, gaugeDerived.stitchesPerCm);
  const backNeckStitches = cmToStitches(m.backNeckWidthCm, gaugeDerived.stitchesPerCm);
  const backNeckDepthRows = cmToRows(m.backNeckDepthCm, gaugeDerived.rowsPerCm);
  const armholeDecreaseTotal = m.armholeDecreaseStitchesPerSide * 2;
  const armholeShapingRows = Math.max(2, m.armholeDecreaseStitchesPerSide * 2);
  const backArmholeShaping = calculateArmholeShaping(backCastOnStitches, m.armholeDecreaseStitchesPerSide, armholeShapingRows);
  const frontArmholeShaping = calculateArmholeShaping(frontCastOnStitches, m.armholeDecreaseStitchesPerSide, armholeShapingRows);
  const lastArmholeShapingRow = backArmholeShaping.rows[backArmholeShaping.rows.length - 1] ?? 0;
  const rowsAfterArmholeShaping = Math.max(armholeRows - lastArmholeShapingRow, 0);
  const frontNeckStitches = cmToStitches(m.neckWidthCm, gaugeDerived.stitchesPerCm);
  const neckDepthRows = cmToRows(m.frontNeckDepthCm, gaugeDerived.rowsPerCm);
  const neckStartRow = cmToRows(m.bodyLengthCm - m.frontNeckDepthCm, gaugeDerived.rowsPerCm);
  const neckCenterBindOffStitches = Math.round(frontNeckStitches * FRONT_NECK_CENTER_BIND_OFF_PERCENT);
  const remainingNeckStitches = Math.max(frontNeckStitches - neckCenterBindOffStitches, 0);
  const neckDecreaseStitchesPerSide = Math.floor(remainingNeckStitches / 2);
  const frontNeckShaping = calculateNeckShaping(neckDecreaseStitchesPerSide, neckDepthRows);
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

  warnings.push(...collectMeasurementWarnings(project));
  warnings.push(...backArmholeShaping.warnings, ...frontNeckShaping.warnings, ...sleeveShaping.warnings);
  if (remainingNeckStitches % 2 !== 0) {
    warnings.push('Оставшиеся петли горловины переда не делятся поровну: одну петлю придется убрать с одной стороны или изменить ширину горловины.');
  }

  return {
    gaugeDerived,
    formulas: [
      `Обхват груди ${m.bustCm} см + свобода ${m.easeCm} см = ${totalCircumference} см.`,
      `${totalCircumference} / 2 = ${frontWidth} см на перед и ${backWidth} см на спинку.`,
      `${frontWidth} x ${gaugeDerived.stitchesPerCm} = ${frontCastOnStitches} петель переда.`,
      `${backWidth} x ${gaugeDerived.stitchesPerCm} = ${backCastOnStitches} петель спинки.`,
      `Горловина переда ${frontNeckStitches} п.: закрыть средние ${neckCenterBindOffStitches} п., оставшиеся ${remainingNeckStitches} п. распределить по сторонам.`,
      `Пройма: убрать по ${m.armholeDecreaseStitchesPerSide} п. с каждой стороны, всего ${armholeDecreaseTotal} п.`,
    ],
    back: {
      widthCm: backWidth,
      castOnStitches: backCastOnStitches,
      rowsToArmhole,
      armholeRows,
      shoulderStitches,
      backNeckStitches,
      backNeckDepthRows,
      armholeDecreaseStitchesPerSide: m.armholeDecreaseStitchesPerSide,
      armholeShaping: backArmholeShaping,
      rowsAfterArmholeShaping,
      instruction: [
        `Наберите ${backCastOnStitches} п.`,
        `Вяжите ${rowsToArmhole} рядов прямо до проймы.`,
        `Для проймы убавляйте по 1 п. с каждой стороны в рядах: ${formatRows(backArmholeShaping.rows)}.`,
        `После убавок проймы вяжите еще ${rowsAfterArmholeShaping} рядов до плеча.`,
        `Ориентир горловины спинки: ${backNeckStitches} п. шириной и ${backNeckDepthRows} р. глубиной.`,
        'Закройте петли плеч и горловины.',
      ],
    },
    front: {
      widthCm: frontWidth,
      castOnStitches: frontCastOnStitches,
      rowsToArmhole,
      armholeRows,
      neckStitches: frontNeckStitches,
      neckDepthRows,
      neckStartRow,
      neckCenterBindOffStitches,
      neckDecreaseStitchesPerSide,
      neckShaping: frontNeckShaping,
      instruction: [
        `Наберите ${frontCastOnStitches} п.`,
        `Вяжите ${rowsToArmhole} рядов прямо до проймы.`,
        `Выполните пройму как на спинке: убавляйте по 1 п. с каждой стороны в рядах ${formatRows(frontArmholeShaping.rows)}.`,
        `На высоте ${neckStartRow} рядов от начала детали начните горловину.`,
        `Закройте средние ${neckCenterBindOffStitches} п.`,
        `Для закругления горловины убавляйте по 1 п. со стороны горловины в рядах: ${formatRows(frontNeckShaping.rows)}.`,
        'Довяжите плечи до общей высоты детали.',
      ],
    },
    sleeve: {
      wristStitches,
      upperArmStitches,
      sleeveRows,
      shaping: sleeveShaping,
      instruction: [
        `Наберите ${wristStitches} п.`,
        `Вяжите ${sleeveRows} рядов.`,
        `Для расширения рукава прибавляйте по 1 п. с каждой стороны в рядах: ${formatRows(sleeveShaping.rows)}.`,
        `В конце должно быть ${upperArmStitches} п.`,
      ],
    },
    warnings: Array.from(new Set(warnings)),
  };
}

export function validateMeasurements(project: Project): void {
  const gaugeDerived = deriveGauge(project.gauge);
  const measurements = Object.entries(project.measurements);
  const invalid = measurements.find(([, value]) => !Number.isFinite(value) || value <= 0);

  if (invalid) {
    throw new Error('Все мерки должны быть положительными числами.');
  }

  if (project.measurements.bodyLengthCm <= project.measurements.armholeDepthCm) {
    throw new Error('Длина изделия должна быть больше глубины проймы.');
  }

  const pieceWidthStitches = cmToStitches(
    (project.measurements.bustCm + project.measurements.easeCm) / 2,
    gaugeDerived.stitchesPerCm,
  );
  if (project.measurements.armholeDecreaseStitchesPerSide * 2 >= pieceWidthStitches) {
    throw new Error('Убавки проймы не могут быть больше ширины детали.');
  }
}

function calculateArmholeShaping(castOnStitches: number, decreasesPerSide: number, totalRows: number): ShapingPlan {
  return calculateShapingPlan({
    mode: 'decrease',
    startStitches: castOnStitches,
    targetStitches: castOnStitches - decreasesPerSide * 2,
    totalRows,
    sides: 'both',
    actionEvery: 2,
  });
}

function calculateNeckShaping(actionsPerSide: number, totalRows: number): ShapingPlan {
  if (actionsPerSide <= 0) {
    return {
      totalDelta: 0,
      actionsTotal: 0,
      actionsPerSide: 0,
      rows: [],
      humanReadableInstruction: 'Дополнительные убавки горловины не нужны.',
      warnings: [],
    };
  }

  return calculateShapingPlan({
    mode: 'decrease',
    startStitches: actionsPerSide + 1,
    targetStitches: 1,
    totalRows,
    sides: 'left',
  });
}

function collectMeasurementWarnings(project: Project): string[] {
  const m = project.measurements;
  const warnings: string[] = [];

  if (m.sleeveLengthCm > 75) {
    warnings.push('Длина рукава больше 75 см. Проверьте мерку: для большинства изделий это необычно много.');
  }

  if (m.wristCircumferenceCm < 12) {
    warnings.push('Обхват запястья меньше 12 см. Проверьте, не указана ли мерка слишком маленькой.');
  }

  if (m.armholeDepthCm < 12 || m.armholeDepthCm > 35) {
    warnings.push('Глубина проймы обычно находится примерно в диапазоне 12-35 см. Проверьте мерку перед вязанием.');
  }

  return warnings;
}

function formatRows(rows: number[]): string {
  return rows.length > 0 ? rows.join(', ') : 'нет';
}
