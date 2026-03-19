import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PRIMARY_GRADIENT, WHITE } from "../../theme/colors";
import whiteTreeLogo from "../../assets/white-tree.png";
import TintedImage from "../ui/TintedImage";
import { getCurrentStudent, listCoursesForStudent } from "../../services/api";
import type { Course } from "../../types/domain";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const coursesIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const navItems: NavItem[] = [
  {
    label: "Home",
    path: "/home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Feedback",
    path: "/feedback",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

interface SidebarNavProps {
  activePath?: string;
  sidebarCourses?: Course[];
  /** Route prefix for all nav links. Empty string for student, "/teacher" for instructor. */
  routePrefix?: string;
}

export default function SidebarNav({ activePath, sidebarCourses, routePrefix = "" }: SidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fetchedCourses, setFetchedCourses] = useState<Course[]>([]);
  const [coursesOpen, setCoursesOpen] = useState(false);

  const courses = sidebarCourses ?? fetchedCourses;
  const homePath = routePrefix || "/home";
  const isCoursesActive =
    (activePath === "/courses" || location.pathname.includes("/course/")) &&
    !location.pathname.includes("/feedback");

  useEffect(() => {
    if (sidebarCourses) return;
    let cancelled = false;
    getCurrentStudent()
      .then((student) => listCoursesForStudent(student.id))
      .then((list) => {
        if (!cancelled) setFetchedCourses(list);
      })
      .catch(() => {
        if (!cancelled) setFetchedCourses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sidebarCourses]);

  const sidebarStyles: React.CSSProperties = {
    width: 240,
    background: PRIMARY_GRADIENT,
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  };

  const logoContainerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    marginBottom: 32,
  };

  const logoStyles: React.CSSProperties = {
    width: 160,
    height: "auto",
  };

  const navItemStyles = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 8,
    color: WHITE,
    backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    border: "none",
    width: "100%",
    textAlign: "left",
    fontSize: 15,
    fontWeight: isActive ? 600 : 400,
  });

  const coursesHeaderStyles = (isActive: boolean): React.CSSProperties => ({
    ...navItemStyles(isActive),
    justifyContent: "space-between",
  });

  const dropdownStyles: React.CSSProperties = {
    marginTop: 4,
    marginBottom: 4,
    paddingLeft: 12,
    borderLeft: "2px solid rgba(255, 255, 255, 0.3)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  };

  const courseLinkStyles = (isActive: boolean): React.CSSProperties => ({
    display: "block",
    padding: "8px 12px",
    borderRadius: 6,
    color: WHITE,
    backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    opacity: isActive ? 1 : 0.9,
  });

  return (
    <nav style={sidebarStyles}>
      <div style={logoContainerStyles}>
        <TintedImage
          src={whiteTreeLogo}
          color={WHITE}
          alt="SAIPIENS"
          width={160}
          style={logoStyles}
        />
      </div>

      {/* Home */}
      <button
        style={navItemStyles(activePath === homePath)}
        onClick={() => navigate(homePath)}
        onMouseEnter={(e) => {
          if (activePath !== homePath) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }}
        onMouseLeave={(e) => {
          if (activePath !== homePath) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {navItems[0].icon}
        {navItems[0].label}
      </button>

      {/* Courses dropdown */}
      <div>
        <button
          style={coursesHeaderStyles(isCoursesActive)}
          onClick={() => setCoursesOpen((open) => !open)}
          onMouseEnter={(e) => {
            if (!isCoursesActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          }}
          onMouseLeave={(e) => {
            if (!isCoursesActive) e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {coursesIcon}
            Courses
          </span>
          <span
            style={{
              transform: coursesOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
        {coursesOpen && (
          <div style={dropdownStyles}>
            {courses.length === 0 ? (
              <span style={{ padding: "8px 12px", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                No courses
              </span>
            ) : (
              courses.map((course) => {
                const isActive = location.pathname === `${routePrefix}/course/${course.id}`;
                return (
                  <button
                    key={course.id}
                    style={courseLinkStyles(isActive)}
                    onClick={() => {
                      navigate(`${routePrefix}/course/${course.id}`);
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {course.title}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Feedback & Settings */}
      {navItems.slice(1).map((item) => {
        const fullPath = `${routePrefix}${item.path}`;
        return (
          <button
            key={item.path}
            style={navItemStyles(activePath === fullPath)}
            onClick={() => navigate(fullPath)}
            onMouseEnter={(e) => {
              if (activePath !== fullPath) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (activePath !== fullPath) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
