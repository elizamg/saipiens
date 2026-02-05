import {
  students,
  instructors,
  courses,
  units,
  awards,
  feedbackItems,
  objectives,
  questions,
  studentObjectiveProgress,
  chatThreads,
  chatMessages,
  studentAwards,
} from "../mock/db";
import type {
  Student,
  Instructor,
  Course,
  Unit,
  Award,
  FeedbackItem,
  Objective,
  Question,
  StudentObjectiveProgress,
  ChatThread,
  ChatMessage,
  ThreadWithProgress,
  UnitProgress,
} from "../types/domain";
import { computeUnitProgress, buildProgressMap, getEarnedStars } from "../utils/progress";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ STUDENT ============

export async function getCurrentStudent(): Promise<Student> {
  await delay(50);
  const student = students[0];
  if (!student) {
    throw new Error("No student found");
  }
  return student;
}

// ============ COURSES ============

export async function listCoursesForStudent(studentId: string): Promise<Course[]> {
  await delay(50);
  return courses.filter((course) =>
    course.enrolledStudentIds.includes(studentId)
  );
}

export async function getCourse(courseId: string): Promise<Course | undefined> {
  await delay(50);
  return courses.find((course) => course.id === courseId);
}

// ============ INSTRUCTORS ============

export async function listInstructors(ids: string[]): Promise<Instructor[]> {
  await delay(50);
  return instructors.filter((instructor) => ids.includes(instructor.id));
}

// ============ UNITS ============

export async function listUnits(courseId: string): Promise<Unit[]> {
  await delay(50);
  return units.filter((unit) => unit.courseId === courseId);
}

export async function getUnit(unitId: string): Promise<Unit | undefined> {
  await delay(50);
  return units.find((unit) => unit.id === unitId);
}

// ============ OBJECTIVES ============

export async function listObjectives(unitId: string): Promise<Objective[]> {
  await delay(50);
  return objectives.filter((obj) => obj.unitId === unitId);
}

export async function getObjective(objectiveId: string): Promise<Objective | undefined> {
  await delay(50);
  return objectives.find((obj) => obj.id === objectiveId);
}

// ============ QUESTIONS ============

export async function listQuestionsForObjective(objectiveId: string): Promise<Question[]> {
  await delay(50);
  return questions.filter((q) => q.objectiveId === objectiveId);
}

export async function getQuestion(questionId: string): Promise<Question | undefined> {
  await delay(50);
  return questions.find((q) => q.id === questionId);
}

// ============ STUDENT PROGRESS ============

export async function getStudentObjectiveProgress(
  studentId: string,
  objectiveId: string
): Promise<StudentObjectiveProgress | undefined> {
  await delay(50);
  return studentObjectiveProgress.find(
    (p) => p.studentId === studentId && p.objectiveId === objectiveId
  );
}

export async function listStudentProgressForUnit(
  studentId: string,
  unitId: string
): Promise<StudentObjectiveProgress[]> {
  await delay(50);
  const unitObjectiveIds = objectives
    .filter((obj) => obj.unitId === unitId)
    .map((obj) => obj.id);
  return studentObjectiveProgress.filter(
    (p) => p.studentId === studentId && unitObjectiveIds.includes(p.objectiveId)
  );
}

export async function getUnitProgress(
  studentId: string,
  unitId: string
): Promise<UnitProgress> {
  await delay(50);
  const unitObjectives = objectives.filter((obj) => obj.unitId === unitId);
  const progressList = studentObjectiveProgress.filter(
    (p) => p.studentId === studentId && unitObjectives.some((obj) => obj.id === p.objectiveId)
  );
  const progressMap = buildProgressMap(progressList);
  return computeUnitProgress(unitId, unitObjectives, progressMap);
}

// ============ AWARDS ============

export async function listAwards(studentId: string): Promise<Award[]> {
  await delay(50);
  const awardIds = studentAwards[studentId] ?? [];
  return awards.filter((award) => awardIds.includes(award.id));
}

export async function listAwardsForCourse(studentId: string, courseId: string): Promise<Award[]> {
  await delay(50);
  const awardIds = studentAwards[studentId] ?? [];
  return awards.filter((award) => awardIds.includes(award.id) && award.courseId === courseId);
}

// ============ FEEDBACK ============

export async function listFeedback(studentId: string): Promise<FeedbackItem[]> {
  await delay(50);
  const studentCourses = courses.filter((course) =>
    course.enrolledStudentIds.includes(studentId)
  );
  const courseIds = studentCourses.map((c) => c.id);
  return feedbackItems.filter((fb) => courseIds.includes(fb.courseId));
}

export async function listFeedbackForCourse(courseId: string): Promise<FeedbackItem[]> {
  await delay(50);
  return feedbackItems.filter((fb) => fb.courseId === courseId);
}

// ============ CHAT THREADS ============

export async function listChatThreadsForUnit(params: {
  courseId: string;
  unitId: string;
  studentId: string;
}): Promise<ThreadWithProgress[]> {
  await delay(50);
  const unitThreads = chatThreads.filter(
    (thread) => thread.courseId === params.courseId && thread.unitId === params.unitId
  );

  // Get progress for each thread's objective
  const progressList = studentObjectiveProgress.filter(
    (p) => p.studentId === params.studentId
  );
  const progressMap = buildProgressMap(progressList);

  // Build question map for difficulty stars
  const questionMap: Record<string, Question> = {};
  questions.forEach((q) => {
    questionMap[q.id] = q;
  });

  return unitThreads.map((thread) => {
    const progress = progressMap[thread.objectiveId];
    const currentQuestionId = progress?.currentQuestionId || "";
    const currentQuestion = questionMap[currentQuestionId];

    return {
      ...thread,
      earnedStars: getEarnedStars(thread.objectiveId, progressMap),
      currentDifficultyStars: currentQuestion?.difficultyStars ?? 1,
      currentQuestionId,
    };
  });
}

export async function getThread(threadId: string): Promise<ChatThread | undefined> {
  await delay(50);
  return chatThreads.find((thread) => thread.id === threadId);
}

export async function getThreadWithProgress(
  threadId: string,
  studentId: string
): Promise<ThreadWithProgress | undefined> {
  await delay(50);
  const thread = chatThreads.find((t) => t.id === threadId);
  if (!thread) return undefined;

  const progress = studentObjectiveProgress.find(
    (p) => p.studentId === studentId && p.objectiveId === thread.objectiveId
  );

  const currentQuestionId = progress?.currentQuestionId || "";
  const currentQuestion = questions.find((q) => q.id === currentQuestionId);

  return {
    ...thread,
    earnedStars: progress?.earnedStars ?? 0,
    currentDifficultyStars: currentQuestion?.difficultyStars ?? 1,
    currentQuestionId,
  };
}

// ============ CHAT MESSAGES ============

export async function listMessages(threadId: string): Promise<ChatMessage[]> {
  await delay(50);
  return chatMessages
    .filter((msg) => msg.threadId === threadId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendMessage(
  threadId: string,
  content: string
): Promise<ChatMessage> {
  await delay(100);
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    threadId,
    role: "student",
    content,
    createdAt: new Date().toISOString(),
  };
  chatMessages.push(newMessage);
  return newMessage;
}
