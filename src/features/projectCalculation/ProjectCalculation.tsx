import { Printer } from 'lucide-react';
import type { Project } from '../../entities/project/types';
import { calculateBasicSweater } from '../../shared/domain/patternCalculations';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Section } from '../../shared/ui/Section';
import { PatternDiagram } from './PatternDiagram';

export function ProjectCalculation({ project }: { project: Project }) {
  let result;
  try {
    result = calculateBasicSweater(project);
  } catch (error) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-800">
        {error instanceof Error ? error.message : 'Не удалось рассчитать проект.'}
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Section title="Пошаговая инструкция">
        <div className="grid gap-3">
          <InstructionCard title="Спинка" steps={result.back.instruction} />
          <InstructionCard title="Перед" steps={result.front.instruction} />
          <InstructionCard title="Рукав" steps={result.sleeve.instruction} />
        </div>
      </Section>

      <Section title="Плотность">
        <Card className="grid gap-2 text-sm">
          <p>10 см = {project.gauge.stitchesPer10cm} петель</p>
          <p>10 см = {project.gauge.rowsPer10cm} рядов</p>
          <p>1 см = {result.gaugeDerived.stitchesPerCm} петель</p>
          <p>1 см = {result.gaugeDerived.rowsPerCm} рядов</p>
        </Card>
      </Section>

      <Section title="Схема">
        <Card>
          <PatternDiagram result={result} measurements={project.measurements} />
        </Card>
      </Section>

      <Section title="Детали">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <h3 className="mb-2 font-bold">Спинка</h3>
            <p>Набрать {result.back.castOnStitches} п.</p>
            <p>До проймы: {result.back.rowsToArmhole} р.</p>
            <p>Пройма: убрать по {result.back.armholeDecreaseStitchesPerSide} п. с каждой стороны.</p>
            <p>Плечо: {result.back.shoulderStitches} п.</p>
            <p>Горловина спинки: {result.back.backNeckStitches} п., глубина {result.back.backNeckDepthRows} р.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold">Перед</h3>
            <p>Набрать {result.front.castOnStitches} п.</p>
            <p>До проймы: {result.front.rowsToArmhole} р.</p>
            <p>Начало горловины: {result.front.neckStartRow} р. от начала.</p>
            <p>Закрыть средние {result.front.neckCenterBindOffStitches} п.</p>
            <p>Убавки горловины: по {result.front.neckDecreaseStitchesPerSide} п. с каждой стороны.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold">Рукав</h3>
            <p>Набрать {result.sleeve.wristStitches} п.</p>
            <p>Вязать {result.sleeve.sleeveRows} р.</p>
            <p>Прибавить до {result.sleeve.upperArmStitches} п.</p>
            <p className="mt-2 text-sm text-stone-700">{result.sleeve.shaping.humanReadableInstruction}</p>
          </Card>
        </div>
      </Section>

      <Section title="Ряды прибавок и убавок">
        <div className="grid gap-3">
          <RowsCard title="Пройма" rows={result.back.armholeShaping.rows} />
          <RowsCard title="Горловина переда" rows={result.front.neckShaping.rows} />
          <RowsCard title="Рукав" rows={result.sleeve.shaping.rows} />
        </div>
      </Section>

      <details className="rounded-lg border border-flax bg-white p-4 shadow-soft">
        <summary className="cursor-pointer text-lg font-bold text-ink">Как посчитано</summary>
        <ul className="mt-3 grid gap-2 text-sm text-stone-700">
          {result.formulas.map((formula) => (
            <li key={formula}>{formula}</li>
          ))}
        </ul>
      </details>

      <Card className="grid gap-3 border-amber-200 bg-amber-50 text-sm text-amber-900">
        {result.warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
      </Card>

      <Button type="button" variant="secondary" icon={<Printer size={18} />} onClick={() => window.print()}>
        Печать / PDF
      </Button>
    </div>
  );
}

function InstructionCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <ol className="grid list-decimal gap-2 pl-5 text-sm leading-6 text-stone-800">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </Card>
  );
}

function RowsCard({ title, rows }: { title: string; rows: number[] }) {
  return (
    <Card>
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {rows.length > 0 ? (
          rows.map((row) => (
            <span key={row} className="rounded-md bg-sky px-2 py-1 text-sm font-semibold">
              {row}
            </span>
          ))
        ) : (
          <span className="text-sm text-stone-600">Нет дополнительных рядов.</span>
        )}
      </div>
    </Card>
  );
}
