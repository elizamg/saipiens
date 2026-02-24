import type { Student, Course, Unit, Objective } from "../types/domain";

export const teacherStudents: Student[] = [
  { id: "ts-1", name: "Aisha Johnson", yearLabel: "7th grade" },
  { id: "ts-2", name: "Ben Carter", yearLabel: "8th grade" },
  { id: "ts-3", name: "Carmen Reyes", yearLabel: "7th grade" },
  { id: "ts-4", name: "David Kim", yearLabel: "8th grade" },
  { id: "ts-5", name: "Elena Petrova", yearLabel: "7th grade" },
  { id: "ts-6", name: "Finn O'Brien", yearLabel: "8th grade" },
  { id: "ts-7", name: "Grace Nakamura", yearLabel: "7th grade" },
  { id: "ts-8", name: "Hector Morales", yearLabel: "8th grade" },
  { id: "ts-9", name: "Iris Chang", yearLabel: "7th grade" },
  { id: "ts-10", name: "Jamal Williams", yearLabel: "8th grade" },
  { id: "ts-11", name: "Kira Patel", yearLabel: "7th grade" },
  { id: "ts-12", name: "Leo Fontaine", yearLabel: "8th grade" },
  { id: "ts-13", name: "Maya Singh", yearLabel: "7th grade" },
  { id: "ts-14", name: "Noah Fischer", yearLabel: "8th grade" },
  { id: "ts-15", name: "Olivia Torres", yearLabel: "7th grade" },
  { id: "ts-16", name: "Pablo Gutierrez", yearLabel: "8th grade" },
  { id: "ts-17", name: "Quinn Murphy", yearLabel: "7th grade" },
  { id: "ts-18", name: "Rosa Almeida", yearLabel: "8th grade" },
];

export const courseRosterMap: Record<string, string[]> = {
  "1": ["ts-1", "ts-2", "ts-3", "ts-4", "ts-5", "ts-6", "ts-7", "ts-8", "ts-9", "ts-10", "ts-11", "ts-12", "ts-13", "ts-14", "ts-15", "ts-16", "ts-17", "ts-18", "ts-extra-1", "ts-extra-2", "ts-extra-3", "ts-extra-4", "ts-extra-5", "ts-extra-6", "ts-extra-7", "ts-extra-8", "ts-extra-9", "ts-extra-10"],
  "2": ["ts-1", "ts-2", "ts-3", "ts-4", "ts-5", "ts-6", "ts-7", "ts-8", "ts-9", "ts-10", "ts-11", "ts-12", "ts-13", "ts-14", "ts-15", "ts-16", "ts-17", "ts-18", "ts-extra-11", "ts-extra-12", "ts-extra-13", "ts-extra-14", "ts-extra-15", "ts-extra-16", "ts-extra-17", "ts-extra-18", "ts-extra-19", "ts-extra-20", "ts-extra-21", "ts-extra-22", "ts-extra-23"],
  "3": ["ts-1", "ts-3", "ts-5", "ts-7", "ts-9", "ts-11", "ts-13", "ts-15", "ts-17", "ts-2", "ts-4", "ts-6", "ts-8", "ts-10", "ts-12", "ts-14", "ts-16", "ts-18", "ts-extra-24", "ts-extra-25", "ts-extra-26", "ts-extra-27", "ts-extra-28", "ts-extra-29", "ts-extra-30", "ts-extra-31"],
  "4": ["ts-1", "ts-2", "ts-3", "ts-4", "ts-5", "ts-6", "ts-7", "ts-8", "ts-9", "ts-10", "ts-11", "ts-12", "ts-13", "ts-14", "ts-15", "ts-16", "ts-17", "ts-18", "ts-extra-32", "ts-extra-33", "ts-extra-34", "ts-extra-35", "ts-extra-36", "ts-extra-37"],
  "5": ["ts-1", "ts-2", "ts-3", "ts-4", "ts-5", "ts-6", "ts-7", "ts-8", "ts-9", "ts-10", "ts-11", "ts-12", "ts-13", "ts-14", "ts-15", "ts-16", "ts-17", "ts-18", "ts-extra-38", "ts-extra-39", "ts-extra-40", "ts-extra-41", "ts-extra-42", "ts-extra-43", "ts-extra-44", "ts-extra-45", "ts-extra-46", "ts-extra-47", "ts-extra-48"],
};

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

