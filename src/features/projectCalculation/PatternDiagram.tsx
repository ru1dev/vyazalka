import { useState } from 'react';
import type { CalculationResult, Measurements } from '../../entities/project/types';

type DiagramMode = 'overview' | 'back' | 'front' | 'sleeve';

type PieceFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type DimensionLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  orientation: 'horizontal' | 'vertical';
  offset: number;
  textOffset?: number;
  id: string;
  compact?: boolean;
};

type LabelProps = {
  x: number;
  y: number;
  lines: string[];
  anchor?: 'start' | 'middle' | 'end';
  size?: 'title' | 'body' | 'small';
  weight?: 'normal' | 'bold';
};

type PatternDiagramData = {
  back: {
    widthCm: number;
    widthStitches: number;
    heightCm: number;
    heightRows: number;
    armholeDepthCm: number;
    armholeDepthRows: number;
    neckWidthCm: number;
    neckWidthStitches: number;
    leftShoulderStitches: number;
    rightShoulderStitches: number;
    armholeDecreaseStitchesPerSide: number;
  };
  front: {
    widthCm: number;
    widthStitches: number;
    heightCm: number;
    heightRows: number;
    armholeDepthCm: number;
    armholeDepthRows: number;
    neckWidthCm: number;
    neckWidthStitches: number;
    neckDepthCm: number;
    neckDepthRows: number;
    neckStartRow: number;
    armholeDecreaseStitchesPerSide: number;
  };
  sleeve: {
    wristCm: number;
    wristStitches: number;
    upperArmCm: number;
    upperArmStitches: number;
    lengthCm: number;
    lengthRows: number;
  };
};

const DETAIL_BODY_VIEW_BOX = '0 0 520 650';
const DETAIL_SLEEVE_VIEW_BOX = '0 0 520 620';
const OVERVIEW_BODY_VIEW_BOX = '0 0 360 460';
const OVERVIEW_SLEEVE_VIEW_BOX = '0 0 360 430';
const DETAIL_BODY_FRAME: PieceFrame = { x: 130, y: 130, width: 190, height: 350 };
const DETAIL_SLEEVE_FRAME: PieceFrame = { x: 120, y: 125, width: 220, height: 340 };
const OVERVIEW_BODY_FRAME: PieceFrame = { x: 90, y: 96, width: 142, height: 250 };
const OVERVIEW_SLEEVE_FRAME: PieceFrame = { x: 78, y: 94, width: 180, height: 250 };
const DETAIL_STROKE = '#24201d';
const DIM_STROKE = '#5f5a54';
const GUIDE_STROKE = '#8f3551';

const tabs: Array<{ mode: DiagramMode; label: string }> = [
  { mode: 'overview', label: 'Все вместе' },
  { mode: 'back', label: 'Спинка' },
  { mode: 'front', label: 'Перед' },
  { mode: 'sleeve', label: 'Рукав' },
];

