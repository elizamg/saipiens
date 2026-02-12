// Muted palette: soft grey surface, muted violet/lavender/olive. Analogous harmony.
// Surface (replaces cream): soft warm grey for backgrounds
export const SURFACE = "#f2f1ef";
export const CREAM = SURFACE; // alias for existing imports

// Muted accent colors — desaturated so they combine without clashing
export const OLIVE = "#a39e72";
export const LAVENDER = "#9a98b5";
export const PRIMARY = "#8b7a9e";

// Success: muted sage (harmonizes with olive, reads as success)
export const SUCCESS_GREEN = "#5c8f6a";

// Semantic: primary tint for selected/current state (muted purple)
export const TRANSPARENT_PRIMARY = "rgba(139, 122, 158, 0.18)";

// Legacy / aliases
export const LIGHTER_GREEN = LAVENDER;
export const MAIN_GREEN = PRIMARY;
export const MID_GREEN = OLIVE;
export const DARKER_GREEN = OLIVE;
export const DARK_ACCENT = "#504b43";
export const TRANSPARENT_GREEN = TRANSPARENT_PRIMARY;

// Gradients (muted)
export const BLUE_MAIN = "rgb(59, 130, 246)";
export const GREEN_GRADIENT = `linear-gradient(90deg, ${SUCCESS_GREEN}, #4a7c59)`;
export const GREEN_GRADIENT_VERTICAL = `linear-gradient(180deg, ${LAVENDER} 0%, ${PRIMARY} 100%)`;
export const RADIAL_GREEN = `radial-gradient(circle, ${LAVENDER}, ${PRIMARY})`;
export const WHITE_GREEN_GRADIENT = `linear-gradient(180deg, #ffffff, ${LAVENDER})`;

// Neutral Colors
export const WHITE = "#ffffff";
export const GRAY_50 = "#f9fafb";
export const GRAY_100 = "#f3f4f6";
export const GRAY_200 = "#e5e7eb";
export const GRAY_300 = "#d1d5db";
export const GRAY_400 = "#9ca3af";
export const GRAY_500 = "#6b7280";
export const GRAY_600 = "#4b5563";
export const GRAY_700 = "#374151";
export const GRAY_800 = "#1f2937";
export const GRAY_900 = "#111827";
