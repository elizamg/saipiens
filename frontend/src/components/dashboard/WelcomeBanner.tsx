import React, { useMemo } from "react";
import { PRIMARY_GRADIENT, WHITE } from "../../theme/colors";

interface WelcomeBannerProps {
  name: string;
  role?: "student" | "teacher";
  subtitle?: string;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const STUDENT_PHRASES = {
  morning: [
    (n: string) => `Morning, ${n}! Fresh start, fresh ideas.`,
    (n: string) => `Good morning, ${n} — let's get the day started.`,
    (n: string) => `${n}, let's get those pencils sharpened.`,
    (n: string) => `Rise and grind, ${n}. Morning energy — let's use it.`,
  ],
  afternoon: [
    (n: string) => `Good afternoon, ${n} — halfway through the day.`,
    (n: string) => `Keep the momentum going, ${n}.`,
    (n: string) => `Afternoon grind, ${n}. Let's make it count.`,
  ],
  evening: [
    (n: string) => `Evening's a great time to learn, ${n}.`,
    (n: string) => `Night owl mode, ${n} — let's go.`,
    (n: string) => `Good evening, ${n}. One more session before tomorrow.`,
  ],
  general: [
    (n: string) => `Let's get after it, ${n}.`,
    (n: string) => `${n}, you're back. Keep going.`,
    (n: string) => `One more session closer, ${n}.`,
    (n: string) => `Today counts, ${n}.`,
    (n: string) => `You've got this, ${n}.`,
    (n: string) => `Sam is ready to chat, ${n}.`,
    (n: string) => `Ready when you are, ${n}.`,
    (n: string) => `Every session adds up, ${n}.`,
  ],
};

const TEACHER_PHRASES = {
  morning: [
    (n: string) => `Morning, ${n}! Your class is ready.`,
    (n: string) => `Good morning, ${n} — let's prep.`,
    (n: string) => `${n}, your students are waiting.`,
  ],
  afternoon: [
    (n: string) => `Good afternoon, ${n} — let's prep.`,
    (n: string) => `${n}, afternoon planning in session.`,
    (n: string) => `Good afternoon, ${n}. Lots to teach today.`,
  ],
  evening: [
    (n: string) => `Evening planning pays off, ${n}.`,
    (n: string) => `${n}, night prep = morning confidence.`,
    (n: string) => `Good evening, ${n}. Tomorrow's lesson won't write itself.`,
  ],
  general: [
    (n: string) => `${n}, your students need you today.`,
    (n: string) => `Another great lesson ahead, ${n}.`,
    (n: string) => `You're making a difference, ${n}.`,
    (n: string) => `Ready to teach greatness, ${n}?`,
    (n: string) => `Your class is in good hands, ${n}.`,
  ],
};

function pickPhrase(name: string, role: "student" | "teacher"): string {
  const time = getTimeOfDay();
  const bank = role === "teacher" ? TEACHER_PHRASES : STUDENT_PHRASES;
  const pool = [...bank[time], ...bank.general];
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn(name);
}

export default function WelcomeBanner({ name, role = "student", subtitle }: WelcomeBannerProps) {
  const firstName = name.split(" ")[0];
  const phrase = useMemo(() => pickPhrase(firstName, role), [firstName, role]);

  return (
    <div style={{
      background: PRIMARY_GRADIENT,
      borderRadius: 12,
      padding: "14px 24px",
      marginBottom: 32,
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: WHITE }}>{phrase}</h1>
      {subtitle && (
        <>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>·</span>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{subtitle}</p>
        </>
      )}
    </div>
  );
}
