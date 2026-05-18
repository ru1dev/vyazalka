import type { DecorativeZone } from '../../entities/project/types';
import type { SleevelessDressCalculationResult } from '../../shared/domain/sleevelessDressCalculations';
import type { DimensionLine, PatternPiece } from './types';

export function createSleevelessDressPatternPieces(
  result: SleevelessDressCalculationResult,
  decorativeZones: DecorativeZone[] = [],
): PatternPiece[] {
  return [
    createDressPiece('back', 'Спинка', result, decorativeZones),
    createDressPiece('front', 'Перед', result, decorativeZones),
  ];
}

function createDressPiece(
  id: 'back' | 'front',
  title: string,
  result: SleevelessDressCalculationResult,
  decorativeZones: DecorativeZone[],
): PatternPiece {
  const piece = result[id];
  const neckWidthCm = roundMetric(piece.neckStitches / result.gaugeDerived.stitchesPerCm);
  const zones = decorativeZones
    .filter((zone) => zone.pieceId === id)
    .map((zone) => ({
      id: zone.id,
      kind: zone.kind,
      startAt: clamp(zone.startRow / Math.max(piece.totalRows, 1), 0, 0.96),
      heightRatio: clamp(zone.heightRows / Math.max(piece.totalRows, 1), 0.04, 0.5),
      widthRatio: clamp(zone.widthStitches / Math.max(piece.castOnStitches, 1), 0.08, 0.8),
      offsetRatio: clamp((zone.offsetFromCenterStitches ?? 0) / Math.max(piece.castOnStitches, 1), -0.35, 0.35),
      label: zone.label,
    }));

  return {
    id,
    title,
    shape: 'dressBody',
    measurements: {
      heightCm: resultFormulaBodyLength(result),
      heightUnits: piece.totalRows,
      hipsWidthCm: piece.hipsWidthCm,
      hipsWidthUnits: piece.castOnStitches,
      waistWidthCm: piece.waistWidthCm,
      waistWidthUnits: piece.waistStitches,
      bustWidthCm: piece.bustWidthCm,
      bustWidthUnits: piece.bustStitches,
      armholeDepthCm: resultFormulaArmholeDepth(result),
      armholeDepthUnits: piece.armholeRows,
      neckWidthCm,
      neckWidthUnits: piece.neckStitches,
      neckDepthCm: resultFormulaNeckDepth(result, id),
      neckDepthUnits: piece.neckDepthRows,
      waistAt: piece.rowsToWaist / Math.max(piece.totalRows, 1),
      bustAt: piece.rowsToArmhole / Math.max(piece.totalRows, 1),
      armholeInsetUnits: piece.armholeDecreaseStitchesPerSide,
      leftShoulderUnits: piece.leftShoulderStitches,
      rightShoulderUnits: piece.rightShoulderStitches,
    },
    dimensions: [
      dimension({ id: `${id}-hips`, label: 'Бедра / низ', placement: 'bottom', priority: 'primary', anchorKey: 'hipsWidth' }),
      dimension({ id: `${id}-bust`, label: 'Грудь', placement: 'top', priority: 'primary', anchorKey: 'bustWidth' }),
      dimension({ id: `${id}-height`, label: 'Высота', placement: 'right', orientation: 'vertical', priority: 'primary', anchorKey: 'height' }),
      dimension({ id: `${id}-waist`, label: 'Талия', placement: 'bottom', priority: 'secondary', anchorKey: 'waistWidth' }),
      dimension({ id: `${id}-neck`, label: 'Горловина', placement: 'top', priority: 'secondary', anchorKey: 'neckWidth' }),
      dimension({ id: `${id}-armhole`, label: 'Пройма', placement: 'left', orientation: 'vertical', priority: 'secondary', anchorKey: 'armholeDepth' }),
      dimension({ id: `${id}-neck-depth`, label: 'Глубина горловины', placement: 'left', orientation: 'vertical', priority: 'secondary', anchorKey: 'neckDepth', display: 'table' }),
    ],
    guides: [
      { id: `${id}-waist-guide`, label: 'талия', position: 'horizontal', at: 1 - piece.rowsToWaist / Math.max(piece.totalRows, 1), style: 'dashed', priority: 'primary' },
      { id: `${id}-bust-guide`, label: 'грудь', position: 'horizontal', at: 1 - piece.rowsToArmhole / Math.max(piece.totalRows, 1), style: 'dashed', priority: 'primary' },
    ],
    labels: [
      { id: `${id}-neck-label`, text: 'горловина', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: id === 'front' ? 0.18 : 0.08 } },
      { id: `${id}-bottom-label`, text: 'низ', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: 0.93 } },
    ],
    decorativeZones: zones,
    notes: [
      `Плечи: ${piece.leftShoulderStitches} п. / ${piece.rightShoulderStitches} п.`,
      `Бедра -> талия: ${piece.hipsToWaistShaping.totalDelta} п., ряды ${formatRows(piece.hipsToWaistShaping.rows)}.`,
      `Талия -> грудь: ${piece.waistToBustShaping.totalDelta} п., ряды ${formatRows(piece.waistToBustShaping.rows)}.`,
      zones.length > 0 ? `Декоративные зоны: ${zones.length}.` : 'Декоративные зоны не заданы.',
    ],
    measurementTable: [
      row('Бедра / низ', piece.hipsWidthCm, piece.castOnStitches, 'п.'),
      row('Талия', piece.waistWidthCm, piece.waistStitches, 'п.'),
      row('Грудь', piece.bustWidthCm, piece.bustStitches, 'п.'),
      row('Высота', resultFormulaBodyLength(result), piece.totalRows, 'р.'),
      row('Пройма', resultFormulaArmholeDepth(result), piece.armholeRows, 'р.'),
      row('Горловина', neckWidthCm, piece.neckStitches, 'п.'),
      row('Глубина горловины', resultFormulaNeckDepth(result, id), piece.neckDepthRows, 'р.'),
      row('Начало горловины', '', piece.neckStartRow, 'р.'),
      row('Левое плечо', '', piece.leftShoulderStitches, 'п.'),
      row('Правое плечо', '', piece.rightShoulderStitches, 'п.'),
    ],
  };
}

