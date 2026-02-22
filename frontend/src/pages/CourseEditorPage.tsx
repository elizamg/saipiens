import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ObjectiveRow from "../components/course/ObjectiveRow";
import { GRAY_500, GRAY_900 } from "../theme/colors";
import type { ObjectiveKind } from "../types/domain";
import {
  mockInstructor,
  teacherCourses,
  sidebarCourses,
  teacherUnitsMap,
  teacherObjectivesMap,
} from "../data/teacherMockData";

const SECTION_ORDER: ObjectiveKind[] = ["knowledge", "skill", "capstone"];

const SECTION_LABELS: Record<ObjectiveKind, string> = {
  knowledge: "Knowledge",
  skill: "Skills",
  capstone: "Capstone",
};

export default function CourseEditorPage() {
  const { courseId, unitId } = useParams<{
    courseId: string;
    unitId: string;
  }>();

  const course = teacherCourses.find((c) => c.id === courseId);
  const units = courseId ? teacherUnitsMap[courseId] ?? [] : [];
  const unit = units.find((u) => u.id === unitId);
  const objectives = unitId ? teacherObjectivesMap[unitId] ?? [] : [];

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    objectives.forEach((obj) => {
      map[obj.id] = obj.enabled !== false;
    });
    return map;
  });

  const grouped = useMemo(() => {
    const byKind: Record<ObjectiveKind, typeof objectives> = {
      knowledge: [],
      skill: [],
      capstone: [],
    };
    objectives.forEach((obj) => {
      byKind[obj.kind].push(obj);
    });
    // Sort each group by order
    for (const kind of SECTION_ORDER) {
      byKind[kind].sort((a, b) => a.order - b.order);
    }
    return byKind;
  }, [objectives]);

  const handleToggle = (id: string, checked: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [id]: checked }));
  };

  const backLinkStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: GRAY_500,
    textDecoration: "none",
    marginBottom: 24,
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 32,
  };

  const sectionHeadingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_900,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: 28,
  };

  return (
    <AppShell
      student={mockInstructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      {!course || !unit ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
          Unit not found.
        </div>
      ) : (
        <>
          <Link
            to={`/teacher/course/${courseId}`}
            style={backLinkStyles}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to {course.title}
          </Link>

          <h1 style={titleStyles}>{unit.title}</h1>

          {SECTION_ORDER.map((kind) => {
            const items = grouped[kind];
            if (items.length === 0) return null;
            return (
              <section key={kind} style={sectionStyles}>
                <h2 style={sectionHeadingStyles}>{SECTION_LABELS[kind]}</h2>
                {items.map((obj) => (
                  <ObjectiveRow
                    key={obj.id}
                    objective={obj}
                    checked={enabledMap[obj.id] ?? true}
                    onToggle={handleToggle}
                  />
                ))}
              </section>
            );
          })}
        </>
      )}
    </AppShell>
  );
}
