import { describe, expect, it } from 'vitest';
import { LocalProjectRepository } from './localRepository';
import type { Project } from './types';

const project: Project = {
  id: 'repo-test-project',
  ownerId: null,
  title: 'Repo test',
  garmentType: 'basic_sweater_bottom_up',
  gauge: { stitchesPer10cm: 22, rowsPer10cm: 30 },
  measurements: {
    bustCm: 96,
    easeCm: 8,
    bodyLengthCm: 58,
    armholeDepthCm: 20,
    armholeDecreaseStitchesPerSide: 8,
    shoulderWidthCm: 12,
    neckWidthCm: 18,
    frontNeckDepthCm: 9,
    backNeckWidthCm: 16,
    backNeckDepthCm: 3,
    sleeveLengthCm: 40,
    wristCircumferenceCm: 22,
    upperArmCircumferenceCm: 37,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  version: 1,
};

describe('LocalProjectRepository', () => {
  it('saves and loads a project', async () => {
    const repository = new LocalProjectRepository();
    await repository.clearForTests();

    await repository.save(project);

    await expect(repository.getById(project.id)).resolves.toEqual(project);
    await expect(repository.list()).resolves.toEqual([project]);
  });
});
