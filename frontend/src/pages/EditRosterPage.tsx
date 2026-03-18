import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import BackButton from "../components/ui/BackButton";
import StudentRosterEditor from "../components/course/StudentRosterEditor";
import { GRAY_500, GRAY_900 } from "../theme/colors";
import type { Student } from "../types/domain";
import {
  listTeacherStudents,
  getCourseRoster,
  updateCourseRoster,
  createNewStudent,
  getCurrentInstructor,
  listTeacherCourses,
} from "../services/api";

export default function EditRosterPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState<{ id: string; name: string } | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    Promise.all([
      getCurrentInstructor(),
      listTeacherStudents(),
      getCourseRoster(courseId),
      listTeacherCourses(),
    ])
      .then(([instr, students, rosterIds, courses]) => {
        setInstructor(instr);
        setAllStudents(students);
        setSelectedIds(rosterIds);
        const course = courses.find((c) => c.id === courseId);
        if (course) setCourseTitle(course.title);
      })
      .catch(() => setError("Failed to load roster data."))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleAddStudent = async (student: Student) => {
    // Optimistically add to the list; createNewStudent already persisted it.
    setAllStudents((prev) => [...prev, student]);
    setSelectedIds((prev) => [...prev, student.id]);
  };

  const handleSave = async () => {
    if (!courseId) return;
    setSaving(true);
    setError(null);
    try {
      await updateCourseRoster(courseId, selectedIds);
      navigate(`/teacher/course/${courseId}`);
    } catch {
      setError("Failed to save roster. Please try again.");
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <AppShell
        student={instructor ? { ...instructor, yearLabel: "" } : { id: "", name: "", yearLabel: "" }}
        activePath="/courses"
        sidebarCourses={[]}
        routePrefix="/teacher"
      >
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Loading roster…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      student={instructor ? { ...instructor, yearLabel: "" } : { id: "", name: "", yearLabel: "" }}
      activePath="/courses"
      sidebarCourses={[]}
      routePrefix="/teacher"
    >
      <BackButton onClick={() => navigate(`/teacher/course/${courseId}`)} style={{ marginBottom: 16 }} />

      <h1 style={titleStyles}>
        Edit Roster{courseTitle ? ` — ${courseTitle}` : ""}
      </h1>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 14, marginBottom: 16 }}>{error}</p>
      )}

      <div style={sectionStyles}>
        <StudentRosterEditor
          allStudents={allStudents}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onAddStudent={handleAddStudent}
          createStudent={createNewStudent}
        />
      </div>

      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </AppShell>
  );
}
