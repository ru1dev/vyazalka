import type { Project } from './types';
import { defaultConstructionSettings, emptyGauge, emptyMeasurements } from './types';
import { createId } from '../../shared/utils/createId';
import { nowIso } from '../../shared/utils/date';

export function createEmptyProject(): Project {
  const now = nowIso();

  return {
    id: createId(),
    ownerId: null,
    title: 'Новый базовый свитер',
    garmentType: 'basic_sweater_bottom_up',
    gauge: emptyGauge,
    measurements: emptyMeasurements,
    construction: defaultConstructionSettings,
    decorativeZones: [],
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
    construction: {
      ...defaultConstructionSettings,
      ...project.construction,
    },
    decorativeZones: project.decorativeZones ?? [],
    version: project.version || 1,
  };
}
