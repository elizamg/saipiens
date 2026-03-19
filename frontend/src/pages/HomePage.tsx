import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import ProgressStats from "../components/dashboard/ProgressStats";
import ContinueLearning from "../components/dashboard/ContinueLearning";
import EnrolledCourses from "../components/dashboard/EnrolledCourses";
import AwardsGrid from "../components/dashboard/AwardsGrid";
import TeacherFeedbackPanel from "../components/dashboard/TeacherFeedbackPanel";
import SkeletonBanner from "../components/ui/SkeletonBanner";
import SkeletonCourseCard from "../components/ui/SkeletonCourseCard";
import Skeleton from "../components/ui/Skeleton";
import {
  getCurrentStudent,
  listCoursesForStudent,
  listInstructors,
  listAwards,
  listFeedback,
  listUnits,
  getUnitProgress,
  getKnowledgeProgress,
  listChatThreadsForUnit,
} from "../services/api";
import type {
  Student, Course, Instructor, Award, FeedbackItem, Unit, UnitProgress, ThreadWithProgress,
} from "../types/domain";

function HomePageSkeleton() {
  return (
    <>
      <SkeletonBanner />
      <section style={{ marginBottom: 32 }}>
        <Skeleton width={140} height={20} borderRadius={6} style={{ marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          <SkeletonCourseCard />
          <SkeletonCourseCard />
          <SkeletonCourseCard />
        </div>
      </section>
    </>
  );
}

export interface CourseProgress {
  completed: number;
  total: number;
  percent: number;
}

export default function HomePage() {
  const location = useLocation();
  const activePath = location.pathname === "/courses" ? "/courses" : "/home";
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesMap, setCoursesMap] = useState<Record<string, Course>>({});
  const [instructorsMap, setInstructorsMap] = useState<Record<string, Instructor>>({});
  const [unitMap, setUnitMap] = useState<Record<string, Unit>>({});
  const [awards, setAwards] = useState<Award[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [progressStats, setProgressStats] = useState<{
    skillsMastered: number; knowledgeCorrect: number; unitsCompleted: number; totalUnits: number; streakDays: number;
  } | null>(null);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, CourseProgress>>({});
  const [continueUnit, setContinueUnit] = useState<{
    unit: Unit; course: Course; progress: UnitProgress;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const studentData = await getCurrentStudent();
        setStudent(studentData);

        const [coursesData, awardsData, feedbackData] = await Promise.all([
          listCoursesForStudent(studentData.id),
          listAwards(studentData.id),
          listFeedback(studentData.id),
        ]);

        setCourses(coursesData);
        setAwards(awardsData);
        setFeedback(feedbackData);

        // Build courses map
        const cMap: Record<string, Course> = {};
        coursesData.forEach((c) => {
          cMap[c.id] = c;
        });
        setCoursesMap(cMap);

        // Get all instructor IDs from courses
        const instructorIds = [...new Set(
          coursesData.flatMap((c) => c.instructorIds ?? []).filter(Boolean)
        )];
        const instructorsData = instructorIds.length > 0
          ? await listInstructors(instructorIds)
          : [];
        const iMap: Record<string, Instructor> = {};
        instructorsData.forEach((i) => {
          iMap[i.id] = i;
        });
        setInstructorsMap(iMap);

        // Load units for all courses
        const unitsByCourse = await Promise.all(
          coursesData.map((c) => listUnits(c.id))
        );
        const uMap: Record<string, Unit> = {};
        const allUnits: Unit[] = [];
        unitsByCourse.flat().forEach((u) => {
          uMap[u.id] = u;
          allUnits.push(u);
        });
        setUnitMap(uMap);

        // Load progress for all units (sequential to avoid 503 throttling)
        let totalSkills = 0;
        let totalKnowledge = 0;
        let unitsCompleted = 0;
        const cpMap: Record<string, { completed: number; total: number }> = {};
        const unitProgressMap: Record<string, UnitProgress> = {};

        for (const unit of allUnits) {
          try {
            const [skillProg, knowledgeProg] = await Promise.all([
              getUnitProgress(studentData.id, unit.id),
              getKnowledgeProgress(unit.id, studentData.id).catch(() => null),
            ]);
            const completed = skillProg.completedObjectives + (knowledgeProg?.correctCount ?? 0);
            const total = skillProg.totalObjectives + (knowledgeProg?.totalTopics ?? 0);
            totalSkills += skillProg.completedObjectives;
            totalKnowledge += knowledgeProg?.correctCount ?? 0;

            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            if (pct === 100) unitsCompleted++;

            unitProgressMap[unit.id] = {
              unitId: unit.id,
              totalObjectives: total,
              completedObjectives: completed,
              progressPercent: pct,
            };

            if (!cpMap[unit.courseId]) cpMap[unit.courseId] = { completed: 0, total: 0 };
            cpMap[unit.courseId].completed += completed;
            cpMap[unit.courseId].total += total;
          } catch {
            // Skip units whose progress fails
          }
        }

        // streakDays will be set after thread loop; use a placeholder now
        setProgressStats({
          skillsMastered: totalSkills,
          knowledgeCorrect: totalKnowledge,
          unitsCompleted,
          totalUnits: allUnits.length,
          streakDays: 0, // updated after thread loop
        });

        const cpResult: Record<string, CourseProgress> = {};
        for (const [cid, { completed, total }] of Object.entries(cpMap)) {
          cpResult[cid] = {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        }
        setCourseProgressMap(cpResult);

        // Find the most recently active unit for "Continue Learning" + collect activity dates for streak
        let latestThread: ThreadWithProgress | null = null;
        let latestUnit: Unit | null = null;
        const activityDates = new Set<string>();
        for (const unit of allUnits) {
          if (unit.status !== "active") continue;
          try {
            const threads = await listChatThreadsForUnit({
              courseId: unit.courseId,
              unitId: unit.id,
              studentId: studentData.id,
            });
            for (const t of threads) {
              if (t.lastMessageAt) {
                activityDates.add(new Date(t.lastMessageAt).toDateString());
                if (!latestThread || t.lastMessageAt > latestThread.lastMessageAt) {
                  latestThread = t;
                  latestUnit = unit;
                }
              }
            }
          } catch {
            // Skip
          }
        }

        // Calculate streak: count consecutive days backwards from today
        let streakDays = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (activityDates.has(d.toDateString())) {
            streakDays++;
          } else if (i > 0) {
            break; // streak broken (skip today if no activity yet)
          }
        }
        // Update streak in progress stats now that we have thread data
        setProgressStats((prev) => prev ? { ...prev, streakDays } : null);

        if (latestUnit && latestThread) {
          setContinueUnit({
            unit: latestUnit,
            course: cMap[latestUnit.courseId],
            progress: unitProgressMap[latestUnit.id] ?? {
              unitId: latestUnit.id, totalObjectives: 0, completedObjectives: 0, progressPercent: 0,
            },
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <AppShell student={student} activePath={activePath} role="student">
      {loading ? (
        <HomePageSkeleton />
      ) : student ? (
        <div style={{ animation: "fadeIn 0.3s ease both" }}>
          <WelcomeBanner name={student.name} role="student" subtitle={student.yearLabel} />
          {progressStats && (
            <ProgressStats
              skillsMastered={progressStats.skillsMastered}
              knowledgeCorrect={progressStats.knowledgeCorrect}
              unitsCompleted={progressStats.unitsCompleted}
              totalUnits={progressStats.totalUnits}
              streakDays={progressStats.streakDays}
            />
          )}
          {continueUnit && (
            <ContinueLearning
              unit={continueUnit.unit}
              course={continueUnit.course}
              progress={continueUnit.progress}
            />
          )}
          <EnrolledCourses
            courses={courses}
            instructorsMap={instructorsMap}
            courseProgressMap={courseProgressMap}
          />
          <AwardsGrid
            awards={awards}
            coursesMap={coursesMap}
            showCourseName={true}
          />
          <TeacherFeedbackPanel
            feedbackItems={feedback}
            unitMap={unitMap}
            instructorsMap={instructorsMap}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
