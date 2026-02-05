import React, { useState, useRef, useEffect } from "react";
import { MAIN_GREEN, WHITE, GRAY_300 } from "../../theme/colors";

interface ChatComposerProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({ onSend, disabled = false, placeholder = "Type a message..." }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const containerStyles: React.CSSProperties = {
    padding: "16px 24px",
    backgroundColor: WHITE,
    borderTop: `1px solid ${GRAY_300}`,
    display: "flex",
    gap: 12,
    alignItems: "flex-end",
  };

  const textareaStyles: React.CSSProperties = {
    flex: 1,
    resize: "none",
    border: `1px solid ${GRAY_300}`,
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    minHeight: 44,
    maxHeight: 120,
    lineHeight: 1.4,
  };

  const buttonStyles: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    backgroundColor: value.trim() && !disabled ? MAIN_GREEN : GRAY_300,
    color: WHITE,
    cursor: value.trim() && !disabled ? "pointer" : "not-allowed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background-color 0.15s ease",
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={containerStyles}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={textareaStyles}
        disabled={disabled}
        rows={1}
      />
      <button
        type="button"
        style={buttonStyles}
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
