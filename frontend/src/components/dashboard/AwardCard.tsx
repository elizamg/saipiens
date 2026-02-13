import Card from "../ui/Card";
import TintedImage from "../ui/TintedImage";
import { GRAY_900, GRAY_500, SUCCESS_GREEN } from "../../theme/colors";
import { getAwardIcon } from "../../utils/awardIcons";
import type { Award } from "../../types/domain";

interface AwardCardProps {
  award: Award;
  courseName?: string;
}

export default function AwardCard({ award, courseName }: AwardCardProps) {
  const contentStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  };

  const iconStyles: React.CSSProperties = {
    width: 64,
    height: 64,
    marginBottom: 12,
    objectFit: "contain",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: GRAY_900,
    marginBottom: 4,
  };

  const subtitleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    color: GRAY_500,
    marginBottom: courseName ? 8 : 0,
  };

  const courseTagStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 11,
    fontWeight: 500,
    color: SUCCESS_GREEN,
    backgroundColor: "rgba(92, 143, 106, 0.18)",
    padding: "4px 8px",
    borderRadius: 4,
  };

  return (
    <Card padding={16}>
      <div style={contentStyles}>
        <TintedImage
          src={getAwardIcon(award.iconKey)}
          color={SUCCESS_GREEN}
          alt={award.title}
          width={64}
          height={64}
          style={iconStyles}
        />
        <h4 style={titleStyles}>{award.title}</h4>
        <p style={subtitleStyles}>{award.subtitle}</p>
        {courseName && <span style={courseTagStyles}>{courseName}</span>}
      </div>
    </Card>
  );
}
