import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import { GRAY_300, GRAY_500, PRIMARY } from "../../theme/colors";

interface NewUnitCardProps {
  courseId: string;
}

export default function NewUnitCard({ courseId }: NewUnitCardProps) {
  const navigate = useNavigate();

  const cardOverrides: React.CSSProperties = {
    border: `2px dashed ${GRAY_300}`,
    boxShadow: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  };

  const labelStyles: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: GRAY_500,
  };

  return (
    <Card
      padding={16}
      style={cardOverrides}
      onClick={() => navigate(`/teacher/course/${courseId}/upload`)}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <line
          x1="10"
          y1="3"
          x2="10"
          y2="17"
          stroke={PRIMARY}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="10"
          x2="17"
          y2="10"
          stroke={PRIMARY}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span style={labelStyles}>New Unit</span>
    </Card>
  );
}
