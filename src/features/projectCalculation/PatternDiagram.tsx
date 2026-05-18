import { useState } from 'react';
import type { DecorativeZoneView, DimensionLine, GuideLine, PatternPiece, PieceLabel } from '../patternDiagram/types';

type DiagramMode = 'overview' | string;

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

type ShapeGeometry = {
  path: string;
  frame: PieceFrame;
  anchors: Record<string, { start: Point; end: Point }>;
};

type RenderMode = 'overview' | 'detail';

const VIEW_BOX = '0 0 560 620';
const OVERVIEW_FRAME: PieceFrame = { x: 150, y: 140, width: 190, height: 300 };
const DETAIL_FRAME: PieceFrame = { x: 150, y: 145, width: 210, height: 330 };
const DETAIL_STROKE = '#24201d';
const DIM_STROKE = '#5f5a54';
const GUIDE_STROKE = '#8f3551';

export function PatternDiagram({ pieces }: { pieces: PatternPiece[] }) {
  const [mode, setMode] = useState<DiagramMode>('overview');
  const selectedPiece = pieces.find((piece) => piece.id === mode) ?? pieces[0];
  const tabs = [{ id: 'overview', title: 'Все вместе' }, ...pieces.map((piece) => ({ id: piece.id, title: piece.title }))];

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${
              mode === tab.id ? 'border-berry bg-berry text-white' : 'border-flax bg-white text-ink'
            }`}
            onClick={() => setMode(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {mode === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} mode="overview" />
          ))}
        </div>
      ) : selectedPiece ? (
        <PieceCard piece={selectedPiece} mode="detail" />
      ) : null}
    </div>
  );
}

function PieceCard({ piece, mode }: { piece: PatternPiece; mode: RenderMode }) {
  return (
    <div className={`rounded-lg border border-flax bg-white shadow-sm print:break-inside-avoid print:border-stone-400 print:shadow-none ${mode === 'detail' ? 'p-4 md:p-6' : 'p-3 md:p-4'}`}>
      <h3 className="mb-3 text-center text-base font-bold text-ink md:text-lg">{piece.title}</h3>
      <svg viewBox={VIEW_BOX} className="h-auto w-full" role="img" aria-label={`Схема детали ${piece.title}`}>
        {renderPieceSvg(piece, mode)}
      </svg>
      {mode === 'detail' ? <PieceMeasurementTable piece={piece} /> : null}
      {mode === 'detail' && piece.notes?.length ? <PieceNotes notes={piece.notes} /> : null}
    </div>
  );
}

function renderPieceSvg(piece: PatternPiece, mode: RenderMode) {
  const frame = mode === 'detail' ? DETAIL_FRAME : OVERVIEW_FRAME;
  const geometry = createShapeGeometry(piece, frame);
  const dimensions = piece.dimensions.filter((dimension) => {
    const display = dimension.display ?? 'both';
    if (display === 'table') return false;
    return mode === 'detail' || dimension.priority === 'primary';
  });
  const guides = piece.guides.filter((guide) => mode === 'detail' || guide.priority === 'primary');
  const labels = piece.labels.filter((label) => mode === 'detail' || label.priority === 'primary');

  return (
    <>
      {drawPieceOutline(geometry.path, fillForShape(piece.shape), mode)}
      {piece.decorativeZones?.map((zone) => drawDecorativeZone(zone, geometry, mode))}
      {guides.map((guide) => drawGuideLine(guide, geometry, mode))}
      {dimensions.map((dimension, index) => drawDimensionLine(dimension, geometry, piece, mode, placementIndex(dimensions, dimension, index)))}
      {labels.map((label) => drawPieceLabel(label, geometry, mode))}
    </>
  );
}

function createShapeGeometry(piece: PatternPiece, frame: PieceFrame): ShapeGeometry {
  if (piece.shape === 'sleeveTrapezoid') return createSleeveGeometry(piece, frame);
  if (piece.shape === 'dressBody') return createDressGeometry(piece, frame);
  if (piece.shape === 'customPath' && piece.customPath) return createCustomGeometry(piece.customPath, frame);
  if (piece.shape === 'rectangle') return createRectangleGeometry(frame);
  return createBodyGeometry(piece, frame);
}

function createRectangleGeometry(frame: PieceFrame): ShapeGeometry {
  const path = `M ${frame.x} ${frame.y} L ${frame.x + frame.width} ${frame.y} L ${frame.x + frame.width} ${frame.y + frame.height} L ${frame.x} ${frame.y + frame.height} Z`;
  return withAnchors(path, frame, {});
}

function createCustomGeometry(path: string, frame: PieceFrame): ShapeGeometry {
  return withAnchors(path, frame, {});
}

function createBodyGeometry(piece: PatternPiece, frame: PieceFrame): ShapeGeometry {
  const widthCm = numberMeasurement(piece, 'widthCm', 52);
  const heightCm = numberMeasurement(piece, 'heightCm', 60);
  const armholeDepthCm = numberMeasurement(piece, 'armholeDepthCm', 20);
  const armholeInsetUnits = numberMeasurement(piece, 'armholeInsetUnits', 8);
  const widthUnits = numberMeasurement(piece, 'widthUnits', 100);
  const neckWidthCm = numberMeasurement(piece, 'neckWidthCm', 16);
  const neckDepthCm = piece.shape === 'frontWithNeck' ? numberMeasurement(piece, 'neckDepthCm', 9) : Math.max(heightCm * 0.04, 2);
  const armholeY = frame.y + frame.height * (1 - clamp(armholeDepthCm / heightCm, 0.24, 0.42));
  const armholeInset = frame.width * clamp(armholeInsetUnits / Math.max(widthUnits / 2, 1), 0.06, 0.16);
  const neckWidth = frame.width * clamp(neckWidthCm / widthCm, 0.22, 0.44);
  const neckDepth = frame.height * clamp(neckDepthCm / heightCm, piece.shape === 'frontWithNeck' ? 0.12 : 0.05, piece.shape === 'frontWithNeck' ? 0.34 : 0.09);
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

  return withAnchors(path, frame, {
    neckWidth: { start: neckLeft, end: neckRight },
    neckDepth: { start: neckRight, end: neckBottom },
    armholeDepth: { start: rightArmholeStart, end: topRight },
  });
}

function createSleeveGeometry(piece: PatternPiece, frame: PieceFrame): ShapeGeometry {
  const topCm = numberMeasurement(piece, 'topWidthCm', 34);
  const bottomCm = numberMeasurement(piece, 'bottomWidthCm', 18);
  const topWidth = clamp(topCm * 4.2, 150, 230);
  const bottomWidth = clamp(bottomCm * 4.2, 86, Math.min(topWidth - 18, 180));
  const topLeft = { x: frame.x + (frame.width - topWidth) / 2, y: frame.y };
  const topRight = { x: topLeft.x + topWidth, y: frame.y };
  const bottomLeft = { x: frame.x + (frame.width - bottomWidth) / 2, y: frame.y + frame.height };
  const bottomRight = { x: bottomLeft.x + bottomWidth, y: frame.y + frame.height };
  const path = `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;

  return withAnchors(path, frame, {
    topWidth: { start: topLeft, end: topRight },
    bottomWidth: { start: bottomLeft, end: bottomRight },
  });
}

