import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { SURFACE } from "../../theme/colors";
import type { ChatMessage, Agent } from "../../types/domain";

interface MessageListProps {
  messages: ChatMessage[];
  agent?: Agent;
}

export default function MessageList({ messages, agent }: MessageListProps) {
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
  }, [messages]);

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
    </div>
  );
}
