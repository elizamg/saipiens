import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import { getCurrentInstructor, updateProfile, getAvatarUploadUrl } from "../services/api";
import { getCurrentUserEmail, changePassword } from "../services/cognitoAuth";
import { useAuth } from "../contexts/AuthContext";
import type { Instructor } from "../types/domain";
import {
  GRAY_500,
  GRAY_600,
  GRAY_700,
  PRIMARY,
  SUCCESS_GREEN,
  WHITE,
} from "../theme/colors";

export default function TeacherSettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [name, setName] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentInstructor()
      .then((i) => {
        setInstructor(i);
        setName(i.name);
        setAvatarPreviewUrl(i.avatarUrl);
      })
      .catch(console.error);
    getCurrentUserEmail().then(setEmail).catch(console.error);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const { uploadUrl, publicUrl } = await getAvatarUploadUrl(avatarFile.name, avatarFile.type);
        if (uploadUrl !== "mock") {
          await fetch(uploadUrl, { method: "PUT", body: avatarFile });
          avatarUrl = publicUrl;
        } else {
          avatarUrl = avatarPreviewUrl;
        }
      }
      await updateProfile({ name, ...(avatarUrl ? { avatarUrl } : {}) });
      setSaveSuccess(true);
      setAvatarFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      await changePassword(pwOld, pwNew);
      setPwSuccess(true);
      setPwOld("");
      setPwNew("");
      setPwConfirm("");
    } catch (e: unknown) {
      setPwError((e as Error).message ?? "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  const shellStudent = instructor
    ? { ...instructor, yearLabel: "" }
    : { id: "", name: "", yearLabel: "" };

  return (
    <AppShell student={shellStudent} activePath="/teacher/settings" routePrefix="/teacher">
      <div>
        <h1 style={{ margin: "0 0 24px 0", fontSize: 24, fontWeight: 600 }}>Settings</h1>

        {/* Profile */}
        <Card style={{ marginBottom: 16 }}>
          <h2 style={cardHeadingStyle}>Profile</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div
              style={{ position: "relative", cursor: "pointer" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar src={avatarPreviewUrl} name={name || "?"} size={72} />
              <CameraOverlay />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarPreviewUrl(URL.createObjectURL(file));
                    setAvatarFile(file);
                  }
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: GRAY_500 }}>Click to change photo</span>
          </div>
          <Input label="Name" value={name} onChange={setName} placeholder="Your name" />
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {saveSuccess && (
              <span style={{ fontSize: 14, color: SUCCESS_GREEN }}>Saved!</span>
            )}
          </div>
        </Card>

        {/* Account */}
        <Card style={{ marginBottom: 16 }}>
          <h2 style={cardHeadingStyle}>Account</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={fieldLabelStyle}>Email</div>
              <div style={{ fontSize: 15, color: GRAY_700 }}>{email ?? "—"}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Role</div>
              <RoleBadge label="Instructor" />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card style={{ marginBottom: 16 }}>
          <h2 style={cardHeadingStyle}>Security</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input
              label="Current password"
              type="password"
              value={pwOld}
              onChange={setPwOld}
            />
            <Input
              label="New password"
              type="password"
              value={pwNew}
              onChange={setPwNew}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={pwConfirm}
              onChange={setPwConfirm}
            />
          </div>
          {pwError && (
            <p style={{ margin: "12px 0 0", fontSize: 14, color: "#dc2626" }}>{pwError}</p>
          )}
          {pwSuccess && (
            <p style={{ margin: "12px 0 0", fontSize: 14, color: SUCCESS_GREEN }}>
              Password changed successfully.
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            <Button
              onClick={handleChangePassword}
              disabled={pwLoading || !pwOld || !pwNew || !pwConfirm}
            >
              {pwLoading ? "Changing…" : "Change Password"}
            </Button>
          </div>
        </Card>

        {/* Sign Out */}
        <Card>
          <h2 style={cardHeadingStyle}>Sign Out</h2>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components / styles
// ---------------------------------------------------------------------------

const cardHeadingStyle: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: 16,
  fontWeight: 600,
  color: GRAY_700,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: GRAY_600,
  marginBottom: 4,
};

function RoleBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 12,
        backgroundColor: PRIMARY,
        color: WHITE,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function CameraOverlay() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CameraIcon />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
