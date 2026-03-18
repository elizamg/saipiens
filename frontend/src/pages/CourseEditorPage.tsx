import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import BackButton from "../components/ui/BackButton";
import { GRAY_300, GRAY_500, GRAY_900, PRIMARY } from "../theme/colors";
import type { ObjectiveKind, Course, Unit, Objective, Student, KnowledgeTopic } from "../types/domain";
import {
  getCourse,
  listTeacherObjectives,
  getCurrentInstructor,
  listTeacherCourses,
  getUploadStatus,
  updateObjectiveEnabled,
  generateSelectedObjectives,
  getIdentifiedKnowledge,
  getUnit,
  updateUnitDeadline,
  deleteUnit,
  listKnowledgeTopics,
  updateKnowledgeTopicEnabled,
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
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [instructor, setInstructor] = useState<Student | null>(null);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  // Track which objective IDs are enabled (local state for optimistic UI)
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deadline, setDeadline] = useState<string>("");
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Knowledge topics (shown alongside objectives for "ready" units)
  const [knowledgeTopics, setKnowledgeTopics] = useState<KnowledgeTopic[]>([]);
  const [enabledTopicIds, setEnabledTopicIds] = useState<Set<string>>(new Set());

  // For units in "review" status (no objectives yet, only identified knowledge)
  const [identifiedKnowledge, setIdentifiedKnowledge] = useState<
    { type: string; description: string }[]
  >([]);
  const [selectedReviewIndices, setSelectedReviewIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!courseId || !unitId) return;
    Promise.all([
      getCourse(courseId),
      getUnit(unitId),
      listTeacherObjectives(unitId),
      getCurrentInstructor().then((i) => ({ ...i, yearLabel: "" } as Student)),
      listTeacherCourses(),
      getUploadStatus(unitId),
    ])
      .then(async ([c, u, objs, instr, courses, status]) => {
        setCourse(c);
        setUnit(u);
        setObjectives(objs);
        setInstructor(instr);
        setSidebarCourses(courses);

        // Initialize deadline (convert ISO to datetime-local format)
        if (u.deadline) {
          const d = new Date(u.deadline);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDeadline(local);
        }

        // Initialize enabled set from current objective state
        setEnabledIds(new Set(objs.filter((o) => o.enabled !== false).map((o) => o.id)));

        // Use upload-status endpoint for the most accurate status
        const unitStatus = status.status || u.status;
        if (unitStatus === "processing") {
          setGenerating(true);
        }

        // If unit is in review status (identified knowledge but no objectives yet),
        // fetch the identified knowledge to display
        if (unitStatus === "review" && objs.length === 0) {
          try {
            const data = await getIdentifiedKnowledge(unitId);
            setIdentifiedKnowledge(data.identifiedKnowledge);
            setSelectedReviewIndices(new Set(data.identifiedKnowledge.map((_, i) => i)));
            // Allow saving the default selection immediately
            if (data.identifiedKnowledge.length > 0) setDirty(true);
          } catch {
            // no identified knowledge available
          }
        }

        // Fetch knowledge topics for ready units (shown alongside skill objectives)
        if (unitStatus === "ready" || (unitStatus !== "processing" && objs.length > 0)) {
          try {
            const topics = await listKnowledgeTopics(unitId);
            setKnowledgeTopics(topics);
            setEnabledTopicIds(new Set(topics.filter((t) => t.enabled !== false).map((t) => t.id)));
          } catch {
            // no knowledge topics available
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, unitId]);

  // Poll while unit is processing
  useEffect(() => {
    if (!generating || !unitId) return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) break;
        try {
          const result = await getUploadStatus(unitId);
          if (result.status === "ready" || result.status === "error") {
            const objs = await listTeacherObjectives(unitId);
            setObjectives(objs);
            setEnabledIds(new Set(objs.filter((o) => o.enabled !== false).map((o) => o.id)));
            setIdentifiedKnowledge([]);
            setGenerating(false);
            // Fetch knowledge topics for the newly ready unit
            try {
              const topics = await listKnowledgeTopics(unitId);
              setKnowledgeTopics(topics);
              setEnabledTopicIds(new Set(topics.filter((t) => t.enabled !== false).map((t) => t.id)));
            } catch { /* ignore */ }
            return;
          }
        } catch {
          // keep polling
        }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [generating, unitId]);

  const toggleObjective = useCallback((id: string) => {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  }, []);

  const toggleKnowledgeTopic = useCallback((id: string) => {
    setEnabledTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  }, []);

  const toggleReviewItem = useCallback((index: number) => {
    setSelectedReviewIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!unitId || !courseId) return;
    setSaving(true);

    try {
      if (identifiedKnowledge.length > 0 && objectives.length === 0) {
        // Review mode: send selected identified knowledge to generate
        const selected = identifiedKnowledge
          .filter((_, i) => selectedReviewIndices.has(i))
          .map((k) => ({ type: k.type, description: k.description }));
        if (selected.length > 0) {
          await generateSelectedObjectives(unitId, selected);
          setGenerating(true);
        }
      } else {
        // Edit mode: update enabled state for each changed objective
        const objUpdates = objectives
          .filter((obj) => (obj.enabled !== false) !== enabledIds.has(obj.id))
          .map((obj) => updateObjectiveEnabled(obj.id, enabledIds.has(obj.id)));
        // Also update knowledge topic enabled state
        const topicUpdates = knowledgeTopics
          .filter((t) => (t.enabled !== false) !== enabledTopicIds.has(t.id))
          .map((t) => updateKnowledgeTopicEnabled(t.id, enabledTopicIds.has(t.id)));
        await Promise.all([...objUpdates, ...topicUpdates]);
        // Update local state to reflect saved enabled values
        setObjectives((prev) =>
          prev.map((obj) => ({ ...obj, enabled: enabledIds.has(obj.id) }))
        );
        setKnowledgeTopics((prev) =>
          prev.map((t) => ({ ...t, enabled: enabledTopicIds.has(t.id) }))
        );
      }
      setDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReupload = () => {
    if (!unitId || !courseId) return;
    navigate(`/teacher/course/${courseId}/upload?unitId=${unitId}`);
  };

  const handleDeadlineSave = async (overrideValue?: string | null) => {
    if (!unitId) return;
    try {
      const raw = overrideValue !== undefined ? overrideValue : deadline;
      let isoDeadline: string | null = null;
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          isoDeadline = d.toISOString();
        }
      }
      const updated = await updateUnitDeadline(unitId, isoDeadline);
      console.log("deadline save response:", JSON.stringify(updated));
      setUnit((prev) => prev ? { ...prev, deadline: updated.deadline } : updated);
      if (updated.deadline) {
        const d = new Date(updated.deadline);
        setDeadline(
          new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        );
      } else {
        setDeadline("");
      }
      setEditingDeadline(false);
    } catch (err) {
      console.error("Failed to save deadline:", err);
    }
  };

  const handleDeleteUnit = async () => {
    if (!unitId || !courseId) return;
    try {
      await deleteUnit(unitId);
      navigate(`/teacher/course/${courseId}`);
    } catch (err) {
      console.error("Failed to delete unit:", err);
    }
  };

  // Sort objectives: enabled first, disabled at bottom
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
      byKind[kind].sort((a, b) => {
        const aEnabled = enabledIds.has(a.id) ? 0 : 1;
        const bEnabled = enabledIds.has(b.id) ? 0 : 1;
        if (aEnabled !== bEnabled) return aEnabled - bEnabled;
        return a.order - b.order;
      });
    }
    return byKind;
  }, [objectives, enabledIds]);

  // Group identified knowledge for review mode
  const reviewGrouped = useMemo(() => {
    const skills = identifiedKnowledge
      .map((k, i) => ({ ...k, _idx: i }))
      .filter((k) => k.type === "skill");
    const knowledge = identifiedKnowledge
      .map((k, i) => ({ ...k, _idx: i }))
      .filter((k) => k.type !== "skill");
    // Sort: selected first, unselected at bottom
    const sortFn = (a: { _idx: number }, b: { _idx: number }) => {
      const aSelected = selectedReviewIndices.has(a._idx) ? 0 : 1;
      const bSelected = selectedReviewIndices.has(b._idx) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return a._idx - b._idx;
    };
    skills.sort(sortFn);
    knowledge.sort(sortFn);
    return { skills, knowledge };
  }, [identifiedKnowledge, selectedReviewIndices]);

  // ---- Styles ----

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 8,
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

  const bannerStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    borderRadius: 8,
    backgroundColor: "#f3f0f7",
    border: `1px solid ${PRIMARY}`,
    fontSize: 14,
    fontWeight: 500,
    color: PRIMARY,
    marginBottom: 20,
  };

  const actionBarStyles: React.CSSProperties = {
    display: "flex",
    gap: 12,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: `1px solid ${GRAY_300}`,
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

  const isReviewMode = identifiedKnowledge.length > 0 && objectives.length === 0;
  const enabledCount = isReviewMode
    ? selectedReviewIndices.size
    : enabledIds.size + enabledTopicIds.size;
  const totalCount = isReviewMode ? identifiedKnowledge.length : objectives.length + knowledgeTopics.length;

  const renderObjectiveRow = (
    id: string,
    text: string,
    enabled: boolean,
    onToggle: () => void
  ) => (
    <label
      key={id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: enabled ? "#f9fafb" : "#f3f3f3",
        marginBottom: 6,
        fontSize: 14,
        color: enabled ? GRAY_900 : GRAY_500,
        lineHeight: 1.4,
        cursor: "pointer",
        opacity: enabled ? 1 : 0.6,
        transition: "all 0.15s ease",
      }}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        style={{ marginTop: 2, accentColor: PRIMARY, cursor: "pointer" }}
      />
      <span>
        {text}
      </span>
    </label>
  );

  return (
    <AppShell {...shellProps}>
      {!course || !unit ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
          Unit not found.
        </div>
      ) : (
        <>
          <BackButton onClick={() => navigate(`/teacher/course/${courseId}`)} style={{ marginBottom: 16 }} />

          <h1 style={titleStyles}>{unit.title}</h1>

          {/* Deadline */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            {editingDeadline ? (
              <>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: `1px solid ${GRAY_300}`,
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
                <Button variant="primary" onClick={() => handleDeadlineSave()} style={{ padding: "6px 12px", fontSize: 13 }}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingDeadline(false);
                    if (unit.deadline) {
                      const d = new Date(unit.deadline);
                      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                      setDeadline(local);
                    } else {
                      setDeadline("");
                    }
                  }}
                  style={{ padding: "6px 12px", fontSize: 13 }}
                >
                  Cancel
                </Button>
                {deadline && (
                  <Button
                    variant="secondary"
                    onClick={() => { setDeadline(""); handleDeadlineSave(null); }}
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    Remove
                  </Button>
                )}
              </>
            ) : (
              <span
                onClick={() => setEditingDeadline(true)}
                style={{
                  fontSize: 14,
                  color: deadline
                    ? new Date(deadline) < new Date()
                      ? "#dc2626"
                      : GRAY_500
                    : GRAY_500,
                  cursor: "pointer",
                }}
              >
                {deadline
                  ? `Due: ${new Date(deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${new Date(deadline).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                  : "No deadline set — click to add"}
              </span>
            )}
          </div>

          {generating && (
            <div style={bannerStyles}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite"/>
                </path>
              </svg>
              Generating assignments...
            </div>
          )}

          {!generating && totalCount > 0 && (
            <p style={{ fontSize: 14, color: GRAY_500, marginBottom: 24 }}>
              {enabledCount} of {totalCount} objective{totalCount !== 1 ? "s" : ""} selected
            </p>
          )}

          <div style={actionBarStyles}>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="secondary" onClick={handleReupload}>
              Re-upload Documents
            </Button>
            <div style={{ flex: 1 }} />
            {showDeleteConfirm ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>Delete this unit?</span>
                <Button
                  variant="secondary"
                  onClick={handleDeleteUnit}
                  style={{ padding: "6px 12px", fontSize: 13 }}
                >
                  Confirm
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ padding: "6px 12px", fontSize: 13 }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ padding: "6px 12px", fontSize: 13 }}
              >
                Delete Unit
              </Button>
            )}
          </div>

          {isReviewMode ? (
            <>
              {reviewGrouped.skills.length > 0 && (
                <section style={sectionStyles}>
                  <h2 style={sectionHeadingStyles}>
                    Skills ({reviewGrouped.skills.length})
                  </h2>
                  {reviewGrouped.skills.map((k) =>
                    renderObjectiveRow(
                      `review-${k._idx}`,
                      k.description,
                      selectedReviewIndices.has(k._idx),
                      () => toggleReviewItem(k._idx)
                    )
                  )}
                </section>
              )}
              {reviewGrouped.knowledge.length > 0 && (
                <section style={sectionStyles}>
                  <h2 style={sectionHeadingStyles}>
                    Knowledge ({reviewGrouped.knowledge.length})
                  </h2>
                  {reviewGrouped.knowledge.map((k) =>
                    renderObjectiveRow(
                      `review-${k._idx}`,
                      k.description,
                      selectedReviewIndices.has(k._idx),
                      () => toggleReviewItem(k._idx)
                    )
                  )}
                </section>
              )}
            </>
          ) : (
            <>
              {SECTION_ORDER.filter((k) => k !== "knowledge").map((kind) => {
                const items = grouped[kind];
                if (items.length === 0) return null;
                const enabledInSection = items.filter((o) => enabledIds.has(o.id)).length;
                return (
                  <section key={kind} style={sectionStyles}>
                    <h2 style={sectionHeadingStyles}>
                      {SECTION_LABELS[kind]} ({enabledInSection}/{items.length})
                    </h2>
                    {items.map((obj) =>
                      renderObjectiveRow(
                        obj.id,
                        obj.description || obj.title,
                        enabledIds.has(obj.id),
                        () => toggleObjective(obj.id)
                      )
                    )}
                  </section>
                );
              })}
              {knowledgeTopics.length > 0 && (
                <section style={sectionStyles}>
                  <h2 style={sectionHeadingStyles}>
                    Knowledge ({enabledTopicIds.size}/{knowledgeTopics.length})
                  </h2>
                  {[...knowledgeTopics]
                    .sort((a, b) => {
                      const aEnabled = enabledTopicIds.has(a.id) ? 0 : 1;
                      const bEnabled = enabledTopicIds.has(b.id) ? 0 : 1;
                      if (aEnabled !== bEnabled) return aEnabled - bEnabled;
                      return a.order - b.order;
                    })
                    .map((topic) =>
                      renderObjectiveRow(
                        topic.id,
                        topic.knowledgeTopic,
                        enabledTopicIds.has(topic.id),
                        () => toggleKnowledgeTopic(topic.id)
                      )
                    )}
                </section>
              )}
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
