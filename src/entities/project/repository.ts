import type { Project } from './types';

export interface ProjectRepository {
  list(ownerId?: string | null): Promise<Project[]>;
  getById(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
  import(project: Project): Promise<Project>;
}
