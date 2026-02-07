import React from "react";
import { useNavigate } from "react-router-dom";
import { MAIN_GREEN, WHITE, TRANSPARENT_GREEN } from "../../theme/colors";
import whiteTreeLogo from "../../assets/white-tree.png";
import TintedImage from "../ui/TintedImage";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

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
    label: "Courses",
    path: "/courses",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Progress",
    path: "/progress",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
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
}

export default function SidebarNav({ activePath }: SidebarNavProps) {
  const navigate = useNavigate();

  const sidebarStyles: React.CSSProperties = {
    width: 240,
    background: MAIN_GREEN,
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
    backgroundColor: isActive ? TRANSPARENT_GREEN : "transparent",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    border: "none",
    width: "100%",
    textAlign: "left",
    fontSize: 15,
    fontWeight: isActive ? 600 : 400,
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
      {navItems.map((item) => (
        <button
          key={item.path}
          style={navItemStyles(activePath === item.path)}
          onClick={() => navigate(item.path)}
          onMouseEnter={(e) => {
            if (activePath !== item.path) {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }
          }}
          onMouseLeave={(e) => {
            if (activePath !== item.path) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
