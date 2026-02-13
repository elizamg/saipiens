import AwardCard from "./AwardCard";
import { GRAY_900 } from "../../theme/colors";
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
    return null;
  }

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}>{title}</h2>
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