function createDressGeometry(piece: PatternPiece, frame: PieceFrame): ShapeGeometry {
  const hipsCm = numberMeasurement(piece, 'hipsWidthCm', numberMeasurement(piece, 'widthCm', 52));
  const waistCm = numberMeasurement(piece, 'waistWidthCm', hipsCm * 0.78);
  const bustCm = numberMeasurement(piece, 'bustWidthCm', hipsCm * 0.92);
  const heightCm = numberMeasurement(piece, 'heightCm', 90);
  const armholeDepthCm = numberMeasurement(piece, 'armholeDepthCm', 20);
  const armholeInsetUnits = numberMeasurement(piece, 'armholeInsetUnits', 7);
  const widthUnits = numberMeasurement(piece, 'hipsWidthUnits', numberMeasurement(piece, 'widthUnits', 110));
  const neckWidthCm = numberMeasurement(piece, 'neckWidthCm', 16);
  const neckDepthCm = numberMeasurement(piece, 'neckDepthCm', piece.id === 'front' ? 10 : 3);
  const waistAt = clamp(numberMeasurement(piece, 'waistAt', 0.42), 0.18, 0.82);
  const bustAt = clamp(numberMeasurement(piece, 'bustAt', 0.72), waistAt + 0.08, 0.9);
  const centerX = frame.x + frame.width / 2;
  const bottomY = frame.y + frame.height;
  const waistY = bottomY - frame.height * waistAt;
  const bustY = bottomY - frame.height * bustAt;
  const armholeY = frame.y + frame.height * (1 - clamp(armholeDepthCm / heightCm, 0.18, 0.38));
  const hipsWidth = frame.width;
  const waistWidth = frame.width * clamp(waistCm / Math.max(hipsCm, 1), 0.58, 0.92);
  const bustWidth = frame.width * clamp(bustCm / Math.max(hipsCm, 1), 0.68, 0.98);
  const armholeInset = frame.width * clamp(armholeInsetUnits / Math.max(widthUnits / 2, 1), 0.05, 0.14);
  const topWidth = Math.max(bustWidth - armholeInset * 2, frame.width * 0.46);
  const neckWidth = frame.width * clamp(neckWidthCm / Math.max(hipsCm, 1), 0.18, 0.38);
  const neckDepth = frame.height * clamp(neckDepthCm / heightCm, piece.id === 'front' ? 0.09 : 0.035, piece.id === 'front' ? 0.26 : 0.08);
  const bottomLeft = { x: centerX - hipsWidth / 2, y: bottomY };
  const bottomRight = { x: centerX + hipsWidth / 2, y: bottomY };
  const waistLeft = { x: centerX - waistWidth / 2, y: waistY };
  const waistRight = { x: centerX + waistWidth / 2, y: waistY };
  const bustLeft = { x: centerX - bustWidth / 2, y: bustY };
  const bustRight = { x: centerX + bustWidth / 2, y: bustY };
  const armholeLeft = { x: centerX - bustWidth / 2, y: armholeY };
  const armholeRight = { x: centerX + bustWidth / 2, y: armholeY };
  const topLeft = { x: centerX - topWidth / 2, y: frame.y };
  const topRight = { x: centerX + topWidth / 2, y: frame.y };
  const neckLeft = { x: centerX - neckWidth / 2, y: frame.y };
  const neckRight = { x: centerX + neckWidth / 2, y: frame.y };
  const neckBottom = { x: centerX, y: frame.y + neckDepth };
  const path = [
    `M ${bottomLeft.x} ${bottomLeft.y}`,
    `L ${waistLeft.x} ${waistLeft.y}`,
    `L ${bustLeft.x} ${bustLeft.y}`,
    `L ${armholeLeft.x} ${armholeLeft.y}`,
    `Q ${topLeft.x - 10} ${armholeY - 35} ${topLeft.x} ${topLeft.y}`,
    `L ${neckLeft.x} ${neckLeft.y}`,
    `Q ${centerX} ${neckBottom.y} ${neckRight.x} ${neckRight.y}`,
    `L ${topRight.x} ${topRight.y}`,
    `Q ${topRight.x + 10} ${armholeY - 35} ${armholeRight.x} ${armholeRight.y}`,
    `L ${bustRight.x} ${bustRight.y}`,
    `L ${waistRight.x} ${waistRight.y}`,
    `L ${bottomRight.x} ${bottomRight.y}`,
    'Z',
  ].join(' ');

  return withAnchors(path, frame, {
    hipsWidth: { start: bottomLeft, end: bottomRight },
    waistWidth: { start: waistLeft, end: waistRight },
    bustWidth: { start: bustLeft, end: bustRight },
    neckWidth: { start: neckLeft, end: neckRight },
    neckDepth: { start: neckRight, end: neckBottom },
    armholeDepth: { start: armholeRight, end: topRight },
  });
}

