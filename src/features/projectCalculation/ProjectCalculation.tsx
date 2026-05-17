import { Printer } from 'lucide-react';
import type { ArmholeSchemeItem, PatternCheck, Project } from '../../entities/project/types';
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
      <Section title="Проверка выкройки">
        <div className="grid gap-2">
          {result.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      </Section>

      <Section title="Краткий итог">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <h3 className="mb-2 font-bold">Спинка</h3>
            <p>Набрать {result.back.castOnStitches} п.</p>
            <p>После проймы: {result.back.castOnStitches - result.back.armholeDecreaseStitchesPerSide * 2} п.</p>
            <p>Плечи: {result.back.leftShoulderStitches} п. / {result.back.rightShoulderStitches} п.</p>
            <p>Горловина спинки: {result.back.backNeckStitches} п.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold">Перед</h3>
            <p>Набрать {result.front.castOnStitches} п.</p>
            <p>Начало горловины: {result.front.neckStartRow} р.</p>
            <p>Закрыть средние {result.front.neckCenterBindOffStitches} п.</p>
            <p>Убавки: {result.front.leftNeckDecreaseStitches} п. / {result.front.rightNeckDecreaseStitches} п.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold">Рукав</h3>
            <p>Набрать {result.sleeve.wristStitches} п.</p>
            <p>Вязать {result.sleeve.sleeveRows} р.</p>
            <p>В конце {result.sleeve.upperArmStitches} п.</p>
          </Card>
        </div>
      </Section>

      <Section title="Расчетный лист">
        <div className="grid gap-3">
          {result.calculationSheet.map((section) => (
            <Card key={section.title}>
              <h3 className="mb-3 font-bold">{section.title}</h3>
              <div className="grid gap-2 text-sm">
                {section.rows.map((row) => (
                  <div key={`${section.title}-${row.label}`} className="grid gap-1 border-b border-flax/60 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between gap-3">
                      <span className="text-stone-600">{row.label}</span>
                      <span className="text-right font-semibold text-ink">{row.value}</span>
                    </div>
                    {row.note ? <p className="text-xs text-stone-500">{row.note}</p> : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Пошаговая инструкция">
        <div className="grid gap-3">
          <InstructionCard title="Спинка" steps={result.back.instruction} />
          <InstructionCard title="Перед" steps={result.front.instruction} />
          <InstructionCard title="Рукав" steps={result.sleeve.instruction} />
        </div>
      </Section>

      <Section title="Схема">
        <Card>
          <PatternDiagram result={result} measurements={project.measurements} />
        </Card>
      </Section>

      <Section title="Ряды прибавок и убавок">
        <div className="grid gap-3">
          <ArmholeRowsCard scheme={result.back.armholeScheme} />
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

function CheckRow({ check }: { check: PatternCheck }) {
  const className =
    check.severity === 'critical'
      ? 'border-red-200 bg-red-50 text-red-800'
      : check.severity === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return <Card className={`text-sm font-medium ${className}`}>{check.message}</Card>;
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

function ArmholeRowsCard({ scheme }: { scheme: ArmholeSchemeItem[] }) {
  return (
    <Card>
      <h3 className="mb-3 font-bold">Пройма</h3>
      <div className="grid gap-2 text-sm">
        {scheme.map((item) => (
          <p key={`${item.row}-${item.stitches}`}>
            {item.row} ряд: {item.action === 'bindOff' ? 'закрыть' : 'убавить'} {item.stitches} п.
          </p>
        ))}
      </div>
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
