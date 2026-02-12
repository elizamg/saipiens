import React from "react";
import { PRIMARY, GRAY_900, GRAY_600, GRAY_200, WHITE } from "../../theme/colors";
import ProgressCircle from "../ui/ProgressCircle";
import Avatar from "../ui/Avatar";
import type { ChatMessage, ProgressState, Agent } from "../../types/domain";

const PROGRESS_LABELS: Record<string, string> = {
  walkthrough_started: "Walkthrough started",
  walkthrough_complete: "Walkthrough complete",
  challenge_complete: "Challenge complete!",
};

interface MessageBubbleProps {
  message: ChatMessage;
  agent?: Agent;
}

export default function MessageBubble({ message, agent }: MessageBubbleProps) {
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
    <div style={containerStyles}>
      {showAgentAvatar && (
        <Avatar
          src={agent.avatarUrl}
          name={agent.name}
          size={32}
          imageScale={0.8}
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
  );
}
