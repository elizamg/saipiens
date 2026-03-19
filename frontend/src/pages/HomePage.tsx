import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import EnrolledCourses from "../components/dashboard/EnrolledCourses";
import AwardsGrid from "../components/dashboard/AwardsGrid";
import TeacherFeedbackPanel from "../components/dashboard/TeacherFeedbackPanel";
import {
  getCurrentStudent,
  listCoursesForStudent,
  listInstructors,
  listAwards,
  listFeedback,
  listUnits,
} from "../services/api";
import type { Student, Course, Instructor, Award, FeedbackItem, Unit } from "../types/domain";

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

        // Get all instructor IDs from courses (filter out null/undefined to avoid DynamoDB errors)
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

        // Load units for all courses (for feedback unit titles)
        const unitsByCourse = await Promise.all(
          coursesData.map((c) => listUnits(c.id))
        );
        const uMap: Record<string, Unit> = {};
        unitsByCourse.flat().forEach((u) => {
          uMap[u.id] = u;
        });
        setUnitMap(uMap);
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
      {!loading && student ? (
        <>
          <WelcomeBanner name={student.name} role="student" subtitle={student.yearLabel} />
          <EnrolledCourses courses={courses} instructorsMap={instructorsMap} />
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
        </>
      ) : null}
    </AppShell>
  );
}
