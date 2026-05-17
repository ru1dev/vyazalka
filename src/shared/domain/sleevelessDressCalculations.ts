import type {
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

export type DressPieceResult = {
  title: string;
  hipsWidthCm: number;
  waistWidthCm: number;
  bustWidthCm: number;
  castOnStitches: number;
  waistStitches: number;
  bustStitches: number;
  rowsWaistToHips: number;
  rowsWaistToBust: number;
  rowsToWaist: number;
  rowsToArmhole: number;
  armholeRows: number;
  totalRows: number;
  armholeDecreaseStitchesPerSide: number;
  armholeScheme: DressArmholeSchemeItem[];
  armholeSchemeSum: number;
  shoulderStitches: number;
  leftShoulderStitches: number;
  rightShoulderStitches: number;
  neckStitches: number;
  neckDepthRows: number;
  neckStartRow: number;
  neckCenterBindOffStitches: number;
  leftNeckDecreaseStitches: number;
  rightNeckDecreaseStitches: number;
  hipsToWaistShaping: ShapingPlan;
  waistToBustShaping: ShapingPlan;
  neckShaping: ShapingPlan;
  instruction: string[];
};

export type SleevelessDressCalculationResult = {
  gaugeDerived: {
    stitchesPerCm: number;
    rowsPerCm: number;
  };
  formulas: string[];
  calculationSheet: CalculationSheetSection[];
  checks: PatternCheck[];
  hasCriticalIssues: boolean;
  fieldWarnings: FieldWarnings;
  constructionWarnings: ConstructionWarnings;
  back: DressPieceResult;
  front: DressPieceResult;
  warnings: string[];
};

export type DressArmholeSchemeItem = {
  row: number;
  stitches: number;
  action: 'bindOff' | 'decrease';
};

export function calculateSleevelessDress(project: Project): SleevelessDressCalculationResult {
  const warnings = ['Расчет является вспомогательным. Перед вязанием проверьте образец и конструкцию изделия.'];
  const gaugeDerived = deriveGauge(project.gauge);
  const m = project.measurements;
  const construction = { ...defaultConstructionSettings, ...project.construction };

  validateDressMeasurements(project);

  const bustWidth = (m.bustCm + m.easeBustCm) / 2;
  const waistWidth = (m.waistCm + m.easeWaistCm) / 2;
  const hipsWidth = (m.hipsCm + m.easeHipsCm) / 2;
  const bustStitches = cmToStitches(bustWidth, gaugeDerived.stitchesPerCm);
  const waistStitches = cmToStitches(waistWidth, gaugeDerived.stitchesPerCm);
  const hipsStitches = cmToStitches(hipsWidth, gaugeDerived.stitchesPerCm);
  const rowsToWaist = cmToRows(m.distanceFromStartToWaistCm, gaugeDerived.rowsPerCm);
  const rowsWaistToHips = cmToRows(m.distanceFromWaistToHipsCm, gaugeDerived.rowsPerCm);
  const totalRows = cmToRows(m.bodyLengthCm, gaugeDerived.rowsPerCm);
  const rowsToArmhole = cmToRows(m.bodyLengthCm - m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const armholeRows = cmToRows(m.armholeDepthCm, gaugeDerived.rowsPerCm);
  const rowsWaistToBust = Math.max(rowsToArmhole - rowsToWaist, 1);
  const armholeScheme = createArmholeScheme(m.armholeDecreaseStitchesPerSide, construction);
  const armholeSchemeSum = armholeScheme.reduce((sum, item) => sum + item.stitches, 0);
  const frontNeckWidthCm = m.frontNeckWidthCm || m.neckWidthCm;
  const frontNeckStitches = cmToStitches(frontNeckWidthCm, gaugeDerived.stitchesPerCm);
  const backNeckStitches = cmToStitches(m.backNeckWidthCm, gaugeDerived.stitchesPerCm);
  const frontNeckDepthRows = cmToRows(m.frontNeckDepthCm, gaugeDerived.rowsPerCm);
  const backNeckDepthRows = cmToRows(m.backNeckDepthCm, gaugeDerived.rowsPerCm);
  const frontNeckStartRow = totalRows - frontNeckDepthRows;
  const backNeckStartRow = totalRows - backNeckDepthRows;
  const widthAfterArmhole = bustStitches - m.armholeDecreaseStitchesPerSide * 2;
  const autoBackShoulders = calculateAutoShoulders(widthAfterArmhole, backNeckStitches, gaugeDerived.stitchesPerCm);
  const autoFrontShoulders = calculateAutoShoulders(widthAfterArmhole, frontNeckStitches, gaugeDerived.stitchesPerCm);
  const manualShoulderStitches = cmToStitches(m.shoulderWidthCm, gaugeDerived.stitchesPerCm);
  const backLeftShoulder = construction.autoShoulder ? autoBackShoulders.leftShoulder : manualShoulderStitches;
  const backRightShoulder = construction.autoShoulder ? autoBackShoulders.rightShoulder : manualShoulderStitches;
  const frontLeftShoulder = construction.autoShoulder ? autoFrontShoulders.leftShoulder : manualShoulderStitches;
  const frontRightShoulder = construction.autoShoulder ? autoFrontShoulders.rightShoulder : manualShoulderStitches;
  const hipsToWaistShaping = makeHorizontalShaping(hipsStitches, waistStitches, rowsWaistToHips, 1);
  const waistToBustShaping = makeHorizontalShaping(waistStitches, bustStitches, rowsWaistToBust, rowsToWaist + 1);
  const frontNeckDistribution = calculateNeckDistribution(frontNeckStitches);
  const backNeckDistribution = calculateNeckDistribution(backNeckStitches);
  const frontNeckShaping = calculateNeckShaping(Math.max(frontNeckDistribution.leftDecrease, frontNeckDistribution.rightDecrease), frontNeckDepthRows);
  const backNeckShaping = calculateNeckShaping(Math.max(backNeckDistribution.leftDecrease, backNeckDistribution.rightDecrease), Math.max(backNeckDepthRows, 1));
  const checks = collectDressChecks({
    measurements: m,
    construction,
    widthAfterArmhole,
    backRequiredTopStitches: backLeftShoulder + backRightShoulder + backNeckStitches,
    frontRequiredTopStitches: frontLeftShoulder + frontRightShoulder + frontNeckStitches,
    rowsToArmhole,
    frontNeckStartRow,
    armholeSchemeSum,
    frontNeckDistribution,
    backNeckDistribution,
  });
  const fieldWarnings = collectFieldWarnings(checks);
  const constructionWarnings = collectConstructionWarnings(checks);
  const hasCriticalIssues = checks.some((check) => check.severity === 'critical');

  warnings.push(...checks.filter((check) => check.severity !== 'ok').map((check) => check.message));
  warnings.push(...hipsToWaistShaping.warnings, ...waistToBustShaping.warnings, ...frontNeckShaping.warnings, ...backNeckShaping.warnings);

  const back: DressPieceResult = {
    title: 'Спинка',
    hipsWidthCm: hipsWidth,
    waistWidthCm: waistWidth,
    bustWidthCm: bustWidth,
    castOnStitches: hipsStitches,
    waistStitches,
    bustStitches,
    rowsWaistToHips,
    rowsWaistToBust,
    rowsToWaist,
    rowsToArmhole,
    armholeRows,
    totalRows,
    armholeDecreaseStitchesPerSide: m.armholeDecreaseStitchesPerSide,
    armholeScheme,
    armholeSchemeSum,
    shoulderStitches: backLeftShoulder,
    leftShoulderStitches: backLeftShoulder,
    rightShoulderStitches: backRightShoulder,
    neckStitches: backNeckStitches,
    neckDepthRows: backNeckDepthRows,
    neckStartRow: backNeckStartRow,
    neckCenterBindOffStitches: backNeckDistribution.centerBindOff,
    leftNeckDecreaseStitches: backNeckDistribution.leftDecrease,
    rightNeckDecreaseStitches: backNeckDistribution.rightDecrease,
    hipsToWaistShaping,
    waistToBustShaping,
    neckShaping: backNeckShaping,
    instruction: createDressInstruction({
      title: 'спинки',
      hasCriticalIssues,
      checks,
      castOnStitches: hipsStitches,
      rowsWaistToHips,
      rowsToWaist,
      rowsToArmhole,
      hipsToWaistShaping,
      waistToBustShaping,
      armholeScheme,
      neckStartRow: backNeckStartRow,
      neckCenterBindOffStitches: backNeckDistribution.centerBindOff,
      leftNeckDecreaseStitches: backNeckDistribution.leftDecrease,
      rightNeckDecreaseStitches: backNeckDistribution.rightDecrease,
      neckRows: backNeckShaping.rows,
      finalStitches: bustStitches,
    }),
  };

  const front: DressPieceResult = {
    ...back,
    title: 'Перед',
    shoulderStitches: frontLeftShoulder,
    leftShoulderStitches: frontLeftShoulder,
    rightShoulderStitches: frontRightShoulder,
    neckStitches: frontNeckStitches,
    neckDepthRows: frontNeckDepthRows,
    neckStartRow: frontNeckStartRow,
    neckCenterBindOffStitches: frontNeckDistribution.centerBindOff,
    leftNeckDecreaseStitches: frontNeckDistribution.leftDecrease,
    rightNeckDecreaseStitches: frontNeckDistribution.rightDecrease,
    neckShaping: frontNeckShaping,
    instruction: createDressInstruction({
      title: 'переда',
      hasCriticalIssues,
      checks,
      castOnStitches: hipsStitches,
      rowsWaistToHips,
      rowsToWaist,
      rowsToArmhole,
      hipsToWaistShaping,
      waistToBustShaping,
      armholeScheme,
      neckStartRow: frontNeckStartRow,
      neckCenterBindOffStitches: frontNeckDistribution.centerBindOff,
      leftNeckDecreaseStitches: frontNeckDistribution.leftDecrease,
      rightNeckDecreaseStitches: frontNeckDistribution.rightDecrease,
      neckRows: frontNeckShaping.rows,
      finalStitches: bustStitches,
    }),
  };

  return {
    gaugeDerived,
    formulas: [
      `Грудь: (${m.bustCm} + ${m.easeBustCm}) / 2 = ${bustWidth} см на деталь.`,
      `Талия: (${m.waistCm} + ${m.easeWaistCm}) / 2 = ${waistWidth} см на деталь.`,
      `Бедра: (${m.hipsCm} + ${m.easeHipsCm}) / 2 = ${hipsWidth} см на деталь.`,
      `${hipsWidth} x ${gaugeDerived.stitchesPerCm} = ${hipsStitches} п. наборного ряда.`,
      `${waistWidth} x ${gaugeDerived.stitchesPerCm} = ${waistStitches} п. на талии.`,
      `${bustWidth} x ${gaugeDerived.stitchesPerCm} = ${bustStitches} п. по груди.`,
      `Снизу вверх: бедра -> талия = ${hipsToWaistShaping.totalDelta} п., талия -> грудь = ${waistToBustShaping.totalDelta} п.`,
    ],
    calculationSheet: buildCalculationSheet({
      project,
      bustWidth,
      waistWidth,
      hipsWidth,
      bustStitches,
      waistStitches,
      hipsStitches,
      rowsToWaist,
      rowsWaistToHips,
      rowsWaistToBust,
      totalRows,
      rowsToArmhole,
      armholeRows,
      widthAfterArmhole,
      frontNeckWidthCm,
      frontNeckStitches,
      backNeckStitches,
      frontNeckDepthRows,
      backNeckDepthRows,
      frontNeckStartRow,
      backNeckStartRow,
      frontNeckDistribution,
      backNeckDistribution,
      frontLeftShoulder,
      frontRightShoulder,
      backLeftShoulder,
      backRightShoulder,
      armholeScheme,
      armholeSchemeSum,
      hipsToWaistShaping,
      waistToBustShaping,
    }),
    checks,
    hasCriticalIssues,
    fieldWarnings,
    constructionWarnings,
    back,
    front,
    warnings: Array.from(new Set(warnings)),
  };
}

function validateDressMeasurements(project: Project): void {
  const requiredFields: Array<keyof Measurements> = [
    'bustCm',
    'waistCm',
    'hipsCm',
    'easeBustCm',
    'easeWaistCm',
    'easeHipsCm',
    'bodyLengthCm',
    'armholeDepthCm',
    'armholeDecreaseStitchesPerSide',
    'shoulderWidthCm',
    'frontNeckWidthCm',
    'frontNeckDepthCm',
    'backNeckWidthCm',
    'backNeckDepthCm',
    'distanceFromStartToWaistCm',
    'distanceFromWaistToHipsCm',
  ];
  const invalid = requiredFields.find((field) => {
    const value = project.measurements[field];
    return !Number.isFinite(value) || value <= 0;
  });

  if (invalid) throw new Error('Все мерки платья должны быть положительными числами.');
  if (project.measurements.bodyLengthCm <= project.measurements.armholeDepthCm) {
    throw new Error('Длина изделия должна быть больше глубины проймы.');
  }
  if (project.measurements.distanceFromStartToWaistCm >= project.measurements.bodyLengthCm) {
    throw new Error('Уровень талии должен быть ниже общей длины изделия.');
  }
  if (project.measurements.armholeDecreaseStitchesPerSide * 2 >= cmToStitches((project.measurements.bustCm + project.measurements.easeBustCm) / 2, deriveGauge(project.gauge).stitchesPerCm)) {
    throw new Error('Убавки проймы не могут быть больше ширины детали по груди.');
  }
}

function makeHorizontalShaping(startStitches: number, targetStitches: number, totalRows: number, startRow: number): ShapingPlan {
  if (startStitches === targetStitches) return emptyShapingPlan('Формирование не требуется.');

  return calculateShapingPlan({
    mode: targetStitches > startStitches ? 'increase' : 'decrease',
    startStitches,
    targetStitches,
    totalRows: Math.max(totalRows, 1),
    sides: 'both',
    startRow,
  });
}

function calculateNeckShaping(actionsPerSide: number, totalRows: number): ShapingPlan {
  if (actionsPerSide <= 0) return emptyShapingPlan('Дополнительные убавки горловины не нужны.');

  return calculateShapingPlan({
    mode: 'decrease',
    startStitches: actionsPerSide + 1,
    targetStitches: 1,
    totalRows: Math.max(totalRows, 1),
    sides: 'left',
  });
}

function calculateAutoShoulders(availableTopStitches: number, neckStitches: number, stitchesPerCm: number) {
  const shoulderTotal = Math.max(availableTopStitches - neckStitches, 0);
  const leftShoulder = Math.floor(shoulderTotal / 2);
  const rightShoulder = shoulderTotal - leftShoulder;

  return {
    leftShoulder,
    rightShoulder,
    leftShoulderCm: stitchesToCm(leftShoulder, stitchesPerCm),
    rightShoulderCm: stitchesToCm(rightShoulder, stitchesPerCm),
  };
}

function calculateNeckDistribution(totalStitches: number) {
  const centerBindOff = Math.round(totalStitches * FRONT_NECK_CENTER_BIND_OFF_PERCENT);
  const remaining = totalStitches - centerBindOff;
  const leftDecrease = Math.floor(remaining / 2);
  const rightDecrease = remaining - leftDecrease;
  return { centerBindOff, remaining, leftDecrease, rightDecrease };
}

function createArmholeScheme(decreasesPerSide: number, construction: ConstructionSettings): DressArmholeSchemeItem[] {
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
  if (decreasesPerSide >= 8) return normalizeChunkSum([3, 2, ...Array.from({ length: decreasesPerSide - 5 }, () => 1)], decreasesPerSide);
  if (decreasesPerSide >= 5) return normalizeChunkSum([2, ...Array.from({ length: decreasesPerSide - 2 }, () => 1)], decreasesPerSide);
  return Array.from({ length: decreasesPerSide }, () => 1);
}

function normalizeChunkSum(chunks: number[], target: number): number[] {
  const result = [...chunks];
  while (result.reduce((sum, value) => sum + value, 0) > target) result.pop();
  while (result.reduce((sum, value) => sum + value, 0) < target) result.push(1);
  return result;
}

function parseManualScheme(value: string): number[] {
  return value
    .split('-')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function collectDressChecks(input: {
  measurements: Measurements;
  construction: ConstructionSettings;
  widthAfterArmhole: number;
  backRequiredTopStitches: number;
  frontRequiredTopStitches: number;
  rowsToArmhole: number;
  frontNeckStartRow: number;
  armholeSchemeSum: number;
  frontNeckDistribution: ReturnType<typeof calculateNeckDistribution>;
  backNeckDistribution: ReturnType<typeof calculateNeckDistribution>;
}): PatternCheck[] {
  const checks: PatternCheck[] = [];
  const m = input.measurements;

  checks.push(
    input.backRequiredTopStitches > input.widthAfterArmhole || input.frontRequiredTopStitches > input.widthAfterArmhole
      ? critical('dress-top-width', 'Плечи и горловина не помещаются в ширину детали после проймы. Уменьшите ширину плеча или горловины.')
      : ok('dress-top-width', 'Плечи и горловина помещаются в ширину детали после проймы.'),
  );

  checks.push(
    input.frontNeckStartRow <= input.rowsToArmhole
      ? critical('dress-front-neck-start', 'Горловина начинается одновременно с проймой или раньше. Проверьте глубину горловины и глубину проймы.')
      : ok('dress-front-neck-start', 'Горловина переда начинается выше начала проймы.'),
  );

  if (input.frontNeckDistribution.leftDecrease !== input.frontNeckDistribution.rightDecrease || input.backNeckDistribution.leftDecrease !== input.backNeckDistribution.rightDecrease) {
    checks.push(warning('dress-neck-odd', 'Оставшиеся петли горловины не делятся поровну: одна сторона отличается на 1 петлю.'));
  } else {
    checks.push(ok('dress-neck-odd', 'Петли горловины распределяются поровну.'));
  }

  if (m.armholeDepthCm < 12) checks.push(warning('dress-armhole-depth-small', 'Глубина проймы выглядит маленькой.'));
  if (m.armholeDepthCm > 35) checks.push(warning('dress-armhole-depth-large', 'Глубина проймы выглядит большой.'));
  if (m.armholeDecreaseStitchesPerSide < 3) checks.push(warning('dress-armhole-too-straight', 'Убавки проймы очень маленькие, форма может быть почти прямой.'));
  if (m.armholeDecreaseStitchesPerSide * 2 > input.widthAfterArmhole * 0.35) checks.push(critical('dress-armhole-too-large', 'Убавки проймы съедают слишком много ширины детали.'));
  if (input.construction.armholeMode === 'manual' && input.armholeSchemeSum !== m.armholeDecreaseStitchesPerSide) {
    checks.push(warning('dress-manual-armhole-sum', `Ручная схема проймы дает ${input.armholeSchemeSum} п., а нужно ${m.armholeDecreaseStitchesPerSide} п.`));
  }
  if (m.waistCm >= m.hipsCm) checks.push(warning('dress-waist-hips', 'Талия не меньше бедер: приталивание может быть слабым или отсутствовать.'));
  if (m.distanceFromStartToWaistCm + m.distanceFromWaistToHipsCm > m.bodyLengthCm) {
    checks.push(warning('dress-levels-overflow', 'Уровни талии и бедер выходят за общую длину изделия. Проверьте вертикальные мерки.'));
  }

  return checks;
}

function collectFieldWarnings(checks: PatternCheck[]): FieldWarnings {
  const warnings: FieldWarnings = {};

  for (const check of checks.filter((item) => item.severity !== 'ok')) {
    if (check.id === 'dress-top-width') {
      addFieldWarning(warnings, 'shoulderWidthCm', check.message);
      addFieldWarning(warnings, 'frontNeckWidthCm', check.message);
      addFieldWarning(warnings, 'backNeckWidthCm', check.message);
    }
    if (check.id === 'dress-front-neck-start') {
      addFieldWarning(warnings, 'frontNeckDepthCm', check.message);
      addFieldWarning(warnings, 'armholeDepthCm', check.message);
    }
    if (check.id.startsWith('dress-armhole')) addFieldWarning(warnings, 'armholeDepthCm', check.message);
    if (check.id === 'dress-armhole-too-straight' || check.id === 'dress-armhole-too-large' || check.id === 'dress-manual-armhole-sum') {
      addFieldWarning(warnings, 'armholeDecreaseStitchesPerSide', check.message);
    }
    if (check.id === 'dress-waist-hips') {
      addFieldWarning(warnings, 'waistCm', check.message);
      addFieldWarning(warnings, 'hipsCm', check.message);
    }
    if (check.id === 'dress-levels-overflow') {
      addFieldWarning(warnings, 'distanceFromStartToWaistCm', check.message);
      addFieldWarning(warnings, 'distanceFromWaistToHipsCm', check.message);
    }
  }

  return warnings;
}

function collectConstructionWarnings(checks: PatternCheck[]): ConstructionWarnings {
  const warnings: ConstructionWarnings = {};
  const manualWarning = checks.find((check) => check.id === 'dress-manual-armhole-sum');
  if (manualWarning) warnings.manualArmholeScheme = [manualWarning.message];
  return warnings;
}

function buildCalculationSheet(input: {
  project: Project;
  bustWidth: number;
  waistWidth: number;
  hipsWidth: number;
  bustStitches: number;
  waistStitches: number;
  hipsStitches: number;
  rowsToWaist: number;
  rowsWaistToHips: number;
  rowsWaistToBust: number;
  totalRows: number;
  rowsToArmhole: number;
  armholeRows: number;
  widthAfterArmhole: number;
  frontNeckWidthCm: number;
  frontNeckStitches: number;
  backNeckStitches: number;
  frontNeckDepthRows: number;
  backNeckDepthRows: number;
  frontNeckStartRow: number;
  backNeckStartRow: number;
  frontNeckDistribution: ReturnType<typeof calculateNeckDistribution>;
  backNeckDistribution: ReturnType<typeof calculateNeckDistribution>;
  frontLeftShoulder: number;
  frontRightShoulder: number;
  backLeftShoulder: number;
  backRightShoulder: number;
  armholeScheme: DressArmholeSchemeItem[];
  armholeSchemeSum: number;
  hipsToWaistShaping: ShapingPlan;
  waistToBustShaping: ShapingPlan;
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
      title: 'Уровни фигуры',
      rows: [
        { label: 'Грудь + свобода', value: `${m.bustCm} + ${m.easeBustCm} = ${m.bustCm + m.easeBustCm} см`, note: `${data.bustWidth} см / ${data.bustStitches} п. на деталь` },
        { label: 'Талия + свобода', value: `${m.waistCm} + ${m.easeWaistCm} = ${m.waistCm + m.easeWaistCm} см`, note: `${data.waistWidth} см / ${data.waistStitches} п. на деталь` },
        { label: 'Бедра + свобода', value: `${m.hipsCm} + ${m.easeHipsCm} = ${m.hipsCm + m.easeHipsCm} см`, note: `${data.hipsWidth} см / ${data.hipsStitches} п. на деталь` },
      ],
    },
    {
      title: 'Вертикали',
      rows: [
        { label: 'Общая длина', value: `${m.bodyLengthCm} см = ${data.totalRows} р.` },
        { label: 'До талии от низа', value: `${m.distanceFromStartToWaistCm} см = ${data.rowsToWaist} р.` },
        { label: 'Талия -> бедра', value: `${m.distanceFromWaistToHipsCm} см = ${data.rowsWaistToHips} р.` },
        { label: 'До проймы', value: `${data.rowsToArmhole} р.` },
        { label: 'Глубина проймы', value: `${m.armholeDepthCm} см = ${data.armholeRows} р.` },
      ],
    },
    {
      title: 'Приталивание',
      rows: [
        { label: 'Бедра -> талия', value: `${data.hipsToWaistShaping.totalDelta} п.`, note: `ряды: ${formatRows(data.hipsToWaistShaping.rows)}` },
        { label: 'Талия -> грудь', value: `${data.waistToBustShaping.totalDelta} п.`, note: `ряды: ${formatRows(data.waistToBustShaping.rows)}` },
      ],
    },
    {
      title: 'Пройма и верх',
      rows: [
        { label: 'После проймы', value: `${data.widthAfterArmhole} п.` },
        { label: 'Схема проймы', value: formatScheme(data.armholeScheme), note: `сумма ${data.armholeSchemeSum} п. с каждой стороны` },
        { label: 'Плечи спинки', value: `${data.backLeftShoulder} п. / ${data.backRightShoulder} п.` },
        { label: 'Плечи переда', value: `${data.frontLeftShoulder} п. / ${data.frontRightShoulder} п.` },
      ],
    },
    {
      title: 'Горловина',
      rows: [
        { label: 'Перед', value: `${data.frontNeckWidthCm} см = ${data.frontNeckStitches} п.`, note: `средние ${data.frontNeckDistribution.centerBindOff} п., убавки ${data.frontNeckDistribution.leftDecrease}/${data.frontNeckDistribution.rightDecrease} п.` },
        { label: 'Спинка', value: `${m.backNeckWidthCm} см = ${data.backNeckStitches} п.`, note: `средние ${data.backNeckDistribution.centerBindOff} п., убавки ${data.backNeckDistribution.leftDecrease}/${data.backNeckDistribution.rightDecrease} п.` },
        { label: 'Начало горловины переда', value: `${data.frontNeckStartRow} р.` },
        { label: 'Начало горловины спинки', value: `${data.backNeckStartRow} р.` },
      ],
    },
  ];
}

function createDressInstruction(input: {
  title: string;
  hasCriticalIssues: boolean;
  checks: PatternCheck[];
  castOnStitches: number;
  rowsWaistToHips: number;
  rowsToWaist: number;
  rowsToArmhole: number;
  hipsToWaistShaping: ShapingPlan;
  waistToBustShaping: ShapingPlan;
  armholeScheme: DressArmholeSchemeItem[];
  neckStartRow: number;
  neckCenterBindOffStitches: number;
  leftNeckDecreaseStitches: number;
  rightNeckDecreaseStitches: number;
  neckRows: number[];
  finalStitches: number;
}): string[] {
  if (input.hasCriticalIssues) {
    return [`Расчет требует корректировки: ${input.checks.find((check) => check.severity === 'critical')?.message ?? 'проверьте параметры выкройки.'}`];
  }

  return [
    `Наберите ${input.castOnStitches} п. для ${input.title}.`,
    `Вяжите снизу вверх. До талии: ${input.rowsToWaist} р.`,
    input.hipsToWaistShaping.totalDelta > 0
      ? `Для перехода от бедер к талии убавляйте по 1 п. с каждой стороны в рядах: ${formatRows(input.hipsToWaistShaping.rows)}.`
      : 'Переход от бедер к талии без убавок.',
    input.waistToBustShaping.totalDelta > 0
      ? `Для перехода от талии к груди выполняйте формирование в рядах: ${formatRows(input.waistToBustShaping.rows)}.`
      : 'Переход от талии к груди без дополнительного формирования.',
    `Вяжите до проймы: всего ${input.rowsToArmhole} р. от наборного края.`,
    `Выполните пройму: ${formatArmholeRows(input.armholeScheme)}.`,
    `На высоте ${input.neckStartRow} р. начните горловину: закройте средние ${input.neckCenterBindOffStitches} п.`,
    `Для закругления горловины убавьте ${input.leftNeckDecreaseStitches} п. слева и ${input.rightNeckDecreaseStitches} п. справа в рядах: ${formatRows(input.neckRows)}.`,
    `По линии груди должно быть около ${input.finalStitches} п. до убавок проймы.`,
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

function formatScheme(scheme: DressArmholeSchemeItem[]): string {
  return scheme.map((item) => item.stitches).join('-') || 'нет';
}

function formatArmholeRows(scheme: DressArmholeSchemeItem[]): string {
  return scheme
    .map((item) => `${item.row} ряд: ${item.action === 'bindOff' ? 'закрыть' : 'убавить'} ${item.stitches} п.`)
    .join('; ');
}
