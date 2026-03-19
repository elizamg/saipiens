import AwardCard from "./AwardCard";
import SectionIcon from "../ui/SectionIcon";
import { GRAY_900, GRAY_200, GRAY_500 } from "../../theme/colors";
import type { Award, Course } from "../../types/domain";

interface AwardsGridProps {
  awards: Award[];
  title?: string;
  coursesMap?: Record<string, Course>;
  showCourseName?: boolean;
}

export default function AwardsGrid({
  awards,
  title = "Your Awards",
  coursesMap,
  showCourseName = false,
}: AwardsGridProps) {
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

  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 16,
  };

  if (awards.length === 0) {
    return (
      <section style={sectionStyles}>
        <h2 style={headingStyles}><SectionIcon name="trophy" color="#b08d57" />{title}</h2>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "32px 24px",
          border: `2px dashed ${GRAY_200}`,
          borderRadius: 16,
        }}>
          <SectionIcon name="trophy" color="#b08d57" size={40} />
          <p style={{ margin: 0, fontSize: 14, color: GRAY_500, textAlign: "center" }}>
            Complete units to earn awards!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}><SectionIcon name="trophy" color="#b08d57" />{title}</h2>
      <div style={gridStyles}>
        {awards.map((award) => {
          const courseName = showCourseName && coursesMap
            ? coursesMap[award.courseId]?.title
            : undefined;
          return (
            <AwardCard
              key={award.id}
              award={award}
              courseName={courseName}
            />
          );
        })}
      </div>
    </section>
  );
}
