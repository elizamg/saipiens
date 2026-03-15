import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ActiveUnits from "../components/course/ActiveUnits";
import NewUnitCard from "../components/course/NewUnitCard";
import Button from "../components/ui/Button";
import { GRAY_900, GRAY_500, PRIMARY } from "../theme/colors";
import {
  getCourse,
  listUnits,
  getCourseRoster,
  getCurrentInstructor,
  listTeacherCourses,
  updateCourseTitle,
  deleteCourse,
} from "../services/api";
import type { Course, Unit, Student } from "../types/domain";

export default function TeacherCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [instructor, setInstructor] = useState<Student | null>(null);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getCourse(courseId),
      listUnits(courseId),
      getCourseRoster(courseId).catch(() => [] as string[]),
      getCurrentInstructor().then((i) => ({ ...i, yearLabel: "" } as Student)),
      listTeacherCourses(),
    ])
      .then(([c, u, roster, instr, courses]) => {
        setCourse(c);
        setUnits(u);
        setStudentCount(roster.length);
        setInstructor(instr);
        setSidebarCourses(courses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 32,
    fontWeight: 700,
    color: GRAY_900,
  };

  const infoRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const infoTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const bookIcon = (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke={PRIMARY}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={iconStyles}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );

  if (loading) {
    return (
      <AppShell
        student={instructor ?? { id: "", name: "", yearLabel: "" }}
        activePath="/courses"
        sidebarCourses={sidebarCourses}
        routePrefix="/teacher"
      >
        <p style={{ fontSize: 14, color: GRAY_500 }}>Loading course…</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      student={instructor ?? { id: "", name: "", yearLabel: "" }}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      {!course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>Course not found.</div>
      ) : (
        <>
          <header style={headerStyles}>
            <div style={titleRowStyles}>
              {bookIcon}
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={async () => {
                    const trimmed = titleDraft.trim();
                    if (trimmed && trimmed !== course.title && courseId) {
                      const updated = await updateCourseTitle(courseId, trimmed);
                      setCourse(updated);
                    }
                    setEditingTitle(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  style={{ ...titleStyles, border: "none", outline: "none", background: "transparent", width: "100%" }}
                />
              ) : (
                <h1
                  style={{ ...titleStyles, cursor: "pointer" }}
                  onClick={() => { setTitleDraft(course.title); setEditingTitle(true); }}
                  title="Click to edit"
                >
                  {course.title}
                </h1>
              )}
            </div>
            <div style={infoRowStyles}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={GRAY_500}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span style={infoTextStyles}>
                {studentCount} student{studentCount !== 1 ? "s" : ""} enrolled
              </span>
              <Button
                variant="secondary"
                onClick={() => navigate(`/teacher/course/${courseId}/roster`)}
                style={{ padding: "4px 12px", fontSize: 13, marginLeft: 8 }}
              >
                Edit Roster
              </Button>
              {showDeleteConfirm ? (
                <>
                  <span style={{ fontSize: 13, marginLeft: 8 }}>Delete this course?</span>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!courseId) return;
                      await deleteCourse(courseId);
                      navigate("/teacher");
                    }}
                    style={{ padding: "4px 12px", fontSize: 13, marginLeft: 4 }}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ padding: "4px 12px", fontSize: 13, marginLeft: 4 }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{ padding: "4px 12px", fontSize: 13, marginLeft: 8 }}
                >
                  Delete Course
                </Button>
              )}
            </div>
          </header>

          <ActiveUnits units={units} courseId={course.id} routePrefix="/teacher" />
          <NewUnitCard courseId={course.id} />
        </>
      )}
    </AppShell>
  );
}
