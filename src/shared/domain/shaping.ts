import type { ShapingInput, ShapingPlan } from '../../entities/project/types';

const sideLabels: Record<ShapingInput['sides'], string> = {
  left: 'слева',
  right: 'справа',
  both: 'с двух сторон',
  center: 'по центру',
};

const modeLabels: Record<ShapingInput['mode'], { verb: string; noun: string }> = {
  increase: { verb: 'прибавить', noun: 'прибавки' },
  decrease: { verb: 'убавить', noun: 'убавки' },
};

export function calculateShapingPlan(input: ShapingInput): ShapingPlan {
  const startRow = input.startRow ?? 1;
  const warnings: string[] = [];
  validateShapingInput(input);

  const totalDelta = Math.abs(input.targetStitches - input.startStitches);
  const stitchesPerActionRow = input.sides === 'both' ? 2 : 1;
  const rawActionRowsCount = Math.ceil(totalDelta / stitchesPerActionRow);
  const actionsPerSide =
    input.sides === 'both' ? Math.floor(totalDelta / 2) : rawActionRowsCount;

  if (totalDelta === 0) {
    return {
      totalDelta,
      actionsTotal: 0,
      actionsPerSide: 0,
      rows: [],
      humanReadableInstruction: 'Изменения количества петель не нужны.',
      warnings,
    };
  }

  if (input.sides === 'both' && totalDelta % 2 !== 0) {
    warnings.push(
      'Общее количество петель не делится ровно на две стороны: одна прибавка или убавка останется одиночной, либо измените параметры.',
    );
  }

  const rows = distributeRows({
    actionRowsCount: rawActionRowsCount,
    totalRows: input.totalRows,
    startRow,
    actionEvery: input.actionEvery,
  });

  if (rows.length < rawActionRowsCount) {
    warnings.push(
      'Действий больше, чем доступных рядов: часть прибавок или убавок попала в одни и те же ряды.',
    );
  }

  if (rawActionRowsCount > input.totalRows) {
    warnings.push('Количество действий больше количества рядов.');
  }

  const every = rows.length > 1 ? Math.round(input.totalRows / rawActionRowsCount) : input.totalRows;
  const labels = modeLabels[input.mode];
  const sideText =
    input.sides === 'both'
      ? `по 1 петле с каждой стороны`
      : `по 1 петле ${sideLabels[input.sides]}`;

  return {
    totalDelta,
    actionsTotal: rawActionRowsCount,
    actionsPerSide,
    rows,
    humanReadableInstruction: `Нужно ${labels.verb} ${totalDelta} п. Сделайте ${labels.noun} ${sideText} примерно каждые ${every} р.: ${rows.join(', ')}.`,
    warnings,
  };
}

function validateShapingInput(input: ShapingInput): void {
  const values = [input.startStitches, input.targetStitches, input.totalRows];
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Петли и ряды должны быть положительными числами.');
  }

  if (input.mode === 'increase' && input.targetStitches < input.startStitches) {
    throw new Error('Для прибавок итоговое количество петель должно быть больше начального.');
  }

  if (input.mode === 'decrease' && input.targetStitches > input.startStitches) {
    throw new Error('Для убавок итоговое количество петель должно быть меньше начального.');
  }
}

function distributeRows(params: {
  actionRowsCount: number;
  totalRows: number;
  startRow: number;
  actionEvery?: number;
}): number[] {
  const rows = new Set<number>();

  for (let i = 1; i <= params.actionRowsCount; i += 1) {
    const offset = params.actionEvery
      ? i * params.actionEvery
      : Math.round((i * params.totalRows) / params.actionRowsCount);
    rows.add(params.startRow + offset - 1);
  }

  return Array.from(rows).sort((a, b) => a - b);
}