/** Mock objectives per unit for the teacher course editor. */
export const teacherObjectivesMap: Record<string, Objective[]> = {
  // American History — The American Revolution
  "u1-1": [
    { id: "o1-1-1", unitId: "u1-1", kind: "knowledge", title: "Causes of the Revolution", description: "Identify the political and economic factors that led to colonial unrest.", order: 1, enabled: true },
    { id: "o1-1-2", unitId: "u1-1", kind: "knowledge", title: "Key Figures", description: "Describe the roles of Washington, Jefferson, Franklin, and other founders.", order: 2, enabled: true },
    { id: "o1-1-3", unitId: "u1-1", kind: "knowledge", title: "Declaration of Independence", description: "Explain the purpose and main ideas of the Declaration.", order: 3, enabled: true },
    { id: "o1-1-4", unitId: "u1-1", kind: "skill", title: "Primary Source Analysis", description: "Analyze excerpts from Revolutionary-era documents for bias and purpose.", order: 4, enabled: true },
    { id: "o1-1-5", unitId: "u1-1", kind: "skill", title: "Timeline Construction", description: "Sequence major events from the Stamp Act to the Treaty of Paris.", order: 5, enabled: true },
    { id: "o1-1-6", unitId: "u1-1", kind: "capstone", title: "Revolution Debate", description: "Argue whether independence was inevitable using evidence from multiple sources.", order: 6, enabled: true },
  ],
  // American History — The Civil War
  "u1-2": [
    { id: "o1-2-1", unitId: "u1-2", kind: "knowledge", title: "Causes of the Civil War", description: "Identify the economic, social, and political causes of the conflict.", order: 1, enabled: true },
    { id: "o1-2-2", unitId: "u1-2", kind: "knowledge", title: "Major Battles", description: "Describe the significance of Gettysburg, Antietam, and Fort Sumter.", order: 2, enabled: true },
    { id: "o1-2-3", unitId: "u1-2", kind: "knowledge", title: "Emancipation Proclamation", description: "Explain the purpose and impact of Lincoln's executive order.", order: 3, enabled: true },
    { id: "o1-2-4", unitId: "u1-2", kind: "skill", title: "Map Reading", description: "Interpret Civil War battle maps and troop movement diagrams.", order: 4, enabled: true },
    { id: "o1-2-5", unitId: "u1-2", kind: "skill", title: "Compare Perspectives", description: "Compare Union and Confederate viewpoints on key issues.", order: 5, enabled: true },
    { id: "o1-2-6", unitId: "u1-2", kind: "capstone", title: "Leadership Analysis", description: "Evaluate the leadership decisions of Lincoln and Davis during the war.", order: 6, enabled: true },
  ],
  // American History — Reconstruction Era
  "u1-3": [
    { id: "o1-3-1", unitId: "u1-3", kind: "knowledge", title: "Reconstruction Plans", description: "Compare Lincoln's, Johnson's, and Congressional Reconstruction plans.", order: 1, enabled: true },
    { id: "o1-3-2", unitId: "u1-3", kind: "knowledge", title: "Amendments 13–15", description: "Explain the purpose and impact of each Reconstruction amendment.", order: 2, enabled: true },
    { id: "o1-3-3", unitId: "u1-3", kind: "knowledge", title: "Freedmen's Bureau", description: "Describe the role of the Freedmen's Bureau in post-war society.", order: 3, enabled: true },
    { id: "o1-3-4", unitId: "u1-3", kind: "skill", title: "Cause and Effect Mapping", description: "Trace the long-term effects of Reconstruction policies.", order: 4, enabled: true },
    { id: "o1-3-5", unitId: "u1-3", kind: "skill", title: "Evaluating Sources", description: "Assess reliability of Reconstruction-era newspaper accounts.", order: 5, enabled: true },
    { id: "o1-3-6", unitId: "u1-3", kind: "capstone", title: "Reconstruction Success or Failure", description: "Argue whether Reconstruction achieved its goals using primary sources.", order: 6, enabled: true },
  ],
  // Physics 7 — Forces & Motion
  "u2-1": [
    { id: "o2-1-1", unitId: "u2-1", kind: "knowledge", title: "Newton's First Law", description: "Define inertia and explain objects at rest and in motion.", order: 1, enabled: true },
    { id: "o2-1-2", unitId: "u2-1", kind: "knowledge", title: "Newton's Second Law", description: "Apply F=ma to calculate force, mass, and acceleration.", order: 2, enabled: true },
    { id: "o2-1-3", unitId: "u2-1", kind: "knowledge", title: "Newton's Third Law", description: "Identify action-reaction force pairs in everyday scenarios.", order: 3, enabled: true },
    { id: "o2-1-4", unitId: "u2-1", kind: "skill", title: "Free Body Diagrams", description: "Draw and label free body diagrams for objects in various states.", order: 4, enabled: true },
    { id: "o2-1-5", unitId: "u2-1", kind: "skill", title: "Problem Solving with F=ma", description: "Solve multi-step problems involving net force and acceleration.", order: 5, enabled: true },
    { id: "o2-1-6", unitId: "u2-1", kind: "capstone", title: "Roller Coaster Design", description: "Design a roller coaster segment and calculate forces at key points.", order: 6, enabled: true },
  ],
  // Physics 7 — Energy & Work
  "u2-2": [
    { id: "o2-2-1", unitId: "u2-2", kind: "knowledge", title: "Kinetic Energy", description: "Define kinetic energy and calculate it using KE = ½mv².", order: 1, enabled: true },
    { id: "o2-2-2", unitId: "u2-2", kind: "knowledge", title: "Potential Energy", description: "Distinguish gravitational and elastic potential energy.", order: 2, enabled: true },
    { id: "o2-2-3", unitId: "u2-2", kind: "knowledge", title: "Conservation of Energy", description: "Explain how energy transforms between kinetic and potential forms.", order: 3, enabled: true },
    { id: "o2-2-4", unitId: "u2-2", kind: "skill", title: "Energy Bar Charts", description: "Construct energy bar charts for systems at different positions.", order: 4, enabled: true },
    { id: "o2-2-5", unitId: "u2-2", kind: "capstone", title: "Energy Audit Project", description: "Analyze energy transformations in a real-world mechanical system.", order: 5, enabled: true },
  ],
  // Physics 7 — Waves & Sound
  "u2-3": [
    { id: "o2-3-1", unitId: "u2-3", kind: "knowledge", title: "Wave Properties", description: "Define wavelength, frequency, amplitude, and wave speed.", order: 1, enabled: true },
    { id: "o2-3-2", unitId: "u2-3", kind: "knowledge", title: "Sound Waves", description: "Explain how sound travels through different media.", order: 2, enabled: true },
    { id: "o2-3-3", unitId: "u2-3", kind: "knowledge", title: "Doppler Effect", description: "Describe how motion affects perceived pitch.", order: 3, enabled: true },
    { id: "o2-3-4", unitId: "u2-3", kind: "skill", title: "Wave Calculations", description: "Use v = fλ to solve wave speed problems.", order: 4, enabled: true },
    { id: "o2-3-5", unitId: "u2-3", kind: "skill", title: "Interpreting Wave Diagrams", description: "Read and compare transverse and longitudinal wave diagrams.", order: 5, enabled: true },
    { id: "o2-3-6", unitId: "u2-3", kind: "capstone", title: "Musical Instrument Analysis", description: "Explain how a chosen instrument produces and modifies sound waves.", order: 6, enabled: true },
  ],
  // World History — Ancient Civilizations
  "u3-1": [
    { id: "o3-1-1", unitId: "u3-1", kind: "knowledge", title: "Mesopotamia", description: "Describe the geography, government, and innovations of Mesopotamia.", order: 1, enabled: true },
    { id: "o3-1-2", unitId: "u3-1", kind: "knowledge", title: "Ancient Egypt", description: "Explain the social hierarchy, religion, and achievements of Egypt.", order: 2, enabled: true },
    { id: "o3-1-3", unitId: "u3-1", kind: "knowledge", title: "Indus Valley", description: "Identify key features of Indus Valley urban planning and trade.", order: 3, enabled: true },
    { id: "o3-1-4", unitId: "u3-1", kind: "skill", title: "Artifact Analysis", description: "Examine artifacts to draw conclusions about daily life.", order: 4, enabled: true },
    { id: "o3-1-5", unitId: "u3-1", kind: "capstone", title: "Civilization Comparison", description: "Compare two ancient civilizations across political, economic, and social dimensions.", order: 5, enabled: true },
  ],
  // World History — The Middle Ages
  "u3-2": [
    { id: "o3-2-1", unitId: "u3-2", kind: "knowledge", title: "Feudal System", description: "Explain the hierarchy of lords, vassals, and serfs.", order: 1, enabled: true },
    { id: "o3-2-2", unitId: "u3-2", kind: "knowledge", title: "The Crusades", description: "Describe the causes, events, and effects of the Crusades.", order: 2, enabled: true },
    { id: "o3-2-3", unitId: "u3-2", kind: "knowledge", title: "The Black Death", description: "Explain how the plague spread and its impact on European society.", order: 3, enabled: true },
    { id: "o3-2-4", unitId: "u3-2", kind: "skill", title: "Medieval Map Interpretation", description: "Analyze trade routes and territorial changes on medieval maps.", order: 4, enabled: true },
    { id: "o3-2-5", unitId: "u3-2", kind: "skill", title: "Document-Based Questions", description: "Answer questions using excerpts from medieval chronicles.", order: 5, enabled: true },
    { id: "o3-2-6", unitId: "u3-2", kind: "capstone", title: "Fall of Feudalism Essay", description: "Argue which factors most contributed to the decline of feudalism.", order: 6, enabled: true },
  ],
  // World History — The Renaissance
  "u3-3": [
    { id: "o3-3-1", unitId: "u3-3", kind: "knowledge", title: "Origins in Italy", description: "Explain why the Renaissance began in Italian city-states.", order: 1, enabled: true },
    { id: "o3-3-2", unitId: "u3-3", kind: "knowledge", title: "Art and Humanism", description: "Describe how humanist philosophy influenced Renaissance art.", order: 2, enabled: true },
    { id: "o3-3-3", unitId: "u3-3", kind: "knowledge", title: "Scientific Revolution Seeds", description: "Identify Renaissance thinkers who laid groundwork for modern science.", order: 3, enabled: true },
    { id: "o3-3-4", unitId: "u3-3", kind: "skill", title: "Art Comparison", description: "Compare medieval and Renaissance artworks to identify stylistic shifts.", order: 4, enabled: true },
    { id: "o3-3-5", unitId: "u3-3", kind: "capstone", title: "Renaissance Impact Assessment", description: "Evaluate the Renaissance's lasting impact on Western culture and thought.", order: 5, enabled: true },
  ],
  // Chemistry — Atomic Structure
  "u4-1": [
    { id: "o4-1-1", unitId: "u4-1", kind: "knowledge", title: "Subatomic Particles", description: "Identify protons, neutrons, and electrons and their properties.", order: 1, enabled: true },
    { id: "o4-1-2", unitId: "u4-1", kind: "knowledge", title: "Atomic Models", description: "Trace the evolution from Dalton's model to the electron cloud.", order: 2, enabled: true },
    { id: "o4-1-3", unitId: "u4-1", kind: "knowledge", title: "Electron Configuration", description: "Write electron configurations for the first 20 elements.", order: 3, enabled: true },
    { id: "o4-1-4", unitId: "u4-1", kind: "skill", title: "Periodic Table Reading", description: "Use the periodic table to predict element properties.", order: 4, enabled: true },
    { id: "o4-1-5", unitId: "u4-1", kind: "skill", title: "Isotope Calculations", description: "Calculate average atomic mass from isotope data.", order: 5, enabled: true },
    { id: "o4-1-6", unitId: "u4-1", kind: "capstone", title: "Element Profile Project", description: "Research and present a comprehensive profile of a chosen element.", order: 6, enabled: true },
  ],
  // Chemistry — Chemical Bonding
  "u4-2": [
    { id: "o4-2-1", unitId: "u4-2", kind: "knowledge", title: "Ionic Bonds", description: "Explain how electrons are transferred to form ionic compounds.", order: 1, enabled: true },
    { id: "o4-2-2", unitId: "u4-2", kind: "knowledge", title: "Covalent Bonds", description: "Describe electron sharing in molecular compounds.", order: 2, enabled: true },
    { id: "o4-2-3", unitId: "u4-2", kind: "knowledge", title: "Metallic Bonds", description: "Explain the electron sea model and metallic properties.", order: 3, enabled: true },
    { id: "o4-2-4", unitId: "u4-2", kind: "skill", title: "Lewis Dot Structures", description: "Draw Lewis structures for simple molecules and polyatomic ions.", order: 4, enabled: true },
    { id: "o4-2-5", unitId: "u4-2", kind: "capstone", title: "Bond Type Investigation", description: "Predict and test bond types for unknown compounds using properties.", order: 5, enabled: true },
  ],
  // Chemistry — Reactions & Equations
  "u4-3": [
    { id: "o4-3-1", unitId: "u4-3", kind: "knowledge", title: "Types of Reactions", description: "Classify reactions as synthesis, decomposition, single/double replacement, or combustion.", order: 1, enabled: true },
    { id: "o4-3-2", unitId: "u4-3", kind: "knowledge", title: "Balancing Equations", description: "Balance chemical equations using the law of conservation of mass.", order: 2, enabled: true },
    { id: "o4-3-3", unitId: "u4-3", kind: "knowledge", title: "Reaction Rates", description: "Identify factors that affect the speed of chemical reactions.", order: 3, enabled: true },
    { id: "o4-3-4", unitId: "u4-3", kind: "skill", title: "Stoichiometry Problems", description: "Use mole ratios to calculate reactants and products.", order: 4, enabled: true },
    { id: "o4-3-5", unitId: "u4-3", kind: "skill", title: "Predicting Products", description: "Predict products of common reaction types from reactants.", order: 5, enabled: true },
    { id: "o4-3-6", unitId: "u4-3", kind: "capstone", title: "Reaction Design Challenge", description: "Design a multi-step reaction pathway to produce a target compound.", order: 6, enabled: true },
  ],
  // Earth Science — Rocks & Minerals
  "u5-1": [
    { id: "o5-1-1", unitId: "u5-1", kind: "knowledge", title: "Mineral Identification", description: "Use hardness, luster, and streak to identify common minerals.", order: 1, enabled: true },
    { id: "o5-1-2", unitId: "u5-1", kind: "knowledge", title: "Rock Cycle", description: "Describe how igneous, sedimentary, and metamorphic rocks transform.", order: 2, enabled: true },
    { id: "o5-1-3", unitId: "u5-1", kind: "knowledge", title: "Rock Types", description: "Classify rocks by formation process and give examples of each.", order: 3, enabled: true },
    { id: "o5-1-4", unitId: "u5-1", kind: "skill", title: "Specimen Analysis", description: "Examine rock specimens and identify their type and formation.", order: 4, enabled: true },
    { id: "o5-1-5", unitId: "u5-1", kind: "capstone", title: "Geological History Report", description: "Interpret a rock layer sequence to reconstruct local geological history.", order: 5, enabled: true },
  ],
  // Earth Science — Weather & Climate
  "u5-2": [
    { id: "o5-2-1", unitId: "u5-2", kind: "knowledge", title: "Atmosphere Layers", description: "Name and describe the layers of Earth's atmosphere.", order: 1, enabled: true },
    { id: "o5-2-2", unitId: "u5-2", kind: "knowledge", title: "Weather Fronts", description: "Explain how cold, warm, and stationary fronts affect weather.", order: 2, enabled: true },
    { id: "o5-2-3", unitId: "u5-2", kind: "knowledge", title: "Climate vs Weather", description: "Distinguish between short-term weather and long-term climate patterns.", order: 3, enabled: true },
    { id: "o5-2-4", unitId: "u5-2", kind: "skill", title: "Weather Map Reading", description: "Interpret symbols and data on a standard weather map.", order: 4, enabled: true },
    { id: "o5-2-5", unitId: "u5-2", kind: "skill", title: "Data Graphing", description: "Create and analyze temperature and precipitation graphs.", order: 5, enabled: true },
    { id: "o5-2-6", unitId: "u5-2", kind: "capstone", title: "Climate Change Analysis", description: "Evaluate evidence for climate change and propose mitigation strategies.", order: 6, enabled: true },
  ],
  // Earth Science — Plate Tectonics
  "u5-3": [
    { id: "o5-3-1", unitId: "u5-3", kind: "knowledge", title: "Continental Drift", description: "Describe Wegener's hypothesis and the evidence supporting it.", order: 1, enabled: true },
    { id: "o5-3-2", unitId: "u5-3", kind: "knowledge", title: "Plate Boundaries", description: "Identify convergent, divergent, and transform boundaries and their effects.", order: 2, enabled: true },
    { id: "o5-3-3", unitId: "u5-3", kind: "knowledge", title: "Earthquakes and Volcanoes", description: "Explain why seismic and volcanic activity concentrates at plate boundaries.", order: 3, enabled: true },
    { id: "o5-3-4", unitId: "u5-3", kind: "skill", title: "Seismograph Interpretation", description: "Read seismograph data to determine earthquake magnitude and location.", order: 4, enabled: true },
    { id: "o5-3-5", unitId: "u5-3", kind: "skill", title: "Plate Movement Modeling", description: "Model plate movements and predict future continental positions.", order: 5, enabled: true },
    { id: "o5-3-6", unitId: "u5-3", kind: "capstone", title: "Natural Hazard Preparedness Plan", description: "Develop an evidence-based preparedness plan for a tectonic hazard zone.", order: 6, enabled: true },
  ],
};

