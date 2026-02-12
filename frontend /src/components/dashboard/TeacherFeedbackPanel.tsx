import React from "react";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import { GRAY_900, GRAY_600, MAIN_GREEN } from "../../theme/colors";
import type { FeedbackItem, Unit, Instructor } from "../../types/domain";
import whiteTreeLogo from "../../assets/white-tree.png";

interface TeacherFeedbackPanelProps {
  feedbackItems: FeedbackItem[];
  /** Map unitId -> Unit for displaying unit title when different from item.title */
  unitMap?: Record<string, Unit>;
  /** Map instructorId -> Instructor for teacher name and avatar */
  instructorsMap?: Record<string, Instructor>;
  title?: string;
  showSeeAllLink?: boolean;
}

export default function TeacherFeedbackPanel({
  feedbackItems,
  unitMap = {},
  instructorsMap = {},
  title = "Feedback",
  showSeeAllLink = true,
}: TeacherFeedbackPanelProps) {
  const sectionStyles: React.CSSProperties = {
    marginBottom: 32,
  };

  const headingRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  };

  const headingStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: GRAY_900,
  };

  const seeAllStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: MAIN_GREEN,
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  const listStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  if (feedbackItems.length === 0) {
    return null;
  }

  return (
    <section style={sectionStyles}>
      <div style={headingRowStyles}>
        <h2 style={headingStyles}>{title}</h2>
        {showSeeAllLink && (
          <button type="button" style={seeAllStyles}>
            See all
          </button>
        )}
      </div>
      <div style={listStyles}>
        {feedbackItems.map((item) => (
          <FeedbackCard
            key={item.id}
            feedback={item}
            unitTitle={unitMap[item.unitId]?.title ?? item.title}
            instructor={
              item.sourceType === "teacher" && item.instructorId
                ? instructorsMap[item.instructorId]
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

interface FeedbackCardProps {
  feedback: FeedbackItem;
  unitTitle: string;
  instructor?: Instructor;
}

function FeedbackCard({ feedback, unitTitle, instructor }: FeedbackCardProps) {
  const contentStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  const unitTitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: GRAY_900,
  };

  const bodyStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    color: GRAY_600,
    lineHeight: 1.5,
  };

  const sourceRowStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  };

  const sourceNameStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: GRAY_900,
  };

  const seeMoreStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: MAIN_GREEN,
    textDecoration: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    alignSelf: "flex-start",
  };

  const isFromSam = feedback.sourceType === "sam";

  return (
    <Card>
      <div style={contentStyles}>
        <h4 style={unitTitleStyles}>{unitTitle}</h4>
        <p style={bodyStyles}>{feedback.body}</p>
        {feedback.ctaLabel && (
          <button type="button" style={seeMoreStyles}>
            {feedback.ctaLabel}
          </button>
        )}
        <div style={sourceRowStyles}>
          {isFromSam ? (
            <>
              <Avatar
                src={whiteTreeLogo}
                name="SAIPIENS"
                size={32}
                imageScale={0.8}
              />
              <span style={sourceNameStyles}>Sam</span>
            </>
          ) : instructor ? (
            <>
              <Avatar
                src={instructor.avatarUrl}
                name={instructor.name}
                size={32}
              />
              <span style={sourceNameStyles}>{instructor.name}</span>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
