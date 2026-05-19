import { Calculator, NotebookTabs } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { AppRoute } from './routes';
import { createEmptyProject, normalizeProject } from '../entities/project/factory';
import { projectRepository } from '../entities/project/localRepository';
import type { Project } from '../entities/project/types';
import { DebugPage } from '../features/debug/DebugPage';
import { ProjectEditor } from '../features/projectEditor/ProjectEditor';
import { ProjectList } from '../features/projectList/ProjectList';
import { ShapingCalculator } from '../features/shapingCalculator/ShapingCalculator';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';
import { createId } from '../shared/utils/createId';
import { storeLastError } from '../shared/utils/errorLog';
import { resetAndReload } from '../shared/utils/resetLocalAppData';

export function App() {
  const [route, setRoute] = useState<AppRoute>(getInitialRoute());
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);

  const repository = useMemo(() => projectRepository, []);

  async function loadProjects() {
    try {
      setStorageError(null);
      setProjects((await repository.list()).map(normalizeProject));
    } catch (error) {
      const stored = storeLastError(error);
      setStorageError(stored.message);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function openEditor(projectId?: string) {
    try {
      const project = projectId ? await repository.getById(projectId) : createEmptyProject();
      if (!project) {
        setMessage('Проект не найден.');
        return;
      }
      setEditingProject(normalizeProject(project));
      setRoute({ name: 'edit', projectId });
    } catch (error) {
      const stored = storeLastError(error);
      setStorageError(stored.message);
    }
  }

  async function saveProject(project: Project) {
    try {
      await repository.save(project);
      await loadProjects();
    } catch (error) {
      const stored = storeLastError(error);
      setStorageError(stored.message);
    }
  }

  async function deleteProject(id: string) {
    try {
      await repository.delete(id);
      await loadProjects();
    } catch (error) {
      const stored = storeLastError(error);
      setStorageError(stored.message);
    }
  }

  async function importProject(file: File) {
    try {
      const text = await file.text();
      const project = JSON.parse(text) as Project;
      const imported = normalizeProject({
        ...project,
        id: project.id || createId(),
        ownerId: project.ownerId ?? null,
        updatedAt: new Date().toISOString(),
        version: project.version || 1,
      });
      await repository.import(imported);
      await loadProjects();
      setMessage('Проект импортирован.');
    } catch (error) {
      const stored = storeLastError(error);
      setStorageError(stored.message);
    }
  }

  function exportProject(project: Project) {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(project.title) || 'project'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (route.name === 'debug') {
    return <DebugPage />;
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
        {storageError ? <StorageError message={storageError} onRetry={() => void loadProjects()} /> : null}

        {!storageError && route.name === 'list' ? (
          <ProjectList
            projects={projects}
            onCreate={() => void openEditor()}
            onOpen={(id) => void openEditor(id)}
            onDelete={(id) => void deleteProject(id)}
            onImport={(file) => void importProject(file)}
          />
        ) : null}

        {!storageError && route.name === 'edit' && editingProject ? (
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

        {!storageError && route.name === 'calculator' ? <ShapingCalculator /> : null}
      </main>
    </div>
  );
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function StorageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="grid gap-4 border-red-200 bg-red-50 text-red-900">
      <div>
        <h2 className="text-xl font-bold">Не удалось открыть локальное хранилище</h2>
        <p className="mt-1 text-sm">Возможно, браузер открыл страницу в приватном режиме или локальная база повреждена.</p>
        <p className="mt-2 break-words text-xs text-red-800">{message}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button type="button" onClick={onRetry}>
          Попробовать снова
        </Button>
        <Button type="button" variant="danger" onClick={() => void resetAndReload()}>
          Сбросить локальные данные
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.location.assign('/debug')}>
          Диагностика
        </Button>
      </div>
    </Card>
  );
}

function getInitialRoute(): AppRoute {
  if (window.location.pathname === '/debug') return { name: 'debug' };
  return { name: 'list' };
}
