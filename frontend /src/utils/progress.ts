import type {
  Objective,
  StudentObjectiveProgress,
  UnitProgress,
  ProgressState,
  StageType,
} from "../types/domain";

/**
 * Check if an objective is completed (challenge_complete)
 */
export function isObjectiveCompleted(progressState: ProgressState): boolean {
  return progressState === "challenge_complete";
}

/**
 * Check if a specific stage is completed based on progress state.
 * begin: completed when progressState is not "not_started"
 * walkthrough: completed when progressState is "walkthrough_complete", "challenge_started", or "challenge_complete"
 * challenge: completed when progressState is "challenge_complete"
 */
export function isStageCompleted(stageType: StageType, progressState: ProgressState): boolean {
  switch (stageType) {
    case "begin":
      return progressState !== "not_started";
    case "walkthrough":
      return progressState === "walkthrough_complete"
        || progressState === "challenge_started"
        || progressState === "challenge_complete";
    case "challenge":
      return progressState === "challenge_complete";
  }
}

/**
 * Get the progress state after completing a given stage type.
 */
export function stageTypeToProgressState(stageType: StageType): ProgressState {
  switch (stageType) {
    case "begin":
      return "walkthrough_started";
    case "walkthrough":
      return "walkthrough_complete";
    case "challenge":
      return "challenge_complete";
  }
}

/**
 * Get the next stage type after the given one, or null if challenge (last stage).
 */
export function nextStageType(stageType: StageType): StageType | null {
  switch (stageType) {
    case "begin":
      return "walkthrough";
    case "walkthrough":
      return "challenge";
    case "challenge":
      return null;
  }
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
    return progress && isObjectiveCompleted(progress.progressState);
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
 * Get progress state for an objective, defaulting to "not_started"
 */
export function getProgressState(
  objectiveId: string,
  progressMap: Record<string, StudentObjectiveProgress>
): ProgressState {
  return progressMap[objectiveId]?.progressState ?? "not_started";
}

/**
 * Human-readable label for a stage type.
 */
export function stageLabel(stageType: StageType): string {
  switch (stageType) {
    case "begin":
      return "Begin";
    case "walkthrough":
      return "Walkthrough";
    case "challenge":
      return "Challenge";
  }
}
