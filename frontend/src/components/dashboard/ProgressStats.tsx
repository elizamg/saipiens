import React from "react";
import Card from "../ui/Card";
import AnimatedNumber from "../ui/AnimatedNumber";
import SectionIcon from "../ui/SectionIcon";
import { GRAY_900, GRAY_500, SUCCESS_GREEN } from "../../theme/colors";

interface ProgressStatsProps {
  skillsMastered: number;
  knowledgeCorrect: number;
  unitsCompleted: number;
  totalUnits: number;
  streakDays?: number;
}

export default function ProgressStats({
  skillsMastered,
  knowledgeCorrect,
  unitsCompleted,
  totalUnits,
  streakDays = 0,
}: ProgressStatsProps) {
  const containerStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  };

  const numberStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    lineHeight: 1,
  };

  const labelStyles: React.CSSProperties = {
    margin: "6px 0 0 0",
    fontSize: 16,
    fontWeight: 500,
    color: GRAY_500,
  };

  return (
    <div style={containerStyles}>
      <Card>
        <p style={numberStyles}>
          <AnimatedNumber value={skillsMastered} />
        </p>
        <p style={labelStyles}><><SectionIcon name="bolt" color="#7B68A6" size={14} />Skills Mastered</></p>
      </Card>
      <Card>
        <p style={numberStyles}>
          <AnimatedNumber value={knowledgeCorrect} />
        </p>
        <p style={labelStyles}><><SectionIcon name="brain" color="#5c8f6a" size={14} />Knowledge Correct</></p>
      </Card>
      <Card>
        <p style={{
          ...numberStyles,
          color: unitsCompleted > 0 ? SUCCESS_GREEN : GRAY_900,
        }}>
          <AnimatedNumber value={unitsCompleted} />
          <span style={{ fontSize: 16, fontWeight: 400, color: GRAY_500 }}>/{totalUnits}</span>
        </p>
        <p style={labelStyles}><><SectionIcon name="check" color="#5c8f6a" size={14} />Units Completed</></p>
      </Card>
      <Card>
        <p style={{
          ...numberStyles,
          color: streakDays > 0 ? "#e8738a" : GRAY_500,
        }}>
          <AnimatedNumber value={streakDays} />
        </p>
        <p style={labelStyles}><><SectionIcon name="flame" color="#e8738a" size={14} />Day Streak</></p>
      </Card>
    </div>
  );
}
