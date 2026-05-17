import type { CalculationResult, Measurements } from '../../entities/project/types';

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
};

type LabelProps = {
  x: number;
  y: number;
  lines: string[];
  anchor?: 'start' | 'middle' | 'end';
  className?: string;
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

const BODY_VIEW_BOX = '0 0 320 430';
const SLEEVE_VIEW_BOX = '0 0 320 390';
const BODY_FRAME: PieceFrame = { x: 78, y: 92, width: 132, height: 230 };
const SLEEVE_FRAME: PieceFrame = { x: 70, y: 86, width: 150, height: 220 };
const DETAIL_STROKE = '#24201d';
const DIM_STROKE = '#5f5a54';
const GUIDE_STROKE = '#8f3551';

export function PatternDiagram({ result, measurements }: { result: CalculationResult; measurements: Measurements }) {
  const data = toPatternDiagramData(result, measurements);

  return (
    <div className="grid gap-4 print:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
      {renderBackPiece(data.back)}
      {renderFrontPiece(data.front)}
      {renderSleevePiece(data.sleeve)}
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

function renderBackPiece(back: PatternDiagramData['back']) {
  const frame = BODY_FRAME;
  const geometry = createBodyGeometry({
    frame,
    armholeDepthRatio: ratio(back.armholeDepthCm, back.heightCm, 0.24, 0.42),
    armholeInsetRatio: ratio(back.armholeDecreaseStitchesPerSide, Math.max(back.widthStitches / 2, 1), 0.06, 0.16),
    neckWidthRatio: ratio(back.neckWidthCm, back.widthCm, 0.22, 0.42),
    neckDepthRatio: 0.06,
  });

  return (
    <DiagramCard title="Спинка">
      <svg viewBox={BODY_VIEW_BOX} className="h-auto w-full" role="img" aria-label="Техническая схема спинки">
        {drawPieceOutline(geometry.path, '#eef6f4')}
        {drawGuideLine({ x1: frame.x, y1: geometry.armholeY, x2: frame.x + frame.width, y2: geometry.armholeY, id: 'back-armhole-guide' })}
        {drawDimensionLine({
          id: 'back-width',
          x1: geometry.bottomLeft.x,
          y1: geometry.bottomLeft.y,
          x2: geometry.bottomRight.x,
          y2: geometry.bottomRight.y,
          label: formatDimensionLabel(back.widthCm, back.widthStitches, 'п.'),
          orientation: 'horizontal',
          offset: 36,
        })}
        {drawDimensionLine({
          id: 'back-height',
          x1: geometry.bottomRight.x,
          y1: geometry.bottomRight.y,
          x2: geometry.topRight.x,
          y2: geometry.topRight.y,
          label: formatDimensionLabel(back.heightCm, back.heightRows, 'р.'),
          orientation: 'vertical',
          offset: 42,
        })}
        {drawDimensionLine({
          id: 'back-neck',
          x1: geometry.neckLeft.x,
          y1: geometry.neckLeft.y,
          x2: geometry.neckRight.x,
          y2: geometry.neckRight.y,
          label: formatDimensionLabel(back.neckWidthCm, back.neckWidthStitches, 'п.'),
          orientation: 'horizontal',
          offset: -28,
        })}
        {drawDimensionLine({
          id: 'back-armhole',
          x1: geometry.rightArmholeStart.x,
          y1: geometry.rightArmholeStart.y,
          x2: geometry.topRight.x,
          y2: geometry.topRight.y,
          label: formatDimensionLabel(back.armholeDepthCm, back.armholeDepthRows, 'р.'),
          orientation: 'vertical',
          offset: 24,
        })}
        {drawLabel({ x: frame.x + frame.width / 2, y: 44, lines: ['Спинка'], anchor: 'middle', className: 'font-bold' })}
        {drawLabel({
          x: frame.x + frame.width / 2,
          y: 365,
          lines: [`лев. плечо ${back.leftShoulderStitches} п.`, `прав. плечо ${back.rightShoulderStitches} п.`],
          anchor: 'middle',
        })}
      </svg>
    </DiagramCard>
  );
}

function renderFrontPiece(front: PatternDiagramData['front']) {
  const frame = BODY_FRAME;
  const geometry = createBodyGeometry({
    frame,
    armholeDepthRatio: ratio(front.armholeDepthCm, front.heightCm, 0.24, 0.42),
    armholeInsetRatio: ratio(front.armholeDecreaseStitchesPerSide, Math.max(front.widthStitches / 2, 1), 0.06, 0.16),
    neckWidthRatio: ratio(front.neckWidthCm, front.widthCm, 0.22, 0.44),
    neckDepthRatio: ratio(front.neckDepthCm, front.heightCm, 0.12, 0.34),
  });
  const neckStartY = clamp(frame.y + frame.height - (front.neckStartRow / Math.max(front.heightRows, 1)) * frame.height, frame.y + 44, frame.y + frame.height - 48);

  return (
    <DiagramCard title="Перед">
      <svg viewBox={BODY_VIEW_BOX} className="h-auto w-full" role="img" aria-label="Техническая схема переда">
        {drawPieceOutline(geometry.path, '#fffaf2')}
        {drawGuideLine({ x1: frame.x, y1: geometry.armholeY, x2: frame.x + frame.width, y2: geometry.armholeY, id: 'front-armhole-guide' })}
        {drawGuideLine({ x1: frame.x + 12, y1: neckStartY, x2: frame.x + frame.width - 12, y2: neckStartY, id: 'front-neck-start-guide' })}
        {drawDimensionLine({
          id: 'front-width',
          x1: geometry.bottomLeft.x,
          y1: geometry.bottomLeft.y,
          x2: geometry.bottomRight.x,
          y2: geometry.bottomRight.y,
          label: formatDimensionLabel(front.widthCm, front.widthStitches, 'п.'),
          orientation: 'horizontal',
          offset: 36,
        })}
        {drawDimensionLine({
          id: 'front-height',
          x1: geometry.bottomRight.x,
          y1: geometry.bottomRight.y,
          x2: geometry.topRight.x,
          y2: geometry.topRight.y,
          label: formatDimensionLabel(front.heightCm, front.heightRows, 'р.'),
          orientation: 'vertical',
          offset: 42,
        })}
        {drawDimensionLine({
          id: 'front-neck-width',
          x1: geometry.neckLeft.x,
          y1: geometry.neckLeft.y,
          x2: geometry.neckRight.x,
          y2: geometry.neckRight.y,
          label: formatDimensionLabel(front.neckWidthCm, front.neckWidthStitches, 'п.'),
          orientation: 'horizontal',
          offset: -26,
        })}
        {drawDimensionLine({
          id: 'front-neck-depth',
          x1: geometry.neckRight.x,
          y1: geometry.neckRight.y,
          x2: geometry.neckBottom.x,
          y2: geometry.neckBottom.y,
          label: formatDimensionLabel(front.neckDepthCm, front.neckDepthRows, 'р.'),
          orientation: 'vertical',
          offset: 18,
        })}
        {drawLabel({ x: frame.x + frame.width / 2, y: 44, lines: ['Перед'], anchor: 'middle', className: 'font-bold' })}
        {drawLabel({ x: frame.x + frame.width / 2, y: neckStartY - 8, lines: [`начало горл.: ${front.neckStartRow} р.`], anchor: 'middle' })}
      </svg>
    </DiagramCard>
  );
}

function renderSleevePiece(sleeve: PatternDiagramData['sleeve']) {
  const frame = SLEEVE_FRAME;
  const topWidth = normalizeWidth(sleeve.upperArmCm, 80, 150);
  const bottomWidth = normalizeWidth(sleeve.wristCm, 48, Math.min(topWidth - 12, 110));
  const topLeft = { x: frame.x + (frame.width - topWidth) / 2, y: frame.y };
  const topRight = { x: topLeft.x + topWidth, y: frame.y };
  const bottomLeft = { x: frame.x + (frame.width - bottomWidth) / 2, y: frame.y + frame.height };
  const bottomRight = { x: bottomLeft.x + bottomWidth, y: frame.y + frame.height };
  const path = `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;

  return (
    <DiagramCard title="Рукав">
      <svg viewBox={SLEEVE_VIEW_BOX} className="h-auto w-full" role="img" aria-label="Техническая схема рукава">
        {drawPieceOutline(path, '#f8efd8')}
        {drawDimensionLine({
          id: 'sleeve-top',
          x1: topLeft.x,
          y1: topLeft.y,
          x2: topRight.x,
          y2: topRight.y,
          label: formatDimensionLabel(sleeve.upperArmCm, sleeve.upperArmStitches, 'п.'),
          orientation: 'horizontal',
          offset: -34,
        })}
        {drawDimensionLine({
          id: 'sleeve-bottom',
          x1: bottomLeft.x,
          y1: bottomLeft.y,
          x2: bottomRight.x,
          y2: bottomRight.y,
          label: formatDimensionLabel(sleeve.wristCm, sleeve.wristStitches, 'п.'),
          orientation: 'horizontal',
          offset: 36,
        })}
        {drawDimensionLine({
          id: 'sleeve-height',
          x1: topRight.x,
          y1: topRight.y,
          x2: bottomRight.x,
          y2: bottomRight.y,
          label: formatDimensionLabel(sleeve.lengthCm, sleeve.lengthRows, 'р.'),
          orientation: 'vertical',
          offset: 42,
        })}
        {drawLabel({ x: frame.x + frame.width / 2, y: 44, lines: ['Рукав'], anchor: 'middle', className: 'font-bold' })}
        {drawLabel({ x: frame.x + frame.width / 2, y: topLeft.y + 22, lines: ['верх'], anchor: 'middle' })}
        {drawLabel({ x: frame.x + frame.width / 2, y: bottomLeft.y - 12, lines: ['низ'], anchor: 'middle' })}
      </svg>
    </DiagramCard>
  );
}

function DiagramCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-flax bg-white p-3 shadow-sm print:break-inside-avoid print:border-stone-400 print:shadow-none">
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
    `Q ${frame.x + armholeInset * 0.35} ${armholeY - 26} ${topLeft.x} ${topLeft.y}`,
    `L ${neckLeft.x} ${neckLeft.y}`,
    `Q ${centerX} ${neckBottom.y} ${neckRight.x} ${neckRight.y}`,
    `L ${topRight.x} ${topRight.y}`,
    `Q ${frame.x + frame.width - armholeInset * 0.35} ${armholeY - 26} ${rightArmholeStart.x} ${rightArmholeStart.y}`,
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

function drawPieceOutline(path: string, fill: string) {
  return <path d={path} fill={fill} stroke={DETAIL_STROKE} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />;
}

function drawDimensionLine({ x1, y1, x2, y2, label, orientation, offset, textOffset = 14, id }: DimensionLineProps) {
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
  const labelLines = splitLabel(label);
  const labelX = isHorizontal ? (sx1 + sx2) / 2 : sx1 + Math.sign(offset) * textOffset;
  const labelY = isHorizontal ? sy1 + Math.sign(offset) * textOffset : (sy1 + sy2) / 2 - (labelLines.length - 1) * 6;

  return (
    <g key={id} className="text-[11px] text-ink">
      <line {...extensionA} stroke={DIM_STROKE} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <line {...extensionB} stroke={DIM_STROKE} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={DIM_STROKE} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {drawArrow({ x: sx1, y: sy1 }, isHorizontal ? 'left' : 'up')}
      {drawArrow({ x: sx2, y: sy2 }, isHorizontal ? 'right' : 'down')}
      {drawLabel({
        x: labelX,
        y: labelY,
        lines: labelLines,
        anchor: isHorizontal ? 'middle' : offset > 0 ? 'start' : 'end',
      })}
    </g>
  );
}

function drawArrow(point: Point, direction: 'left' | 'right' | 'up' | 'down') {
  const size = 5;
  const points = {
    left: `${point.x},${point.y} ${point.x + size},${point.y - size / 2} ${point.x + size},${point.y + size / 2}`,
    right: `${point.x},${point.y} ${point.x - size},${point.y - size / 2} ${point.x - size},${point.y + size / 2}`,
    up: `${point.x},${point.y} ${point.x - size / 2},${point.y + size} ${point.x + size / 2},${point.y + size}`,
    down: `${point.x},${point.y} ${point.x - size / 2},${point.y - size} ${point.x + size / 2},${point.y - size}`,
  }[direction];

  return <polygon points={points} fill={DIM_STROKE} />;
}

function drawLabel({ x, y, lines, anchor = 'middle', className = '' }: LabelProps) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={DETAIL_STROKE} className={`select-none text-[11px] ${className}`}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : 13}>
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
      strokeWidth="1"
      strokeDasharray="5 5"
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
  return clamp(value * 3.2, min, max);
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
