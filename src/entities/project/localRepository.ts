import Dexie, { type Table } from 'dexie';
import type { Project } from './types';
import type { ProjectRepository } from './repository';
import { storeLastError } from '../../shared/utils/errorLog';

class VyazalkaDatabase extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super('vyazalka');
    this.version(1).stores({
      projects: 'id, ownerId, updatedAt',
    });
  }
}

export class LocalProjectRepository implements ProjectRepository {
  constructor(private readonly db = new VyazalkaDatabase()) {}

  async list(ownerId: string | null = null): Promise<Project[]> {
    try {
      const projects = await this.db.projects
        .filter((project) => (ownerId ? project.ownerId === ownerId : true))
        .toArray();

      return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } catch (error) {
      storeLastError(error);
      throw new Error('Не удалось прочитать проекты из локального хранилища.');
    }
  }

  async getById(id: string): Promise<Project | undefined> {
    try {
      return await this.db.projects.get(id);
    } catch (error) {
      storeLastError(error);
      throw new Error('Не удалось открыть проект из локального хранилища.');
    }
  }

  async save(project: Project): Promise<Project> {
    try {
      await this.db.projects.put(project);
      return project;
    } catch (error) {
      storeLastError(error);
      throw new Error('Не удалось сохранить проект в локальное хранилище.');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.projects.delete(id);
    } catch (error) {
      storeLastError(error);
      throw new Error('Не удалось удалить проект из локального хранилища.');
    }
  }

  async import(project: Project): Promise<Project> {
    try {
      await this.db.projects.put(project);
      return project;
    } catch (error) {
      storeLastError(error);
      throw new Error('Не удалось импортировать проект в локальное хранилище.');
    }
  }

  async clearForTests(): Promise<void> {
    await this.db.projects.clear();
  }
}

export const projectRepository = new LocalProjectRepository();