function dimension(input: {
  id: string;
  label: string;
  placement: 'top' | 'right' | 'bottom' | 'left';
  priority: 'primary' | 'secondary';
  anchorKey: string;
  orientation?: 'horizontal' | 'vertical';
  display?: 'diagram' | 'table' | 'both';
}): DimensionLine {
  return {
    id: input.id,
    label: input.label,
    side: input.placement,
    placement: input.placement,
    kind: input.orientation === 'vertical' ? 'height' : 'width',
    orientation: input.orientation ?? 'horizontal',
    priority: input.priority,
    anchorKey: input.anchorKey,
    measurementKey: input.anchorKey,
    display: input.display ?? 'both',
  };
}

function row(label: string, cm: number | string, units: number | string, unitLabel: string) {
  return { label, cm, units, unitLabel };
}

function formatRows(rows: number[]): string {
  return rows.length ? rows.join(', ') : 'нет';
}

function resultFormulaBodyLength(result: SleevelessDressCalculationResult) {
  return roundMetric(result.front.totalRows / result.gaugeDerived.rowsPerCm);
}

function resultFormulaArmholeDepth(result: SleevelessDressCalculationResult) {
  return roundMetric(result.front.armholeRows / result.gaugeDerived.rowsPerCm);
}

function resultFormulaNeckDepth(result: SleevelessDressCalculationResult, id: 'front' | 'back') {
  return roundMetric(result[id].neckDepthRows / result.gaugeDerived.rowsPerCm);
}

function roundMetric(value: number) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