function withAnchors(path: string, frame: PieceFrame, customAnchors: Record<string, { start: Point; end: Point }>): ShapeGeometry {
  return {
    path,
    frame,
    anchors: {
      width: { start: { x: frame.x, y: frame.y + frame.height }, end: { x: frame.x + frame.width, y: frame.y + frame.height } },
      height: { start: { x: frame.x + frame.width, y: frame.y + frame.height }, end: { x: frame.x + frame.width, y: frame.y } },
      ...customAnchors,
    },
  };
}

function drawPieceOutline(path: string, fill: string, mode: RenderMode) {
  return <path d={path} fill={fill} stroke={DETAIL_STROKE} strokeWidth={mode === 'detail' ? 2.8 : 2.4} vectorEffect="non-scaling-stroke" />;
}

function drawDimensionLine(dimension: DimensionLine, geometry: ShapeGeometry, piece: PatternPiece, mode: RenderMode, index: number) {
  const anchor = getDimensionAnchor(dimension, geometry);
  const placement = dimension.placement ?? dimension.side;
  const offset = dimensionOffset(placement, mode, index);
  const label = formatDimensionLabel(dimension, piece);
  const isHorizontal = dimension.orientation
    ? dimension.orientation === 'horizontal'
    : Math.abs(anchor.end.x - anchor.start.x) >= Math.abs(anchor.end.y - anchor.start.y);
  const sx1 = isHorizontal ? anchor.start.x : anchor.start.x + offset;
  const sy1 = isHorizontal ? anchor.start.y + horizontalOffset(placement, offset) : anchor.start.y;
  const sx2 = isHorizontal ? anchor.end.x : anchor.end.x + offset;
  const sy2 = isHorizontal ? anchor.end.y + horizontalOffset(placement, offset) : anchor.end.y;
  const textOffset = mode === 'detail' ? 24 : 19;
  const labelLines = mode === 'detail' ? splitLabel(label) : [label];
  const labelX = isHorizontal ? (sx1 + sx2) / 2 : sx1 + Math.sign(offset) * textOffset;
  const labelY = isHorizontal ? sy1 + Math.sign(offset) * textOffset : (sy1 + sy2) / 2 - (labelLines.length - 1) * 8;

  return (
    <g key={dimension.id}>
      {drawExtensionLine(anchor.start, { x: sx1, y: sy1 })}
      {drawExtensionLine(anchor.end, { x: sx2, y: sy2 })}
      <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={DIM_STROKE} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      {drawArrow({ x: sx1, y: sy1 }, isHorizontal ? 'left' : 'up')}
      {drawArrow({ x: sx2, y: sy2 }, isHorizontal ? 'right' : 'down')}
      {drawText({
        x: clamp(labelX, 34, 526),
        y: clamp(labelY, 26, 594),
        lines: labelLines,
        anchor: isHorizontal ? 'middle' : offset > 0 ? 'start' : 'end',
        size: mode === 'detail' ? 16 : 14,
        weight: 700,
      })}
    </g>
  );
}

