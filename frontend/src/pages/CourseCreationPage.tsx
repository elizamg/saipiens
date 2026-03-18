import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import BackButton from "../components/ui/BackButton";
import IconChooser from "../components/course/IconChooser";
import StudentRosterEditor from "../components/course/StudentRosterEditor";
import { GRAY_500, GRAY_900 } from "../theme/colors";
import type { Student } from "../types/domain";
import { createCourse, listTeacherStudents, getCurrentInstructor, listTeacherCourses } from "../services/api";
import type { Course } from "../types/domain";

export default function CourseCreationPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("general");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [instructor, setInstructor] = useState<Student | null>(null);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTeacherStudents().then(setAllStudents).catch(() => {});
    getCurrentInstructor().then((i) => setInstructor({ ...i, yearLabel: "" })).catch(() => {});
    listTeacherCourses().then(setSidebarCourses).catch(() => {});
  }, []);

  const handleAddStudent = (student: Student) => {
    setAllStudents((prev) => [...prev, student]);
  };

  const handleCreate = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCourse({
        title: courseName.trim(),
        icon: selectedIcon,
        studentIds: selectedStudentIds,
        subject: courseName.trim(),
        gradeLevel: gradeLevel.trim() || undefined,
      });
      navigate(`/teacher/course/${result.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create course.");
    } finally {
      setSubmitting(false);
    }
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

  const labelStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: GRAY_900,
    marginBottom: 8,
    display: "block",
  };

  return (
    <AppShell
      student={instructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      <BackButton onClick={() => navigate("/teacher")} style={{ marginBottom: 16 }} />

      <h1 style={titleStyles}>Create New Course</h1>

      <div style={sectionStyles}>
        <Input
          label="Course Name"
          placeholder="e.g. American History"
          value={courseName}
          onChange={setCourseName}
        />
      </div>

      <div style={sectionStyles}>
        <Input
          label="Grade Level"
          placeholder="e.g. 7, 10, College"
          value={gradeLevel}
          onChange={setGradeLevel}
        />
      </div>

      <div style={sectionStyles}>
        <span style={labelStyles}>Course Icon</span>
        <IconChooser selected={selectedIcon} onChange={setSelectedIcon} />
      </div>

      <div style={sectionStyles}>
        <span style={labelStyles}>Student Roster</span>
        <StudentRosterEditor
          allStudents={allStudents}
          selectedIds={selectedStudentIds}
          onSelectionChange={setSelectedStudentIds}
          onAddStudent={handleAddStudent}
        />
      </div>

      {error && (
        <p style={{ color: "red", fontSize: 13, margin: "0 0 12px 0" }}>{error}</p>
      )}

      <Button
        variant="primary"
        onClick={handleCreate}
        disabled={!courseName.trim() || submitting}
      >
        {submitting ? "Creating…" : "Create Course"}
      </Button>
    </AppShell>
  );
}
