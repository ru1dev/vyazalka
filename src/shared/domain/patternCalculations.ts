import type {
  ArmholeSchemeItem,
  CalculationResult,
  CalculationSheetSection,
  ConstructionSettings,
  Measurements,
  PatternCheck,
  Project,
  ShapingPlan,
} from '../../entities/project/types';
import { defaultConstructionSettings } from '../../entities/project/types';
import { roundToTwoDecimals } from '../utils/rounding';
import { cmToRows, cmToStitches, deriveGauge } from './gauge';
import { calculateShapingPlan } from './shaping';

const FRONT_NECK_CENTER_BIND_OFF_PERCENT = 0.6;

type FieldWarnings = Partial<Record<keyof Measurements, string[]>>;
type ConstructionWarnings = Partial<Record<keyof ConstructionSettings, string[]>>;

export function calculateBasicSweater(project: Project): CalculationResult {
  const warnings = ['Расчет является вспомогательным. Перед вязанием проверьте образец и конструкцию изделия.'];
  const gaugeDerived = deriveGauge(project.gauge);
  const m = project.measurements;
  const construction = { ...defaultConstructionSettings, ...project.construction };

  validateMeasurements(project);

  const totalCircumference = m.bustCm + m.easeCm;
  const frontWidth = totalCircumference / 2;
  const backWidth = totalCircumference / 2;
  const rowsToArmhole = cmToRows(m.bodyLengthCm - m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const armholeRows = cmToRows(m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const totalBodyRows = cmToRows(m.bodyLengthCm, gaugeDerived.rowsPerCm);
  const backCastOnStitches = cmToStitches(backWidth, gaugeDerived.stitchesPerCm);
  const frontCastOnStitches = cmToStitches(frontWidth, gaugeDerived.stitchesPerCm);
  const backNeckStitches = cmToStitches(m.backNeckWidthCm, gaugeDerived.stitchesPerCm);
  const backNeckDepthRows = cmToRows(m.backNeckDepthCm, gaugeDerived.rowsPerCm);
  const armholeDecreaseTotal = m.armholeDecreaseStitchesPerSide * 2;
  const widthStitchesAfterArmhole = backCastOnStitches - armholeDecreaseTotal;
  const autoShoulders = calculateAutoShoulders(widthStitchesAfterArmhole, backNeckStitches, gaugeDerived.stitchesPerCm);
  const manualShoulderStitches = cmToStitches(m.shoulderWidthCm, gaugeDerived.stitchesPerCm);
  const leftShoulderStitches = construction.autoShoulder ? autoShoulders.leftShoulder : manualShoulderStitches;
  const rightShoulderStitches = construction.autoShoulder ? autoShoulders.rightShoulder : manualShoulderStitches;
  const shoulderStitches = construction.autoShoulder ? leftShoulderStitches : manualShoulderStitches;
  const requiredTopStitches = leftShoulderStitches + rightShoulderStitches + backNeckStitches;
  const armholeScheme = createArmholeScheme(m.armholeDecreaseStitchesPerSide, construction);
  const armholeSchemeSum = armholeScheme.reduce((sum, item) => sum + item.stitches, 0);
  const armholeShapingRows = Math.max(2, m.armholeDecreaseStitchesPerSide * 2);
  const backArmholeShaping = calculateArmholeShaping(backCastOnStitches, m.armholeDecreaseStitchesPerSide, armholeShapingRows);
  const frontArmholeShaping = calculateArmholeShaping(frontCastOnStitches, m.armholeDecreaseStitchesPerSide, armholeShapingRows);
  const lastArmholeShapingRow = Math.max(backArmholeShaping.rows[backArmholeShaping.rows.length - 1] ?? 0, armholeScheme[armholeScheme.length - 1]?.row ?? 0);
  const rowsAfterArmholeShaping = Math.max(armholeRows - lastArmholeShapingRow, 0);
  const frontNeckStitches = cmToStitches(m.neckWidthCm, gaugeDerived.stitchesPerCm);
  const neckDepthRows = cmToRows(m.frontNeckDepthCm, gaugeDerived.rowsPerCm);
  const neckStartRow = totalBodyRows - neckDepthRows;
  const neckDistribution = calculateFrontNeckDistribution(frontNeckStitches);
  const frontNeckShaping = calculateNeckShaping(Math.max(neckDistribution.leftDecrease, neckDistribution.rightDecrease), neckDepthRows);
  const wristStitches = cmToStitches(m.wristCircumferenceCm, gaugeDerived.stitchesPerCm);
  const upperArmStitches = cmToStitches(m.upperArmCircumferenceCm, gaugeDerived.stitchesPerCm);
  const sleeveRows = cmToRows(m.sleeveLengthCm, gaugeDerived.rowsPerCm);
  const sleeveShaping = upperArmStitches > wristStitches
    ? calculateShapingPlan({
        mode: 'increase',
        startStitches: wristStitches,
        targetStitches: upperArmStitches,
        totalRows: sleeveRows,
        sides: 'both',
      })
    : emptyShapingPlan('Расширения рукава не будет.');
  const checks = collectPatternChecks({
    measurements: m,
    construction,
    bodyPartStitches: backCastOnStitches,
    widthStitchesAfterArmhole,
    requiredTopStitches,
    rowsToArmhole,
    totalBodyRows,
    frontNeckDepthRows: neckDepthRows,
    wristStitches,
    upperArmStitches,
    armholeSchemeSum,
    neckDistribution,
  });
  const fieldWarnings = collectFieldWarnings(checks);
  const constructionWarnings = collectConstructionWarnings(checks);

  warnings.push(...checks.filter((check) => check.severity !== 'ok').map((check) => check.message));
  warnings.push(...backArmholeShaping.warnings, ...frontNeckShaping.warnings, ...sleeveShaping.warnings);

  const hasCriticalIssues = checks.some((check) => check.severity === 'critical');

  return {
    gaugeDerived,
    formulas: [
      `Обхват груди ${m.bustCm} см + свобода ${m.easeCm} см = ${totalCircumference} см.`,
      `${totalCircumference} / 2 = ${frontWidth} см на перед и ${backWidth} см на спинку.`,
      `${frontWidth} x ${gaugeDerived.stitchesPerCm} = ${frontCastOnStitches} петель переда.`,
      `${backWidth} x ${gaugeDerived.stitchesPerCm} = ${backCastOnStitches} петель спинки.`,
      `После проймы остается ${widthStitchesAfterArmhole} п.; плечи и горловина требуют ${requiredTopStitches} п.`,
      `Горловина переда ${frontNeckStitches} п.: закрыть средние ${neckDistribution.centerBindOff} п., убавить ${neckDistribution.leftDecrease} п. слева и ${neckDistribution.rightDecrease} п. справа.`,
      `Пройма: убрать по ${m.armholeDecreaseStitchesPerSide} п. с каждой стороны, схема ${formatScheme(armholeScheme)}.`,
    ],
    calculationSheet: buildCalculationSheet({
      project,
      frontWidth,
      backWidth,
      totalCircumference,
      rowsToArmhole,
      armholeRows,
      totalBodyRows,
      backCastOnStitches,
      frontCastOnStitches,
      widthStitchesAfterArmhole,
      backNeckStitches,
      frontNeckStitches,
      neckDepthRows,
      neckStartRow,
      neckDistribution,
      leftShoulderStitches,
      rightShoulderStitches,
      leftShoulderCm: stitchesToCm(leftShoulderStitches, gaugeDerived.stitchesPerCm),
      rightShoulderCm: stitchesToCm(rightShoulderStitches, gaugeDerived.stitchesPerCm),
      requiredTopStitches,
      armholeScheme,
      armholeSchemeSum,
      wristStitches,
      upperArmStitches,
      sleeveRows,
    }),
    checks,
    hasCriticalIssues,
    fieldWarnings,
    constructionWarnings,
    back: {
      widthCm: backWidth,
      castOnStitches: backCastOnStitches,
      rowsToArmhole,
      armholeRows,
      shoulderStitches,
      leftShoulderStitches,
      rightShoulderStitches,
      leftShoulderCm: stitchesToCm(leftShoulderStitches, gaugeDerived.stitchesPerCm),
      rightShoulderCm: stitchesToCm(rightShoulderStitches, gaugeDerived.stitchesPerCm),
      backNeckStitches,
      backNeckDepthRows,
      armholeDecreaseStitchesPerSide: m.armholeDecreaseStitchesPerSide,
      armholeShaping: backArmholeShaping,
      armholeScheme,
      armholeSchemeSum,
      rowsAfterArmholeShaping,
      instruction: hasCriticalIssues
        ? [`Расчет требует корректировки: ${checks.find((check) => check.severity === 'critical')?.message ?? 'проверьте параметры выкройки.'}`]
        : [
            `Наберите ${backCastOnStitches} п.`,
            `Вяжите ${rowsToArmhole} рядов прямо до проймы.`,
            `Для проймы выполните схему: ${formatArmholeRows(armholeScheme)}.`,
            `После убавок проймы вяжите еще ${rowsAfterArmholeShaping} рядов до плеча.`,
            `Плечи: ${leftShoulderStitches} п. слева и ${rightShoulderStitches} п. справа. Горловина спинки: ${backNeckStitches} п.`,
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
      neckCenterBindOffStitches: neckDistribution.centerBindOff,
      leftNeckDecreaseStitches: neckDistribution.leftDecrease,
      rightNeckDecreaseStitches: neckDistribution.rightDecrease,
      neckDecreaseStitchesPerSide: neckDistribution.leftDecrease,
      neckShaping: frontNeckShaping,
      instruction: hasCriticalIssues
        ? [`Расчет требует корректировки: ${checks.find((check) => check.severity === 'critical')?.message ?? 'проверьте параметры выкройки.'}`]
        : [
            `Наберите ${frontCastOnStitches} п.`,
            `Вяжите ${rowsToArmhole} рядов прямо до проймы.`,
            `Выполните пройму как на спинке: ${formatArmholeRows(armholeScheme)}.`,
            `На высоте ${neckStartRow} рядов от начала детали начните горловину.`,
            `Закройте средние ${neckDistribution.centerBindOff} п.`,
            `Для закругления горловины убавьте ${neckDistribution.leftDecrease} п. слева и ${neckDistribution.rightDecrease} п. справа в рядах: ${formatRows(frontNeckShaping.rows)}.`,
            'Довяжите плечи до общей высоты детали.',
          ],
    },
    sleeve: {
      wristStitches,
      upperArmStitches,
      sleeveRows,
      shaping: sleeveShaping,
      instruction: hasCriticalIssues
        ? ['Расчет требует корректировки перед вязанием рукава вместе с корпусом.']
        : [
            `Наберите ${wristStitches} п.`,
            `Вяжите ${sleeveRows} рядов.`,
            upperArmStitches > wristStitches
              ? `Для расширения рукава прибавляйте по 1 п. с каждой стороны в рядах: ${formatRows(sleeveShaping.rows)}.`
              : 'Расширение рукава не рассчитано: верх рукава не шире запястья.',
            `В конце должно быть ${upperArmStitches} п.`,
          ],
    },
    warnings: Array.from(new Set(warnings)),
  };
}

export function validateMeasurements(project: Project): void {
  const gaugeDerived = deriveGauge(project.gauge);
  const requiredFields: Array<keyof Measurements> = [
    'bustCm',
    'easeCm',
    'bodyLengthCm',
    'armholeDepthCm',
    'armholeDecreaseStitchesPerSide',
    'shoulderWidthCm',
    'neckWidthCm',
    'frontNeckDepthCm',
    'backNeckWidthCm',
    'backNeckDepthCm',
    'sleeveLengthCm',
    'wristCircumferenceCm',
    'upperArmCircumferenceCm',
  ];
  const invalid = requiredFields.find((field) => {
    const value = project.measurements[field];
    return !Number.isFinite(value) || value <= 0;
  });

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
    return emptyShapingPlan('Дополнительные убавки горловины не нужны.');
  }

  return calculateShapingPlan({
    mode: 'decrease',
    startStitches: actionsPerSide + 1,
    targetStitches: 1,
    totalRows,
    sides: 'left',
  });
}

function calculateAutoShoulders(availableTopStitches: number, backNeckStitches: number, stitchesPerCm: number) {
  const shoulderTotal = Math.max(availableTopStitches - backNeckStitches, 0);
  const leftShoulder = Math.floor(shoulderTotal / 2);
  const rightShoulder = shoulderTotal - leftShoulder;

  return {
    leftShoulder,
    rightShoulder,
    leftShoulderCm: stitchesToCm(leftShoulder, stitchesPerCm),
    rightShoulderCm: stitchesToCm(rightShoulder, stitchesPerCm),
  };
}

function calculateFrontNeckDistribution(frontNeckTotalStitches: number) {
  const centerBindOff = Math.round(frontNeckTotalStitches * FRONT_NECK_CENTER_BIND_OFF_PERCENT);
  const remaining = frontNeckTotalStitches - centerBindOff;
  const leftDecrease = Math.floor(remaining / 2);
  const rightDecrease = remaining - leftDecrease;

  return { centerBindOff, remaining, leftDecrease, rightDecrease };
}

function createArmholeScheme(decreasesPerSide: number, construction: ConstructionSettings): ArmholeSchemeItem[] {
  const chunks = construction.armholeMode === 'manual'
    ? parseManualScheme(construction.manualArmholeScheme)
    : construction.armholeMode === 'classic'
      ? generateClassicArmholeChunks(decreasesPerSide)
      : Array.from({ length: decreasesPerSide }, () => 1);

  return chunks.map((stitches, index) => ({
    row: index * 2 + 1,
    stitches,
    action: stitches > 1 ? 'bindOff' : 'decrease',
  }));
}

function generateClassicArmholeChunks(decreasesPerSide: number): number[] {
  if (decreasesPerSide >= 8) {
    return normalizeChunkSum([3, 2, ...Array.from({ length: decreasesPerSide - 5 }, () => 1)], decreasesPerSide);
  }

  if (decreasesPerSide >= 5) {
    return normalizeChunkSum([2, ...Array.from({ length: decreasesPerSide - 2 }, () => 1)], decreasesPerSide);
  }

  return Array.from({ length: decreasesPerSide }, () => 1);
}

function normalizeChunkSum(chunks: number[], target: number): number[] {
  const result = [...chunks];
  while (result.reduce((sum, value) => sum + value, 0) > target) {
    result.pop();
  }
  while (result.reduce((sum, value) => sum + value, 0) < target) {
    result.push(1);
  }
  return result;
}

function parseManualScheme(value: string): number[] {
  return value
    .split('-')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function collectPatternChecks(input: {
  measurements: Measurements;
  construction: ConstructionSettings;
  bodyPartStitches: number;
  widthStitchesAfterArmhole: number;
  requiredTopStitches: number;
  rowsToArmhole: number;
  totalBodyRows: number;
  frontNeckDepthRows: number;
  wristStitches: number;
  upperArmStitches: number;
  armholeSchemeSum: number;
  neckDistribution: ReturnType<typeof calculateFrontNeckDistribution>;
}): PatternCheck[] {
  const checks: PatternCheck[] = [];
  const m = input.measurements;
  const frontNeckStartRow = input.totalBodyRows - input.frontNeckDepthRows;

  checks.push(
    input.requiredTopStitches > input.widthStitchesAfterArmhole
      ? critical('top-width', 'Плечи и горловина не помещаются в ширину детали. Уменьшите ширину плеча или горловины.')
      : ok('top-width', 'Плечи и горловина помещаются в ширину детали после проймы.'),
  );

  checks.push(
    frontNeckStartRow <= input.rowsToArmhole
      ? critical('front-neck-start', 'Горловина начинается одновременно с проймой или раньше. Проверьте глубину горловины и глубину проймы.')
      : ok('front-neck-start', 'Горловина переда начинается выше начала проймы.'),
  );

  if (input.neckDistribution.leftDecrease !== input.neckDistribution.rightDecrease) {
    checks.push(critical('neck-odd', 'Оставшиеся петли горловины не делятся поровну: стороны отличаются на 1 петлю.'));
  } else {
    checks.push(ok('neck-odd', 'Петли горловины распределяются поровну.'));
  }

  if (m.armholeDecreaseStitchesPerSide * 2 > input.bodyPartStitches * 0.25) {
    checks.push(critical('armhole-too-large', 'Убавки проймы съедают слишком много ширины детали.'));
  } else {
    checks.push(ok('armhole-too-large', 'Убавки проймы не съедают чрезмерную ширину.'));
  }

  if (m.armholeDepthCm < 12) {
    checks.push(warning('armhole-depth-small', 'Глубина проймы выглядит маленькой.'));
  }

  if (m.armholeDepthCm > 35) {
    checks.push(warning('armhole-depth-large', 'Глубина проймы выглядит большой.'));
  }

  if (m.armholeDecreaseStitchesPerSide < 3) {
    checks.push(warning('armhole-too-straight', 'Убавки проймы очень маленькие, форма может быть почти прямой.'));
  }

  if (input.construction.armholeMode === 'manual' && input.armholeSchemeSum !== m.armholeDecreaseStitchesPerSide) {
    checks.push(warning('manual-armhole-sum', `Ручная схема проймы дает ${input.armholeSchemeSum} п., а нужно ${m.armholeDecreaseStitchesPerSide} п.`));
  }

  if (m.sleeveLengthCm > 75) {
    checks.push(warning('sleeve-length-large', 'Длина рукава больше 75 см. Проверьте мерку: для большинства изделий это необычно много.'));
  }

  if (m.wristCircumferenceCm < 12) {
    checks.push(warning('wrist-small', 'Обхват запястья меньше 12 см. Проверьте, не указана ли мерка слишком маленькой.'));
  }

  if (input.upperArmStitches <= input.wristStitches) {
    checks.push(warning('sleeve-no-expansion', 'Верх рукава не шире запястья. Для базового рукава расширения не будет или параметры выглядят странно.'));
  }

  return checks;
}

function collectFieldWarnings(checks: PatternCheck[]): FieldWarnings {
  const warnings: FieldWarnings = {};

  for (const check of checks.filter((item) => item.severity !== 'ok')) {
    if (check.id === 'top-width') {
      addFieldWarning(warnings, 'shoulderWidthCm', check.message);
      addFieldWarning(warnings, 'backNeckWidthCm', check.message);
    }
    if (check.id === 'front-neck-start') {
      addFieldWarning(warnings, 'frontNeckDepthCm', check.message);
      addFieldWarning(warnings, 'armholeDepthCm', check.message);
    }
    if (check.id.startsWith('armhole-depth')) addFieldWarning(warnings, 'armholeDepthCm', check.message);
    if (check.id === 'armhole-too-straight' || check.id === 'armhole-too-large' || check.id === 'manual-armhole-sum') addFieldWarning(warnings, 'armholeDecreaseStitchesPerSide', check.message);
    if (check.id === 'sleeve-length-large') addFieldWarning(warnings, 'sleeveLengthCm', check.message);
    if (check.id === 'wrist-small' || check.id === 'sleeve-no-expansion') addFieldWarning(warnings, 'wristCircumferenceCm', check.message);
    if (check.id === 'sleeve-no-expansion') addFieldWarning(warnings, 'upperArmCircumferenceCm', check.message);
    if (check.id === 'neck-odd') addFieldWarning(warnings, 'neckWidthCm', check.message);
  }

  return warnings;
}

function collectConstructionWarnings(checks: PatternCheck[]): ConstructionWarnings {
  const warnings: ConstructionWarnings = {};
  const manualWarning = checks.find((check) => check.id === 'manual-armhole-sum');
  if (manualWarning) warnings.manualArmholeScheme = [manualWarning.message];
  return warnings;
}

function buildCalculationSheet(input: {
  project: Project;
  frontWidth: number;
  backWidth: number;
  totalCircumference: number;
  rowsToArmhole: number;
  armholeRows: number;
  totalBodyRows: number;
  backCastOnStitches: number;
  frontCastOnStitches: number;
  widthStitchesAfterArmhole: number;
  backNeckStitches: number;
  frontNeckStitches: number;
  neckDepthRows: number;
  neckStartRow: number;
  neckDistribution: ReturnType<typeof calculateFrontNeckDistribution>;
  leftShoulderStitches: number;
  rightShoulderStitches: number;
  leftShoulderCm: number;
  rightShoulderCm: number;
  requiredTopStitches: number;
  armholeScheme: ArmholeSchemeItem[];
  armholeSchemeSum: number;
  wristStitches: number;
  upperArmStitches: number;
  sleeveRows: number;
}): CalculationSheetSection[] {
  const { project, ...data } = input;
  const m = project.measurements;
  const gauge = deriveGauge(project.gauge);

  return [
    {
      title: 'Плотность',
      rows: [
        { label: 'Петли', value: `${project.gauge.stitchesPer10cm} п. / 10 см = ${gauge.stitchesPerCm} п./см` },
        { label: 'Ряды', value: `${project.gauge.rowsPer10cm} р. / 10 см = ${gauge.rowsPerCm} р./см` },
      ],
    },
    {
      title: 'Перевод мерок',
      rows: [
        { label: 'Грудь + свобода', value: `${m.bustCm} + ${m.easeCm} = ${data.totalCircumference} см` },
        { label: 'Длина изделия', value: `${m.bodyLengthCm} см = ${data.totalBodyRows} р.` },
        { label: 'Глубина проймы', value: `${m.armholeDepthCm} см = ${data.armholeRows} р.` },
        { label: 'Горловина переда', value: `${m.neckWidthCm} см = ${data.frontNeckStitches} п.` },
        { label: 'Горловина спинки', value: `${m.backNeckWidthCm} см = ${data.backNeckStitches} п.` },
        { label: 'Запястье', value: `${m.wristCircumferenceCm} см = ${data.wristStitches} п.` },
        { label: 'Верх рукава', value: `${m.upperArmCircumferenceCm} см = ${data.upperArmStitches} п.` },
      ],
    },
    {
      title: 'Корпус',
      rows: [
        { label: 'Ширина спинки', value: `${data.backWidth} см / ${data.backCastOnStitches} п.` },
        { label: 'Ширина переда', value: `${data.frontWidth} см / ${data.frontCastOnStitches} п.` },
        { label: 'До проймы', value: `${data.rowsToArmhole} р.` },
        { label: 'После проймы', value: `${data.widthStitchesAfterArmhole} п.`, note: `Было ${data.backCastOnStitches} п., убрано ${m.armholeDecreaseStitchesPerSide * 2} п.` },
      ],
    },
    {
      title: 'Плечи и горловина',
      rows: [
        { label: 'Левое плечо', value: `${data.leftShoulderStitches} п. / ${data.leftShoulderCm} см` },
        { label: 'Правое плечо', value: `${data.rightShoulderStitches} п. / ${data.rightShoulderCm} см` },
        { label: 'Горловина спинки', value: `${data.backNeckStitches} п.` },
        { label: 'Требуется сверху', value: `${data.requiredTopStitches} п.` },
        { label: 'Остаток', value: `${data.widthStitchesAfterArmhole - data.requiredTopStitches} п.` },
      ],
    },
    {
      title: 'Горловина переда',
      rows: [
        { label: 'Всего', value: `${data.frontNeckStitches} п.` },
        { label: 'Среднее закрытие', value: `${data.neckDistribution.centerBindOff} п.` },
        { label: 'Левая сторона', value: `${data.neckDistribution.leftDecrease} п.` },
        { label: 'Правая сторона', value: `${data.neckDistribution.rightDecrease} п.` },
        { label: 'Начало горловины', value: `${data.neckStartRow} р. от начала` },
      ],
    },
    {
      title: 'Пройма',
      rows: [
        { label: 'Режим', value: project.construction.armholeMode === 'classic' ? 'классический' : project.construction.armholeMode === 'manual' ? 'ручной' : 'простой' },
        { label: 'Схема', value: formatScheme(data.armholeScheme) },
        { label: 'Сумма схемы', value: `${data.armholeSchemeSum} п.`, note: `Нужно ${m.armholeDecreaseStitchesPerSide} п. с каждой стороны` },
      ],
    },
  ];
}

function addFieldWarning(warnings: FieldWarnings, field: keyof Measurements, message: string): void {
  warnings[field] = [...(warnings[field] ?? []), message];
}

function emptyShapingPlan(humanReadableInstruction: string): ShapingPlan {
  return {
    totalDelta: 0,
    actionsTotal: 0,
    actionsPerSide: 0,
    rows: [],
    humanReadableInstruction,
    warnings: [],
  };
}

function ok(id: string, message: string): PatternCheck {
  return { id, severity: 'ok', message };
}

function warning(id: string, message: string): PatternCheck {
  return { id, severity: 'warning', message };
}

function critical(id: string, message: string): PatternCheck {
  return { id, severity: 'critical', message };
}

function stitchesToCm(stitches: number, stitchesPerCm: number): number {
  return roundToTwoDecimals(stitches / stitchesPerCm);
}

function formatRows(rows: number[]): string {
  return rows.length > 0 ? rows.join(', ') : 'нет';
}

function formatScheme(scheme: ArmholeSchemeItem[]): string {
  return scheme.map((item) => item.stitches).join('-') || 'нет';
}

function formatArmholeRows(scheme: ArmholeSchemeItem[]): string {
  return scheme
    .map((item) => `${item.row} ряд: ${item.action === 'bindOff' ? 'закрыть' : 'убавить'} ${item.stitches} п.`)
    .join('; ');
}
