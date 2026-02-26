import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import Avatar from "../ui/Avatar";
import { SURFACE, WHITE, GRAY_600 } from "../../theme/colors";
import type { ChatMessage, Agent } from "../../types/domain";

interface MessageListProps {
  messages: ChatMessage[];
  agent?: Agent;
  isSending?: boolean;
}

function TypingIndicator({ agent }: { agent?: Agent }) {
  const bubbleStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 16px",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    backgroundColor: WHITE,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    width: "fit-content",
  };

  const dotStyles: React.CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: GRAY_600,
    animation: "typing-bounce 1.2s infinite ease-in-out",
  };

  return (
    <>
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16, alignItems: "flex-start", gap: 8 }}>
        {agent && (
          <Avatar
            src={agent.avatarUrl}
            name={agent.name}
            size={32}
            imageScale={0.8}
            style={{ marginTop: 4 }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {agent && (
            <span style={{ fontSize: 12, fontWeight: 600, color: GRAY_600, marginBottom: 4 }}>
              {agent.name}
            </span>
          )}
          <div style={bubbleStyles}>
            <div style={{ ...dotStyles, animationDelay: "0s" }} />
            <div style={{ ...dotStyles, animationDelay: "0.2s" }} />
            <div style={{ ...dotStyles, animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </>
  );
}

export default function MessageList({ messages, agent, isSending }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);

  const containerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "24px",
    backgroundColor: SURFACE,
  };

  // Check if user is near bottom before messages update
  const checkIfNearBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Auto-scroll only if user was near bottom
  useEffect(() => {
    if (wasNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleScroll = () => {
    wasNearBottomRef.current = checkIfNearBottom();
  };

  return (
    <div
      ref={containerRef}
      style={containerStyles}
      onScroll={handleScroll}
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} agent={agent} />
      ))}
      {isSending && <TypingIndicator agent={agent} />}
    </div>
  );
}