export function PatternDiagram({ result, measurements }: { result: CalculationResult; measurements: Measurements }) {
  const [mode, setMode] = useState<DiagramMode>('overview');
  const data = toPatternDiagramData(result, measurements);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${
              mode === tab.mode ? 'border-berry bg-berry text-white' : 'border-flax bg-white text-ink'
            }`}
            onClick={() => setMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {renderBackPiece(data.back, 'overview')}
          {renderFrontPiece(data.front, 'overview')}
          {renderSleevePiece(data.sleeve, 'overview')}
        </div>
      ) : null}

      {mode === 'back' ? renderBackPiece(data.back, 'detail') : null}
      {mode === 'front' ? renderFrontPiece(data.front, 'detail') : null}
      {mode === 'sleeve' ? renderSleevePiece(data.sleeve, 'detail') : null}
    </div>
  );
}

function toPatternDiagramData(result: CalculationResult, measurements: Measurements): PatternDiagramData {
  const bodyRows = result.back.rowsToArmhole + result.back.armholeRows;

  return {
    back: {
      widthCm: result.back.widthCm,
      widthStitches: result.back.castOnStitches,
      heightCm: measurements.bodyLengthCm,
      heightRows: bodyRows,
      armholeDepthCm: measurements.armholeDepthCm,
      armholeDepthRows: result.back.armholeRows,
      neckWidthCm: measurements.backNeckWidthCm,
      neckWidthStitches: result.back.backNeckStitches,
      leftShoulderStitches: result.back.leftShoulderStitches,
      rightShoulderStitches: result.back.rightShoulderStitches,
      armholeDecreaseStitchesPerSide: result.back.armholeDecreaseStitchesPerSide,
    },
    front: {
      widthCm: result.front.widthCm,
      widthStitches: result.front.castOnStitches,
      heightCm: measurements.bodyLengthCm,
      heightRows: bodyRows,
      armholeDepthCm: measurements.armholeDepthCm,
      armholeDepthRows: result.front.armholeRows,
      neckWidthCm: measurements.neckWidthCm,
      neckWidthStitches: result.front.neckStitches,
      neckDepthCm: measurements.frontNeckDepthCm,
      neckDepthRows: result.front.neckDepthRows,
      neckStartRow: result.front.neckStartRow,
      armholeDecreaseStitchesPerSide: result.back.armholeDecreaseStitchesPerSide,
    },
    sleeve: {
      wristCm: measurements.wristCircumferenceCm,
      wristStitches: result.sleeve.wristStitches,
      upperArmCm: measurements.upperArmCircumferenceCm,
      upperArmStitches: result.sleeve.upperArmStitches,
      lengthCm: measurements.sleeveLengthCm,
      lengthRows: result.sleeve.sleeveRows,
    },
  };
}

function renderBackPiece(back: PatternDiagramData['back'], mode: 'overview' | 'detail') {
  const frame = mode === 'detail' ? DETAIL_BODY_FRAME : OVERVIEW_BODY_FRAME;
  const viewBox = mode === 'detail' ? DETAIL_BODY_VIEW_BOX : OVERVIEW_BODY_VIEW_BOX;
  const geometry = createBodyGeometry({
    frame,
    armholeDepthRatio: ratio(back.armholeDepthCm, back.heightCm, 0.24, 0.42),
    armholeInsetRatio: ratio(back.armholeDecreaseStitchesPerSide, Math.max(back.widthStitches / 2, 1), 0.06, 0.16),
    neckWidthRatio: ratio(back.neckWidthCm, back.widthCm, 0.22, 0.42),
    neckDepthRatio: 0.06,
  });

  return (
    <DiagramCard title="Спинка" detail={mode === 'detail'}>
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label="Схема спинки">
        {drawPieceOutline(geometry.path, '#eef6f4', mode)}
        {mode === 'detail' ? drawGuideLine({ x1: frame.x, y1: geometry.armholeY, x2: frame.x + frame.width, y2: geometry.armholeY, id: 'back-armhole-guide' }) : null}
        {drawDimensionLine({
          id: 'back-width',
          x1: geometry.bottomLeft.x,
          y1: geometry.bottomLeft.y,
          x2: geometry.bottomRight.x,
          y2: geometry.bottomRight.y,
          label: formatDimensionLabel(back.widthCm, back.widthStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? 54 : 42,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'back-height',
          x1: geometry.bottomRight.x,
          y1: geometry.bottomRight.y,
          x2: geometry.topRight.x,
          y2: geometry.topRight.y,
          label: formatDimensionLabel(back.heightCm, back.heightRows, 'р.'),
          orientation: 'vertical',
          offset: mode === 'detail' ? 68 : 54,
          textOffset: mode === 'detail' ? 24 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'back-neck',
          x1: geometry.neckLeft.x,
          y1: geometry.neckLeft.y,
          x2: geometry.neckRight.x,
          y2: geometry.neckRight.y,
          label: formatDimensionLabel(back.neckWidthCm, back.neckWidthStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? -46 : -34,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {mode === 'detail'
          ? drawDimensionLine({
              id: 'back-armhole',
              x1: geometry.rightArmholeStart.x,
              y1: geometry.rightArmholeStart.y,
              x2: geometry.topRight.x,
              y2: geometry.topRight.y,
              label: formatDimensionLabel(back.armholeDepthCm, back.armholeDepthRows, 'р.'),
              orientation: 'vertical',
              offset: 34,
              textOffset: 22,
            })
          : null}
        {drawLabel({ x: frame.x + frame.width / 2, y: mode === 'detail' ? 60 : 48, lines: ['Спинка'], anchor: 'middle', size: 'title', weight: 'bold' })}
        {mode === 'detail'
          ? drawLabel({
              x: frame.x + frame.width / 2,
              y: frame.y + frame.height + 112,
              lines: [`левое плечо ${back.leftShoulderStitches} п.`, `правое плечо ${back.rightShoulderStitches} п.`],
              anchor: 'middle',
              size: 'body',
            })
          : null}
      </svg>
    </DiagramCard>
  );
}

function renderFrontPiece(front: PatternDiagramData['front'], mode: 'overview' | 'detail') {
  const frame = mode === 'detail' ? DETAIL_BODY_FRAME : OVERVIEW_BODY_FRAME;
  const viewBox = mode === 'detail' ? DETAIL_BODY_VIEW_BOX : OVERVIEW_BODY_VIEW_BOX;
  const geometry = createBodyGeometry({
    frame,
    armholeDepthRatio: ratio(front.armholeDepthCm, front.heightCm, 0.24, 0.42),
    armholeInsetRatio: ratio(front.armholeDecreaseStitchesPerSide, Math.max(front.widthStitches / 2, 1), 0.06, 0.16),
    neckWidthRatio: ratio(front.neckWidthCm, front.widthCm, 0.22, 0.44),
    neckDepthRatio: ratio(front.neckDepthCm, front.heightCm, 0.12, 0.34),
  });
  const neckStartY = clamp(frame.y + frame.height - (front.neckStartRow / Math.max(front.heightRows, 1)) * frame.height, frame.y + 58, frame.y + frame.height - 62);

  return (
    <DiagramCard title="Перед" detail={mode === 'detail'}>
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label="Схема переда">
        {drawPieceOutline(geometry.path, '#fffaf2', mode)}
        {mode === 'detail' ? drawGuideLine({ x1: frame.x, y1: geometry.armholeY, x2: frame.x + frame.width, y2: geometry.armholeY, id: 'front-armhole-guide' }) : null}
        {mode === 'detail' ? drawGuideLine({ x1: frame.x + 16, y1: neckStartY, x2: frame.x + frame.width - 16, y2: neckStartY, id: 'front-neck-start-guide' }) : null}
        {drawDimensionLine({
          id: 'front-width',
          x1: geometry.bottomLeft.x,
          y1: geometry.bottomLeft.y,
          x2: geometry.bottomRight.x,
          y2: geometry.bottomRight.y,
          label: formatDimensionLabel(front.widthCm, front.widthStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? 54 : 42,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'front-height',
          x1: geometry.bottomRight.x,
          y1: geometry.bottomRight.y,
          x2: geometry.topRight.x,
          y2: geometry.topRight.y,
          label: formatDimensionLabel(front.heightCm, front.heightRows, 'р.'),
          orientation: 'vertical',
          offset: mode === 'detail' ? 68 : 54,
          textOffset: mode === 'detail' ? 24 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'front-neck-width',
          x1: geometry.neckLeft.x,
          y1: geometry.neckLeft.y,
          x2: geometry.neckRight.x,
          y2: geometry.neckRight.y,
          label: formatDimensionLabel(front.neckWidthCm, front.neckWidthStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? -46 : -34,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {mode === 'detail'
          ? drawDimensionLine({
              id: 'front-neck-depth',
              x1: geometry.neckRight.x,
              y1: geometry.neckRight.y,
              x2: geometry.neckBottom.x,
              y2: geometry.neckBottom.y,
              label: formatDimensionLabel(front.neckDepthCm, front.neckDepthRows, 'р.'),
              orientation: 'vertical',
              offset: 34,
              textOffset: 22,
            })
          : null}
        {mode === 'detail'
          ? drawDimensionLine({
              id: 'front-armhole',
              x1: geometry.leftArmholeStart.x,
              y1: geometry.leftArmholeStart.y,
              x2: geometry.topLeft.x,
              y2: geometry.topLeft.y,
              label: formatDimensionLabel(front.armholeDepthCm, front.armholeDepthRows, 'р.'),
              orientation: 'vertical',
              offset: -42,
              textOffset: 22,
            })
          : null}
        {drawLabel({ x: frame.x + frame.width / 2, y: mode === 'detail' ? 60 : 48, lines: ['Перед'], anchor: 'middle', size: 'title', weight: 'bold' })}
        {mode === 'detail' ? drawLabel({ x: frame.x + frame.width / 2, y: neckStartY - 12, lines: [`начало горловины: ${front.neckStartRow} р.`], anchor: 'middle', size: 'body' }) : null}
      </svg>
    </DiagramCard>
  );
}

function renderSleevePiece(sleeve: PatternDiagramData['sleeve'], mode: 'overview' | 'detail') {
  const frame = mode === 'detail' ? DETAIL_SLEEVE_FRAME : OVERVIEW_SLEEVE_FRAME;
  const viewBox = mode === 'detail' ? DETAIL_SLEEVE_VIEW_BOX : OVERVIEW_SLEEVE_VIEW_BOX;
  const topWidth = normalizeWidth(sleeve.upperArmCm, mode === 'detail' ? 150 : 120, mode === 'detail' ? 220 : 178);
  const bottomWidth = normalizeWidth(sleeve.wristCm, mode === 'detail' ? 86 : 68, Math.min(topWidth - 18, mode === 'detail' ? 170 : 132));
  const topLeft = { x: frame.x + (frame.width - topWidth) / 2, y: frame.y };
  const topRight = { x: topLeft.x + topWidth, y: frame.y };
  const bottomLeft = { x: frame.x + (frame.width - bottomWidth) / 2, y: frame.y + frame.height };
  const bottomRight = { x: bottomLeft.x + bottomWidth, y: frame.y + frame.height };
  const path = `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;

  return (
    <DiagramCard title="Рукав" detail={mode === 'detail'}>
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label="Схема рукава">
        {drawPieceOutline(path, '#f8efd8', mode)}
        {drawDimensionLine({
          id: 'sleeve-top',
          x1: topLeft.x,
          y1: topLeft.y,
          x2: topRight.x,
          y2: topRight.y,
          label: formatDimensionLabel(sleeve.upperArmCm, sleeve.upperArmStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? -54 : -42,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'sleeve-bottom',
          x1: bottomLeft.x,
          y1: bottomLeft.y,
          x2: bottomRight.x,
          y2: bottomRight.y,
          label: formatDimensionLabel(sleeve.wristCm, sleeve.wristStitches, 'п.'),
          orientation: 'horizontal',
          offset: mode === 'detail' ? 54 : 42,
          textOffset: mode === 'detail' ? 22 : 18,
          compact: mode === 'overview',
        })}
        {drawDimensionLine({
          id: 'sleeve-height',
          x1: topRight.x,
          y1: topRight.y,
          x2: bottomRight.x,
          y2: bottomRight.y,
          label: formatDimensionLabel(sleeve.lengthCm, sleeve.lengthRows, 'р.'),
          orientation: 'vertical',
          offset: mode === 'detail' ? 70 : 56,
          textOffset: mode === 'detail' ? 24 : 18,
          compact: mode === 'overview',
        })}
        {drawLabel({ x: frame.x + frame.width / 2, y: mode === 'detail' ? 58 : 48, lines: ['Рукав'], anchor: 'middle', size: 'title', weight: 'bold' })}
      </svg>
    </DiagramCard>
  );
}

function DiagramCard({ title, detail, children }: { title: string; detail: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-flax bg-white shadow-sm print:break-inside-avoid print:border-stone-400 print:shadow-none ${detail ? 'p-4 md:p-6' : 'p-3 md:p-4'}`}>
      <div className="sr-only">{title}</div>
      {children}
    </div>
  );
}

function createBodyGeometry({
  frame,
  armholeDepthRatio,
  armholeInsetRatio,
  neckWidthRatio,
  neckDepthRatio,
}: {
  frame: PieceFrame;
  armholeDepthRatio: number;
  armholeInsetRatio: number;
  neckWidthRatio: number;
  neckDepthRatio: number;
}) {
  const armholeY = frame.y + frame.height * (1 - armholeDepthRatio);
  const armholeInset = frame.width * armholeInsetRatio;
  const neckWidth = frame.width * neckWidthRatio;
  const neckDepth = frame.height * neckDepthRatio;
  const centerX = frame.x + frame.width / 2;
  const neckLeft = { x: centerX - neckWidth / 2, y: frame.y };
  const neckRight = { x: centerX + neckWidth / 2, y: frame.y };
  const neckBottom = { x: centerX, y: frame.y + neckDepth };
  const topLeft = { x: frame.x + armholeInset, y: frame.y };
  const topRight = { x: frame.x + frame.width - armholeInset, y: frame.y };
  const bottomLeft = { x: frame.x, y: frame.y + frame.height };
  const bottomRight = { x: frame.x + frame.width, y: frame.y + frame.height };
  const leftArmholeStart = { x: frame.x, y: armholeY };
  const rightArmholeStart = { x: frame.x + frame.width, y: armholeY };
  const path = [
    `M ${bottomLeft.x} ${bottomLeft.y}`,
    `L ${leftArmholeStart.x} ${leftArmholeStart.y}`,
    `Q ${frame.x + armholeInset * 0.35} ${armholeY - 34} ${topLeft.x} ${topLeft.y}`,
    `L ${neckLeft.x} ${neckLeft.y}`,
    `Q ${centerX} ${neckBottom.y} ${neckRight.x} ${neckRight.y}`,
    `L ${topRight.x} ${topRight.y}`,
    `Q ${frame.x + frame.width - armholeInset * 0.35} ${armholeY - 34} ${rightArmholeStart.x} ${rightArmholeStart.y}`,
    `L ${bottomRight.x} ${bottomRight.y}`,
    'Z',
  ].join(' ');

  return {
    path,
    armholeY,
    topLeft,
    topRight,
    bottomLeft,
    bottomRight,
    neckLeft,
    neckRight,
    neckBottom,
    leftArmholeStart,
    rightArmholeStart,
  };
}

function drawPieceOutline(path: string, fill: string, mode: 'overview' | 'detail') {
  return <path d={path} fill={fill} stroke={DETAIL_STROKE} strokeWidth={mode === 'detail' ? 2.8 : 2.4} vectorEffect="non-scaling-stroke" />;
}

function drawDimensionLine({ x1, y1, x2, y2, label, orientation, offset, textOffset = 20, id, compact = false }: DimensionLineProps) {
  const isHorizontal = orientation === 'horizontal';
  const sx1 = isHorizontal ? x1 : x1 + offset;
  const sy1 = isHorizontal ? y1 + offset : y1;
  const sx2 = isHorizontal ? x2 : x2 + offset;
  const sy2 = isHorizontal ? y2 + offset : y2;
  const extensionA = isHorizontal
    ? { x1, y1, x2: x1, y2: sy1 }
    : { x1, y1, x2: sx1, y2: y1 };
  const extensionB = isHorizontal
    ? { x1: x2, y1: y2, x2, y2: sy2 }
    : { x1: x2, y1: y2, x2: sx2, y2 };
  const labelLines = compact ? [label] : splitLabel(label);
  const labelX = isHorizontal ? (sx1 + sx2) / 2 : sx1 + Math.sign(offset) * textOffset;
  const labelY = isHorizontal ? sy1 + Math.sign(offset) * textOffset : (sy1 + sy2) / 2 - (labelLines.length - 1) * 8;

  return (
    <g key={id}>
      <line {...extensionA} stroke={DIM_STROKE} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <line {...extensionB} stroke={DIM_STROKE} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={DIM_STROKE} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      {drawArrow({ x: sx1, y: sy1 }, isHorizontal ? 'left' : 'up')}
      {drawArrow({ x: sx2, y: sy2 }, isHorizontal ? 'right' : 'down')}
      {drawLabel({
        x: labelX,
        y: labelY,
        lines: labelLines,
        anchor: isHorizontal ? 'middle' : offset > 0 ? 'start' : 'end',
        size: compact ? 'small' : 'body',
        weight: 'bold',
      })}
    </g>
  );
}

function drawArrow(point: Point, direction: 'left' | 'right' | 'up' | 'down') {
  const size = 7;
  const points = {
    left: `${point.x},${point.y} ${point.x + size},${point.y - size / 2} ${point.x + size},${point.y + size / 2}`,
    right: `${point.x},${point.y} ${point.x - size},${point.y - size / 2} ${point.x - size},${point.y + size / 2}`,
    up: `${point.x},${point.y} ${point.x - size / 2},${point.y + size} ${point.x + size / 2},${point.y + size}`,
    down: `${point.x},${point.y} ${point.x - size / 2},${point.y - size} ${point.x + size / 2},${point.y - size}`,
  }[direction];

  return <polygon points={points} fill={DIM_STROKE} />;
}

function drawLabel({ x, y, lines, anchor = 'middle', size = 'body', weight = 'normal' }: LabelProps) {
  const fontSize = size === 'title' ? 20 : size === 'body' ? 16 : 14;
  const lineHeight = size === 'title' ? 22 : size === 'body' ? 18 : 16;

  return (
    <text x={x} y={y} textAnchor={anchor} fill={DETAIL_STROKE} fontSize={fontSize} fontWeight={weight === 'bold' ? 700 : 500}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function drawGuideLine({ x1, y1, x2, y2, id }: { x1: number; y1: number; x2: number; y2: number; id: string }) {
  return (
    <line
      key={id}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={GUIDE_STROKE}
      strokeWidth="1.4"
      strokeDasharray="7 7"
      opacity="0.65"
      vectorEffect="non-scaling-stroke"
    />
  );
}

function formatDimensionLabel(cm: number, units: number, unitLabel: string) {
  return `${formatNumber(cm)} см / ${units} ${unitLabel}`;
}

function splitLabel(label: string): string[] {
  const parts = label.split(' / ');
  return parts.length === 2 ? [parts[0], parts[1]] : [label];
}

function normalizeWidth(value: number, min: number, max: number) {
  return clamp(value * 4.2, min, max);
}

function ratio(value: number, base: number, min: number, max: number) {
  return clamp(value / Math.max(base, 1), min, max);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
