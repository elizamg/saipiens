import type {
  Student,
  Instructor,
  Course,
  Unit,
  Award,
  FeedbackItem,
  Objective,
  Question,
  StudentObjectiveProgress,
  ChatThread,
  ChatMessage,
} from "../types/domain";

// ============ STUDENTS ============
export const students: Student[] = [
  {
    id: "stu_1",
    name: "John Doe",
    yearLabel: "3rd year",
    avatarUrl: undefined,
  },
];

// ============ INSTRUCTORS ============
export const instructors: Instructor[] = [
  {
    id: "ins_1",
    name: "Dr. Sarah Mitchell",
    avatarUrl: undefined,
  },
  {
    id: "ins_2",
    name: "Prof. James Wilson",
    avatarUrl: undefined,
  },
  {
    id: "ins_3",
    name: "Dr. Emily Chen",
    avatarUrl: undefined,
  },
];

// ============ COURSES ============
export const courses: Course[] = [
  {
    id: "crs_1",
    title: "American History",
    icon: "📜",
    instructorIds: ["ins_1"],
    enrolledStudentIds: ["stu_1"],
  },
  {
    id: "crs_2",
    title: "Physics 7",
    icon: "⚛️",
    instructorIds: ["ins_2", "ins_3"],
    enrolledStudentIds: ["stu_1"],
  },
];

// ============ UNITS ============
export const units: Unit[] = [
  // American History units
  {
    id: "unit_ah_1",
    courseId: "crs_1",
    title: "Unit 1: Colonial America",
    status: "completed",
  },
  {
    id: "unit_ah_2",
    courseId: "crs_1",
    title: "Unit 2: Revolutionary War",
    status: "active",
  },
  // Physics 7 units
  {
    id: "unit_ph_6",
    courseId: "crs_2",
    title: "Unit 6: Thermodynamics",
    status: "completed",
  },
  {
    id: "unit_ph_7",
    courseId: "crs_2",
    title: "Unit 7: Electricity",
    status: "locked",
  },
  {
    id: "unit_ph_8",
    courseId: "crs_2",
    title: "Unit 8: Magnetism",
    status: "active",
  },
];

