import React, { useState } from "react";
import Input from "../ui/Input";
import Checkbox from "../ui/Checkbox";
import Button from "../ui/Button";
import { GRAY_500 } from "../../theme/colors";
import type { Student } from "../../types/domain";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (e: string) => EMAIL_REGEX.test(e.trim());

interface StudentRosterEditorProps {
  allStudents: Student[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onAddStudent: (student: Student) => void;
  /** If provided, called to persist the new student before onAddStudent. */
  createStudent?: (firstName: string, lastName: string, email: string) => Promise<Student>;
}

export default function StudentRosterEditor({
  allStudents,
  selectedIds,
  onSelectionChange,
  onAddStudent,
  createStudent,
}: StudentRosterEditorProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const emailError = emailTouched && email.trim() && !isValidEmail(email)
    ? "Please enter a valid email address."
    : null;

  const filtered = allStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleAddStudent = async () => {
    if (!firstName.trim() || !lastName.trim() || !isValidEmail(email)) return;
    setAdding(true);
    setAddError(null);
    try {
      let newStudent: Student;
      if (createStudent) {
        newStudent = await createStudent(firstName, lastName, email);
      } else {
        newStudent = {
          id: `ts-new-${Date.now()}`,
          name: `${firstName.trim()} ${lastName.trim()}`,
          yearLabel: "New",
        };
      }
      onAddStudent(newStudent);
      onSelectionChange([...selectedIds, newStudent.id]);
      setFirstName("");
      setLastName("");
      setEmail("");
      setEmailTouched(false);
      setShowAddForm(false);
    } catch {
      setAddError("Failed to create student. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const searchIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={GRAY_500}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const listStyles: React.CSSProperties = {
    maxHeight: 300,
    overflowY: "auto",
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  const rowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    borderRadius: 4,
  };

  const yearStyles: React.CSSProperties = {
    fontSize: 13,
    color: GRAY_500,
    marginLeft: 8,
    flexShrink: 0,
  };

  const countStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const addFormStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 12,
    border: "1px solid #e5e5e5",
    borderRadius: 8,
  };

  const addFormRowStyles: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
  };

  return (
    <div style={containerStyles}>
      <Input
        placeholder="Search students..."
        value={search}
        onChange={setSearch}
        rightIcon={searchIcon}
      />

      <div style={listStyles}>
        {filtered.length === 0 && (
          <div style={{ padding: 12, fontSize: 14, color: GRAY_500, textAlign: "center" }}>
            No students found.
          </div>
        )}
        {filtered.map((student) => (
          <div key={student.id} style={rowStyles}>
            <Checkbox
              label={student.name}
              checked={selectedIds.includes(student.id)}
              onChange={() => toggleStudent(student.id)}
            />
            <span style={yearStyles}>{student.yearLabel}</span>
          </div>
        ))}
      </div>

      <div style={countStyles}>
        {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
      </div>

      {!showAddForm ? (
        <Button variant="ghost" onClick={() => setShowAddForm(true)}>
          + Add New Student
        </Button>
      ) : (
        <div style={addFormStyles}>
          <div style={addFormRowStyles}>
            <Input
              label="First Name"
              placeholder="First"
              value={firstName}
              onChange={setFirstName}
            />
            <Input
              label="Last Name"
              placeholder="Last"
              value={lastName}
              onChange={setLastName}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Input
                label="Email"
                placeholder="email@school.edu"
                value={email}
                onChange={(v) => { setEmail(v); setEmailTouched(true); }}
                type="email"
              />
              {emailError && (
                <span style={{ fontSize: 12, color: "#dc2626" }}>{emailError}</span>
              )}
            </div>
          </div>
          {addError && (
            <span style={{ fontSize: 12, color: "#dc2626" }}>{addError}</span>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="primary"
              onClick={handleAddStudent}
              disabled={adding || !firstName.trim() || !lastName.trim() || !isValidEmail(email)}
            >
              {adding ? "Adding…" : "Add"}
            </Button>
            <Button variant="ghost" onClick={() => { setShowAddForm(false); setEmailTouched(false); setEmail(""); setFirstName(""); setLastName(""); setAddError(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
