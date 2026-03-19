import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ActiveUnits from "../components/course/ActiveUnits";
import AwardsGrid from "../components/dashboard/AwardsGrid";
import TeacherFeedbackPanel from "../components/dashboard/TeacherFeedbackPanel";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";
import {
  getCurrentStudent,
  getCourse,
  listUnits,
  listInstructors,
  listAwardsForCourse,
  listFeedbackForCourse,
  getUnitProgress,
  getKnowledgeProgress,
} from "../services/api";
import { GRAY_900, GRAY_500, WHITE, PRIMARY } from "../theme/colors";
import { CourseIcon } from "../theme/courseIcons";
import type { Student, Course, Unit, Instructor, Award, FeedbackItem, UnitProgress } from "../types/domain";

function CoursePageSkeleton() {
  return (
    <>
      {/* Course header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <Skeleton width={48} height={48} borderRadius={8} style={{ flexShrink: 0 }} />
          <Skeleton width={280} height={32} borderRadius={8} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={32} height={32} borderRadius="50%" style={{ flexShrink: 0 }} />
          <Skeleton width={140} height={14} borderRadius={6} />
        </div>
      </div>
      {/* Unit row skeletons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ backgroundColor: WHITE, borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 16 }}>
            <Skeleton width={40} height={40} borderRadius={8} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width="50%" height={16} borderRadius={6} />
              <Skeleton width="80%" height={8} borderRadius={4} />
            </div>
            <Skeleton width={100} height={36} borderRadius={8} style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UnitProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;

      try {
        const studentData = await getCurrentStudent();
        setStudent(studentData);

        const [courseData, unitsData, awardsData, feedbackData] = await Promise.all([
          getCourse(courseId),
          listUnits(courseId),
          listAwardsForCourse(studentData.id, courseId),
          listFeedbackForCourse(courseId),
        ]);

        setCourse(courseData || null);
        setUnits(unitsData);
        setAwards(awardsData);
        setFeedback(feedbackData);

        if (courseData) {
          const ids = (courseData.instructorIds ?? []).filter(Boolean);
          if (ids.length > 0) {
            const instructorsData = await listInstructors(ids);
            setInstructors(instructorsData);
          }
        }

        // Load progress for each unit sequentially to avoid 503 throttling
        // Combine skill progress + knowledge progress into one UnitProgress
        const pMap: Record<string, UnitProgress> = {};
        for (const unit of unitsData) {
          try {
            const [skillProg, knowledgeProg] = await Promise.all([
              getUnitProgress(studentData.id, unit.id),
              getKnowledgeProgress(unit.id, studentData.id).catch(() => null),
            ]);
            const totalObjectives = skillProg.totalObjectives + (knowledgeProg?.totalTopics ?? 0);
            const completedObjectives = skillProg.completedObjectives + (knowledgeProg?.correctCount ?? 0);
            pMap[unit.id] = {
              unitId: unit.id,
              totalObjectives,
              completedObjectives,
              progressPercent: totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0,
            };
          } catch {
            // Skip units whose progress fails to load
          }
        }
        setProgressMap(pMap);
      } catch (error) {
        console.error("Error loading course data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId]);

  const headerStyles: React.CSSProperties = {
    marginBottom: 32,
  };

  const titleRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: GRAY_900,
  };

  const instructorRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const avatarGroupStyles: React.CSSProperties = {
    display: "flex",
  };

  const instructorTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  return (
    <AppShell student={student} activePath="/courses">
      {loading ? (
        <CoursePageSkeleton />
      ) : !course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Course not found.</div>
      ) : student ? (
        <div style={{ animation: "fadeIn 0.3s ease both" }}>
          <header style={headerStyles}>
            <div style={titleRowStyles}>
              <CourseIcon icon={course.icon ?? "general"} size={48} color={PRIMARY} />
              <h1 style={titleStyles}>{course.title}</h1>
            </div>
            <div style={instructorRowStyles}>
              <div style={avatarGroupStyles}>
                {instructors.map((instructor, index) => (
                  <Avatar
                    key={instructor.id}
                    src={instructor.avatarUrl}
                    name={instructor.name}
                    size={32}
                    style={{ marginLeft: index > 0 ? -8 : 0, border: "2px solid white" }}
                  />
                ))}
              </div>
              <span style={instructorTextStyles}>
                {instructors.map((i) => i.name).join(", ")}
              </span>
            </div>
          </header>

          <ActiveUnits
            units={units}
            courseId={course.id}
            progressMap={progressMap}
          />
          <AwardsGrid awards={awards} title="Course Awards" />
          <TeacherFeedbackPanel
            feedbackItems={feedback}
            unitMap={Object.fromEntries(units.map((u) => [u.id, u]))}
            instructorsMap={Object.fromEntries(instructors.map((i) => [i.id, i]))}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
