import React from "react";
import Card from "../ui/Card";
import ProgressBar from "../ui/ProgressBar";
import AnimatedNumber from "../ui/AnimatedNumber";
import SectionIcon from "../ui/SectionIcon";
import { GRAY_900, GRAY_500, SUCCESS_GREEN } from "../../theme/colors";

interface CourseStatsBarProps {
  skillCompleted: number;
  skillTotal: number;
  knowledgeCorrect: number;
  knowledgeTotal: number;
  unitsCompleted: number;
  totalUnits: number;
}

export default function CourseStatsBar({
  skillCompleted,
  skillTotal,
  knowledgeCorrect,
  knowledgeTotal,
  unitsCompleted,
  totalUnits,
}: CourseStatsBarProps) {
  const containerStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 32,
  };

  const labelStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 11,
    fontWeight: 600,
    color: GRAY_500,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 6,
  };

  const numberStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: GRAY_900,
    lineHeight: 1,
    marginBottom: 8,
  };

  const fractionStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 400,
    color: GRAY_500,
  };

  const skillPercent = skillTotal > 0 ? Math.round((skillCompleted / skillTotal) * 100) : 0;
  const knowledgePercent = knowledgeTotal > 0 ? Math.round((knowledgeCorrect / knowledgeTotal) * 100) : 0;

  return (
    <div style={containerStyles}>
      <Card>
        <p style={labelStyles}><><SectionIcon name="bolt" color="#7B68A6" size={14} />Skills Progress</></p>
        <p style={numberStyles}>
          <AnimatedNumber value={skillCompleted} /><span style={fractionStyles}>/{skillTotal}</span>
        </p>
        <ProgressBar percent={skillPercent} height={4} />
      </Card>
      <Card>
        <p style={labelStyles}><><SectionIcon name="brain" color="#5c8f6a" size={14} />Knowledge Progress</></p>
        <p style={numberStyles}>
          <AnimatedNumber value={knowledgeCorrect} /><span style={fractionStyles}>/{knowledgeTotal}</span>
        </p>
        <ProgressBar percent={knowledgePercent} height={4} />
      </Card>
      <Card>
        <p style={labelStyles}><><SectionIcon name="check" color="#5c8f6a" size={14} />Units Completed</></p>
        <p style={{ ...numberStyles, color: unitsCompleted > 0 ? SUCCESS_GREEN : GRAY_900 }}>
          <AnimatedNumber value={unitsCompleted} /><span style={fractionStyles}>/{totalUnits}</span>
        </p>
        <ProgressBar percent={totalUnits > 0 ? Math.round((unitsCompleted / totalUnits) * 100) : 0} height={4} />
      </Card>
    </div>
  );
}
