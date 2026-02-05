import type {
  Objective,
  StudentObjectiveProgress,
  UnitProgress,
  EarnedStars,
} from "../types/domain";

/**
 * Check if an objective is completed (earnedStars === 3)
 */
export function isObjectiveCompleted(earnedStars: EarnedStars): boolean {
  return earnedStars === 3;
}

/**
 * Compute unit progress from objectives and student progress
 */
export function computeUnitProgress(
  unitId: string,
  objectives: Objective[],
  progressMap: Record<string, StudentObjectiveProgress>
): UnitProgress {
  const unitObjectives = objectives.filter((obj) => obj.unitId === unitId);
  const totalObjectives = unitObjectives.length;

  if (totalObjectives === 0) {
    return {
      unitId,
      totalObjectives: 0,
      completedObjectives: 0,
      progressPercent: 0,
    };
  }

  const completedObjectives = unitObjectives.filter((obj) => {
    const progress = progressMap[obj.id];
    return progress && isObjectiveCompleted(progress.earnedStars);
  }).length;

  const progressPercent = Math.round((completedObjectives / totalObjectives) * 100);

  return {
    unitId,
    totalObjectives,
    completedObjectives,
    progressPercent,
  };
}

/**
 * Check if a unit is fully completed
 */
export function isUnitCompleted(progress: UnitProgress): boolean {
  return progress.totalObjectives > 0 && progress.completedObjectives === progress.totalObjectives;
}

/**
 * Build a map of objectiveId -> StudentObjectiveProgress
 */
export function buildProgressMap(
  progressList: StudentObjectiveProgress[]
): Record<string, StudentObjectiveProgress> {
  const map: Record<string, StudentObjectiveProgress> = {};
  progressList.forEach((p) => {
    map[p.objectiveId] = p;
  });
  return map;
}

/**
 * Get earned stars for an objective, defaulting to 0
 */
export function getEarnedStars(
  objectiveId: string,
  progressMap: Record<string, StudentObjectiveProgress>
): EarnedStars {
  return progressMap[objectiveId]?.earnedStars ?? 0;
}