/** Mock units per course for the teacher course detail page. */
export const teacherUnitsMap: Record<string, Unit[]> = {
  "1": [
    { id: "u1-1", courseId: "1", title: "The American Revolution", status: "active" },
    { id: "u1-2", courseId: "1", title: "The Civil War", status: "active" },
    { id: "u1-3", courseId: "1", title: "Reconstruction Era", status: "active" },
  ],
  "2": [
    { id: "u2-1", courseId: "2", title: "Forces & Motion", status: "active" },
    { id: "u2-2", courseId: "2", title: "Energy & Work", status: "active" },
    { id: "u2-3", courseId: "2", title: "Waves & Sound", status: "active" },
  ],
  "3": [
    { id: "u3-1", courseId: "3", title: "Ancient Civilizations", status: "active" },
    { id: "u3-2", courseId: "3", title: "The Middle Ages", status: "active" },
    { id: "u3-3", courseId: "3", title: "The Renaissance", status: "active" },
  ],
  "4": [
    { id: "u4-1", courseId: "4", title: "Atomic Structure", status: "active" },
    { id: "u4-2", courseId: "4", title: "Chemical Bonding", status: "active" },
    { id: "u4-3", courseId: "4", title: "Reactions & Equations", status: "active" },
  ],
  "5": [
    { id: "u5-1", courseId: "5", title: "Rocks & Minerals", status: "active" },
    { id: "u5-2", courseId: "5", title: "Weather & Climate", status: "active" },
    { id: "u5-3", courseId: "5", title: "Plate Tectonics", status: "active" },
  ],
};
