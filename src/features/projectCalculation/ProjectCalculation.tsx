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
      <Section title="Плотность">
        <Card className="grid gap-2 text-sm">
          <p>10 см = {project.gauge.stitchesPer10cm} петель</p>
          <p>10 см = {project.gauge.rowsPer10cm} рядов</p>
          <p>1 см = {result.gaugeDerived.stitchesPerCm} петель</p>
          <p>1 см = {result.gaugeDerived.rowsPerCm} рядов</p>
        </Card>
      </Section>

      <Section title="Формулы">
        <Card>
          <ul className="grid gap-2 text-sm text-stone-700">
            {result.formulas.map((formula) => (
              <li key={formula}>{formula}</li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Схема">
        <Card>
          <PatternDiagram result={result} />
        </Card>
      </Section>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <h3 className="mb-2 font-bold">Спинка</h3>
          <p>Набрать {result.back.castOnStitches} п.</p>
          <p>Вязать {result.back.rowsToArmhole} р. до проймы.</p>
          <p>Затем {result.back.armholeRows} р. проймы.</p>
        </Card>
        <Card>
          <h3 className="mb-2 font-bold">Перед</h3>
          <p>Набрать {result.front.castOnStitches} п.</p>
          <p>Вязать {result.front.rowsToArmhole} р. до проймы.</p>
          <p>Горловина: {result.front.neckStitches} п., глубина {result.front.neckDepthRows} р.</p>
        </Card>
        <Card>
          <h3 className="mb-2 font-bold">Рукав</h3>
          <p>Набрать {result.sleeve.wristStitches} п.</p>
          <p>Вязать {result.sleeve.sleeveRows} р.</p>
          <p>Прибавить до {result.sleeve.upperArmStitches} п.</p>
          <p className="mt-2 text-sm text-stone-700">{result.sleeve.shaping.humanReadableInstruction}</p>
        </Card>
      </div>

      <Section title="Ряды прибавок рукава">
        <Card>
          <div className="flex flex-wrap gap-2">
            {result.sleeve.shaping.rows.map((row) => (
              <span key={row} className="rounded-md bg-sky px-2 py-1 text-sm font-semibold">{row}</span>
            ))}
          </div>
        </Card>
      </Section>

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
