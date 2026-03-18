export interface CourseIconOption {
  key: string;
  label: string;
}

export const COURSE_ICON_OPTIONS: CourseIconOption[] = [
  { key: "general", label: "General" },
  { key: "history", label: "History" },
  { key: "science", label: "Science" },
  { key: "computer", label: "Computer Science" },
  { key: "math", label: "Math" },
  { key: "art", label: "Art" },
  { key: "religion", label: "Religion" },
  { key: "music", label: "Music" },
  { key: "globe", label: "Geography" },
];

export function CourseIcon({
  icon,
  size = 28,
  color = "currentColor",
}: {
  icon: string;
  size?: number;
  color?: string;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: color,
    style: { flexShrink: 0 },
  };

  switch (icon) {
    case "history":
      // Waving flag on a pole
      return (
        <svg {...props}>
          <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
        </svg>
      );
    case "science":
      // Wide Erlenmeyer flask — short narrow neck, wide body, rounded bottom corners
      return (
        <svg {...props}>
          <path d="M9 3h6v5L22 20a2 2 0 01-2 2H4a2 2 0 01-2-2L9 8z" />
        </svg>
      );
    case "computer":
      // Laptop / monitor
      return (
        <svg {...props}>
          <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
        </svg>
      );
    case "math":
    case "calculator":
      // Calculator — body with display cutout + button grid (evenodd rule)
      return (
        <svg {...props} fillRule="evenodd">
          <path d="M5 2A3 3 0 002 5v14a3 3 0 003 3h14a3 3 0 003-3V5a3 3 0 00-3-3H5zM6 6h12v3H6V6zM6 12h2v2H6v-2zM10 12h2v2h-2v-2zM14 12h2v2h-2v-2zM6 16h2v2H6v-2zM10 16h2v2h-2v-2zM14 16h2v2h-2v-2z" />
        </svg>
      );
    case "art":
      // Artist palette
      return (
        <svg {...props}>
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case "music":
      // Music note
      return (
        <svg {...props}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    case "globe":
      // Globe
      return (
        <svg {...props}>
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />
        </svg>
      );
    case "religion":
      // Latin cross
      return (
        <svg {...props}>
          <path d="M10 2h4v7h7v4h-7v9h-4v-9H3v-4h7V2z" />
        </svg>
      );
    default:
      // "general" and unknown keys → filled book
      return (
        <svg {...props}>
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v8l2.5-1.5L13 12V4h5v16z" />
        </svg>
      );
  }
}