function drawExtensionLine(start: Point, end: Point) {
  return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={DIM_STROKE} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />;
}

function drawGuideLine(guide: GuideLine, geometry: ShapeGeometry, mode: RenderMode) {
  const at = clamp(guide.at, 0.08, 0.92);
  const x = geometry.frame.x + geometry.frame.width * at;
  const y = geometry.frame.y + geometry.frame.height * at;
  const isHorizontal = guide.position === 'horizontal';
  const line = isHorizontal
    ? { x1: geometry.frame.x, y1: y, x2: geometry.frame.x + geometry.frame.width, y2: y }
    : { x1: x, y1: geometry.frame.y, x2: x, y2: geometry.frame.y + geometry.frame.height };

  return (
    <g key={guide.id}>
      <line
        {...line}
        stroke={GUIDE_STROKE}
        strokeWidth="1.4"
        strokeDasharray={guide.style === 'solid' ? undefined : '7 7'}
        opacity="0.65"
        vectorEffect="non-scaling-stroke"
      />
      {mode === 'detail' && guide.label
        ? drawText({
            x: isHorizontal ? geometry.frame.x + geometry.frame.width / 2 : x + 10,
            y: isHorizontal ? y - 10 : geometry.frame.y + 18,
            lines: [guide.label],
            anchor: isHorizontal ? 'middle' : 'start',
            size: 14,
            weight: 600,
          })
        : null}
    </g>
  );
}

function drawDecorativeZone(zone: DecorativeZoneView, geometry: ShapeGeometry, mode: RenderMode) {
  const frame = geometry.frame;
  const height = frame.height * clamp(zone.heightRatio, 0.03, 0.55);
  const width = frame.width * clamp(zone.widthRatio, 0.05, 0.82);
  const centerX = frame.x + frame.width / 2 + frame.width * clamp(zone.offsetRatio ?? 0, -0.4, 0.4);
  const y = frame.y + frame.height * (1 - clamp(zone.startAt, 0, 0.96)) - height;
  const top = clamp(y, frame.y + 18, frame.y + frame.height - height - 12);
  const left = centerX - width / 2;
  const fill = zone.kind === 'colorBlock' ? '#dfeee9' : '#f5d7df';
  const stroke = '#8f3551';

  if (zone.kind === 'diamond') {
    const points = `${centerX},${top} ${left + width},${top + height / 2} ${centerX},${top + height} ${left},${top + height / 2}`;
    return (
      <g key={zone.id}>
        <polygon points={points} fill={fill} stroke={stroke} strokeWidth="1.4" opacity="0.72" vectorEffect="non-scaling-stroke" />
        {mode === 'detail' && zone.label ? drawText({ x: centerX, y: top + height / 2 + 5, lines: [zone.label], anchor: 'middle', size: 13, weight: 700 }) : null}
      </g>
    );
  }

  return (
    <g key={zone.id}>
      <rect x={left} y={top} width={width} height={height} fill={fill} stroke={stroke} strokeWidth="1.4" opacity="0.72" vectorEffect="non-scaling-stroke" />
      {zone.kind === 'stripe'
        ? Array.from({ length: Math.max(3, Math.round(width / 22)) }, (_, index) => (
            <line key={`${zone.id}-stripe-${index}`} x1={left + index * 22} y1={top + height} x2={left + index * 22 + height} y2={top} stroke={stroke} strokeWidth="0.8" opacity="0.45" />
          ))
        : null}
      {mode === 'detail' && zone.label ? drawText({ x: centerX, y: top + height / 2 + 5, lines: [zone.label], anchor: 'middle', size: 13, weight: 700 }) : null}
    </g>
  );
}