// ============ OBJECTIVES ============
// Each objective (Knowledge 1, Skill 1, etc.) can have multiple questions
export const objectives: Objective[] = [
  // Unit 6 (Thermodynamics) - COMPLETED (all objectives have 3 stars)
  { id: "obj_6_k1", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 1" },
  { id: "obj_6_k2", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 2" },
  { id: "obj_6_s1", unitId: "unit_ph_6", kind: "skill", title: "Skill 1" },

  // Unit 8 (Magnetism) - IN PROGRESS
  { id: "obj_8_k1", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 1" },
  { id: "obj_8_k2", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 2" },
  { id: "obj_8_k3", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 3" },
  { id: "obj_8_s1", unitId: "unit_ph_8", kind: "skill", title: "Skill 1" },
  { id: "obj_8_s2", unitId: "unit_ph_8", kind: "skill", title: "Skill 2" },
];

// ============ QUESTIONS ============
// Each objective has 3 questions at difficulty 1, 2, and 3
export const questions: Question[] = [
  // Unit 6, Knowledge 1 - ALL COMPLETED
  { id: "q_6k1_d1", objectiveId: "obj_6_k1", difficultyStars: 1, prompt: "What is the first law of thermodynamics in simple terms?" },
  { id: "q_6k1_d2", objectiveId: "obj_6_k1", difficultyStars: 2, prompt: "Explain how the first law applies to an adiabatic process." },
  { id: "q_6k1_d3", objectiveId: "obj_6_k1", difficultyStars: 3, prompt: "Derive the work done by an ideal gas in an isothermal expansion using the first law." },

  // Unit 6, Knowledge 2 - ALL COMPLETED
  { id: "q_6k2_d1", objectiveId: "obj_6_k2", difficultyStars: 1, prompt: "What is entropy?" },
  { id: "q_6k2_d2", objectiveId: "obj_6_k2", difficultyStars: 2, prompt: "How does entropy relate to the second law of thermodynamics?" },
  { id: "q_6k2_d3", objectiveId: "obj_6_k2", difficultyStars: 3, prompt: "Calculate the entropy change when ice melts at 0°C. Given: heat of fusion = 334 J/g." },

  // Unit 6, Skill 1 - ALL COMPLETED
  { id: "q_6s1_d1", objectiveId: "obj_6_s1", difficultyStars: 1, prompt: "A gas expands from 1L to 2L at constant pressure of 100 kPa. Calculate the work done." },
  { id: "q_6s1_d2", objectiveId: "obj_6_s1", difficultyStars: 2, prompt: "Calculate the work done by an ideal gas expanding isothermally from 2L to 6L at 300K (n=1 mol)." },
  { id: "q_6s1_d3", objectiveId: "obj_6_s1", difficultyStars: 3, prompt: "A Carnot engine operates between 500K and 300K. If it absorbs 1000J of heat, calculate work output and efficiency." },

  // Unit 8, Knowledge 1 - COMPLETED (3 stars)
  { id: "q_8k1_d1", objectiveId: "obj_8_k1", difficultyStars: 1, prompt: "What creates a magnetic field around a wire?" },
  { id: "q_8k1_d2", objectiveId: "obj_8_k1", difficultyStars: 2, prompt: "Describe the shape and direction of magnetic field lines around a current-carrying wire." },
  { id: "q_8k1_d3", objectiveId: "obj_8_k1", difficultyStars: 3, prompt: "Using the right-hand rule, explain how to determine field direction. How does field strength vary with distance?" },

  // Unit 8, Knowledge 2 - PARTIAL (2 stars, working on 3-star)
  { id: "q_8k2_d1", objectiveId: "obj_8_k2", difficultyStars: 1, prompt: "What is an electromagnet?" },
  { id: "q_8k2_d2", objectiveId: "obj_8_k2", difficultyStars: 2, prompt: "List two ways to increase the strength of an electromagnet." },
  { id: "q_8k2_d3", objectiveId: "obj_8_k2", difficultyStars: 3, prompt: "Explain all factors affecting electromagnet strength and derive the relationship B = μ₀nI for a solenoid." },

  // Unit 8, Knowledge 3 - NOT STARTED (0 stars, on 1-star question)
  { id: "q_8k3_d1", objectiveId: "obj_8_k3", difficultyStars: 1, prompt: "What is electromagnetic induction?" },
  { id: "q_8k3_d2", objectiveId: "obj_8_k3", difficultyStars: 2, prompt: "State Faraday's law of electromagnetic induction." },
  { id: "q_8k3_d3", objectiveId: "obj_8_k3", difficultyStars: 3, prompt: "Derive the EMF induced in a rotating coil and explain its applications in generators." },

  // Unit 8, Skill 1 - COMPLETED (3 stars)
  { id: "q_8s1_d1", objectiveId: "obj_8_s1", difficultyStars: 1, prompt: "A wire carries 1A. Is the magnetic field at 1cm stronger or weaker than at 2cm?" },
  { id: "q_8s1_d2", objectiveId: "obj_8_s1", difficultyStars: 2, prompt: "Calculate the magnetic field strength at 5cm from a wire carrying 2A. Use μ₀ = 4π × 10⁻⁷ T·m/A." },
  { id: "q_8s1_d3", objectiveId: "obj_8_s1", difficultyStars: 3, prompt: "Two parallel wires 10cm apart carry currents of 5A in opposite directions. Calculate the field at the midpoint." },

  // Unit 8, Skill 2 - NOT STARTED (0 stars, on 1-star question)
  { id: "q_8s2_d1", objectiveId: "obj_8_s2", difficultyStars: 1, prompt: "A solenoid has 100 turns. If we double the turns, what happens to the magnetic field?" },
  { id: "q_8s2_d2", objectiveId: "obj_8_s2", difficultyStars: 2, prompt: "Calculate the magnetic field inside a solenoid with 500 turns, length 20cm, carrying 3A." },
  { id: "q_8s2_d3", objectiveId: "obj_8_s2", difficultyStars: 3, prompt: "Design a solenoid to produce a 0.01T field using 2A current. Specify turns and length needed." },
];

// ============ STUDENT OBJECTIVE PROGRESS ============
// earnedStars = highest difficulty completed (0, 1, 2, or 3)
// currentQuestionId = the question currently being worked on
export const studentObjectiveProgress: StudentObjectiveProgress[] = [
  // Unit 6 - ALL COMPLETED (3 stars each)
  { studentId: "stu_1", objectiveId: "obj_6_k1", earnedStars: 3, currentQuestionId: "q_6k1_d3", updatedAt: "2024-01-10T15:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_k2", earnedStars: 3, currentQuestionId: "q_6k2_d3", updatedAt: "2024-01-11T14:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s1", earnedStars: 3, currentQuestionId: "q_6s1_d3", updatedAt: "2024-01-12T16:00:00Z" },

  // Unit 8 - MIXED PROGRESS
  { studentId: "stu_1", objectiveId: "obj_8_k1", earnedStars: 3, currentQuestionId: "q_8k1_d3", updatedAt: "2024-01-15T10:30:00Z" }, // Completed
  { studentId: "stu_1", objectiveId: "obj_8_k2", earnedStars: 2, currentQuestionId: "q_8k2_d3", updatedAt: "2024-01-15T11:00:00Z" }, // Working on 3-star
  { studentId: "stu_1", objectiveId: "obj_8_k3", earnedStars: 0, currentQuestionId: "q_8k3_d1", updatedAt: "2024-01-15T11:30:00Z" }, // Not started
  { studentId: "stu_1", objectiveId: "obj_8_s1", earnedStars: 3, currentQuestionId: "q_8s1_d3", updatedAt: "2024-01-15T12:15:00Z" }, // Completed
  { studentId: "stu_1", objectiveId: "obj_8_s2", earnedStars: 0, currentQuestionId: "q_8s2_d1", updatedAt: "2024-01-15T12:30:00Z" }, // Not started
];

// ============ CHAT THREADS ============
// One thread per objective
export const chatThreads: ChatThread[] = [
  // Unit 6 Threads (completed)
  { id: "thr_6_k1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-10T15:00:00Z" },
  { id: "thr_6_k2", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-11T14:00:00Z" },
  { id: "thr_6_s1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },

  // Unit 8 Threads (in progress)
  { id: "thr_8_k1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-15T10:30:00Z" },
  { id: "thr_8_k2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-15T11:10:00Z" },
  { id: "thr_8_k3", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k3", title: "Knowledge 3", kind: "knowledge", lastMessageAt: "2024-01-15T11:30:00Z" },
  { id: "thr_8_s1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-15T12:15:00Z" },
  { id: "thr_8_s2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-15T12:30:00Z" },
];

// ============ CHAT MESSAGES ============
// IMPORTANT: Messages contain ONLY student responses, tutor feedback, and system messages.
// Question prompts are NEVER stored as messages - they are application state rendered in the header.
export const chatMessages: ChatMessage[] = [
  // ========== Unit 6 Messages (all completed) ==========

  // Thread 6_k1 - Completed all 3 questions (2 messages per question)
  { id: "msg_6k1_1", threadId: "thr_6_k1", questionId: "q_6k1_d1", role: "student", content: "Energy cannot be created or destroyed, only transferred.", createdAt: "2024-01-10T13:10:00Z" },
  { id: "msg_6k1_2", threadId: "thr_6_k1", questionId: "q_6k1_d1", role: "tutor", content: "Correct! You've earned 1 star. Moving to the next question.", createdAt: "2024-01-10T13:15:00Z" },
  { id: "msg_6k1_3", threadId: "thr_6_k1", questionId: "q_6k1_d2", role: "student", content: "In adiabatic processes, Q=0, so ΔU = -W. All energy change comes from work.", createdAt: "2024-01-10T13:30:00Z" },
  { id: "msg_6k1_4", threadId: "thr_6_k1", questionId: "q_6k1_d2", role: "tutor", content: "Excellent! 2 stars earned. Ready for the final challenge.", createdAt: "2024-01-10T13:35:00Z" },
  { id: "msg_6k1_5", threadId: "thr_6_k1", questionId: "q_6k1_d3", role: "student", content: "For isothermal: ΔU=0, so Q=W. W = ∫PdV = ∫(nRT/V)dV = nRT·ln(V₂/V₁)", createdAt: "2024-01-10T14:30:00Z" },
  { id: "msg_6k1_6", threadId: "thr_6_k1", questionId: "q_6k1_d3", role: "tutor", content: "Perfect derivation! You've mastered this topic with 3 stars. Great work!", createdAt: "2024-01-10T15:00:00Z", metadata: { isSystemMessage: true } },

  // ========== Unit 8 Messages (mixed progress) ==========

  // Thread 8_k1 - COMPLETED (3 stars)
  { id: "msg_8k1_1", threadId: "thr_8_k1", questionId: "q_8k1_d1", role: "student", content: "Electric current flowing through the wire creates the magnetic field.", createdAt: "2024-01-15T09:10:00Z" },
  { id: "msg_8k1_2", threadId: "thr_8_k1", questionId: "q_8k1_d1", role: "tutor", content: "Correct! 1 star earned. Moving to the next question.", createdAt: "2024-01-15T09:15:00Z" },
  { id: "msg_8k1_3", threadId: "thr_8_k1", questionId: "q_8k1_d2", role: "student", content: "The field lines form concentric circles around the wire. Direction follows the right-hand rule.", createdAt: "2024-01-15T09:30:00Z" },
  { id: "msg_8k1_4", threadId: "thr_8_k1", questionId: "q_8k1_d2", role: "tutor", content: "Excellent! 2 stars. One more to master this topic.", createdAt: "2024-01-15T09:35:00Z" },
  { id: "msg_8k1_5", threadId: "thr_8_k1", questionId: "q_8k1_d3", role: "student", content: "Point thumb in current direction, fingers curl in field direction. Field strength B ∝ 1/r, decreasing with distance.", createdAt: "2024-01-15T10:15:00Z" },

  // Thread 8_k2 - PARTIAL (2 stars, working on 3-star question)
  { id: "msg_8k2_1", threadId: "thr_8_k2", questionId: "q_8k2_d1", role: "student", content: "A magnet made by passing electric current through a coil of wire.", createdAt: "2024-01-15T10:40:00Z" },
  { id: "msg_8k2_2", threadId: "thr_8_k2", questionId: "q_8k2_d1", role: "tutor", content: "Correct! 1 star earned. Moving to the next question.", createdAt: "2024-01-15T10:45:00Z" },
  { id: "msg_8k2_3", threadId: "thr_8_k2", questionId: "q_8k2_d2", role: "student", content: "Increase the current, and add more coil turns.", createdAt: "2024-01-15T10:55:00Z" },
  { id: "msg_8k2_4", threadId: "thr_8_k2", questionId: "q_8k2_d2", role: "tutor", content: "Great! 2 stars. Ready for the challenge question.", createdAt: "2024-01-15T11:00:00Z" },
  { id: "msg_8k2_5", threadId: "thr_8_k2", questionId: "q_8k2_d3", role: "student", content: "Current, number of turns, and core material all affect strength. For the derivation...", createdAt: "2024-01-15T11:10:00Z" },
  { id: "msg_8k2_6", threadId: "thr_8_k2", questionId: "q_8k2_d3", role: "tutor", content: "Good start! You mentioned the factors correctly. Can you complete the derivation using Ampère's law?", createdAt: "2024-01-15T11:15:00Z" },

  // Thread 8_k3 - NOT STARTED (0 stars) - no messages yet, question shown in header

  // Thread 8_s1 - COMPLETED (3 stars)
  { id: "msg_8s1_1", threadId: "thr_8_s1", questionId: "q_8s1_d1", role: "student", content: "Stronger at 1cm because field decreases with distance.", createdAt: "2024-01-15T11:40:00Z" },
  { id: "msg_8s1_2", threadId: "thr_8_s1", questionId: "q_8s1_d1", role: "tutor", content: "Correct! 1 star. Moving to the next question.", createdAt: "2024-01-15T11:45:00Z" },
  { id: "msg_8s1_3", threadId: "thr_8_s1", questionId: "q_8s1_d2", role: "student", content: "B = μ₀I/(2πr) = (4π × 10⁻⁷ × 2)/(2π × 0.05) = 8 × 10⁻⁶ T = 8 μT", createdAt: "2024-01-15T11:55:00Z" },
  { id: "msg_8s1_4", threadId: "thr_8_s1", questionId: "q_8s1_d2", role: "tutor", content: "Perfect calculation! 2 stars.", createdAt: "2024-01-15T12:00:00Z" },
  { id: "msg_8s1_5", threadId: "thr_8_s1", questionId: "q_8s1_d3", role: "student", content: "Each wire creates B = μ₀I/(2πr) at midpoint. r=5cm. Fields add (opposite currents). B_total = 2 × (4π×10⁻⁷×5)/(2π×0.05) = 4×10⁻⁵ T = 40 μT", createdAt: "2024-01-15T12:10:00Z" },
  { id: "msg_8s1_6", threadId: "thr_8_s1", questionId: "q_8s1_d3", role: "tutor", content: "Excellent! You correctly identified that fields add and calculated perfectly. 3 stars - great work!", createdAt: "2024-01-15T12:15:00Z", metadata: { isSystemMessage: true } },

  // Thread 8_s2 - NOT STARTED (0 stars) - no messages yet, question shown in header
];

// ============ AWARDS ============
export const awards: Award[] = [
  { id: "awd_1", courseId: "crs_1", title: "Early Riser", subtitle: "Completed 5 lessons before 8 AM", iconKey: "early" },
  { id: "awd_2", courseId: "crs_2", title: "Medium Master", subtitle: "Achieved 80% on 10 quizzes", iconKey: "medium" },
  { id: "awd_3", courseId: "crs_2", title: "Night Owl", subtitle: "Studied for 20 hours after 9 PM", iconKey: "owl" },
];

// ============ FEEDBACK ============
// Each feedback item is associated with a unit. Source is either a teacher (instructorId) or Sam (AI).
export const feedbackItems: FeedbackItem[] = [
  {
    id: "fb_1",
    courseId: "crs_1",
    unitId: "unit_ah_1",
    title: "Unit 1: Colonial America",
    body: "Your analytical writing has improved significantly. Great progress on the essay structure and use of primary sources.",
    ctaLabel: "See more",
    sourceType: "teacher",
    instructorId: "ins_1",
  },
  {
    id: "fb_2",
    courseId: "crs_2",
    unitId: "unit_ph_6",
    title: "Unit 6: Thermodynamics",
    body: "Excellent work on the momentum experiment and applying the first law. You've shown strong grasp of entropy concepts.",
    ctaLabel: "See more",
    sourceType: "sam",
  },
  {
    id: "fb_3",
    courseId: "crs_2",
    unitId: "unit_ph_8",
    title: "Unit 8: Magnetism",
    body: "Good progress on Knowledge 2. Keep working on the derivation for electromagnet strength—you're close.",
    ctaLabel: "See more",
    sourceType: "teacher",
    instructorId: "ins_2",
  },
];

// Student-award mapping
export const studentAwards: Record<string, string[]> = {
  stu_1: ["awd_1", "awd_2", "awd_3"],
};
