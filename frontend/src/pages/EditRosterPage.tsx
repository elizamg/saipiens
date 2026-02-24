import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import StudentRosterEditor from "../components/course/StudentRosterEditor";
import { GRAY_500, GRAY_900 } from "../theme/colors";
import type { Student } from "../types/domain";
import {
  mockInstructor,
  teacherCourses,
  sidebarCourses,
  teacherStudents,
  courseRosterMap,
} from "../data/teacherMockData";

export default function EditRosterPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const course = teacherCourses.find((c) => c.id === courseId);
  const initialIds = courseId ? courseRosterMap[courseId] ?? [] : [];

  const [allStudents, setAllStudents] = useState<Student[]>([...teacherStudents]);
  const [selectedIds, setSelectedIds] = useState<string[]>([...initialIds]);

  const handleAddStudent = (student: Student) => {
    setAllStudents((prev) => [...prev, student]);
  };

  const handleSave = () => {
    if (!courseId) return;
    courseRosterMap[courseId] = [...selectedIds];
    const tc = teacherCourses.find((c) => c.id === courseId);
    if (tc) {
      tc.studentCount = selectedIds.length;
    }
    navigate(`/teacher/course/${courseId}`);
  };

  const backLinkStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
    textDecoration: "none",
    cursor: "pointer",
    marginBottom: 8,
    display: "inline-block",
  };

  const titleStyles: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    margin: "0 0 24px 0",
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: 24,
  };

  return (
    <AppShell
      student={mockInstructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      {!course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Course not found.</div>
      ) : (
        <>
          <div
            style={backLinkStyles}
            onClick={() => navigate(`/teacher/course/${courseId}`)}
            role="link"
            tabIndex={0}
          >
            &larr; Back
          </div>

          <h1 style={titleStyles}>Edit Roster &mdash; {course.title}</h1>

          <div style={sectionStyles}>
            <StudentRosterEditor
              allStudents={allStudents}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onAddStudent={handleAddStudent}
            />
          </div>

          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </>
      )}
    </AppShell>
  );
}
