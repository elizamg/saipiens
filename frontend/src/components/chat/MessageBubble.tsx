import React, { useState, useEffect } from "react";
import { PRIMARY, GRAY_900, GRAY_600, GRAY_200, WHITE } from "../../theme/colors";
import Confetti from "../ui/Confetti";

const NEW_ATTEMPT_BUTTON_STYLES: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 12,
  border: "none",
  backgroundColor: PRIMARY,
  color: WHITE,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const GRADING_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  "correct": { label: "🎯 Correct!", bg: "#d1fae5", color: "#065f46" },
  "slight clarification": { label: "💪 Almost there!", bg: "#fef9c3", color: "#713f12" },
  "small mistake": { label: "🔄 Small mistake", bg: "#ffedd5", color: "#7c2d12" },
  "incorrect": { label: "📝 Incorrect", bg: "#fee2e2", color: "#7f1d1d" },
};
import ProgressCircle from "../ui/ProgressCircle";
import Avatar from "../ui/Avatar";
import type { ChatMessage, ProgressState, Agent } from "../../types/domain";

const PROGRESS_LABELS: Record<string, string> = {
  walkthrough_started: "📖 Walkthrough started",
  walkthrough_complete: "✅ Walkthrough complete",
  challenge_complete: "🏆 Challenge complete!",
};

interface MessageBubbleProps {
  message: ChatMessage;
  agent?: Agent;
  onNewAttempt?: () => void;
}

export default function MessageBubble({ message, agent, onNewAttempt }: MessageBubbleProps) {
  // Synthetic action button — renders a centered "NEW ATTEMPT" button in the message list
  if (message.metadata?.isNewAttemptButton) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <button type="button" style={NEW_ATTEMPT_BUTTON_STYLES} onClick={onNewAttempt}>
          NEW ATTEMPT
        </button>
      </div>
    );
  }

  const isStudent = message.role === "student";
  const progressState = message.metadata?.progressState;
  const isProgressFeedback = progressState != null && (message.metadata?.isSystemMessage === true || message.role === "tutor");
  const isSystem = message.metadata?.isSystemMessage === true || isProgressFeedback;

  const containerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: isSystem ? "center" : isStudent ? "flex-end" : "flex-start",
    marginBottom: 16,
    alignItems: "flex-start",
    gap: 8,
  };

  const bubbleStyles: React.CSSProperties = {
    maxWidth: isSystem ? "90%" : "70%",
    padding: "12px 16px",
    borderRadius: 16,
    backgroundColor: isSystem ? GRAY_200 : isStudent ? PRIMARY : WHITE,
    color: isSystem ? GRAY_900 : isStudent ? WHITE : GRAY_900,
    boxShadow: isSystem ? "none" : isStudent ? "none" : "0 1px 3px rgba(0, 0, 0, 0.1)",
    borderTopRightRadius: isStudent && !isSystem ? 4 : 16,
    borderTopLeftRadius: isStudent && !isSystem ? 16 : 4,
    textAlign: isSystem ? "center" : "left",
    fontWeight: isSystem ? 600 : 400,
  };

  const contentStyles: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  };

  const timeStyles: React.CSSProperties = {
    fontSize: 11,
    color: isStudent ? "rgba(255, 255, 255, 0.85)" : GRAY_600,
    marginTop: 8,
    textAlign: "right",
  };

  const attachmentContainerStyles: React.CSSProperties = {
    marginTop: 12,
  };

  const imageStyles: React.CSSProperties = {
    maxWidth: "100%",
    borderRadius: 8,
  };

  const senderNameStyles: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: GRAY_600,
    marginBottom: 4,
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const showAgentAvatar = !isStudent && !isSystem && agent;
  const showCircle = isProgressFeedback && progressState === "walkthrough_started";
  const gradingCategory = !isStudent && !isSystem ? message.metadata?.gradingCategory : undefined;
  const gradingBadge = gradingCategory ? GRADING_BADGE[gradingCategory] : undefined;

  // Confetti triggers
  const isCorrectAnswer = gradingCategory === "correct";
  const isChallengeComplete = isProgressFeedback && progressState === "challenge_complete";
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => {
    if (isCorrectAnswer || isChallengeComplete) {
      // Small delay so the message renders first
      const timer = setTimeout(() => setConfettiTrigger(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isCorrectAnswer, isChallengeComplete]);

  const bubble = (
    <div style={bubbleStyles}>
      {isProgressFeedback ? (
        <div style={{ ...contentStyles, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {showCircle && <ProgressCircle state={progressState as ProgressState} size={20} />}
          <span>{PROGRESS_LABELS[progressState as string] ?? message.content}</span>
        </div>
      ) : (
        <div style={contentStyles}>{message.content}</div>
      )}
      {gradingBadge && (
        <div style={{
          display: "inline-block",
          marginTop: 8,
          padding: "3px 10px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          backgroundColor: gradingBadge.bg,
          color: gradingBadge.color,
        }}>
          {gradingBadge.label}
        </div>
      )}
      {message.attachments && message.attachments.length > 0 && (
        <div style={attachmentContainerStyles}>
          {message.attachments.map((attachment, index) =>
            attachment.type === "image" ? (
              <img
                key={index}
                src={attachment.url}
                alt={attachment.name || "Attachment"}
                style={imageStyles}
              />
            ) : null
          )}
        </div>
      )}
      <div style={timeStyles}>{formatTime(message.createdAt)}</div>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {confettiTrigger && (
        <Confetti
          trigger={confettiTrigger}
          intensity={isChallengeComplete ? "big" : "small"}
        />
      )}
      <div style={containerStyles}>
        {showAgentAvatar && (
          <Avatar
            src={agent.avatarUrl}
            name={agent.name}
            size={32}
            imageScale={0.8}
            tintColor={agent.tintColor}
            style={{ marginTop: 4 }}
          />
        )}
        {showAgentAvatar ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={senderNameStyles}>{agent.name}</span>
            {bubble}
          </div>
        ) : (
          bubble
        )}
      </div>
    </div>
  );
}
