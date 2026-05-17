import { ArrowLeft, Download, Save } from 'lucide-react';
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
  neckWidthCm: 'Ширина горловины, см',
  frontNeckDepthCm: 'Глубина горловины переда, см',
  sleeveLengthCm: 'Длина рукава, см',
  wristCircumferenceCm: 'Обхват запястья, см',
  upperArmCircumferenceCm: 'Обхват рукава сверху, см',
};

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
  const [step, setStep] = useState<(typeof steps)[number]>('Проект');
  const [savedMessage, setSavedMessage] = useState('');

  const calculationState = useMemo(() => {
    try {
      calculateBasicSweater(draft);
      return { canCalculate: true, error: '' };
    } catch (error) {
      return { canCalculate: false, error: error instanceof Error ? error.message : 'Заполните данные для расчета.' };
    }
  }, [draft]);

  function updateGauge(field: keyof Gauge, value: string) {
    setDraft((current) => ({ ...current, gauge: { ...current.gauge, [field]: Number(value) } }));
  }

  function updateMeasurement(field: keyof Measurements, value: string) {
    setDraft((current) => ({ ...current, measurements: { ...current.measurements, [field]: Number(value) } }));
  }

  async function save() {
    const updated = { ...draft, updatedAt: nowIso() };
    setDraft(updated);
    await onSave(updated);
    setSavedMessage('Сохранено локально.');
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" icon={<ArrowLeft size={18} />} onClick={onBack}>Назад</Button>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" icon={<Download size={18} />} onClick={() => onExport(draft)}>JSON</Button>
          <Button type="button" icon={<Save size={18} />} onClick={save}>Сохранить</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {steps.map((item) => (
          <button
            key={item}
            type="button"
            className={`min-h-10 rounded-lg border px-2 text-xs font-semibold ${step === item ? 'border-berry bg-berry text-white' : 'border-flax bg-white text-ink'}`}
            onClick={() => setStep(item)}
          >
            {item}
          </button>
        ))}
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
            <Input label="Петель в 10 см" type="number" min="0" step="0.1" value={draft.gauge.stitchesPer10cm} onChange={(event) => updateGauge('stitchesPer10cm', event.target.value)} />
            <Input label="Рядов в 10 см" type="number" min="0" step="0.1" value={draft.gauge.rowsPer10cm} onChange={(event) => updateGauge('rowsPer10cm', event.target.value)} />
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
        <Section title="Мерки">
          <Card className="grid gap-4">
            {(Object.keys(measurementLabels) as Array<keyof Measurements>).map((field) => (
              <Input
                key={field}
                label={measurementLabels[field]}
                type="number"
                min="0"
                step="0.1"
                value={draft.measurements[field]}
                onChange={(event) => updateMeasurement(field, event.target.value)}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      {step === 'Расчет' ? (
        calculationState.canCalculate ? (
          <ProjectCalculation project={draft} />
        ) : (
          <Card className="border-red-200 bg-red-50 text-red-800">{calculationState.error}</Card>
        )
      ) : null}
    </div>
  );
}
