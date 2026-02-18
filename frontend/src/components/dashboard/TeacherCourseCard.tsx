import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import TintedImage from "../ui/TintedImage";
import { GRAY_900, GRAY_500, PRIMARY } from "../../theme/colors";
import historyLogo from "../../assets/history-logo.png";
import scienceLogo from "../../assets/science-logo.png";

const courseIconMap: Record<string, string> = {
  history: historyLogo,
  science: scienceLogo,
};

interface TeacherCourseCardProps {
  id: string;
  title: string;
  studentCount: number;
  icon: string;
}

export default function TeacherCourseCard({
  id,
  title,
  studentCount,
  icon,
}: TeacherCourseCardProps) {
  const navigate = useNavigate();

  const headerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  };

  const iconStyles: React.CSSProperties = {
    width: 40,
    height: 40,
    objectFit: "contain",
  };

  const titleStyles: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: GRAY_900,
  };

  const infoSectionStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  };

  const infoTextStyles: React.CSSProperties = {
    fontSize: 14,
    color: GRAY_500,
  };

  const iconSrc = courseIconMap[icon];

  return (
    <Card>
      <div style={headerStyles}>
        {iconSrc && (
          <TintedImage
            src={iconSrc}
            color={PRIMARY}
            width={40}
            height={40}
            style={iconStyles}
          />
        )}
        <h3 style={titleStyles}>{title}</h3>
      </div>
      <div style={infoSectionStyles}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={GRAY_500}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span style={infoTextStyles}>
          {studentCount} student{studentCount !== 1 ? "s" : ""}
        </span>
      </div>
      <Button
        variant="primary"
        onClick={() => navigate(`/teacher/course/${id}`)}
        style={{ padding: "10px 20px", fontSize: 14 }}
      >
        View Course
      </Button>
    </Card>
  );
}
