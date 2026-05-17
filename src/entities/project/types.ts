export type GarmentType = 'basic_sweater_bottom_up';

export type UserDraft = {
  id: string;
  localOnly: boolean;
  futureUserId?: string;
};

export type Gauge = {
  stitchesPer10cm: number;
  rowsPer10cm: number;
};

export type Measurements = {
  bustCm: number;
  easeCm: number;
  bodyLengthCm: number;
  armholeDepthCm: number;
  armholeDecreaseStitchesPerSide: number;
  shoulderWidthCm: number;
  neckWidthCm: number;
  frontNeckDepthCm: number;
  backNeckWidthCm: number;
  backNeckDepthCm: number;
  sleeveLengthCm: number;
  wristCircumferenceCm: number;
  upperArmCircumferenceCm: number;
};

export type Project = {
  id: string;
  ownerId?: string | null;
  title: string;
  garmentType: GarmentType;
  gauge: Gauge;
  measurements: Measurements;
  construction: ConstructionSettings;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ArmholeMode = 'simple' | 'classic' | 'manual';

export type ConstructionSettings = {
  autoShoulder: boolean;
  armholeMode: ArmholeMode;
  manualArmholeScheme: string;
};

export type GaugeDerived = {
  stitchesPerCm: number;
  rowsPerCm: number;
};

export type CalculationResult = {
  gaugeDerived: GaugeDerived;
  formulas: string[];
  calculationSheet: CalculationSheetSection[];
  checks: PatternCheck[];
  hasCriticalIssues: boolean;
  fieldWarnings: Partial<Record<keyof Measurements, string[]>>;
  constructionWarnings: Partial<Record<keyof ConstructionSettings, string[]>>;
  back: {
    widthCm: number;
    castOnStitches: number;
    rowsToArmhole: number;
    armholeRows: number;
    shoulderStitches: number;
    leftShoulderStitches: number;
    rightShoulderStitches: number;
    leftShoulderCm: number;
    rightShoulderCm: number;
    backNeckStitches: number;
    backNeckDepthRows: number;
    armholeDecreaseStitchesPerSide: number;
    armholeShaping: ShapingPlan;
    armholeScheme: ArmholeSchemeItem[];
    armholeSchemeSum: number;
    rowsAfterArmholeShaping: number;
    instruction: string[];
  };
  front: {
    widthCm: number;
    castOnStitches: number;
    rowsToArmhole: number;
    armholeRows: number;
    neckStitches: number;
    neckDepthRows: number;
    neckStartRow: number;
    neckCenterBindOffStitches: number;
    leftNeckDecreaseStitches: number;
    rightNeckDecreaseStitches: number;
    neckDecreaseStitchesPerSide: number;
    neckShaping: ShapingPlan;
    instruction: string[];
  };
  sleeve: {
    wristStitches: number;
    upperArmStitches: number;
    sleeveRows: number;
    shaping: ShapingPlan;
    instruction: string[];
  };
  warnings: string[];
};

export type PatternCheckSeverity = 'ok' | 'warning' | 'critical';

export type PatternCheck = {
  id: string;
  severity: PatternCheckSeverity;
  message: string;
};

export type CalculationSheetSection = {
  title: string;
  rows: Array<{
    label: string;
    value: string;
    note?: string;
  }>;
};

export type ArmholeSchemeItem = {
  row: number;
  stitches: number;
  action: 'bindOff' | 'decrease';
};

export type ShapingMode = 'increase' | 'decrease';
export type ShapingSides = 'left' | 'right' | 'both' | 'center';

export type ShapingInput = {
  mode: ShapingMode;
  startStitches: number;
  targetStitches: number;
  totalRows: number;
  sides: ShapingSides;
  startRow?: number;
  actionEvery?: number;
};

export type ShapingPlan = {
  totalDelta: number;
  actionsTotal: number;
  actionsPerSide: number;
  rows: number[];
  humanReadableInstruction: string;
  warnings: string[];
};

export const emptyGauge: Gauge = {
  stitchesPer10cm: 0,
  rowsPer10cm: 0,
};

export const emptyMeasurements: Measurements = {
  bustCm: 0,
  easeCm: 0,
  bodyLengthCm: 0,
  armholeDepthCm: 0,
  armholeDecreaseStitchesPerSide: 0,
  shoulderWidthCm: 0,
  neckWidthCm: 0,
  frontNeckDepthCm: 0,
  backNeckWidthCm: 0,
  backNeckDepthCm: 0,
  sleeveLengthCm: 0,
  wristCircumferenceCm: 0,
  upperArmCircumferenceCm: 0,
};

export const defaultConstructionSettings: ConstructionSettings = {
  autoShoulder: true,
  armholeMode: 'classic',
  manualArmholeScheme: '',
};
