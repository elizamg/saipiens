import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import IconChooser from "../components/course/IconChooser";
import StudentRosterEditor from "../components/course/StudentRosterEditor";
import { GRAY_500, GRAY_900 } from "../theme/colors";
import type { Student } from "../types/domain";
import {
  mockInstructor,
  teacherCourses,
  sidebarCourses,
  teacherStudents,
  courseRosterMap,
  teacherUnitsMap,
} from "../data/teacherMockData";

export default function CourseCreationPage() {
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("general");
  const [allStudents, setAllStudents] = useState<Student[]>([...teacherStudents]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleAddStudent = (student: Student) => {
    setAllStudents((prev) => [...prev, student]);
  };

  const handleCreate = () => {
    const newId = `course-${Date.now()}`;
    teacherCourses.push({
      id: newId,
      title: courseName,
      studentCount: selectedStudentIds.length,
      icon: selectedIcon,
    });
    sidebarCourses.push({
      id: newId,
      title: courseName,
      icon: selectedIcon,
      instructorIds: [mockInstructor.id],
      enrolledStudentIds: [],
    });
    courseRosterMap[newId] = [...selectedStudentIds];
    teacherUnitsMap[newId] = [];
    navigate(`/teacher/course/${newId}`);
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
      student={mockInstructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      <div
        style={backLinkStyles}
        onClick={() => navigate("/teacher")}
        role="link"
        tabIndex={0}
      >
        &larr; Back
      </div>

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

      <Button
        variant="primary"
        onClick={handleCreate}
        disabled={!courseName.trim()}
      >
        Create Course
      </Button>
    </AppShell>
  );
}
