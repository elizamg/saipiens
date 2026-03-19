import React from "react";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import SectionIcon from "../ui/SectionIcon";
import { GRAY_900, GRAY_600, GRAY_500, PRIMARY } from "../../theme/colors";
import type { FeedbackItem, Instructor } from "../../types/domain";
import whiteTreeLogo from "../../assets/white-tree.png";

interface FeedbackHighlightProps {
  teacherFeedback?: FeedbackItem | null;
  samSummary?: string | null;
  instructor?: Instructor | null;
}

export default function FeedbackHighlight({
  teacherFeedback,
  samSummary,
  instructor,
}: FeedbackHighlightProps) {
  if (!teacherFeedback && !samSummary) return null;

  const sectionStyles: React.CSSProperties = {
    marginBottom: 32,
  };

  const headingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: GRAY_900,
    marginBottom: 16,
  };

  const cardsStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const quoteStyles: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  };

  const quoteIconStyles: React.CSSProperties = {
    fontSize: 24,
    color: PRIMARY,
    lineHeight: 1,
    flexShrink: 0,
    opacity: 0.6,
  };

  const bodyStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    color: GRAY_600,
    lineHeight: 1.6,
    fontStyle: "italic",
  };

  const sourceRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  };

  const sourceNameStyles: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: GRAY_900,
  };

  const sourceLabelStyles: React.CSSProperties = {
    fontSize: 11,
    color: GRAY_500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  /**
   * Pick the most meaningful sentence(s) from a block of feedback text.
   * Prefers sentences with positive/encouraging language. Falls back to
   * the first 1-2 sentences if nothing stands out.
   */
  function pickHighlight(text: string): string {
    // Split into sentences (handle ". ", "! ", "? " boundaries)
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (sentences.length <= 2) return text;

    // Score each sentence — positive/encouraging words get higher scores
    const positiveWords = /great|excellent|impressive|well done|strong|improved|proud|fantastic|good job|nicely|outstanding|progress|mastered|solid|thorough|creative|insightful/i;
    const scored = sentences.map((s) => ({
      sentence: s,
      score: positiveWords.test(s) ? 2 : 1,
    }));

    // Pick the top-scoring sentence(s), up to ~200 chars total
    scored.sort((a, b) => b.score - a.score);
    let result = scored[0].sentence;
    if (scored.length > 1 && result.length + scored[1].sentence.length < 200) {
      // Add a second sentence if it fits and also scores well
      if (scored[1].score >= scored[0].score) {
        result += " " + scored[1].sentence;
      }
    }
    return result;
  }

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}><SectionIcon name="sparkle" color="#7B68A6" />Highlights</h2>
      <div style={cardsStyles}>
        {teacherFeedback && (
          <Card>
            <div style={quoteStyles}>
              <span style={quoteIconStyles}>&ldquo;</span>
              <div>
                <p style={bodyStyles}>{pickHighlight(teacherFeedback.body)}</p>
                <div style={sourceRowStyles}>
                  {instructor ? (
                    <>
                      <Avatar src={instructor.avatarUrl} name={instructor.name} size={28} />
                      <div>
                        <div style={sourceNameStyles}>{instructor.name}</div>
                        <div style={sourceLabelStyles}>Teacher Feedback</div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div style={sourceNameStyles}>{teacherFeedback.instructorName ?? "Your Teacher"}</div>
                      <div style={sourceLabelStyles}>Teacher Feedback</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
        {samSummary && (
          <Card>
            <div style={quoteStyles}>
              <span style={quoteIconStyles}>&ldquo;</span>
              <div>
                <p style={bodyStyles}>{pickHighlight(samSummary)}</p>
                <div style={sourceRowStyles}>
                  <Avatar src={whiteTreeLogo} name="Sam" size={28} imageScale={0.8} />
                  <div>
                    <div style={sourceNameStyles}>Sam</div>
                    <div style={sourceLabelStyles}>Learning Summary</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