function drawPieceLabel(label: PieceLabel, geometry: ShapeGeometry, mode: RenderMode) {
  const at = label.at ?? { x: 0.5, y: 0.5 };
  const x = geometry.frame.x + geometry.frame.width * at.x;
  const y = geometry.frame.y + geometry.frame.height * at.y;

  return drawText({
    x,
    y,
    lines: [label.text],
    anchor: 'middle',
    size: mode === 'detail' ? 15 : 13,
    weight: 600,
  });
}

function PieceMeasurementTable({ piece }: { piece: PatternPiece }) {
  if (!piece.measurementTable?.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-flax">
      <div className="grid grid-cols-3 bg-paper px-3 py-2 text-xs font-bold text-stone-700">
        <span>Параметр</span>
        <span>см</span>
        <span>петли/ряды</span>
      </div>
      {piece.measurementTable.map((row) => (
        <div key={row.label} className="grid grid-cols-3 border-t border-flax px-3 py-2 text-sm">
          <span>{row.label}</span>
          <span>{row.cm || '-'}</span>
          <span>{row.units} {row.unitLabel}</span>
        </div>
      ))}
    </div>
  );
}

function PieceNotes({ notes }: { notes: string[] }) {
  return (
    <div className="mt-3 grid gap-1 rounded-lg bg-sky/60 px-3 py-2 text-sm text-ink">
      {notes.map((note) => (
        <p key={note}>{note}</p>
      ))}
    </div>
  );
}

function getDimensionAnchor(dimension: DimensionLine, geometry: ShapeGeometry) {
  return geometry.anchors[dimension.anchorKey ?? dimension.measurementKey ?? dimension.kind] ?? geometry.anchors[dimension.kind] ?? geometry.anchors.width;
}

function placementIndex(dimensions: DimensionLine[], dimension: DimensionLine, index: number) {
  const placement = dimension.placement ?? dimension.side;
  return dimensions
    .slice(0, index)
    .filter((item) => (item.placement ?? item.side) === placement).length;
}

function dimensionOffset(side: DimensionLine['side'], mode: RenderMode, index: number) {
  const base = mode === 'detail' ? 56 : 42;
  const step = mode === 'detail' ? 34 : 26;
  const value = base + Math.min(index, 1) * step;
  if (side === 'top' || side === 'left') return -value;
  return value;
}

function horizontalOffset(placement: DimensionLine['side'], offset: number) {
  if (placement === 'top' || placement === 'bottom') return offset;
  return 0;
}

function formatDimensionLabel(dimension: DimensionLine, piece: PatternPiece) {
  const key = dimension.anchorKey ?? dimension.measurementKey ?? dimension.kind;
  const cm = piece.measurements[`${key}Cm`];
  const units = piece.measurements[`${key}Units`];
  if (cm !== undefined && units !== undefined) return `${formatValue(cm)} см / ${units}`;
  return dimension.label;
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

function drawText({
  x,
  y,
  lines,
  anchor,
  size,
  weight,
}: {
  x: number;
  y: number;
  lines: string[];
  anchor: 'start' | 'middle' | 'end';
  size: number;
  weight: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={DETAIL_STROKE} fontSize={size} fontWeight={weight}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : size + 3}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function splitLabel(label: string): string[] {
  const parts = label.split(' / ');
  return parts.length === 2 ? [parts[0], parts[1]] : [label];
}

function fillForShape(shape: PatternPiece['shape']) {
  if (shape === 'sleeveTrapezoid') return '#f8efd8';
  if (shape === 'dressBody') return '#fff7ee';
  if (shape === 'frontWithNeck') return '#fffaf2';
  return '#eef6f4';
}

function numberMeasurement(piece: PatternPiece, key: string, fallback: number) {
  const value = piece.measurements[key];
  return typeof value === 'number' ? value : fallback;
}

function formatValue(value: number | string) {
  if (typeof value === 'string') return value;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
