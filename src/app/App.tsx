import { Calculator, NotebookTabs } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AppRoute } from './routes';
import { createEmptyProject } from '../entities/project/factory';
import { projectRepository } from '../entities/project/localRepository';
import type { Project } from '../entities/project/types';
import { ProjectEditor } from '../features/projectEditor/ProjectEditor';
import { ProjectList } from '../features/projectList/ProjectList';
import { ShapingCalculator } from '../features/shapingCalculator/ShapingCalculator';
import { Button } from '../shared/ui/Button';

export function App() {
  const [route, setRoute] = useState<AppRoute>({ name: 'list' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [message, setMessage] = useState('');

  const repository = useMemo(() => projectRepository, []);

  async function loadProjects() {
    setProjects(await repository.list());
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function openEditor(projectId?: string) {
    const project = projectId ? await repository.getById(projectId) : createEmptyProject();
    if (!project) {
      setMessage('Проект не найден.');
      return;
    }
    setEditingProject(project);
    setRoute({ name: 'edit', projectId });
  }

  async function saveProject(project: Project) {
    await repository.save(project);
    await loadProjects();
  }

  async function deleteProject(id: string) {
    await repository.delete(id);
    await loadProjects();
  }

  async function importProject(file: File) {
    const text = await file.text();
    const project = JSON.parse(text) as Project;
    const imported = {
      ...project,
      id: project.id || crypto.randomUUID(),
      ownerId: project.ownerId ?? null,
      updatedAt: new Date().toISOString(),
      version: project.version || 1,
    };
    await repository.import(imported);
    await loadProjects();
    setMessage('Проект импортирован.');
  }

  function exportProject(project: Project) {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-flax bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <button type="button" className="flex items-center gap-2 text-left" onClick={() => setRoute({ name: 'list' })}>
            <NotebookTabs className="text-berry" size={28} />
            <div>
              <h1 className="text-xl font-black text-ink">Вязалка</h1>
              <p className="text-xs text-stone-600">цифровая тетрадь вязальщицы</p>
            </div>
          </button>
          <Button type="button" variant="secondary" icon={<Calculator size={18} />} onClick={() => setRoute({ name: 'calculator' })}>
            Калькулятор
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-5">
        {message ? <p className="rounded-lg bg-sky px-3 py-2 text-sm font-semibold text-ink">{message}</p> : null}

        {route.name === 'list' ? (
          <ProjectList
            projects={projects}
            onCreate={() => void openEditor()}
            onOpen={(id) => void openEditor(id)}
            onDelete={(id) => void deleteProject(id)}
            onImport={(file) => void importProject(file)}
          />
        ) : null}

        {route.name === 'edit' && editingProject ? (
          <ProjectEditor
            project={editingProject}
            onBack={() => {
              setRoute({ name: 'list' });
              setEditingProject(null);
              void loadProjects();
            }}
            onSave={saveProject}
            onExport={exportProject}
          />
        ) : null}

        {route.name === 'calculator' ? <ShapingCalculator /> : null}
      </main>
    </div>
  );
}
