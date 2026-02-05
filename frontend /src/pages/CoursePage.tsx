import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ActiveUnits from "../components/course/ActiveUnits";
import AwardsGrid from "../components/dashboard/AwardsGrid";
import TeacherFeedbackPanel from "../components/dashboard/TeacherFeedbackPanel";
import Avatar from "../components/ui/Avatar";
import {
  getCurrentStudent,
  getCourse,
  listUnits,
  listInstructors,
  listAwardsForCourse,
  listFeedbackForCourse,
  getUnitProgress,
} from "../services/api";
import { GRAY_900, GRAY_500 } from "../theme/colors";
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
          const instructorsData = await listInstructors(courseData.instructorIds);
          setInstructors(instructorsData);
        }

        // Load progress for each unit
        const progressPromises = unitsData.map((unit) =>
          getUnitProgress(studentData.id, unit.id)
        );
        const progressResults = await Promise.all(progressPromises);
        const pMap: Record<string, UnitProgress> = {};
        progressResults.forEach((p) => {
          pMap[p.unitId] = p;
        });
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
    fontSize: 40,
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
      {!loading && student && course ? (
        <>
          <header style={headerStyles}>
            <div style={titleRowStyles}>
              {course.icon && <span style={iconStyles}>{course.icon}</span>}
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
