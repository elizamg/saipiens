import type { Student, Course, Unit } from "../types/domain";

export const mockInstructor: Student = {
  id: "instructor-1",
  name: "Ms. Gallagher",
  yearLabel: "Instructor",
};

export interface TeacherCourse {
  id: string;
  title: string;
  studentCount: number;
  icon: string;
}

export const teacherCourses: TeacherCourse[] = [
  { id: "1", title: "American History", studentCount: 28, icon: "history" },
  { id: "2", title: "Physics 7", studentCount: 31, icon: "science" },
  { id: "3", title: "World History", studentCount: 26, icon: "history" },
  { id: "4", title: "Chemistry", studentCount: 24, icon: "science" },
  { id: "5", title: "Earth Science", studentCount: 29, icon: "science" },
];

/** Convert teacher courses to the Course type for the sidebar. */
export const sidebarCourses: Course[] = teacherCourses.map((c) => ({
  id: c.id,
  title: c.title,
  icon: c.icon,
  instructorIds: [mockInstructor.id],
  enrolledStudentIds: [],
}));

/** Mock units per course for the teacher course detail page. */
export const teacherUnitsMap: Record<string, Unit[]> = {
  "1": [
    { id: "u1-1", courseId: "1", title: "The American Revolution", status: "active" },
    { id: "u1-2", courseId: "1", title: "The Civil War", status: "active" },
    { id: "u1-3", courseId: "1", title: "Reconstruction Era", status: "locked" },
  ],
  "2": [
    { id: "u2-1", courseId: "2", title: "Forces & Motion", status: "active" },
    { id: "u2-2", courseId: "2", title: "Energy & Work", status: "active" },
    { id: "u2-3", courseId: "2", title: "Waves & Sound", status: "locked" },
  ],
  "3": [
    { id: "u3-1", courseId: "3", title: "Ancient Civilizations", status: "active" },
    { id: "u3-2", courseId: "3", title: "The Middle Ages", status: "active" },
    { id: "u3-3", courseId: "3", title: "The Renaissance", status: "locked" },
  ],
  "4": [
    { id: "u4-1", courseId: "4", title: "Atomic Structure", status: "active" },
    { id: "u4-2", courseId: "4", title: "Chemical Bonding", status: "active" },
    { id: "u4-3", courseId: "4", title: "Reactions & Equations", status: "locked" },
  ],
  "5": [
    { id: "u5-1", courseId: "5", title: "Rocks & Minerals", status: "active" },
    { id: "u5-2", courseId: "5", title: "Weather & Climate", status: "active" },
    { id: "u5-3", courseId: "5", title: "Plate Tectonics", status: "locked" },
  ],
};
