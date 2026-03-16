import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ActiveUnits from "../components/course/ActiveUnits";
import AwardsGrid from "../components/dashboard/AwardsGrid";
import TeacherFeedbackPanel from "../components/dashboard/TeacherFeedbackPanel";
import Avatar from "../components/ui/Avatar";
import TintedImage from "../components/ui/TintedImage";
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
import { GRAY_900, GRAY_500, PRIMARY } from "../theme/colors";
import { courseIconMap } from "../theme/courseIcons";
import type { Student, Course, Unit, Instructor, Award, FeedbackItem, UnitProgress } from "../types/domain";

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

  const iconStyles: React.CSSProperties = {
    width: 48,
    height: 48,
    objectFit: "contain",
  };

  const bookIcon = (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyles}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );

  const courseIconSrc = course?.icon ? courseIconMap[course.icon] : null;

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
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Loading…</div>
      ) : !course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Course not found.</div>
      ) : student ? (
        <>
          <header style={headerStyles}>
            <div style={titleRowStyles}>
              {courseIconSrc ? (
                <TintedImage src={courseIconSrc} color={PRIMARY} width={48} height={48} style={iconStyles} />
              ) : (
                bookIcon
              )}
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
        </>
      ) : null}
    </AppShell>
  );
}
