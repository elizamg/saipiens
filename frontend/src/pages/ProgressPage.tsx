import { useState, useEffect } from "react";
import AppShell from "../components/layout/AppShell";
import { getCurrentStudent } from "../services/api";
import { GRAY_600 } from "../theme/colors";
import type { Student } from "../types/domain";

export default function ProgressPage() {
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    getCurrentStudent().then(setStudent).catch(console.error);
  }, []);

  return (
    <AppShell student={student} activePath="/progress">
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 600 }}>Progress</h1>
        <p style={{ margin: 0, fontSize: 14, color: GRAY_600 }}>Your progress across courses will appear here.</p>
      </div>
    </AppShell>
  );
}
