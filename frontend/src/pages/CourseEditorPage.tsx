import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import ObjectiveRow from "../components/course/ObjectiveRow";
import { GRAY_300, GRAY_500, GRAY_900, PRIMARY } from "../theme/colors";
import type { ObjectiveKind, Course, Unit, Objective, Student } from "../types/domain";
import {
  getCourse,
  listUnits,
  listTeacherObjectives,
  getCurrentInstructor,
  listTeacherCourses,
  updateUnitTitle,
  updateObjectiveEnabled,
} from "../services/api";

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

  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [instructor, setInstructor] = useState<Student | null>(null);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !unitId) return;
    Promise.all([
      getCourse(courseId),
      listUnits(courseId),
      listTeacherObjectives(unitId),
      getCurrentInstructor().then((i) => ({ ...i, yearLabel: "" } as Student)),
      listTeacherCourses(),
    ])
      .then(([c, units, objs, instr, courses]) => {
        setCourse(c);
        setUnit(units.find((u) => u.id === unitId) ?? null);
        setObjectives(objs);
        setInstructor(instr);
        setSidebarCourses(courses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, unitId]);

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({});

  // Sync enabledMap when objectives load
  useEffect(() => {
    const map: Record<string, boolean> = {};
    objectives.forEach((obj) => {
      map[obj.id] = obj.enabled !== false;
    });
    setEnabledMap(map);
  }, [objectives]);

  const [unitTitle, setUnitTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync unitTitle when unit loads
  useEffect(() => {
    if (unit) setUnitTitle(unit.title);
  }, [unit]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleTitleSave = async () => {
    const trimmed = unitTitle.trim();
    if (!trimmed || !unitId) {
      setUnitTitle(unit?.title ?? "");
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    await updateUnitTitle(unitId, trimmed);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setUnitTitle(unit?.title ?? "");
      setIsEditingTitle(false);
    }
  };

  const grouped = useMemo(() => {
    const byKind: Record<ObjectiveKind, Objective[]> = {
      knowledge: [],
      skill: [],
      capstone: [],
    };
    objectives.forEach((obj) => {
      byKind[obj.kind].push(obj);
    });
    for (const kind of SECTION_ORDER) {
      byKind[kind].sort((a, b) => a.order - b.order);
    }
    return byKind;
  }, [objectives]);

  const handleToggle = async (id: string, checked: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [id]: checked }));
    try {
      await updateObjectiveEnabled(id, checked);
    } catch {
      // Revert on failure
      setEnabledMap((prev) => ({ ...prev, [id]: !checked }));
    }
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

  const shellProps = {
    student: instructor ?? { id: "", name: "", yearLabel: "" },
    activePath: "/courses" as const,
    sidebarCourses,
    routePrefix: "/teacher" as const,
  };

  if (loading) {
    return (
      <AppShell {...shellProps}>
        <p style={{ fontSize: 14, color: GRAY_500 }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell {...shellProps}>
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

          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              style={{
                ...titleStyles,
                border: `2px solid ${PRIMARY}`,
                borderRadius: 8,
                padding: "4px 10px",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                background: "white",
                fontFamily: "inherit",
              }}
              autoFocus
            />
          ) : (
            <h1
              style={{
                ...titleStyles,
                cursor: "text",
                borderRadius: 8,
                padding: "4px 10px",
                marginLeft: -10,
                border: `2px solid transparent`,
                transition: "border-color 0.15s",
              }}
              onClick={handleTitleClick}
              title="Click to edit unit name"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = GRAY_300;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              }}
            >
              {unitTitle}
            </h1>
          )}

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
