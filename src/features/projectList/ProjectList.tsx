import { FileJson, Plus, Trash2 } from 'lucide-react';
import type { Project } from '../../entities/project/types';
import { formatDateTime } from '../../shared/utils/date';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Section } from '../../shared/ui/Section';

export function ProjectList({
  projects,
  onCreate,
  onOpen,
  onDelete,
  onImport,
}: {
  projects: Project[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
}) {
  return (
    <div className="grid gap-5">
      <Section
        title="Проекты"
        aside={<Button type="button" icon={<Plus size={18} />} onClick={onCreate}>Создать</Button>}
      >
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-flax bg-white px-4 py-3 text-sm font-semibold shadow-sm">
          <FileJson size={18} />
          Импорт JSON
          <input className="hidden" type="file" accept="application/json" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.currentTarget.value = '';
          }} />
        </label>
      </Section>

      {projects.length === 0 ? (
        <Card className="grid gap-3 text-stone-700">
          <p>Пока нет сохраненных проектов.</p>
          <p>Создайте первый проект, введите плотность и мерки, затем приложение сохранит расчеты локально в браузере.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Card key={project.id} className="grid gap-3">
              <button type="button" className="grid gap-1 text-left" onClick={() => onOpen(project.id)}>
                <span className="text-lg font-bold">{project.title}</span>
                <span className="text-sm text-stone-600">Базовый свитер / кофта снизу вверх</span>
                <span className="text-sm text-stone-600">Изменен: {formatDateTime(project.updatedAt)}</span>
                <span className="text-sm text-stone-700">
                  {project.gauge.stitchesPer10cm} п. / {project.gauge.rowsPer10cm} р. в 10 см, грудь {project.measurements.bustCm} см
                </span>
              </button>
              <div className="flex justify-end">
                <Button type="button" variant="danger" icon={<Trash2 size={17} />} onClick={() => onDelete(project.id)}>
                  Удалить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
