import { useMemo, useState } from 'react';
import type { ShapingInput, ShapingMode, ShapingSides } from '../../entities/project/types';
import { calculateShapingPlan } from '../../shared/domain/shaping';
import { Card } from '../../shared/ui/Card';
import { Input, Select } from '../../shared/ui/Input';
import { Section } from '../../shared/ui/Section';

const defaultInput: ShapingInput = {
  mode: 'increase',
  startStitches: 48,
  targetStitches: 82,
  totalRows: 120,
  sides: 'both',
};

export function ShapingCalculator() {
  const [input, setInput] = useState(defaultInput);

  const result = useMemo(() => {
    try {
      return { plan: calculateShapingPlan(input), error: '' };
    } catch (error) {
      return { plan: null, error: error instanceof Error ? error.message : 'Ошибка расчета.' };
    }
  }, [input]);

  function updateNumber(field: keyof Pick<ShapingInput, 'startStitches' | 'targetStitches' | 'totalRows'>, value: string) {
    setInput((current) => ({ ...current, [field]: parseNumericInput(value) }));
  }

  return (
    <div className="grid gap-5">
      <Section title="Калькулятор прибавок/убавок">
        <Card className="grid gap-4">
          <Select
            label="Режим"
            value={input.mode}
            onChange={(event) => setInput((current) => ({ ...current, mode: event.target.value as ShapingMode }))}
          >
            <option value="increase">Прибавки</option>
            <option value="decrease">Убавки</option>
          </Select>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Начальное количество петель" type="number" min="1" value={formatNumericInput(input.startStitches)} onChange={(event) => updateNumber('startStitches', event.target.value)} />
            <Input label="Итоговое количество петель" type="number" min="1" value={formatNumericInput(input.targetStitches)} onChange={(event) => updateNumber('targetStitches', event.target.value)} />
            <Input label="Количество рядов" type="number" min="1" value={formatNumericInput(input.totalRows)} onChange={(event) => updateNumber('totalRows', event.target.value)} />
          </div>
          <Select
            label="Стороны"
            value={input.sides}
            onChange={(event) => setInput((current) => ({ ...current, sides: event.target.value as ShapingSides }))}
          >
            <option value="both">С двух сторон</option>
            <option value="left">Слева</option>
            <option value="right">Справа</option>
            <option value="center">По центру</option>
          </Select>
        </Card>
      </Section>

      <Section title="Результат">
        {result.error ? (
          <Card className="border-red-200 bg-red-50 text-red-800">{result.error}</Card>
        ) : result.plan ? (
          <Card className="grid gap-4">
            <p className="font-semibold">{result.plan.humanReadableInstruction}</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span>Всего: {result.plan.totalDelta} п.</span>
              <span>Действий: {result.plan.actionsTotal}</span>
              <span>На сторону: {result.plan.actionsPerSide}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.plan.rows.map((row) => (
                <span key={row} className="rounded-md bg-sky px-2 py-1 text-sm font-semibold">{row}</span>
              ))}
            </div>
            {result.plan.warnings.map((warning) => (
              <p key={warning} className="text-sm font-medium text-amber-800">{warning}</p>
            ))}
          </Card>
        ) : null}
      </Section>
    </div>
  );
}

function parseNumericInput(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatNumericInput(value: number): string {
  return value === 0 ? '' : String(value);
}
