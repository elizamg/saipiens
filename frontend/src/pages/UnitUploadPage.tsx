import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import BackButton from "../components/ui/BackButton";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { GRAY_300, GRAY_500, GRAY_900, PRIMARY } from "../theme/colors";
import {
  getCourse,
  getCurrentInstructor,
  listTeacherCourses,
  createUnitFromUpload,
  reuploadUnit,
  processUnit,
  listUnitFiles,
  getUploadStatus,
  getIdentifiedKnowledge,
  generateSelectedObjectives,
  getUnit,
} from "../services/api";
import type { Course, Student, IdentifiedKnowledge } from "../types/domain";

const ACCEPTED_TYPES = ".pdf,.txt,.docx,.doc,.md,.rtf";
const MAX_FILES = 10;

type Step = "name" | "upload" | "processing" | "review";

export default function UnitUploadPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query params for edit/re-upload flows
  const existingUnitId = searchParams.get("unitId");
  const mode = searchParams.get("mode"); // "review" to jump to review step

  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Student | null>(null);
  const [sidebarCourses, setSidebarCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine initial step based on query params
  const getInitialStep = (): Step => {
    if (existingUnitId && mode === "review") return "review";
    if (existingUnitId) return "upload"; // re-upload: skip name step
    return "name";
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [unitName, setUnitName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingUnitId, setProcessingUnitId] = useState<string | null>(
    existingUnitId
  );
  const [identifiedKnowledge, setIdentifiedKnowledge] = useState<
    IdentifiedKnowledge[]
  >([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [existingFiles, setExistingFiles] = useState<{ name: string; size: number }[]>([]);

  // Load course info + handle edit/re-upload modes
  useEffect(() => {
    if (!courseId) return;
    const promises: Promise<unknown>[] = [
      getCourse(courseId),
      getCurrentInstructor().then(
        (i) => ({ ...i, yearLabel: "" }) as Student
      ),
      listTeacherCourses(),
    ];

    // If returning to an existing unit, fetch its data
    if (existingUnitId) {
      promises.push(getUnit(existingUnitId));
    }

    Promise.all(promises)
      .then(([c, instr, courses, unitData]) => {
        setCourse(c as Course);
        setInstructor(instr as Student);
        setSidebarCourses(courses as Course[]);

        if (unitData) {
          const u = unitData as { title: string };
          setUnitName(u.title || "");
        }

        // Load existing uploaded files for reupload mode
        if (existingUnitId && mode !== "review") {
          listUnitFiles(existingUnitId).then((data) => {
            setExistingFiles(data.files || []);
          }).catch(console.error);
        }

        // If mode=review, immediately load identified knowledge
        if (existingUnitId && mode === "review") {
          getIdentifiedKnowledge(existingUnitId).then((data) => {
            setIdentifiedKnowledge(data.identifiedKnowledge);
            setSelectedIndices(
              new Set(data.identifiedKnowledge.map((_, i) => i))
            );
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [courseId, existingUnitId, mode]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    setFiles((prev) => {
      const combined = [...prev, ...arr];
      return combined.slice(0, MAX_FILES);
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleProcess = async () => {
    if (files.length === 0 || !courseId) return;
    setStep("processing");
    setUploadError(null);
    try {
      if (existingUnitId) {
        // Re-upload flow: reuse existing unit
        const { uploadUrls } = await reuploadUnit(
          existingUnitId,
          files.map((f) => f.name)
        );
        // Upload files to S3
        const uploadResults = await Promise.all(
          files.map((file) => {
            const url = uploadUrls[file.name];
            if (!url) throw new Error(`No upload URL for file: ${file.name}`);
            return fetch(url, { method: "PUT", body: file });
          })
        );
        for (const res of uploadResults) {
          if (!res.ok) throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`);
        }
        // Trigger the processing pipeline
        await processUnit(existingUnitId);
        setProcessingUnitId(existingUnitId);
      } else {
        // New upload flow
        const { unitId } = await createUnitFromUpload(
          courseId,
          files,
          unitName
        );
        setProcessingUnitId(unitId);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setStep("upload");
    }
  };

  // Poll for upload status once we have a processingUnitId
  useEffect(() => {
    if (!processingUnitId || !courseId) return;
    if (step !== "processing") return;
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 3000));
        if (cancelled) break;
        try {
          const result = await getUploadStatus(processingUnitId);
          if (result.status === "review" || result.status === "ready") {
            navigate(
              `/teacher/course/${courseId}/unit/${processingUnitId}`
            );
            return;
          }
          if (result.status === "error") {
            setUploadError(result.statusError || "Processing failed");
            setStep("upload");
            setProcessingUnitId(null);
            return;
          }
        } catch {
          // network error — keep polling
        }
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [processingUnitId, courseId, navigate, step]);

  // ---- Styles ----

  const backLinkStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: GRAY_500,
    textDecoration: "none",
    marginBottom: 24,
    cursor: "pointer",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    marginBottom: 8,
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    color: GRAY_500,
    marginBottom: 32,
  };

  const dropZoneStyles: React.CSSProperties = {
    border: `2px dashed ${isDragOver ? PRIMARY : GRAY_300}`,
    borderRadius: 16,
    padding: 48,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    cursor: "pointer",
    backgroundColor: isDragOver
      ? "rgba(139, 122, 158, 0.06)"
      : "transparent",
    transition: "border-color 0.2s ease, background-color 0.2s ease",
  };

  const dropTextStyles: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 500,
    color: GRAY_900,
  };

  const dropSubTextStyles: React.CSSProperties = {
    fontSize: 13,
    color: GRAY_500,
  };

  const fileListStyles: React.CSSProperties = {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  };

  const fileItemStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    fontSize: 14,
    color: GRAY_900,
  };

  const removeButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    color: GRAY_500,
    padding: "0 4px",
    lineHeight: 1,
  };

  const processingContainerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: 16,
  };

  const spinnerStyles: React.CSSProperties = {
    width: 40,
    height: 40,
    border: `3px solid ${GRAY_300}`,
    borderTopColor: PRIMARY,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  };

  const processingTextStyles: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
  };

  const processingSubTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const handleToggleObjective = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIndices(new Set(identifiedKnowledge.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedIndices(new Set());
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!processingUnitId || selectedIndices.size === 0 || !courseId) return;
    const selected = identifiedKnowledge
      .filter((_, i) => selectedIndices.has(i))
      .map((k) => ({ type: k.type, description: k.description }));
    setSaving(true);
    setUploadError(null);
    try {
      await generateSelectedObjectives(processingUnitId, selected);
      // Pipeline runs in background — navigate to unit editor immediately
      navigate(`/teacher/course/${courseId}/unit/${processingUnitId}`);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Save failed"
      );
      setSaving(false);
    }
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

  // ---- Back link helper ----
  const backTarget = existingUnitId
    ? `/teacher/course/${courseId}/unit/${existingUnitId}`
    : `/teacher/course/${courseId}`;
  const backLabel = existingUnitId
    ? `Back to ${unitName || "Unit"}`
    : `Back to ${course?.title}`;

  const renderBackLink = () => (
    <BackButton onClick={() => navigate(backTarget)} style={{ marginBottom: 16 }} />
  );

  if (step === "name") {
    return (
      <AppShell {...shellProps}>
        {!course ? (
          <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
            Course not found.
          </div>
        ) : (
          <>
            {renderBackLink()}
            <h1 style={titleStyles}>Name Your Unit</h1>
            <p style={subtitleStyles}>
              Give this unit a title before uploading your documents.
            </p>
            <div style={{ maxWidth: 480, marginBottom: 24 }}>
              <Input
                label="Unit Name"
                placeholder="e.g. The American Revolution"
                value={unitName}
                onChange={setUnitName}
              />
            </div>
            <Button
              variant="primary"
              onClick={() => setStep("upload")}
              disabled={!unitName.trim()}
            >
              Continue to Upload
            </Button>
          </>
        )}
      </AppShell>
    );
  }

  if (step === "processing") {
    return (
      <AppShell {...shellProps}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={processingContainerStyles}>
          <div style={spinnerStyles} />
          <p style={processingTextStyles}>Processing your documents...</p>
          <p style={processingSubTextStyles}>
            Sam is analyzing your content
          </p>
        </div>
      </AppShell>
    );
  }

  if (step === "review") {
    const skills = identifiedKnowledge
      .map((k, i) => ({ ...k, _idx: i }))
      .filter((k) => k.type === "skill");
    const knowledge = identifiedKnowledge
      .map((k, i) => ({ ...k, _idx: i }))
      .filter((k) => k.type !== "skill");

    const renderSection = (
      label: string,
      items: { type: string; description: string; _idx: number }[]
    ) => {
      if (items.length === 0) return null;
      return (
        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: GRAY_900,
              marginBottom: 12,
            }}
          >
            {label} ({items.length})
          </h3>
          {items.map((k) => (
            <label
              key={k._idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                backgroundColor: selectedIndices.has(k._idx)
                  ? "#f3f0f7"
                  : "#f9fafb",
                marginBottom: 6,
                cursor: "pointer",
                border: `1px solid ${selectedIndices.has(k._idx) ? PRIMARY : "transparent"}`,
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="checkbox"
                checked={selectedIndices.has(k._idx)}
                onChange={() => handleToggleObjective(k._idx)}
                style={{ marginTop: 2, accentColor: PRIMARY }}
              />
              <span
                style={{ fontSize: 14, color: GRAY_900, lineHeight: 1.4 }}
              >
                {k.description}
              </span>
            </label>
          ))}
        </div>
      );
    };

    return (
      <AppShell {...shellProps}>
        {renderBackLink()}

        <h1 style={titleStyles}>Review Objectives</h1>
        <p style={subtitleStyles}>
          Sam identified{" "}
          <strong>{identifiedKnowledge.length}</strong> learning objectives
          from your documents. Select the ones you want to include in{" "}
          <strong>{unitName}</strong>.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <button
            onClick={handleSelectAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: PRIMARY,
              fontWeight: 500,
            }}
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: GRAY_500,
              fontWeight: 500,
            }}
          >
            Deselect All
          </button>
          <span
            style={{ fontSize: 13, color: GRAY_500, marginLeft: "auto" }}
          >
            {selectedIndices.size} of {identifiedKnowledge.length} selected
          </span>
        </div>

        {renderSection("Skills", skills)}
        {renderSection("Knowledge", knowledge)}

        {uploadError && (
          <p style={{ fontSize: 14, color: "#dc2626", marginTop: 16 }}>
            {uploadError}
          </p>
        )}

        <div style={{ marginTop: 24 }}>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={selectedIndices.size === 0 || saving}
          >
            {saving ? "Saving..." : `Save (${selectedIndices.size} objectives)`}
          </Button>
        </div>
      </AppShell>
    );
  }

  // ---- Upload step (default) ----
  return (
    <AppShell {...shellProps}>
      {!course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
          Course not found.
        </div>
      ) : (
        <>
          {renderBackLink()}

          <h1 style={titleStyles}>
            {existingUnitId ? "Re-upload Documents" : "Upload Documents"}
          </h1>
          <p style={subtitleStyles}>
            Unit: <strong>{unitName}</strong> — Upload up to {MAX_FILES}{" "}
            text-based files. Sam will generate learning objectives from the
            content.
          </p>

          {existingFiles.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: GRAY_900, marginBottom: 8 }}>
                Previously Uploaded Files
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {existingFiles.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      backgroundColor: "#f3f0f7",
                      fontSize: 14,
                      color: GRAY_900,
                    }}
                  >
                    <span>{f.name}</span>
                    <span style={{ fontSize: 12, color: GRAY_500 }}>
                      {f.size < 1024
                        ? `${f.size} B`
                        : f.size < 1024 * 1024
                          ? `${(f.size / 1024).toFixed(1)} KB`
                          : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: GRAY_500, marginTop: 8 }}>
                Upload new files below to replace existing content.
              </p>
            </div>
          )}

          <div
            style={dropZoneStyles}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowse}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GRAY_500}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={dropTextStyles}>
              Drag & drop files here, or click to browse
            </span>
            <span style={dropSubTextStyles}>
              Accepts PDF, TXT, DOCX, DOC, MD, RTF
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {files.length > 0 && (
            <div style={fileListStyles}>
              {files.map((file, idx) => (
                <div key={`${file.name}-${idx}`} style={fileItemStyles}>
                  <span>{file.name}</span>
                  <button
                    style={removeButtonStyles}
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length >= MAX_FILES && (
            <p style={{ fontSize: 13, color: GRAY_500, marginTop: 8 }}>
              Maximum of {MAX_FILES} files reached.
            </p>
          )}

          {uploadError && (
            <p style={{ fontSize: 14, color: "#dc2626", marginTop: 16 }}>
              {uploadError}
            </p>
          )}

          <div style={{ marginTop: 24 }}>
            <Button
              variant="primary"
              onClick={handleProcess}
              disabled={files.length === 0}
            >
              Process Documents
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
