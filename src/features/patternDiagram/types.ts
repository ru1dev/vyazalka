export type PatternPieceShape =
  | 'rectangle'
  | 'bodyWithArmhole'
  | 'frontWithNeck'
  | 'backWithNeck'
  | 'sleeveTrapezoid'
  | 'customPath';

export type DimensionLine = {
  id: string;
  label: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  kind: 'width' | 'height' | 'custom';
  priority: 'primary' | 'secondary';
  measurementKey?: string;
};

export type GuideLine = {
  id: string;
  label?: string;
  position: 'horizontal' | 'vertical';
  at: number;
  style?: 'dashed' | 'solid';
  priority?: 'primary' | 'secondary';
};

export type PieceLabel = {
  id: string;
  text: string;
  anchor: 'inside' | 'outside' | 'top' | 'bottom' | 'left' | 'right';
  priority: 'primary' | 'secondary';
  at?: { x: number; y: number };
};

export type PieceMeasurement = {
  label: string;
  cm?: number | string;
  units?: number | string;
  unitLabel?: string;
};

export type PatternPiece = {
  id: string;
  title: string;
  shape: PatternPieceShape;
  measurements: Record<string, number | string>;
  dimensions: DimensionLine[];
  guides: GuideLine[];
  labels: PieceLabel[];
  notes?: string[];
  measurementTable?: PieceMeasurement[];
  customPath?: string;
};
