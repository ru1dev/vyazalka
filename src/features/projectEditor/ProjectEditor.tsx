import { ArrowLeft, ArrowRight, Download, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Gauge, Measurements, Project } from '../../entities/project/types';
import { calculateBasicSweater } from '../../shared/domain/patternCalculations';
import { nowIso } from '../../shared/utils/date';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Input, Select, Textarea } from '../../shared/ui/Input';
import { Section } from '../../shared/ui/Section';
import { ProjectCalculation } from '../projectCalculation/ProjectCalculation';

const measurementLabels: Record<keyof Measurements, string> = {
  bustCm: 'Обхват груди, см',
  easeCm: 'Свобода облегания, см',
  bodyLengthCm: 'Длина изделия, см',
  armholeDepthCm: 'Глубина проймы, см',
  armholeDecreaseStitchesPerSide: 'Убавки проймы с каждой стороны, п.',
  shoulderWidthCm: 'Ширина плеча, см',
  neckWidthCm: 'Ширина горловины переда, см',
  frontNeckDepthCm: 'Глубина горловины переда, см',
  backNeckWidthCm: 'Ширина горловины спинки, см',
  backNeckDepthCm: 'Глубина горловины спинки, см',
  sleeveLengthCm: 'Длина рукава, см',
  wristCircumferenceCm: 'Обхват запястья, см',
  upperArmCircumferenceCm: 'Обхват рукава сверху, см',
};

const mainMeasurements: Array<keyof Measurements> = [
  'bustCm',
  'easeCm',
  'bodyLengthCm',
  'armholeDepthCm',
  'sleeveLengthCm',
  'wristCircumferenceCm',
  'upperArmCircumferenceCm',
];

const constructionMeasurements: Array<keyof Measurements> = [
  'armholeDecreaseStitchesPerSide',
  'shoulderWidthCm',
  'neckWidthCm',
  'frontNeckDepthCm',
  'backNeckWidthCm',
  'backNeckDepthCm',
];

const steps = ['Проект', 'Плотность', 'Мерки', 'Расчет'] as const;

export function ProjectEditor({
  project,
  onBack,
  onSave,
  onExport,
}: {
  project: Project;
  onBack: () => void;
  onSave: (project: Project) => Promise<void>;
  onExport: (project: Project) => void;
}) {
  const [draft, setDraft] = useState(project);
  const [stepIndex, setStepIndex] = useState(0);
  const [savedMessage, setSavedMessage] = useState('');
  const step = steps[stepIndex];

  const calculationState = useMemo(() => {
    try {
      calculateBasicSweater(draft);
      return { canCalculate: true, error: '' };
    } catch (error) {
      return { canCalculate: false, error: error instanceof Error ? error.message : 'Заполните данные для расчета.' };
    }
  }, [draft]);

  function updateGauge(field: keyof Gauge, value: string) {
    setDraft((current) => ({ ...current, gauge: { ...current.gauge, [field]: parseNumericInput(value) } }));
  }

  function updateMeasurement(field: keyof Measurements, value: string) {
    setDraft((current) => ({ ...current, measurements: { ...current.measurements, [field]: parseNumericInput(value) } }));
  }

  async function save() {
    const updated = { ...draft, updatedAt: nowIso() };
    setDraft(updated);
    await onSave(updated);
    setSavedMessage('Сохранено локально.');
  }

  function goNext() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goPrevious() {
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="grid gap-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" icon={<ArrowLeft size={18} />} onClick={onBack}>
          Назад
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" icon={<Download size={18} />} onClick={() => onExport(draft)}>
            JSON
          </Button>
          <Button type="button" icon={<Save size={18} />} onClick={save}>
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm font-semibold text-stone-600">
          <span>Шаг {stepIndex + 1} из {steps.length}</span>
          <span>{step}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-flax">
          <div className="h-full rounded-full bg-berry transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="hidden grid-cols-4 gap-2 sm:grid">
          {steps.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`min-h-10 rounded-lg border px-2 text-xs font-semibold ${step === item ? 'border-berry bg-berry text-white' : 'border-flax bg-white text-ink'}`}
              onClick={() => setStepIndex(index)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {savedMessage ? <p className="text-sm font-semibold text-moss">{savedMessage}</p> : null}

      {step === 'Проект' ? (
        <Section title="Проект">
          <Card className="grid gap-4">
            <Input label="Название проекта" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            <Select label="Тип изделия" value={draft.garmentType} onChange={() => undefined}>
              <option value="basic_sweater_bottom_up">Базовый свитер / кофта снизу вверх</option>
            </Select>
            <Input label="Единицы измерения" value="см" disabled />
            <Textarea label="Заметки" value={draft.notes ?? ''} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          </Card>
        </Section>
      ) : null}

      {step === 'Плотность' ? (
        <Section title="Плотность вязания">
          <Card className="grid gap-4">
            <Input label="Петель в 10 см" type="number" min="0" step="0.1" value={formatNumericInput(draft.gauge.stitchesPer10cm)} onChange={(event) => updateGauge('stitchesPer10cm', event.target.value)} />
            <Input label="Рядов в 10 см" type="number" min="0" step="0.1" value={formatNumericInput(draft.gauge.rowsPer10cm)} onChange={(event) => updateGauge('rowsPer10cm', event.target.value)} />
            <p className="text-sm text-stone-700">
              {draft.gauge.stitchesPer10cm > 0 ? `${draft.gauge.stitchesPer10cm} п. / 10 см = ${draft.gauge.stitchesPer10cm / 10} п./см` : 'Введите плотность по петлям.'}
            </p>
            <p className="text-sm text-stone-700">
              {draft.gauge.rowsPer10cm > 0 ? `${draft.gauge.rowsPer10cm} р. / 10 см = ${draft.gauge.rowsPer10cm / 10} р./см` : 'Введите плотность по рядам.'}
            </p>
          </Card>
        </Section>
      ) : null}

      {step === 'Мерки' ? (
        <div className="grid gap-5">
          <MeasurementGroup title="Основные мерки" fields={mainMeasurements} draft={draft} onChange={updateMeasurement} />
          <MeasurementGroup title="Конструкция" fields={constructionMeasurements} draft={draft} onChange={updateMeasurement} />
        </div>
      ) : null}

      {step === 'Расчет' ? (
        calculationState.canCalculate ? (
          <ProjectCalculation project={draft} />
        ) : (
          <Card className="border-red-200 bg-red-50 text-red-800">{calculationState.error}</Card>
        )
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-flax bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3">
          <Button type="button" variant="secondary" className="flex-1" disabled={stepIndex === 0} onClick={goPrevious}>
            Назад
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button type="button" className="flex-1" icon={<ArrowRight size={18} />} onClick={goNext}>
              Далее
            </Button>
          ) : (
            <Button type="button" className="flex-1" icon={<Save size={18} />} onClick={save}>
              Сохранить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MeasurementGroup({
  title,
  fields,
  draft,
  onChange,
}: {
  title: string;
  fields: Array<keyof Measurements>;
  draft: Project;
  onChange: (field: keyof Measurements, value: string) => void;
}) {
  return (
    <Section title={title}>
      <Card className="grid gap-4">
        {fields.map((field) => (
          <Input
            key={field}
            label={measurementLabels[field]}
            type="number"
            min="0"
            step={field === 'armholeDecreaseStitchesPerSide' ? '1' : '0.1'}
            value={formatNumericInput(draft.measurements[field])}
            onChange={(event) => onChange(field, event.target.value)}
          />
        ))}
      </Card>
    </Section>
  );
}

function parseNumericInput(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatNumericInput(value: number): string {
  return value === 0 ? '' : String(value);
}
