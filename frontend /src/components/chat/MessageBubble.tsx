import React from "react";
import { MAIN_GREEN, GRAY_900, GRAY_600, WHITE } from "../../theme/colors";
import type { ChatMessage } from "../../types/domain";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isStudent = message.role === "student";

  const containerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: isStudent ? "flex-end" : "flex-start",
    marginBottom: 16,
  };

  const bubbleStyles: React.CSSProperties = {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: 16,
    backgroundColor: isStudent ? MAIN_GREEN : WHITE,
    color: isStudent ? WHITE : GRAY_900,
    boxShadow: isStudent ? "none" : "0 1px 3px rgba(0, 0, 0, 0.1)",
    borderTopRightRadius: isStudent ? 4 : 16,
    borderTopLeftRadius: isStudent ? 16 : 4,
  };

  const contentStyles: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  };

  const timeStyles: React.CSSProperties = {
    fontSize: 11,
    color: isStudent ? "rgba(255, 255, 255, 0.7)" : GRAY_600,
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={containerStyles}>
      <div style={bubbleStyles}>
        <div style={contentStyles}>{message.content}</div>
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
    </div>
  );
}
