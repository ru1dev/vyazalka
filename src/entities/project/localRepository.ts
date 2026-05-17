import Dexie, { type Table } from 'dexie';
import type { Project } from './types';
import type { ProjectRepository } from './repository';

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
    const projects = await this.db.projects
      .filter((project) => (ownerId ? project.ownerId === ownerId : true))
      .toArray();

    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Project | undefined> {
    return this.db.projects.get(id);
  }

  async save(project: Project): Promise<Project> {
    await this.db.projects.put(project);
    return project;
  }

  async delete(id: string): Promise<void> {
    await this.db.projects.delete(id);
  }

  async import(project: Project): Promise<Project> {
    await this.db.projects.put(project);
    return project;
  }

  async clearForTests(): Promise<void> {
    await this.db.projects.clear();
  }
}

export const projectRepository = new LocalProjectRepository();
