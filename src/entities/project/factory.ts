import type { Project } from './types';
import { emptyGauge, emptyMeasurements } from './types';
import { nowIso } from '../../shared/utils/date';

export function createEmptyProject(): Project {
  const now = nowIso();

  return {
    id: crypto.randomUUID(),
    ownerId: null,
    title: 'Новый базовый свитер',
    garmentType: 'basic_sweater_bottom_up',
    gauge: emptyGauge,
    measurements: emptyMeasurements,
    notes: '',
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    ownerId: project.ownerId ?? null,
    gauge: {
      ...emptyGauge,
      ...project.gauge,
    },
    measurements: {
      ...emptyMeasurements,
      ...project.measurements,
    },
    version: project.version || 1,
  };
}
