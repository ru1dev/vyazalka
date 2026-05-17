import type { CalculationResult, Measurements } from '../../entities/project/types';
import type { PatternPiece } from './types';

export function createBasicSweaterPatternPieces(result: CalculationResult, measurements: Measurements): PatternPiece[] {
  const bodyRows = result.back.rowsToArmhole + result.back.armholeRows;

  return [
    {
      id: 'back',
      title: 'Спинка',
      shape: 'backWithNeck',
      measurements: {
        widthCm: result.back.widthCm,
        widthUnits: result.back.castOnStitches,
        heightCm: measurements.bodyLengthCm,
        heightUnits: bodyRows,
        armholeDepthCm: measurements.armholeDepthCm,
        armholeDepthUnits: result.back.armholeRows,
        neckWidthCm: measurements.backNeckWidthCm,
        neckWidthUnits: result.back.backNeckStitches,
        armholeInsetUnits: result.back.armholeDecreaseStitchesPerSide,
        leftShoulderUnits: result.back.leftShoulderStitches,
        rightShoulderUnits: result.back.rightShoulderStitches,
      },
      dimensions: [
        dimension('back-width', 'Ширина', 'bottom', 'width', 'primary', 'width'),
        dimension('back-height', 'Высота', 'right', 'height', 'primary', 'height'),
        dimension('back-neck', 'Горловина', 'top', 'width', 'primary', 'neckWidth'),
        dimension('back-armhole', 'Пройма', 'left', 'height', 'secondary', 'armholeDepth'),
      ],
      guides: [{ id: 'back-armhole-guide', label: 'пройма', position: 'horizontal', at: 1 - measurements.armholeDepthCm / measurements.bodyLengthCm, style: 'dashed', priority: 'secondary' }],
      labels: [{ id: 'back-neck-label', text: 'горловина', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: 0.09 } }],
      notes: [`Левое плечо: ${result.back.leftShoulderStitches} п.`, `Правое плечо: ${result.back.rightShoulderStitches} п.`],
      measurementTable: [
        row('Ширина', result.back.widthCm, result.back.castOnStitches, 'п.'),
        row('Высота', measurements.bodyLengthCm, bodyRows, 'р.'),
        row('Горловина спинки', measurements.backNeckWidthCm, result.back.backNeckStitches, 'п.'),
        row('Глубина проймы', measurements.armholeDepthCm, result.back.armholeRows, 'р.'),
      ],
    },
    {
      id: 'front',
      title: 'Перед',
      shape: 'frontWithNeck',
      measurements: {
        widthCm: result.front.widthCm,
        widthUnits: result.front.castOnStitches,
        heightCm: measurements.bodyLengthCm,
        heightUnits: bodyRows,
        armholeDepthCm: measurements.armholeDepthCm,
        armholeDepthUnits: result.front.armholeRows,
        neckWidthCm: measurements.neckWidthCm,
        neckWidthUnits: result.front.neckStitches,
        neckDepthCm: measurements.frontNeckDepthCm,
        neckDepthUnits: result.front.neckDepthRows,
        neckStartUnits: result.front.neckStartRow,
        armholeInsetUnits: result.back.armholeDecreaseStitchesPerSide,
      },
      dimensions: [
        dimension('front-width', 'Ширина', 'bottom', 'width', 'primary', 'width'),
        dimension('front-height', 'Высота', 'right', 'height', 'primary', 'height'),
        dimension('front-neck', 'Горловина', 'top', 'width', 'primary', 'neckWidth'),
        dimension('front-neck-depth', 'Глубина горловины', 'left', 'height', 'secondary', 'neckDepth'),
        dimension('front-armhole', 'Пройма', 'right', 'height', 'secondary', 'armholeDepth'),
      ],
      guides: [
        { id: 'front-armhole-guide', label: 'пройма', position: 'horizontal', at: 1 - measurements.armholeDepthCm / measurements.bodyLengthCm, style: 'dashed', priority: 'secondary' },
        { id: 'front-neck-start-guide', label: `начало: ${result.front.neckStartRow} р.`, position: 'horizontal', at: result.front.neckStartRow / bodyRows, style: 'dashed', priority: 'secondary' },
      ],
      labels: [{ id: 'front-neck-label', text: 'горловина', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: 0.18 } }],
      notes: [`Убавки горловины: ${result.front.leftNeckDecreaseStitches} п. / ${result.front.rightNeckDecreaseStitches} п.`],
      measurementTable: [
        row('Ширина', result.front.widthCm, result.front.castOnStitches, 'п.'),
        row('Высота', measurements.bodyLengthCm, bodyRows, 'р.'),
        row('Горловина переда', measurements.neckWidthCm, result.front.neckStitches, 'п.'),
        row('Глубина горловины', measurements.frontNeckDepthCm, result.front.neckDepthRows, 'р.'),
        row('Начало горловины', '', result.front.neckStartRow, 'р.'),
        row('Глубина проймы', measurements.armholeDepthCm, result.front.armholeRows, 'р.'),
      ],
    },
    {
      id: 'sleeve',
      title: 'Рукав',
      shape: 'sleeveTrapezoid',
      measurements: {
        bottomWidthCm: measurements.wristCircumferenceCm,
        bottomWidthUnits: result.sleeve.wristStitches,
        topWidthCm: measurements.upperArmCircumferenceCm,
        topWidthUnits: result.sleeve.upperArmStitches,
        heightCm: measurements.sleeveLengthCm,
        heightUnits: result.sleeve.sleeveRows,
      },
      dimensions: [
        dimension('sleeve-top', 'Верх', 'top', 'width', 'primary', 'topWidth'),
        dimension('sleeve-bottom', 'Низ', 'bottom', 'width', 'primary', 'bottomWidth'),
        dimension('sleeve-height', 'Длина', 'right', 'height', 'primary', 'height'),
      ],
      guides: [],
      labels: [
        { id: 'sleeve-top-label', text: 'верх', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: 0.12 } },
        { id: 'sleeve-bottom-label', text: 'низ', anchor: 'inside', priority: 'secondary', at: { x: 0.5, y: 0.9 } },
      ],
      notes: [`Прибавки: ${result.sleeve.shaping.rows.length > 0 ? result.sleeve.shaping.rows.join(', ') : 'нет'}`],
      measurementTable: [
        row('Верх рукава', measurements.upperArmCircumferenceCm, result.sleeve.upperArmStitches, 'п.'),
        row('Низ рукава', measurements.wristCircumferenceCm, result.sleeve.wristStitches, 'п.'),
        row('Длина', measurements.sleeveLengthCm, result.sleeve.sleeveRows, 'р.'),
      ],
    },
  ];
}

function dimension(
  id: string,
  label: string,
  side: 'top' | 'right' | 'bottom' | 'left',
  kind: 'width' | 'height' | 'custom',
  priority: 'primary' | 'secondary',
  measurementKey: string,
) {
  return { id, label, side, kind, priority, measurementKey };
}

function row(label: string, cm: number | string, units: number | string, unitLabel: string) {
  return { label, cm, units, unitLabel };
}
