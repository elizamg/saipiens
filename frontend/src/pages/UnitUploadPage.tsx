import React, { useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { GRAY_300, GRAY_500, GRAY_900, PRIMARY } from "../theme/colors";
import {
  mockInstructor,
  sidebarCourses,
  teacherCourses,
} from "../data/teacherMockData";
import { createUnitFromUpload } from "../services/api";

const ACCEPTED_TYPES = ".pdf,.txt,.docx,.doc,.md,.rtf";
const MAX_FILES = 10;

type Step = "name" | "upload" | "processing";

export default function UnitUploadPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const course = teacherCourses.find((c) => c.id === courseId);

  const [step, setStep] = useState<Step>("name");
  const [unitName, setUnitName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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
    const { unit } = await createUnitFromUpload(courseId, files, unitName);
    navigate(`/teacher/course/${courseId}/unit/${unit.id}`);
  };

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
    backgroundColor: isDragOver ? "rgba(139, 122, 158, 0.06)" : "transparent",
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

  if (step === "name") {
    return (
      <AppShell
        student={mockInstructor}
        activePath="/courses"
        sidebarCourses={sidebarCourses}
        routePrefix="/teacher"
      >
        {!course ? (
          <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
            Course not found.
          </div>
        ) : (
          <>
            <a
              onClick={() => navigate(`/teacher/course/${courseId}`)}
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
            </a>

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
      <AppShell
        student={mockInstructor}
        activePath="/courses"
        sidebarCourses={sidebarCourses}
        routePrefix="/teacher"
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={processingContainerStyles}>
          <div style={spinnerStyles} />
          <p style={processingTextStyles}>Processing your documents...</p>
          <p style={processingSubTextStyles}>
            Sam is generating learning objectives
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      student={mockInstructor}
      activePath="/courses"
      sidebarCourses={sidebarCourses}
      routePrefix="/teacher"
    >
      {!course ? (
        <div style={{ padding: 24, fontSize: 14, color: GRAY_500 }}>
          Course not found.
        </div>
      ) : (
        <>
          <a
            onClick={() => navigate(`/teacher/course/${courseId}`)}
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
          </a>

          <h1 style={titleStyles}>Upload Documents</h1>
          <p style={subtitleStyles}>
            Unit: <strong>{unitName}</strong> — Upload up to {MAX_FILES} text-based files. Sam will generate learning objectives from the content.
          </p>

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
