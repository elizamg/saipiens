import UnitCard from "./UnitCard";
import { GRAY_900 } from "../../theme/colors";
import type { Unit, UnitProgress } from "../../types/domain";

interface ActiveUnitsProps {
  units: Unit[];
  courseId: string;
  title?: string;
  progressMap?: Record<string, UnitProgress>;
  routePrefix?: string;
}

export default function ActiveUnits({
  units,
  courseId,
  title = "Units",
  progressMap,
  routePrefix,
}: ActiveUnitsProps) {
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

  const listStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  // Sort: active first, then completed, then locked
  const sortedUnits = [...units].sort((a, b) => {
    const order: Record<string, number> = { active: 0, ready: 0, completed: 1, locked: 2, processing: 3, review: 3, error: 4 };
    return (order[a.status] ?? 0) - (order[b.status] ?? 0);
  });

  return (
    <section style={sectionStyles}>
      <h2 style={headingStyles}>{title}</h2>
      <div style={listStyles}>
        {sortedUnits.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            courseId={courseId}
            progress={progressMap?.[unit.id]}
            routePrefix={routePrefix}
          />
        ))}
      </div>
    </section>
  );
}
