import type {
  Student,
  Instructor,
  Agent,
  Course,
  Unit,
  Award,
  FeedbackItem,
  Objective,
  ItemStage,
  StudentObjectiveProgress,
  ChatThread,
  ChatMessage,
} from "../types/domain";
import whiteTreeLogo from "../assets/white-tree.png";

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

// ============ AGENT ============
export const agent: Agent = {
  id: "agent_sam",
  name: "Sam",
  avatarUrl: whiteTreeLogo,
};

// ============ COURSES ============
export const courses: Course[] = [
  {
    id: "crs_1",
    title: "American History",
    icon: "history",
    instructorIds: ["ins_1"],
    enrolledStudentIds: ["stu_1"],
  },
  {
    id: "crs_2",
    title: "Physics 7",
    icon: "science",
    instructorIds: ["ins_2", "ins_3"],
    enrolledStudentIds: ["stu_1"],
  },
];

// ============ UNITS ============
export const units: Unit[] = [
  { id: "unit_ah_1", courseId: "crs_1", title: "Unit 1: Colonial America", status: "completed" },
  { id: "unit_ah_2", courseId: "crs_1", title: "Unit 2: Revolutionary War", status: "active" },
  { id: "unit_ph_6", courseId: "crs_2", title: "Unit 6: Thermodynamics", status: "completed" },
  { id: "unit_ph_7", courseId: "crs_2", title: "Unit 7: Electricity", status: "locked" },
  { id: "unit_ph_8", courseId: "crs_2", title: "Unit 8: Magnetism", status: "active" },
];

// ============ OBJECTIVES ============
// Each objective has an explicit `order` for chronological sorting within its section.
export const objectives: Objective[] = [
  // -------- Unit 6 (Thermodynamics) - COMPLETED --------
  // Knowledge (5)
  { id: "obj_6_k1", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 1", order: 1 },
  { id: "obj_6_k2", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 2", order: 2 },
  { id: "obj_6_k3", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 3", order: 3 },
  { id: "obj_6_k4", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 4", order: 4 },
  { id: "obj_6_k5", unitId: "unit_ph_6", kind: "knowledge", title: "Knowledge 5", order: 5 },
  // Skills (5)
  { id: "obj_6_s1", unitId: "unit_ph_6", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_6_s2", unitId: "unit_ph_6", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_6_s3", unitId: "unit_ph_6", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_6_s4", unitId: "unit_ph_6", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_6_s5", unitId: "unit_ph_6", kind: "skill", title: "Skill 5", order: 5 },
  // Capstone (1)
  { id: "obj_6_c1", unitId: "unit_ph_6", kind: "capstone", title: "Capstone 1", order: 1 },

  // -------- Unit 8 (Magnetism) - IN PROGRESS --------
  // Knowledge (7)
  { id: "obj_8_k1", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 1", order: 1 },
  { id: "obj_8_k2", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 2", order: 2 },
  { id: "obj_8_k3", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 3", order: 3 },
  { id: "obj_8_k4", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 4", order: 4 },
  { id: "obj_8_k5", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 5", order: 5 },
  { id: "obj_8_k6", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 6", order: 6 },
  { id: "obj_8_k7", unitId: "unit_ph_8", kind: "knowledge", title: "Knowledge 7", order: 7 },
  // Skills (6)
  { id: "obj_8_s1", unitId: "unit_ph_8", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_8_s2", unitId: "unit_ph_8", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_8_s3", unitId: "unit_ph_8", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_8_s4", unitId: "unit_ph_8", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_8_s5", unitId: "unit_ph_8", kind: "skill", title: "Skill 5", order: 5 },
  { id: "obj_8_s6", unitId: "unit_ph_8", kind: "skill", title: "Skill 6", order: 6 },
  // Capstones (2)
  { id: "obj_8_c1", unitId: "unit_ph_8", kind: "capstone", title: "Capstone 1", order: 1 },
  { id: "obj_8_c2", unitId: "unit_ph_8", kind: "capstone", title: "Capstone 2", order: 2 },

  // -------- Unit 1 (Colonial America) - COMPLETED --------
  // Knowledge (5)
  { id: "obj_1_k1", unitId: "unit_ah_1", kind: "knowledge", title: "Knowledge 1", order: 1 },
  { id: "obj_1_k2", unitId: "unit_ah_1", kind: "knowledge", title: "Knowledge 2", order: 2 },
  { id: "obj_1_k3", unitId: "unit_ah_1", kind: "knowledge", title: "Knowledge 3", order: 3 },
  { id: "obj_1_k4", unitId: "unit_ah_1", kind: "knowledge", title: "Knowledge 4", order: 4 },
  { id: "obj_1_k5", unitId: "unit_ah_1", kind: "knowledge", title: "Knowledge 5", order: 5 },
  // Skills (5)
  { id: "obj_1_s1", unitId: "unit_ah_1", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_1_s2", unitId: "unit_ah_1", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_1_s3", unitId: "unit_ah_1", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_1_s4", unitId: "unit_ah_1", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_1_s5", unitId: "unit_ah_1", kind: "skill", title: "Skill 5", order: 5 },
  // Capstone (1)
  { id: "obj_1_c1", unitId: "unit_ah_1", kind: "capstone", title: "Capstone 1", order: 1 },

  // -------- Unit 2 (Revolutionary War) - IN PROGRESS --------
  // Knowledge (6)
  { id: "obj_2_k1", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 1", order: 1 },
  { id: "obj_2_k2", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 2", order: 2 },
  { id: "obj_2_k3", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 3", order: 3 },
  { id: "obj_2_k4", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 4", order: 4 },
  { id: "obj_2_k5", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 5", order: 5 },
  { id: "obj_2_k6", unitId: "unit_ah_2", kind: "knowledge", title: "Knowledge 6", order: 6 },
  // Skills (5)
  { id: "obj_2_s1", unitId: "unit_ah_2", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_2_s2", unitId: "unit_ah_2", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_2_s3", unitId: "unit_ah_2", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_2_s4", unitId: "unit_ah_2", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_2_s5", unitId: "unit_ah_2", kind: "skill", title: "Skill 5", order: 5 },
  // Capstone (1)
  { id: "obj_2_c1", unitId: "unit_ah_2", kind: "capstone", title: "Capstone 1", order: 1 },
];

// ============ ITEM STAGES ============
// Each objective has exactly 3 stages: begin (1), walkthrough (2), challenge (3).
export const itemStages: ItemStage[] = [
  // ======================================================================
  //  UNIT 6 - THERMODYNAMICS
  // ======================================================================

  // --- K1: First Law of Thermodynamics ---
  { id: "stg_6k1_b", itemId: "obj_6_k1", stageType: "begin", order: 1, prompt: "What is the first law of thermodynamics in simple terms?" },
  { id: "stg_6k1_w", itemId: "obj_6_k1", stageType: "walkthrough", order: 2, prompt: "Let's walk through how the first law applies to an adiabatic process step by step.", suggestedQuestions: ["What formula should I use?", "Can you give me a hint about adiabatic processes?", "How does Q relate to W here?"] },
  { id: "stg_6k1_c", itemId: "obj_6_k1", stageType: "challenge", order: 3, prompt: "Derive the work done by an ideal gas in an isothermal expansion using the first law." },

  // --- K2: Entropy and the Second Law ---
  { id: "stg_6k2_b", itemId: "obj_6_k2", stageType: "begin", order: 1, prompt: "What is entropy?" },
  { id: "stg_6k2_w", itemId: "obj_6_k2", stageType: "walkthrough", order: 2, prompt: "Let's explore how entropy relates to the second law of thermodynamics.", suggestedQuestions: ["What is the formula for entropy change?", "Why does entropy always increase?", "How does temperature affect entropy?"] },
  { id: "stg_6k2_c", itemId: "obj_6_k2", stageType: "challenge", order: 3, prompt: "Calculate the entropy change when ice melts at 0\u00b0C. Given: heat of fusion = 334 J/g." },

  // --- K3: Heat Engines and the Carnot Cycle ---
  { id: "stg_6k3_b", itemId: "obj_6_k3", stageType: "begin", order: 1, prompt: "What is a heat engine and what does it do?" },
  { id: "stg_6k3_w", itemId: "obj_6_k3", stageType: "walkthrough", order: 2, prompt: "Let's walk through the four stages of the Carnot cycle and why it represents maximum efficiency.", suggestedQuestions: ["What are the four stages of the Carnot cycle?", "Why is Carnot efficiency the maximum?", "How do I calculate Carnot efficiency?"] },
  { id: "stg_6k3_c", itemId: "obj_6_k3", stageType: "challenge", order: 3, prompt: "Explain why no real engine can be more efficient than a Carnot engine operating between the same temperatures. Use the second law in your reasoning." },

  // --- K4: Thermodynamic Processes ---
  { id: "stg_6k4_b", itemId: "obj_6_k4", stageType: "begin", order: 1, prompt: "Name four common thermodynamic processes and what is held constant in each." },
  { id: "stg_6k4_w", itemId: "obj_6_k4", stageType: "walkthrough", order: 2, prompt: "Let's compare isothermal, adiabatic, isobaric, and isochoric processes on a PV diagram.", suggestedQuestions: ["What is held constant in each process?", "How do the curves differ on a PV diagram?", "Which process does the most work?"] },
  { id: "stg_6k4_c", itemId: "obj_6_k4", stageType: "challenge", order: 3, prompt: "An ideal gas undergoes an adiabatic expansion from V1 to 2V1. If gamma = 1.4 and initial temperature is 300K, find the final temperature." },

  // --- K5: Kinetic Theory of Gases ---
  { id: "stg_6k5_b", itemId: "obj_6_k5", stageType: "begin", order: 1, prompt: "What does the kinetic theory of gases tell us about gas molecules?" },
  { id: "stg_6k5_w", itemId: "obj_6_k5", stageType: "walkthrough", order: 2, prompt: "Let's derive the relationship between average kinetic energy and temperature step by step.", suggestedQuestions: ["What is the kinetic energy formula for gas molecules?", "How does Boltzmann's constant come in?", "What assumptions does kinetic theory make?"] },
  { id: "stg_6k5_c", itemId: "obj_6_k5", stageType: "challenge", order: 3, prompt: "Calculate the root-mean-square speed of nitrogen molecules at 300K. Molar mass of N2 = 28 g/mol." },

  // --- S1: Work in Gas Expansion ---
  { id: "stg_6s1_b", itemId: "obj_6_s1", stageType: "begin", order: 1, prompt: "A gas expands from 1L to 2L at constant pressure of 100 kPa. Calculate the work done." },
  { id: "stg_6s1_w", itemId: "obj_6_s1", stageType: "walkthrough", order: 2, prompt: "Let's work through calculating work done by an ideal gas in isothermal expansion.", suggestedQuestions: ["What is the work formula for isothermal expansion?", "Why do we use integration here?", "How does the ideal gas law simplify this?"] },
  { id: "stg_6s1_c", itemId: "obj_6_s1", stageType: "challenge", order: 3, prompt: "A Carnot engine operates between 500K and 300K. If it absorbs 1000J of heat, calculate work output and efficiency." },

  // --- S2: Heat Transfer Calculations ---
  { id: "stg_6s2_b", itemId: "obj_6_s2", stageType: "begin", order: 1, prompt: "How much heat is needed to raise 500g of water from 20\u00b0C to 80\u00b0C? (c = 4.186 J/g\u00b7\u00b0C)" },
  { id: "stg_6s2_w", itemId: "obj_6_s2", stageType: "walkthrough", order: 2, prompt: "Let's walk through a calorimetry problem where a hot metal is dropped into cold water.", suggestedQuestions: ["What is the calorimetry equation?", "How do I set up the heat balance?", "What does specific heat capacity mean here?"] },
  { id: "stg_6s2_c", itemId: "obj_6_s2", stageType: "challenge", order: 3, prompt: "A 200g copper block at 300\u00b0C is dropped into 500g of water at 20\u00b0C in an insulated container. Find the equilibrium temperature. (c_Cu = 0.385 J/g\u00b7\u00b0C)" },

  // --- S3: Efficiency Calculations ---
  { id: "stg_6s3_b", itemId: "obj_6_s3", stageType: "begin", order: 1, prompt: "A heat engine absorbs 800J and exhausts 500J. What is its efficiency?" },
  { id: "stg_6s3_w", itemId: "obj_6_s3", stageType: "walkthrough", order: 2, prompt: "Let's calculate the maximum theoretical efficiency of a power plant operating between 600K and 300K.", suggestedQuestions: ["What is the efficiency formula for a heat engine?", "How does Carnot efficiency apply here?", "What is the relationship between Qh, Qc, and W?"] },
  { id: "stg_6s3_c", itemId: "obj_6_s3", stageType: "challenge", order: 3, prompt: "A refrigerator removes 400J of heat from the cold reservoir per cycle, with a COP of 4.0. Calculate the work input and heat exhausted to the hot reservoir." },

  // --- S4: PV Diagram Analysis ---
  { id: "stg_6s4_b", itemId: "obj_6_s4", stageType: "begin", order: 1, prompt: "On a PV diagram, what does the area under a curve represent?" },
  { id: "stg_6s4_w", itemId: "obj_6_s4", stageType: "walkthrough", order: 2, prompt: "Let's analyze a complete thermodynamic cycle on a PV diagram and calculate net work done.", suggestedQuestions: ["How do I find work from a PV diagram?", "What does the enclosed area represent?", "How do I handle different process types in one cycle?"] },
  { id: "stg_6s4_c", itemId: "obj_6_s4", stageType: "challenge", order: 3, prompt: "A gas undergoes a cycle: isobaric expansion at 200 kPa from 1L to 3L, isochoric cooling to 100 kPa, isobaric compression back to 1L, isochoric heating to start. Calculate the net work." },

  // --- S5: Entropy Change Calculations ---
  { id: "stg_6s5_b", itemId: "obj_6_s5", stageType: "begin", order: 1, prompt: "What is the formula for entropy change in a reversible process?" },
  { id: "stg_6s5_w", itemId: "obj_6_s5", stageType: "walkthrough", order: 2, prompt: "Let's calculate the total entropy change when a hot object is placed in contact with a cold reservoir.", suggestedQuestions: ["How do I calculate entropy change for each body?", "Why is total entropy change positive?", "What makes this process irreversible?"] },
  { id: "stg_6s5_c", itemId: "obj_6_s5", stageType: "challenge", order: 3, prompt: "1 mol of an ideal gas expands isothermally and reversibly at 400K from 10L to 40L. Calculate the entropy change of the gas, surroundings, and universe." },

  // --- C1: Explain Thermodynamics Concepts ---
  { id: "stg_6c1_b", itemId: "obj_6_c1", stageType: "begin", order: 1, prompt: "In your own words, explain the main ideas from this unit: the first and second laws of thermodynamics, entropy, and how a heat engine works." },
  { id: "stg_6c1_w", itemId: "obj_6_c1", stageType: "walkthrough", order: 2, prompt: "Let's go through the key concepts from the lesson one by one. Explain back: what the first law says about energy, what entropy means, and why no heat engine can be 100% efficient.", suggestedQuestions: ["How do I explain the first law in simple terms?", "What's the link between entropy and the second law?", "Why is Carnot efficiency a maximum?"] },
  { id: "stg_6c1_c", itemId: "obj_6_c1", stageType: "challenge", order: 3, prompt: "Explain the thermodynamics of a heat engine in your own words: how it uses heat flow to do work, how the first and second laws apply, and what limits its efficiency. Use ideas and examples from the lesson." },

  // ======================================================================
  //  UNIT 8 - MAGNETISM
  // ======================================================================

  // --- K1: Magnetic Fields Around Wires (COMPLETED - challenge_complete) ---
  { id: "stg_8k1_b", itemId: "obj_8_k1", stageType: "begin", order: 1, prompt: "What creates a magnetic field around a wire?" },
  { id: "stg_8k1_w", itemId: "obj_8_k1", stageType: "walkthrough", order: 2, prompt: "Let's walk through the shape and direction of magnetic field lines around a current-carrying wire.", suggestedQuestions: ["How do I use the right-hand rule?", "What shape do the field lines form?", "How does current direction affect the field?"] },
  { id: "stg_8k1_c", itemId: "obj_8_k1", stageType: "challenge", order: 3, prompt: "Using the right-hand rule, explain how to determine field direction. How does field strength vary with distance?" },

  // --- K2: Electromagnets (challenge_started - walkthrough done, on challenge) ---
  { id: "stg_8k2_b", itemId: "obj_8_k2", stageType: "begin", order: 1, prompt: "What is an electromagnet?" },
  { id: "stg_8k2_w", itemId: "obj_8_k2", stageType: "walkthrough", order: 2, prompt: "Let's work through how electromagnets work and how to increase their strength step by step.", suggestedQuestions: ["What factors affect electromagnet strength?", "Why does an iron core make it stronger?", "What is the solenoid field formula?"] },
  { id: "stg_8k2_c", itemId: "obj_8_k2", stageType: "challenge", order: 3, prompt: "Explain all factors affecting electromagnet strength and derive the relationship B = \u03bc\u2080nI for a solenoid." },

  // --- K3: Electromagnetic Induction (not_started - begin done, on walkthrough, no student walkthrough msgs) ---
  { id: "stg_8k3_b", itemId: "obj_8_k3", stageType: "begin", order: 1, prompt: "What is electromagnetic induction?" },
  { id: "stg_8k3_w", itemId: "obj_8_k3", stageType: "walkthrough", order: 2, prompt: "Let's explore Faraday's law of electromagnetic induction step by step.", suggestedQuestions: ["What is Faraday's law in math form?", "What causes an EMF to be induced?", "How does the rate of flux change matter?"] },
  { id: "stg_8k3_c", itemId: "obj_8_k3", stageType: "challenge", order: 3, prompt: "Derive the EMF induced in a rotating coil and explain its applications in generators." },

  // --- K4: Lenz's Law (not_started) ---
  { id: "stg_8k4_b", itemId: "obj_8_k4", stageType: "begin", order: 1, prompt: "What does Lenz's law tell us about the direction of an induced current?" },
  { id: "stg_8k4_w", itemId: "obj_8_k4", stageType: "walkthrough", order: 2, prompt: "Let's apply Lenz's law to several scenarios involving a magnet moving through a coil.", suggestedQuestions: ["How do I determine the direction of induced current?", "What does Lenz's law say about opposing change?", "Can you show me an example with a bar magnet?"] },
  { id: "stg_8k4_c", itemId: "obj_8_k4", stageType: "challenge", order: 3, prompt: "A bar magnet is dropped through a copper tube. Explain the motion of the magnet using Lenz's law and energy conservation." },

  // --- K5: Magnetic Flux (COMPLETED - challenge_complete) ---
  { id: "stg_8k5_b", itemId: "obj_8_k5", stageType: "begin", order: 1, prompt: "What is magnetic flux and how is it different from the magnetic field?" },
  { id: "stg_8k5_w", itemId: "obj_8_k5", stageType: "walkthrough", order: 2, prompt: "Let's work through how magnetic flux depends on field strength, area, and angle.", suggestedQuestions: ["What is the magnetic flux formula?", "When is flux at its maximum?", "What does the angle theta represent?"] },
  { id: "stg_8k5_c", itemId: "obj_8_k5", stageType: "challenge", order: 3, prompt: "A circular coil of radius 10 cm with 50 turns is placed in a uniform 0.2 T field. Calculate the flux when the coil normal is at 0\u00b0, 30\u00b0, 60\u00b0, and 90\u00b0 to the field." },

  // --- K6: Magnetic Materials / Ferromagnetism (not_started) ---
  { id: "stg_8k6_b", itemId: "obj_8_k6", stageType: "begin", order: 1, prompt: "Why are some materials magnetic and others are not?" },
  { id: "stg_8k6_w", itemId: "obj_8_k6", stageType: "walkthrough", order: 2, prompt: "Let's explore magnetic domains, hysteresis, and what makes ferromagnetic materials special.", suggestedQuestions: ["What are magnetic domains?", "What is a hysteresis loop?", "Why are some materials ferromagnetic?"] },
  { id: "stg_8k6_c", itemId: "obj_8_k6", stageType: "challenge", order: 3, prompt: "Explain the hysteresis loop for a ferromagnetic material. What do remanence and coercivity represent, and how do they affect the choice of material for a permanent magnet vs. a transformer core?" },

  // --- K7: Earth's Magnetic Field (not_started - begin done, on walkthrough, no student walkthrough msgs) ---
  { id: "stg_8k7_b", itemId: "obj_8_k7", stageType: "begin", order: 1, prompt: "What causes Earth's magnetic field?" },
  { id: "stg_8k7_w", itemId: "obj_8_k7", stageType: "walkthrough", order: 2, prompt: "Let's walk through the structure of Earth's magnetic field, including declination, inclination, and the magnetosphere.", suggestedQuestions: ["What is magnetic declination?", "How does the magnetosphere protect Earth?", "Why do the magnetic poles move?"] },
  { id: "stg_8k7_c", itemId: "obj_8_k7", stageType: "challenge", order: 3, prompt: "Explain how Earth's magnetic field protects the planet from solar wind. Include the role of the Van Allen belts and describe what would happen if the field weakened significantly." },

  // --- S1: Calculating B-field from Wire / Biot-Savart (COMPLETED - challenge_complete) ---
  { id: "stg_8s1_b", itemId: "obj_8_s1", stageType: "begin", order: 1, prompt: "A wire carries 1A. Is the magnetic field at 1cm stronger or weaker than at 2cm?" },
  { id: "stg_8s1_w", itemId: "obj_8_s1", stageType: "walkthrough", order: 2, prompt: "Let's calculate the magnetic field strength at a given distance from a current-carrying wire using the Biot-Savart law.", suggestedQuestions: ["What is the Biot-Savart law formula?", "How does distance affect field strength?", "What units does the magnetic field use?"] },
  { id: "stg_8s1_c", itemId: "obj_8_s1", stageType: "challenge", order: 3, prompt: "Two parallel wires 10cm apart carry currents of 5A in opposite directions. Calculate the field at the midpoint." },

  // --- S2: Solenoid Field Calculations (challenge_started - walkthrough done, on challenge) ---
  { id: "stg_8s2_b", itemId: "obj_8_s2", stageType: "begin", order: 1, prompt: "A solenoid has 100 turns. If we double the turns, what happens to the magnetic field?" },
  { id: "stg_8s2_w", itemId: "obj_8_s2", stageType: "walkthrough", order: 2, prompt: "Let's work through calculating the magnetic field inside a solenoid step by step.", suggestedQuestions: ["What is the solenoid field formula?", "How do I find turns per unit length?", "What is the permeability of free space?"] },
  { id: "stg_8s2_c", itemId: "obj_8_s2", stageType: "challenge", order: 3, prompt: "Design a solenoid to produce a 0.01T field using 2A current. Specify turns and length needed." },

  // --- S3: Faraday's Law Calculations (not_started - begin done, on walkthrough, no student walkthrough msgs) ---
  { id: "stg_8s3_b", itemId: "obj_8_s3", stageType: "begin", order: 1, prompt: "If you move a magnet faster into a coil, what happens to the induced EMF?" },
  { id: "stg_8s3_w", itemId: "obj_8_s3", stageType: "walkthrough", order: 2, prompt: "Let's calculate the EMF induced in a coil when the magnetic flux changes, using Faraday's law.", suggestedQuestions: ["How do I calculate change in flux?", "What role does the number of turns play?", "How do I find the direction of induced current?"] },
  { id: "stg_8s3_c", itemId: "obj_8_s3", stageType: "challenge", order: 3, prompt: "A 200-turn coil with area 0.05 m\u00b2 is in a magnetic field that changes from 0.1T to 0.5T in 0.2 seconds. Calculate the induced EMF and the direction of induced current." },

  // --- S4: Transformer Calculations (not_started) ---
  { id: "stg_8s4_b", itemId: "obj_8_s4", stageType: "begin", order: 1, prompt: "If a transformer has 100 turns on the primary and 500 turns on the secondary, is it a step-up or step-down transformer?" },
  { id: "stg_8s4_w", itemId: "obj_8_s4", stageType: "walkthrough", order: 2, prompt: "Let's work through transformer voltage and current ratios step by step.", suggestedQuestions: ["What is the transformer turns ratio equation?", "How are voltage and current related in a transformer?", "What is the difference between step-up and step-down?"] },
  { id: "stg_8s4_c", itemId: "obj_8_s4", stageType: "challenge", order: 3, prompt: "A power station transmits 50 kW at 250V. Calculate the current, then redesign using a step-up transformer to 10,000V. Compare power losses in transmission lines with resistance 2 ohms." },

  // --- S5: Force on Moving Charges / Lorentz Force (not_started) ---
  { id: "stg_8s5_b", itemId: "obj_8_s5", stageType: "begin", order: 1, prompt: "What happens to a charged particle moving through a magnetic field?" },
  { id: "stg_8s5_w", itemId: "obj_8_s5", stageType: "walkthrough", order: 2, prompt: "Let's calculate the Lorentz force on a charged particle and determine its circular path in a uniform field.", suggestedQuestions: ["What is the Lorentz force equation?", "Why does the particle move in a circle?", "How do I find the radius of the circular path?"] },
  { id: "stg_8s5_c", itemId: "obj_8_s5", stageType: "challenge", order: 3, prompt: "A proton (m=1.67\u00d710\u207b\u00b2\u2077 kg, q=1.6\u00d710\u207b\u00b9\u2079 C) enters a 0.5T magnetic field at 2\u00d710\u2076 m/s perpendicular to the field. Calculate the radius of its circular path and its cyclotron frequency." },

  // --- S6: Magnetic Circuit Problems (COMPLETED - challenge_complete) ---
  { id: "stg_8s6_b", itemId: "obj_8_s6", stageType: "begin", order: 1, prompt: "What is a magnetic circuit, and how is it analogous to an electric circuit?" },
  { id: "stg_8s6_w", itemId: "obj_8_s6", stageType: "walkthrough", order: 2, prompt: "Let's work through analyzing a magnetic circuit using reluctance, magnetomotive force, and flux.", suggestedQuestions: ["What is reluctance and how is it calculated?", "How is a magnetic circuit like an electric circuit?", "How do I handle an air gap in the circuit?"] },
  { id: "stg_8s6_c", itemId: "obj_8_s6", stageType: "challenge", order: 3, prompt: "A toroidal core has mean radius 10 cm, cross-section area 4 cm\u00b2, relative permeability 2000, and a 1mm air gap. If a 500-turn coil carries 2A, calculate the flux in the core." },

  // --- C1: Explain Magnetism and Motors ---
  { id: "stg_8c1_b", itemId: "obj_8_c1", stageType: "begin", order: 1, prompt: "In your own words, explain how magnetic fields, electromagnets, and electromagnetic induction work together in a device like an electric motor. What concepts from the lesson are involved?" },
  { id: "stg_8c1_w", itemId: "obj_8_c1", stageType: "walkthrough", order: 2, prompt: "Let's review the main ideas from the lesson. Explain back: how a current creates a magnetic field, how a changing field induces current (Faraday and Lenz), and how those ideas make a motor work.", suggestedQuestions: ["How do I explain the right-hand rule?", "What does Lenz's law say about induced current?", "How does force on a current-carrying wire create motion?"] },
  { id: "stg_8c1_c", itemId: "obj_8_c1", stageType: "challenge", order: 3, prompt: "Explain in your own words how an electric motor works, using the concepts from this unit: magnetic fields from currents, force on conductors, and electromagnetic induction. Describe each step from current to rotation, as if teaching someone who just finished the lesson." },

  // --- C2: Explain Electromagnetic Waves ---
  { id: "stg_8c2_b", itemId: "obj_8_c2", stageType: "begin", order: 1, prompt: "In your own words, explain how changing electric and magnetic fields are related to the propagation of electromagnetic waves. What did you learn from the lesson?" },
  { id: "stg_8c2_w", itemId: "obj_8_c2", stageType: "walkthrough", order: 2, prompt: "Let's go through the key ideas from the lesson. Explain back: how a changing E field creates a B field and vice versa, what Maxwell's equations tell us, and what determines the speed of an EM wave.", suggestedQuestions: ["How do I explain the link between E and B in a wave?", "What role do Maxwell's equations play?", "Why is the speed of light what it is?"] },
  { id: "stg_8c2_c", itemId: "obj_8_c2", stageType: "challenge", order: 3, prompt: "Explain in your own words how electromagnetic waves propagate: how E and B fields create each other, what determines their speed, and how the ideas from the lesson (Maxwell, changing fields, wave propagation) fit together. Teach it back as if to a classmate." },

  // ======================================================================
  //  UNIT 1 - COLONIAL AMERICA (COMPLETED)
  // ======================================================================

  // --- K1: Jamestown Settlement (COMPLETED - challenge_complete) ---
  { id: "stg_1k1_b", itemId: "obj_1_k1", stageType: "begin", order: 1, prompt: "Why was Jamestown established in 1607, and what challenges did the settlers face?" },
  { id: "stg_1k1_w", itemId: "obj_1_k1", stageType: "walkthrough", order: 2, prompt: "Let's walk through the key factors that nearly destroyed Jamestown and how John Smith and John Rolfe helped it survive.", suggestedQuestions: ["What was the 'starving time'?", "How did tobacco save Jamestown?", "What role did John Smith play in the colony's survival?"] },
  { id: "stg_1k1_c", itemId: "obj_1_k1", stageType: "challenge", order: 3, prompt: "Evaluate whether Jamestown's survival was due more to leadership decisions or economic factors like tobacco cultivation. Support your argument with specific evidence." },

  // --- K2: Mayflower Compact (COMPLETED - challenge_complete) ---
  { id: "stg_1k2_b", itemId: "obj_1_k2", stageType: "begin", order: 1, prompt: "What was the Mayflower Compact and why was it significant?" },
  { id: "stg_1k2_w", itemId: "obj_1_k2", stageType: "walkthrough", order: 2, prompt: "Let's examine the Mayflower Compact step by step: who wrote it, what it said, and how it established a precedent for self-government in America.", suggestedQuestions: ["Why was the Compact necessary?", "Who were the 'Strangers' on the Mayflower?", "How did the Compact influence later democracy?"] },
  { id: "stg_1k2_c", itemId: "obj_1_k2", stageType: "challenge", order: 3, prompt: "Compare the Mayflower Compact to modern democratic principles. In what ways was it revolutionary, and in what ways was it limited?" },

  // --- K3: Colonial Government (COMPLETED - challenge_complete) ---
  { id: "stg_1k3_b", itemId: "obj_1_k3", stageType: "begin", order: 1, prompt: "What were the main forms of government in the British colonies?" },
  { id: "stg_1k3_w", itemId: "obj_1_k3", stageType: "walkthrough", order: 2, prompt: "Let's compare royal, proprietary, and charter colonies and how each type of colonial government operated.", suggestedQuestions: ["What is the difference between the three colony types?", "Which type had the most self-governance?", "How did colonial assemblies gain power?"] },
  { id: "stg_1k3_c", itemId: "obj_1_k3", stageType: "challenge", order: 3, prompt: "Analyze how the House of Burgesses and New England town meetings laid the groundwork for American representative democracy." },

  // --- K4: Mercantilism (COMPLETED - challenge_complete) ---
  { id: "stg_1k4_b", itemId: "obj_1_k4", stageType: "begin", order: 1, prompt: "What was mercantilism and how did it shape the colonial economy?" },
  { id: "stg_1k4_w", itemId: "obj_1_k4", stageType: "walkthrough", order: 2, prompt: "Let's trace how the Navigation Acts enforced mercantilist policies and how colonists responded to trade restrictions.", suggestedQuestions: ["What did the Navigation Acts require?", "How did colonists evade trade restrictions?", "Were there any benefits to mercantilism for colonies?"] },
  { id: "stg_1k4_c", itemId: "obj_1_k4", stageType: "challenge", order: 3, prompt: "Argue whether mercantilism ultimately helped or hindered colonial economic development, using the triangular trade and Navigation Acts as evidence." },

  // --- K5: Great Awakening (COMPLETED - challenge_complete) ---
  { id: "stg_1k5_b", itemId: "obj_1_k5", stageType: "begin", order: 1, prompt: "What was the Great Awakening and when did it occur?" },
  { id: "stg_1k5_w", itemId: "obj_1_k5", stageType: "walkthrough", order: 2, prompt: "Let's explore how preachers like Jonathan Edwards and George Whitefield transformed colonial religious life and social structures.", suggestedQuestions: ["How did Edwards and Whitefield differ in style?", "What was the social impact of the Great Awakening?", "How did the movement challenge established churches?"] },
  { id: "stg_1k5_c", itemId: "obj_1_k5", stageType: "challenge", order: 3, prompt: "Evaluate how the Great Awakening contributed to the development of a uniquely American identity and later revolutionary ideals." },

  // --- S1: Primary Source Analysis (COMPLETED - challenge_complete) ---
  { id: "stg_1s1_b", itemId: "obj_1_s1", stageType: "begin", order: 1, prompt: "Read the following excerpt from John Smith's account of Jamestown. What can you identify as the author's perspective and potential biases?" },
  { id: "stg_1s1_w", itemId: "obj_1_s1", stageType: "walkthrough", order: 2, prompt: "Let's practice the SOAP method (Speaker, Occasion, Audience, Purpose) to analyze a primary source from the colonial period step by step.", suggestedQuestions: ["What does SOAP stand for?", "How do I identify the author's bias?", "Why does the audience matter for analysis?"] },
  { id: "stg_1s1_c", itemId: "obj_1_s1", stageType: "challenge", order: 3, prompt: "Compare two primary sources about colonial life: one from a Puritan leader and one from an indentured servant. Analyze how their perspectives differ and what each reveals about colonial society." },

  // --- S2: Map Reading / Colonial Geography (COMPLETED - challenge_complete) ---
  { id: "stg_1s2_b", itemId: "obj_1_s2", stageType: "begin", order: 1, prompt: "Looking at a map of the 13 colonies, can you identify the three colonial regions and name one colony in each?" },
  { id: "stg_1s2_w", itemId: "obj_1_s2", stageType: "walkthrough", order: 2, prompt: "Let's examine how geography influenced settlement patterns, economic activities, and cultural development in each colonial region.", suggestedQuestions: ["How did climate differ across regions?", "Why did the South develop plantations?", "What geographic features shaped New England's economy?"] },
  { id: "stg_1s2_c", itemId: "obj_1_s2", stageType: "challenge", order: 3, prompt: "Using geographic evidence, explain why the Southern colonies developed a plantation economy while New England developed commerce and manufacturing." },

  // --- S3: Comparing Colonial Regions (COMPLETED - challenge_complete) ---
  { id: "stg_1s3_b", itemId: "obj_1_s3", stageType: "begin", order: 1, prompt: "Name one key difference between the New England, Middle, and Southern colonies." },
  { id: "stg_1s3_w", itemId: "obj_1_s3", stageType: "walkthrough", order: 2, prompt: "Let's build a comparison chart examining economy, religion, social structure, and labor systems across the three colonial regions.", suggestedQuestions: ["What categories should I compare?", "How did religion differ across regions?", "Which region had the most diverse economy?"] },
  { id: "stg_1s3_c", itemId: "obj_1_s3", stageType: "challenge", order: 3, prompt: "Write a comparative analysis explaining which colonial region was best positioned for long-term economic success and why." },

  // --- S4: Timeline Construction (challenge_complete) ---
  { id: "stg_1s4_b", itemId: "obj_1_s4", stageType: "begin", order: 1, prompt: "Place these events in chronological order: Mayflower Compact, Jamestown founding, Salem Witch Trials, Bacon's Rebellion." },
  { id: "stg_1s4_w", itemId: "obj_1_s4", stageType: "walkthrough", order: 2, prompt: "Let's construct a detailed timeline of Colonial America from 1607 to 1763, identifying cause-and-effect relationships between events.", suggestedQuestions: ["What are the key dates I should include?", "How do I show cause-and-effect on a timeline?", "What connects Bacon's Rebellion to slavery?"] },
  { id: "stg_1s4_c", itemId: "obj_1_s4", stageType: "challenge", order: 3, prompt: "Create an annotated timeline showing how colonial events from 1607-1763 built upon each other to create the conditions for revolution." },

  // --- S5: Persuasive Essay Writing (challenge_complete) ---
  { id: "stg_1s5_b", itemId: "obj_1_s5", stageType: "begin", order: 1, prompt: "What are the key elements of a persuasive historical essay?" },
  { id: "stg_1s5_w", itemId: "obj_1_s5", stageType: "walkthrough", order: 2, prompt: "Let's outline a persuasive essay about colonial life, working through thesis, evidence, counterarguments, and conclusion step by step.", suggestedQuestions: ["How do I write a strong thesis?", "What makes a good counterargument?", "How should I structure my evidence?"] },
  { id: "stg_1s5_c", itemId: "obj_1_s5", stageType: "challenge", order: 3, prompt: "Write a persuasive essay arguing whether indentured servitude was a path to opportunity or a system of exploitation in colonial America." },

  // --- C1: Explain Colonial America Concepts (challenge_complete) ---
  { id: "stg_1c1_b", itemId: "obj_1_c1", stageType: "begin", order: 1, prompt: "In your own words, explain what 'land of opportunity' meant in Colonial America, using what you learned in this unit." },
  { id: "stg_1c1_w", itemId: "obj_1_c1", stageType: "walkthrough", order: 2, prompt: "Let's review the main ideas from the lesson. Explain back how different groups experienced colonial America — wealthy landowners, indentured servants, enslaved Africans, women, and Native Americans — and what that tells us about opportunity.", suggestedQuestions: ["Which groups had the most opportunity?", "How did race and gender limit opportunity?", "What evidence from the lesson supports your explanation?"] },
  { id: "stg_1c1_c", itemId: "obj_1_c1", stageType: "challenge", order: 3, prompt: "Explain in your own words: Was Colonial America truly a land of opportunity? Use concepts and evidence from the lesson. Consider at least three different social groups and explain your reasoning clearly, as if teaching the material back." },

  // ======================================================================
  //  UNIT 2 - REVOLUTIONARY WAR (ACTIVE / MIXED PROGRESS)
  // ======================================================================

  // --- K1: Causes of Revolution (challenge_complete) ---
  { id: "stg_2k1_b", itemId: "obj_2_k1", stageType: "begin", order: 1, prompt: "What were the main causes of the American Revolution?" },
  { id: "stg_2k1_w", itemId: "obj_2_k1", stageType: "walkthrough", order: 2, prompt: "Let's trace the chain of events from the French and Indian War through the Intolerable Acts, examining how each event escalated colonial resistance.", suggestedQuestions: ["How did the French and Indian War lead to taxation?", "What was the Stamp Act and why did colonists resist?", "How did the Intolerable Acts unite the colonies?"] },
  { id: "stg_2k1_c", itemId: "obj_2_k1", stageType: "challenge", order: 3, prompt: "Rank the top three causes of the American Revolution in order of importance and defend your ranking with historical evidence." },

  // --- K2: Boston Tea Party (challenge_complete) ---
  { id: "stg_2k2_b", itemId: "obj_2_k2", stageType: "begin", order: 1, prompt: "What happened at the Boston Tea Party and why did the colonists do it?" },
  { id: "stg_2k2_w", itemId: "obj_2_k2", stageType: "walkthrough", order: 2, prompt: "Let's examine the Boston Tea Party in context: the Tea Act, the role of the Sons of Liberty, and how Britain responded with the Intolerable Acts.", suggestedQuestions: ["What was the Tea Act really about?", "Who were the Sons of Liberty?", "Why did cheap tea still anger colonists?"] },
  { id: "stg_2k2_c", itemId: "obj_2_k2", stageType: "challenge", order: 3, prompt: "Was the Boston Tea Party an act of justified protest or criminal destruction of property? Argue both sides and then state which interpretation you find more compelling." },

  // --- K3: Declaration of Independence (challenge_started) ---
  { id: "stg_2k3_b", itemId: "obj_2_k3", stageType: "begin", order: 1, prompt: "What was the Declaration of Independence and what were its main ideas?" },
  { id: "stg_2k3_w", itemId: "obj_2_k3", stageType: "walkthrough", order: 2, prompt: "Let's break down the Declaration of Independence section by section: the preamble, the list of grievances, and the formal declaration, examining how Enlightenment ideas influenced each part.", suggestedQuestions: ["How did John Locke influence Jefferson?", "What are the three sections of the Declaration?", "Why did Jefferson blame the king specifically?"] },
  { id: "stg_2k3_c", itemId: "obj_2_k3", stageType: "challenge", order: 3, prompt: "Analyze the contradiction between the Declaration's statement that 'all men are created equal' and the reality of slavery in 1776. How did the founders reconcile this, and what were the long-term consequences?" },

  // --- K4: Key Battles (not_started - begin done, on walkthrough, no student walkthrough msgs) ---
  { id: "stg_2k4_b", itemId: "obj_2_k4", stageType: "begin", order: 1, prompt: "Name three major battles of the American Revolution and explain why each was important." },
  { id: "stg_2k4_w", itemId: "obj_2_k4", stageType: "walkthrough", order: 2, prompt: "Let's analyze the turning points of the war: Lexington and Concord, Saratoga, and Yorktown, examining strategy, leadership, and consequences of each battle.", suggestedQuestions: ["Why was Saratoga a turning point?", "What strategy did Washington use at Yorktown?", "How did foreign allies help at key battles?"] },
  { id: "stg_2k4_c", itemId: "obj_2_k4", stageType: "challenge", order: 3, prompt: "Military historians debate which battle was the true turning point of the Revolution. Build a case for either Saratoga or Yorktown as the single most important battle, using strategic and diplomatic evidence." },

  // --- K5: Foreign Alliances (not_started) ---
  { id: "stg_2k5_b", itemId: "obj_2_k5", stageType: "begin", order: 1, prompt: "Which foreign nations helped the American colonies during the Revolution and why?" },
  { id: "stg_2k5_w", itemId: "obj_2_k5", stageType: "walkthrough", order: 2, prompt: "Let's examine how Benjamin Franklin secured the French alliance and how French military and financial aid changed the course of the war.", suggestedQuestions: ["Why did France want to help the colonies?", "What role did Franklin play in diplomacy?", "How did French aid change the war?"] },
  { id: "stg_2k5_c", itemId: "obj_2_k5", stageType: "challenge", order: 3, prompt: "Could the American colonies have won independence without foreign aid? Assess the contributions of France, Spain, and the Netherlands and argue whether American victory was possible without them." },

  // --- K6: Treaty of Paris (not_started) ---
  { id: "stg_2k6_b", itemId: "obj_2_k6", stageType: "begin", order: 1, prompt: "What were the key terms of the Treaty of Paris of 1783?" },
  { id: "stg_2k6_w", itemId: "obj_2_k6", stageType: "walkthrough", order: 2, prompt: "Let's walk through the negotiations that led to the Treaty of Paris, examining what each side wanted and what they actually got.", suggestedQuestions: ["What were the key terms of the treaty?", "What territory did the US gain?", "How were Native American interests affected?"] },
  { id: "stg_2k6_c", itemId: "obj_2_k6", stageType: "challenge", order: 3, prompt: "Evaluate whether the Treaty of Paris was a fair settlement for all parties involved. Consider the perspectives of Britain, France, Spain, Native Americans, and the new United States." },

  // --- S1: Analyzing Political Cartoons (challenge_complete) ---
  { id: "stg_2s1_b", itemId: "obj_2_s1", stageType: "begin", order: 1, prompt: "What techniques do political cartoonists use to convey their message?" },
  { id: "stg_2s1_w", itemId: "obj_2_s1", stageType: "walkthrough", order: 2, prompt: "Let's analyze Benjamin Franklin's 'Join, or Die' cartoon step by step, identifying symbols, audience, purpose, and historical context.", suggestedQuestions: ["What does the snake symbolize?", "Who was the intended audience?", "How did the cartoon's meaning change over time?"] },
  { id: "stg_2s1_c", itemId: "obj_2_s1", stageType: "challenge", order: 3, prompt: "Compare two Revolutionary-era political cartoons: one from the Patriot perspective and one from the Loyalist perspective. Analyze how each uses visual rhetoric to persuade its audience." },

  // --- S2: Comparing Perspectives (challenge_started) ---
  { id: "stg_2s2_b", itemId: "obj_2_s2", stageType: "begin", order: 1, prompt: "Why is it important to consider multiple perspectives when studying the American Revolution?" },
  { id: "stg_2s2_w", itemId: "obj_2_s2", stageType: "walkthrough", order: 2, prompt: "Let's compare how Patriots, Loyalists, and neutral colonists viewed the same events differently, using the Stamp Act crisis as our case study.", suggestedQuestions: ["How did Patriots view the Stamp Act?", "What was the Loyalist argument for the tax?", "Why do perspectives matter in history?"] },
  { id: "stg_2s2_c", itemId: "obj_2_s2", stageType: "challenge", order: 3, prompt: "Write a dialogue between a Patriot merchant, a Loyalist government official, and an enslaved person discussing whether the Revolution truly represented freedom. Each character should express historically accurate viewpoints." },

  // --- S3: Evaluating Primary Sources (not_started - begin done, on walkthrough, no student walkthrough msgs) ---
  { id: "stg_2s3_b", itemId: "obj_2_s3", stageType: "begin", order: 1, prompt: "What questions should you ask when evaluating the reliability of a primary source from the Revolutionary era?" },
  { id: "stg_2s3_w", itemId: "obj_2_s3", stageType: "walkthrough", order: 2, prompt: "Let's evaluate Thomas Paine's 'Common Sense' as a primary source, applying criteria of authorship, context, purpose, and reliability step by step.", suggestedQuestions: ["Who was Thomas Paine?", "What was the purpose of 'Common Sense'?", "How do I evaluate reliability of a persuasive text?"] },
  { id: "stg_2s3_c", itemId: "obj_2_s3", stageType: "challenge", order: 3, prompt: "You are given two conflicting accounts of the Battle of Lexington: one from a British officer and one from a colonial militiaman. Evaluate both sources for bias and reliability, then construct what you believe actually happened." },

  // --- S4: Cause and Effect Diagrams (not_started) ---
  { id: "stg_2s4_b", itemId: "obj_2_s4", stageType: "begin", order: 1, prompt: "What is a cause-and-effect diagram and how can it help us understand historical events?" },
  { id: "stg_2s4_w", itemId: "obj_2_s4", stageType: "walkthrough", order: 2, prompt: "Let's build a cause-and-effect diagram tracing how the French and Indian War led to increased taxation, which led to colonial protest, which led to revolution.", suggestedQuestions: ["How do I organize causes and effects?", "What was the chain from war to taxation?", "How do I show multiple causes for one effect?"] },
  { id: "stg_2s4_c", itemId: "obj_2_s4", stageType: "challenge", order: 3, prompt: "Create a comprehensive cause-and-effect diagram showing both short-term and long-term causes of the American Revolution, including economic, political, social, and ideological factors." },

  // --- S5: Argumentative Writing (not_started) ---
  { id: "stg_2s5_b", itemId: "obj_2_s5", stageType: "begin", order: 1, prompt: "What is the difference between a persuasive essay and an argumentative essay in historical writing?" },
  { id: "stg_2s5_w", itemId: "obj_2_s5", stageType: "walkthrough", order: 2, prompt: "Let's craft an argumentative thesis about the Revolution and build supporting paragraphs with evidence, counterarguments, and rebuttals.", suggestedQuestions: ["How is argumentative different from persuasive?", "How do I address counterarguments effectively?", "What makes a thesis arguable?"] },
  { id: "stg_2s5_c", itemId: "obj_2_s5", stageType: "challenge", order: 3, prompt: "Write an argumentative essay addressing: Were the American colonists justified in declaring independence from Britain? Include a clear thesis, at least three evidence-based arguments, and address counterarguments." },

  // --- C1: Explain Revolution Concepts (not_started) ---
  { id: "stg_2c1_b", itemId: "obj_2_c1", stageType: "begin", order: 1, prompt: "Using what you learned in this unit, explain in your own words: do you think the American Revolution was inevitable, or could it have been avoided? Share your reasoning." },
  { id: "stg_2c1_w", itemId: "obj_2_c1", stageType: "walkthrough", order: 2, prompt: "Let's review the key ideas from the lesson. Explain back the main turning points — the Olive Branch Petition, compromise attempts, British policies — and how they support or challenge the idea that revolution was inevitable.", suggestedQuestions: ["What was the Olive Branch Petition?", "Were there moments where compromise was possible?", "How do individual decisions vs. structural forces show up in the lesson?"] },
  { id: "stg_2c1_c", itemId: "obj_2_c1", stageType: "challenge", order: 3, prompt: "Explain in your own words: Was the American Revolution inevitable? Use concepts and evidence from the lesson. Consider at least three turning points where a different choice could have changed the outcome, and explain whether structural forces or individual choices mattered more — as if teaching the material back." },
];

// ============ STUDENT OBJECTIVE PROGRESS ============
// progressState: "not_started" | "walkthrough_started" | "walkthrough_complete" | "challenge_started" | "challenge_complete"
export const studentObjectiveProgress: StudentObjectiveProgress[] = [
  // -------- Unit 6 - Thermodynamics --------
  // K1, K2 completed; rest not started
  { studentId: "stu_1", objectiveId: "obj_6_k1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-10T15:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_k2", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-11T14:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_k3", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-11T15:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_k4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-11T15:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_k5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-11T15:00:00Z" },
  // S1 completed; rest not started
  { studentId: "stu_1", objectiveId: "obj_6_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s2", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s3", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  // C1 not started
  { studentId: "stu_1", objectiveId: "obj_6_c1", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },

  // -------- Unit 8 - Magnetism (MIXED PROGRESS) --------
  // K1: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_8_k1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-15T10:30:00Z" },
  // K2: challenge_started (walkthrough done, on challenge)
  { studentId: "stu_1", objectiveId: "obj_8_k2", progressState: "challenge_started", currentStageType: "challenge", updatedAt: "2024-01-15T11:15:00Z" },
  // K3: not_started (begin done, on walkthrough, but no student walkthrough messages yet)
  { studentId: "stu_1", objectiveId: "obj_8_k3", progressState: "not_started", currentStageType: "walkthrough", updatedAt: "2024-01-15T11:30:00Z" },
  // K4: not_started
  { studentId: "stu_1", objectiveId: "obj_8_k4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T11:30:00Z" },
  // K5: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_8_k5", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-15T14:00:00Z" },
  // K6: not_started
  { studentId: "stu_1", objectiveId: "obj_8_k6", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T14:00:00Z" },
  // K7: not_started (begin done, on walkthrough, but no student walkthrough messages yet)
  { studentId: "stu_1", objectiveId: "obj_8_k7", progressState: "not_started", currentStageType: "walkthrough", updatedAt: "2024-01-15T14:30:00Z" },
  // S1: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_8_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-15T12:15:00Z" },
  // S2: challenge_started (walkthrough done, on challenge)
  { studentId: "stu_1", objectiveId: "obj_8_s2", progressState: "challenge_started", currentStageType: "challenge", updatedAt: "2024-01-15T12:45:00Z" },
  // S3: not_started (begin done, on walkthrough, but no student walkthrough messages yet)
  { studentId: "stu_1", objectiveId: "obj_8_s3", progressState: "not_started", currentStageType: "walkthrough", updatedAt: "2024-01-15T13:00:00Z" },
  // S4: not_started
  { studentId: "stu_1", objectiveId: "obj_8_s4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T13:00:00Z" },
  // S5: not_started
  { studentId: "stu_1", objectiveId: "obj_8_s5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T13:00:00Z" },
  // S6: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_8_s6", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-15T15:00:00Z" },
  // C1: not_started
  { studentId: "stu_1", objectiveId: "obj_8_c1", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T15:00:00Z" },
  // C2: not_started
  { studentId: "stu_1", objectiveId: "obj_8_c2", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-15T15:00:00Z" },

  // -------- Unit 1 - Colonial America (ALL COMPLETED - challenge_complete each) --------
  { studentId: "stu_1", objectiveId: "obj_1_k1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-02T10:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_k2", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-02T11:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_k3", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-02T12:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_k4", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-02T13:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_k5", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-02T14:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T10:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s2", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T11:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s3", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T12:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s4", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T13:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s5", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T14:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_c1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-04T10:00:00Z" },

  // -------- Unit 2 - Revolutionary War (MIXED PROGRESS) --------
  // K1: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_2_k1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-06T10:00:00Z" },
  // K2: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_2_k2", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-06T11:00:00Z" },
  // K3: challenge_started (walkthrough done, on challenge)
  { studentId: "stu_1", objectiveId: "obj_2_k3", progressState: "challenge_started", currentStageType: "challenge", updatedAt: "2024-01-06T12:00:00Z" },
  // K4: not_started (begin done, on walkthrough, but no student walkthrough messages yet)
  { studentId: "stu_1", objectiveId: "obj_2_k4", progressState: "not_started", currentStageType: "walkthrough", updatedAt: "2024-01-06T13:00:00Z" },
  // K5: not_started
  { studentId: "stu_1", objectiveId: "obj_2_k5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-06T13:00:00Z" },
  // K6: not_started
  { studentId: "stu_1", objectiveId: "obj_2_k6", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-06T13:00:00Z" },
  // S1: challenge_complete
  { studentId: "stu_1", objectiveId: "obj_2_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-07T10:00:00Z" },
  // S2: challenge_started (walkthrough done, on challenge)
  { studentId: "stu_1", objectiveId: "obj_2_s2", progressState: "challenge_started", currentStageType: "challenge", updatedAt: "2024-01-07T11:00:00Z" },
  // S3: not_started (begin done, on walkthrough, but no student walkthrough messages yet)
  { studentId: "stu_1", objectiveId: "obj_2_s3", progressState: "not_started", currentStageType: "walkthrough", updatedAt: "2024-01-07T12:00:00Z" },
  // S4: not_started
  { studentId: "stu_1", objectiveId: "obj_2_s4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-07T12:00:00Z" },
  // S5: not_started
  { studentId: "stu_1", objectiveId: "obj_2_s5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-07T12:00:00Z" },
  // C1: not_started
  { studentId: "stu_1", objectiveId: "obj_2_c1", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-07T12:00:00Z" },
];

// ============ CHAT THREADS ============
// One thread per objective
export const chatThreads: ChatThread[] = [
  // -------- Unit 6 Threads --------
  { id: "thr_6_k1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-10T15:00:00Z" },
  { id: "thr_6_k2", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-11T14:00:00Z" },
  { id: "thr_6_k3", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k3", title: "Knowledge 3", kind: "knowledge", lastMessageAt: "2024-01-11T15:00:00Z" },
  { id: "thr_6_k4", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k4", title: "Knowledge 4", kind: "knowledge", lastMessageAt: "2024-01-11T15:00:00Z" },
  { id: "thr_6_k5", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_k5", title: "Knowledge 5", kind: "knowledge", lastMessageAt: "2024-01-11T15:00:00Z" },
  { id: "thr_6_s1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s2", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s3", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s4", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s5", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_c1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_c1", title: "Explain: Thermodynamics", kind: "capstone", lastMessageAt: "2024-01-12T16:00:00Z" },

  // -------- Unit 8 Threads --------
  { id: "thr_8_k1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-15T10:30:00Z" },
  { id: "thr_8_k2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-15T11:15:00Z" },
  { id: "thr_8_k3", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k3", title: "Knowledge 3", kind: "knowledge", lastMessageAt: "2024-01-15T11:30:00Z" },
  { id: "thr_8_k4", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k4", title: "Knowledge 4", kind: "knowledge", lastMessageAt: "2024-01-15T11:30:00Z" },
  { id: "thr_8_k5", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k5", title: "Knowledge 5", kind: "knowledge", lastMessageAt: "2024-01-15T14:00:00Z" },
  { id: "thr_8_k6", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k6", title: "Knowledge 6", kind: "knowledge", lastMessageAt: "2024-01-15T14:00:00Z" },
  { id: "thr_8_k7", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_k7", title: "Knowledge 7", kind: "knowledge", lastMessageAt: "2024-01-15T14:30:00Z" },
  { id: "thr_8_s1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-15T12:15:00Z" },
  { id: "thr_8_s2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-15T12:45:00Z" },
  { id: "thr_8_s3", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s4", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s5", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s6", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s6", title: "Skill 6", kind: "skill", lastMessageAt: "2024-01-15T15:00:00Z" },
  { id: "thr_8_c1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_c1", title: "Explain: Magnetism & motors", kind: "capstone", lastMessageAt: "2024-01-15T15:00:00Z" },
  { id: "thr_8_c2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_c2", title: "Explain: EM waves", kind: "capstone", lastMessageAt: "2024-01-15T15:00:00Z" },

  // -------- Unit 1 (Colonial America) Threads --------
  { id: "thr_1_k1", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-02T10:00:00Z" },
  { id: "thr_1_k2", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-02T11:00:00Z" },
  { id: "thr_1_k3", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_k3", title: "Knowledge 3", kind: "knowledge", lastMessageAt: "2024-01-02T12:00:00Z" },
  { id: "thr_1_k4", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_k4", title: "Knowledge 4", kind: "knowledge", lastMessageAt: "2024-01-02T13:00:00Z" },
  { id: "thr_1_k5", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_k5", title: "Knowledge 5", kind: "knowledge", lastMessageAt: "2024-01-02T14:00:00Z" },
  { id: "thr_1_s1", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-03T10:00:00Z" },
  { id: "thr_1_s2", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-03T11:00:00Z" },
  { id: "thr_1_s3", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-03T12:00:00Z" },
  { id: "thr_1_s4", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-03T13:00:00Z" },
  { id: "thr_1_s5", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-03T14:00:00Z" },
  { id: "thr_1_c1", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_c1", title: "Explain: Colonial America", kind: "capstone", lastMessageAt: "2024-01-04T10:00:00Z" },

  // -------- Unit 2 (Revolutionary War) Threads --------
  { id: "thr_2_k1", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k1", title: "Knowledge 1", kind: "knowledge", lastMessageAt: "2024-01-06T10:00:00Z" },
  { id: "thr_2_k2", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k2", title: "Knowledge 2", kind: "knowledge", lastMessageAt: "2024-01-06T11:00:00Z" },
  { id: "thr_2_k3", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k3", title: "Knowledge 3", kind: "knowledge", lastMessageAt: "2024-01-06T12:00:00Z" },
  { id: "thr_2_k4", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k4", title: "Knowledge 4", kind: "knowledge", lastMessageAt: "2024-01-06T13:00:00Z" },
  { id: "thr_2_k5", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k5", title: "Knowledge 5", kind: "knowledge", lastMessageAt: "2024-01-06T13:00:00Z" },
  { id: "thr_2_k6", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_k6", title: "Knowledge 6", kind: "knowledge", lastMessageAt: "2024-01-06T13:00:00Z" },
  { id: "thr_2_s1", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-07T10:00:00Z" },
  { id: "thr_2_s2", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-07T11:00:00Z" },
  { id: "thr_2_s3", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-07T12:00:00Z" },
  { id: "thr_2_s4", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-07T12:00:00Z" },
  { id: "thr_2_s5", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-07T12:00:00Z" },
  { id: "thr_2_c1", unitId: "unit_ah_2", courseId: "crs_1", objectiveId: "obj_2_c1", title: "Explain: Revolution", kind: "capstone", lastMessageAt: "2024-01-07T12:00:00Z" },
];

// ============ CHAT MESSAGES ============
// Messages contain ONLY student responses, tutor feedback, and progress events.
// Stage prompts are NEVER stored as messages - they render in the header box.
export const chatMessages: ChatMessage[] = [
  // ======================================================================
  //  UNIT 6 MESSAGES
  // ======================================================================

  // ========== Thread 6_k1 - First Law of Thermodynamics (challenge_complete) ==========

  // Begin stage
  { id: "msg_6k1_1", threadId: "thr_6_k1", stageId: "stg_6k1_b", role: "student", content: "Energy cannot be created or destroyed, only transferred or converted from one form to another.", createdAt: "2024-01-10T13:10:00Z" },
  { id: "msg_6k1_2", threadId: "thr_6_k1", stageId: "stg_6k1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-10T13:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_6k1_3", threadId: "thr_6_k1", stageId: "stg_6k1_w", role: "tutor", content: "Let's work on the first law of thermodynamics. First, can you write out the mathematical form of the first law?", createdAt: "2024-01-10T13:20:00Z" },
  { id: "msg_6k1_4", threadId: "thr_6_k1", stageId: "stg_6k1_w", role: "student", content: "\u0394U = Q - W, where \u0394U is change in internal energy, Q is heat added, and W is work done by the system.", createdAt: "2024-01-10T13:25:00Z" },
  { id: "msg_6k1_5", threadId: "thr_6_k1", stageId: "stg_6k1_w", role: "tutor", content: "Great! That's right. Now, in an adiabatic process Q = 0. What does the first law simplify to?", createdAt: "2024-01-10T13:30:00Z" },
  { id: "msg_6k1_6", threadId: "thr_6_k1", stageId: "stg_6k1_w", role: "student", content: "\u0394U = -W, so all the change in internal energy comes from work done. If the gas expands (positive W), internal energy decreases.", createdAt: "2024-01-10T13:35:00Z" },
  { id: "msg_6k1_7", threadId: "thr_6_k1", stageId: "stg_6k1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-10T13:40:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_6k1_8", threadId: "thr_6_k1", stageId: "stg_6k1_c", role: "student", content: "For isothermal expansion of an ideal gas: \u0394U = 0 (temperature constant), so Q = W. Work W = \u222bPdV from V1 to V2. Using PV = nRT, P = nRT/V. Therefore W = \u222b(nRT/V)dV = nRT\u00b7ln(V\u2082/V\u2081). This is also the heat absorbed from the reservoir.", createdAt: "2024-01-10T14:30:00Z" },
  { id: "msg_6k1_9", threadId: "thr_6_k1", stageId: "stg_6k1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-10T14:35:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 6_k2 - Entropy and the Second Law (challenge_complete) ==========

  // Begin stage
  { id: "msg_6k2_1", threadId: "thr_6_k2", stageId: "stg_6k2_b", role: "student", content: "Entropy is a measure of disorder or randomness in a system. It tells us how much energy is unavailable for doing useful work.", createdAt: "2024-01-11T12:00:00Z" },
  { id: "msg_6k2_2", threadId: "thr_6_k2", stageId: "stg_6k2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-11T12:05:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_6k2_3", threadId: "thr_6_k2", stageId: "stg_6k2_w", role: "tutor", content: "Let's work on entropy and the second law. First, what does the second law of thermodynamics state about entropy in an isolated system?", createdAt: "2024-01-11T12:10:00Z" },
  { id: "msg_6k2_4", threadId: "thr_6_k2", stageId: "stg_6k2_w", role: "student", content: "The total entropy of an isolated system can never decrease. It either increases (irreversible process) or stays the same (reversible process).", createdAt: "2024-01-11T12:15:00Z" },
  { id: "msg_6k2_5", threadId: "thr_6_k2", stageId: "stg_6k2_w", role: "tutor", content: "Great! That's right. Now, we need to understand how this limits energy conversion. You can do this by thinking about why heat flows spontaneously from hot to cold but not the reverse. Can you explain why?", createdAt: "2024-01-11T12:20:00Z" },
  { id: "msg_6k2_6", threadId: "thr_6_k2", stageId: "stg_6k2_w", role: "student", content: "Heat flowing from hot to cold increases total entropy (the cold object gains more entropy than the hot object loses, because \u0394S = Q/T and the cold T is smaller). The reverse would decrease total entropy, violating the second law.", createdAt: "2024-01-11T12:25:00Z" },
  { id: "msg_6k2_7", threadId: "thr_6_k2", stageId: "stg_6k2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-11T12:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_6k2_8", threadId: "thr_6_k2", stageId: "stg_6k2_c", role: "student", content: "For 1g of ice melting at 0\u00b0C (273.15K): \u0394S = Q/T = 334 J / 273.15 K = 1.223 J/K. The entropy increases because the structured crystalline ice becomes disordered liquid water. For 100g: \u0394S = 33400 / 273.15 = 122.3 J/K.", createdAt: "2024-01-11T13:30:00Z" },
  { id: "msg_6k2_9", threadId: "thr_6_k2", stageId: "stg_6k2_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-11T13:35:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 6_s1 - Work in Gas Expansion (challenge_complete) ==========

  // Begin stage
  { id: "msg_6s1_1", threadId: "thr_6_s1", stageId: "stg_6s1_b", role: "student", content: "W = P\u0394V = 100 kPa \u00d7 (2L - 1L) = 100 kPa \u00d7 0.001 m\u00b3 = 100 J.", createdAt: "2024-01-12T14:00:00Z" },
  { id: "msg_6s1_2", threadId: "thr_6_s1", stageId: "stg_6s1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-12T14:05:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_6s1_3", threadId: "thr_6_s1", stageId: "stg_6s1_w", role: "tutor", content: "Let's work on isothermal expansion work calculations. First, what formula do we use for work in an isothermal process?", createdAt: "2024-01-12T14:10:00Z" },
  { id: "msg_6s1_4", threadId: "thr_6_s1", stageId: "stg_6s1_w", role: "student", content: "W = nRT ln(V2/V1) because pressure changes during the process.", createdAt: "2024-01-12T14:15:00Z" },
  { id: "msg_6s1_5", threadId: "thr_6_s1", stageId: "stg_6s1_w", role: "tutor", content: "Great! That's right. Now, if 2 moles of gas at 300K expand from 5L to 15L isothermally, can you calculate the work?", createdAt: "2024-01-12T14:20:00Z" },
  { id: "msg_6s1_6", threadId: "thr_6_s1", stageId: "stg_6s1_w", role: "student", content: "W = 2 \u00d7 8.314 \u00d7 300 \u00d7 ln(15/5) = 4988.4 \u00d7 ln(3) = 4988.4 \u00d7 1.0986 = 5480 J or about 5.48 kJ.", createdAt: "2024-01-12T14:25:00Z" },
  { id: "msg_6s1_7", threadId: "thr_6_s1", stageId: "stg_6s1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-12T14:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_6s1_8", threadId: "thr_6_s1", stageId: "stg_6s1_c", role: "student", content: "Carnot efficiency: \u03b7 = 1 - Tc/Th = 1 - 300/500 = 0.4 or 40%. Work output: W = \u03b7 \u00d7 Qh = 0.4 \u00d7 1000 = 400 J. Heat rejected: Qc = Qh - W = 1000 - 400 = 600 J.", createdAt: "2024-01-12T15:30:00Z" },
  { id: "msg_6s1_9", threadId: "thr_6_s1", stageId: "stg_6s1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-12T15:35:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 6_k3 - Carnot Cycle (not_started) ==========
  { id: "msg_6k3_0", threadId: "thr_6_k3", stageId: "stg_6k3_b", role: "tutor", content: "Hi! Let's explore the Carnot cycle and heat engines. What is a heat engine and what does it do? Share what you know!", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_k4 - Thermodynamic Processes (not_started) ==========
  { id: "msg_6k4_0", threadId: "thr_6_k4", stageId: "stg_6k4_b", role: "tutor", content: "Hey there! Today we're looking at thermodynamic processes. Can you name four common thermodynamic processes and what is held constant in each?", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_k5 - Kinetic Theory (not_started) ==========
  { id: "msg_6k5_0", threadId: "thr_6_k5", stageId: "stg_6k5_b", role: "tutor", content: "Welcome! We're diving into the kinetic theory of gases. What does the kinetic theory tell us about gas molecules? Give it your best shot!", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_s2 - Calorimetry Problems (not_started) ==========
  { id: "msg_6s2_0", threadId: "thr_6_s2", stageId: "stg_6s2_b", role: "tutor", content: "Hi! Ready for some calorimetry? Here's one to start: how much heat is needed to raise 500g of water from 20\u00b0C to 80\u00b0C? (c = 4.186 J/g\u00b7\u00b0C)", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_s3 - Heat Engine Efficiency (not_started) ==========
  { id: "msg_6s3_0", threadId: "thr_6_s3", stageId: "stg_6s3_b", role: "tutor", content: "Hey! Let's work on heat engine efficiency. A heat engine absorbs 800J and exhausts 500J. What is its efficiency? Walk me through your thinking.", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_s4 - PV Diagram Analysis (not_started) ==========
  { id: "msg_6s4_0", threadId: "thr_6_s4", stageId: "stg_6s4_b", role: "tutor", content: "Welcome! We're going to work with PV diagrams. To get started: on a PV diagram, what does the area under a curve represent?", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_s5 - Entropy Calculations (not_started) ==========
  { id: "msg_6s5_0", threadId: "thr_6_s5", stageId: "stg_6s5_b", role: "tutor", content: "Hi! Today we're tackling entropy. What is the formula for entropy change in a reversible process? Tell me what you remember.", createdAt: "2024-01-10T09:00:00Z" },

  // ========== Thread 6_c1 - Explain Thermodynamics (not_started) ==========
  { id: "msg_6c1_0", threadId: "thr_6_c1", stageId: "stg_6c1_b", role: "tutor", content: "Welcome to your capstone! Here you'll explain the main concepts from this unit in your own words. To start: what are the first and second laws of thermodynamics, what is entropy, and how does a heat engine work? Summarize what you learned.", createdAt: "2024-01-10T09:00:00Z" },

  // ======================================================================
  //  UNIT 8 MESSAGES
  // ======================================================================

  // ========== Thread 8_k1 - Magnetic Fields Around Wires (challenge_complete) ==========

  // Begin stage
  { id: "msg_8k1_1", threadId: "thr_8_k1", stageId: "stg_8k1_b", role: "student", content: "Electric current flowing through the wire creates the magnetic field. Moving charges produce magnetic fields.", createdAt: "2024-01-15T09:10:00Z" },
  { id: "msg_8k1_2", threadId: "thr_8_k1", stageId: "stg_8k1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_8k1_3", threadId: "thr_8_k1", stageId: "stg_8k1_w", role: "tutor", content: "Let's work on magnetic fields around wires. First, what shape do the field lines form around a straight current-carrying wire?", createdAt: "2024-01-15T09:20:00Z" },
  { id: "msg_8k1_4", threadId: "thr_8_k1", stageId: "stg_8k1_w", role: "student", content: "They form concentric circles centered on the wire, in planes perpendicular to the wire.", createdAt: "2024-01-15T09:25:00Z" },
  { id: "msg_8k1_5", threadId: "thr_8_k1", stageId: "stg_8k1_w", role: "tutor", content: "Great! That's right. Now, we need to determine the direction of these circles. You can do this by using the right-hand rule. Can you describe how the right-hand rule works for a current-carrying wire?", createdAt: "2024-01-15T09:28:00Z" },
  { id: "msg_8k1_6", threadId: "thr_8_k1", stageId: "stg_8k1_w", role: "student", content: "Point your right thumb in the direction of the conventional current. Your fingers curl in the direction of the magnetic field lines around the wire.", createdAt: "2024-01-15T09:32:00Z" },
  { id: "msg_8k1_7", threadId: "thr_8_k1", stageId: "stg_8k1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T09:35:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_8k1_8", threadId: "thr_8_k1", stageId: "stg_8k1_c", role: "student", content: "Using the right-hand rule: point thumb in the direction of conventional current, fingers curl showing field direction. For a wire with current going up, the field circles counterclockwise when viewed from above. Field strength B = \u03bc\u2080I/(2\u03c0r), so it's inversely proportional to distance r. At double the distance, the field is half as strong. The field is continuous and never has a starting or ending point\u2014the lines form closed loops.", createdAt: "2024-01-15T10:15:00Z" },
  { id: "msg_8k1_9", threadId: "thr_8_k1", stageId: "stg_8k1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-15T10:20:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 8_k2 - Electromagnets (challenge_started) ==========

  // Begin stage
  { id: "msg_8k2_1", threadId: "thr_8_k2", stageId: "stg_8k2_b", role: "student", content: "An electromagnet is a magnet made by passing electric current through a coil of wire, often wrapped around an iron core. It can be turned on and off.", createdAt: "2024-01-15T10:40:00Z" },
  { id: "msg_8k2_2", threadId: "thr_8_k2", stageId: "stg_8k2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T10:45:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich step-by-step tutor flow
  { id: "msg_8k2_3", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "tutor", content: "Let's work on electromagnets. First, can you tell me what happens when you wrap a wire around an iron core and pass current through it?", createdAt: "2024-01-15T10:48:00Z" },
  { id: "msg_8k2_4", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "student", content: "The iron becomes magnetized because the current creates a magnetic field that aligns the iron's magnetic domains.", createdAt: "2024-01-15T10:52:00Z" },
  { id: "msg_8k2_5", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "tutor", content: "Great! That's right. Now, we need to understand how to increase the strength. You can do this by either increasing the current or adding more turns of wire. Which factor do you think has a bigger effect?", createdAt: "2024-01-15T10:55:00Z" },
  { id: "msg_8k2_6", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "student", content: "More turns? Each turn adds another loop of magnetic field, so more turns means a stronger overall field.", createdAt: "2024-01-15T10:58:00Z" },
  { id: "msg_8k2_7", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "tutor", content: "Good thinking! Actually, both factors are equally important and proportional. B is proportional to both n (turns per unit length) and I (current). Now let's put this together: for a solenoid, B = \u03bc\u2080nI. Can you identify what each symbol represents?", createdAt: "2024-01-15T11:00:00Z" },
  { id: "msg_8k2_8", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "student", content: "B is the magnetic field strength in Tesla, \u03bc\u2080 is the permeability of free space (4\u03c0 \u00d7 10\u207b\u2077 T\u00b7m/A), n is the number of turns per unit length (N/L), and I is the current in amperes.", createdAt: "2024-01-15T11:03:00Z" },
  { id: "msg_8k2_9", threadId: "thr_8_k2", stageId: "stg_8k2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T11:05:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage - student started but not completed
  { id: "msg_8k2_10", threadId: "thr_8_k2", stageId: "stg_8k2_c", role: "student", content: "The factors affecting electromagnet strength are: current (I), number of turns per unit length (n), and core material (permeability \u03bc). For the derivation of B = \u03bc\u2080nI...", createdAt: "2024-01-15T11:10:00Z" },
  { id: "msg_8k2_11", threadId: "thr_8_k2", stageId: "stg_8k2_c", role: "tutor", content: "Good start! You've correctly identified the factors. Can you complete the derivation by applying Amp\u00e8re's law to a rectangular Amperian loop around the solenoid?", createdAt: "2024-01-15T11:15:00Z" },

  // ========== Thread 8_k3 - Electromagnetic Induction (not_started - begin done, on walkthrough) ==========

  // Begin stage
  { id: "msg_8k3_1", threadId: "thr_8_k3", stageId: "stg_8k3_b", role: "student", content: "Electromagnetic induction is the process of generating an electric current or EMF by changing the magnetic flux through a conductor. It was discovered by Faraday.", createdAt: "2024-01-15T11:20:00Z" },
  { id: "msg_8k3_2", threadId: "thr_8_k3", stageId: "stg_8k3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T11:25:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough just started - tutor's first prompt, student hasn't responded yet
  { id: "msg_8k3_3", threadId: "thr_8_k3", stageId: "stg_8k3_w", role: "tutor", content: "Let's work on electromagnetic induction. First, can you state Faraday's law in mathematical form?", createdAt: "2024-01-15T11:28:00Z" },

  // ========== Thread 8_k4 - Lenz's Law (not_started) ==========
  { id: "msg_8k4_0", threadId: "thr_8_k4", stageId: "stg_8k4_b", role: "tutor", content: "Hi! We're going to explore Lenz's law. What does Lenz's law tell us about the direction of an induced current? Share your thoughts!", createdAt: "2024-01-15T09:00:00Z" },

  // ========== Thread 8_k5 - Magnetic Flux (challenge_complete) ==========

  // Begin stage
  { id: "msg_8k5_1", threadId: "thr_8_k5", stageId: "stg_8k5_b", role: "student", content: "Magnetic flux is the total magnetic field passing through a given area. It depends on the field strength, the area, and the angle between the field and the surface normal. It is measured in Webers (Wb).", createdAt: "2024-01-15T13:00:00Z" },
  { id: "msg_8k5_2", threadId: "thr_8_k5", stageId: "stg_8k5_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T13:05:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_8k5_3", threadId: "thr_8_k5", stageId: "stg_8k5_w", role: "tutor", content: "Let's work on magnetic flux. First, can you write the formula for magnetic flux through a flat surface?", createdAt: "2024-01-15T13:10:00Z" },
  { id: "msg_8k5_4", threadId: "thr_8_k5", stageId: "stg_8k5_w", role: "student", content: "\u03a6 = B \u00b7 A \u00b7 cos(\u03b8), where B is the magnetic field, A is the area, and \u03b8 is the angle between the field direction and the normal to the surface.", createdAt: "2024-01-15T13:15:00Z" },
  { id: "msg_8k5_5", threadId: "thr_8_k5", stageId: "stg_8k5_w", role: "tutor", content: "Great! That's right. Now, we need to understand when flux is maximum and minimum. You can do this by thinking about the angle \u03b8. When is the flux at its maximum, and when is it zero?", createdAt: "2024-01-15T13:18:00Z" },
  { id: "msg_8k5_6", threadId: "thr_8_k5", stageId: "stg_8k5_w", role: "student", content: "Flux is maximum when \u03b8 = 0\u00b0 (field is perpendicular to the surface, or parallel to the normal), because cos(0\u00b0) = 1. Flux is zero when \u03b8 = 90\u00b0 (field is parallel to the surface), because cos(90\u00b0) = 0.", createdAt: "2024-01-15T13:22:00Z" },
  { id: "msg_8k5_7", threadId: "thr_8_k5", stageId: "stg_8k5_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T13:25:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_8k5_8", threadId: "thr_8_k5", stageId: "stg_8k5_c", role: "student", content: "Area of coil: A = \u03c0r\u00b2 = \u03c0(0.1)\u00b2 = 0.0314 m\u00b2. For N = 50 turns:\n\nAt 0\u00b0: \u03a6 = NBA cos(0\u00b0) = 50 \u00d7 0.2 \u00d7 0.0314 \u00d7 1 = 0.314 Wb\nAt 30\u00b0: \u03a6 = 50 \u00d7 0.2 \u00d7 0.0314 \u00d7 cos(30\u00b0) = 0.314 \u00d7 0.866 = 0.272 Wb\nAt 60\u00b0: \u03a6 = 50 \u00d7 0.2 \u00d7 0.0314 \u00d7 cos(60\u00b0) = 0.314 \u00d7 0.5 = 0.157 Wb\nAt 90\u00b0: \u03a6 = 50 \u00d7 0.2 \u00d7 0.0314 \u00d7 cos(90\u00b0) = 0.314 \u00d7 0 = 0 Wb", createdAt: "2024-01-15T13:50:00Z" },
  { id: "msg_8k5_9", threadId: "thr_8_k5", stageId: "stg_8k5_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-15T13:55:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 8_k6 - Magnetic Materials (not_started) ==========
  { id: "msg_8k6_0", threadId: "thr_8_k6", stageId: "stg_8k6_b", role: "tutor", content: "Welcome! Let's explore magnetic materials. Why are some materials magnetic and others are not? What do you think?", createdAt: "2024-01-15T09:00:00Z" },

  // ========== Thread 8_k7 - Earth's Magnetic Field (not_started - begin done, on walkthrough) ==========

  // Begin stage
  { id: "msg_8k7_1", threadId: "thr_8_k7", stageId: "stg_8k7_b", role: "student", content: "Earth's magnetic field is caused by convection currents in the liquid iron outer core. These moving charges create a self-sustaining dynamo effect.", createdAt: "2024-01-15T14:10:00Z" },
  { id: "msg_8k7_2", threadId: "thr_8_k7", stageId: "stg_8k7_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T14:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough just started
  { id: "msg_8k7_3", threadId: "thr_8_k7", stageId: "stg_8k7_w", role: "tutor", content: "Let's work on Earth's magnetic field. First, can you describe the overall shape of the field? How does it compare to a simple bar magnet?", createdAt: "2024-01-15T14:20:00Z" },

  // ========== Thread 8_s1 - Calculating B-field / Biot-Savart (challenge_complete) ==========

  // Begin stage
  { id: "msg_8s1_1", threadId: "thr_8_s1", stageId: "stg_8s1_b", role: "student", content: "The field at 1cm is stronger because B = \u03bc\u2080I/(2\u03c0r), so B is inversely proportional to distance. Closer means stronger.", createdAt: "2024-01-15T11:40:00Z" },
  { id: "msg_8s1_2", threadId: "thr_8_s1", stageId: "stg_8s1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T11:45:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich tutor flow
  { id: "msg_8s1_3", threadId: "thr_8_s1", stageId: "stg_8s1_w", role: "tutor", content: "Let's work on calculating B-fields from wires using the Biot-Savart law. First, what formula relates the magnetic field to current and distance for a long straight wire?", createdAt: "2024-01-15T11:48:00Z" },
  { id: "msg_8s1_4", threadId: "thr_8_s1", stageId: "stg_8s1_w", role: "student", content: "B = \u03bc\u2080I / (2\u03c0r), where \u03bc\u2080 = 4\u03c0 \u00d7 10\u207b\u2077 T\u00b7m/A.", createdAt: "2024-01-15T11:50:00Z" },
  { id: "msg_8s1_5", threadId: "thr_8_s1", stageId: "stg_8s1_w", role: "tutor", content: "Great! That's right. Now, let's plug in some numbers. You can do this by substituting I = 2A and r = 5cm = 0.05m. What do you get for B?", createdAt: "2024-01-15T11:52:00Z" },
  { id: "msg_8s1_6", threadId: "thr_8_s1", stageId: "stg_8s1_w", role: "student", content: "B = (4\u03c0 \u00d7 10\u207b\u2077 \u00d7 2) / (2\u03c0 \u00d7 0.05) = (8\u03c0 \u00d7 10\u207b\u2077) / (0.1\u03c0) = 8 \u00d7 10\u207b\u2076 T = 8 \u03bcT.", createdAt: "2024-01-15T11:55:00Z" },
  { id: "msg_8s1_7", threadId: "thr_8_s1", stageId: "stg_8s1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T12:00:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_8s1_8", threadId: "thr_8_s1", stageId: "stg_8s1_c", role: "student", content: "Each wire creates B = \u03bc\u2080I/(2\u03c0r) at the midpoint, where r = 5cm = 0.05m and I = 5A.\n\nB_each = (4\u03c0 \u00d7 10\u207b\u2077 \u00d7 5) / (2\u03c0 \u00d7 0.05) = 2 \u00d7 10\u207b\u2075 T = 20 \u03bcT.\n\nSince the currents are in opposite directions, by the right-hand rule both fields point in the same direction at the midpoint (they add rather than cancel).\n\nB_total = 2 \u00d7 20 \u03bcT = 40 \u03bcT = 4 \u00d7 10\u207b\u2075 T.", createdAt: "2024-01-15T12:10:00Z" },
  { id: "msg_8s1_9", threadId: "thr_8_s1", stageId: "stg_8s1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-15T12:15:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 8_s2 - Solenoid Field Calculations (challenge_started) ==========

  // Begin stage
  { id: "msg_8s2_1", threadId: "thr_8_s2", stageId: "stg_8s2_b", role: "student", content: "The magnetic field doubles because B = \u03bc\u2080nI, and n is proportional to the number of turns (for the same length). So doubling turns doubles n and therefore doubles B.", createdAt: "2024-01-15T12:20:00Z" },
  { id: "msg_8s2_2", threadId: "thr_8_s2", stageId: "stg_8s2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T12:25:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich tutor flow
  { id: "msg_8s2_3", threadId: "thr_8_s2", stageId: "stg_8s2_w", role: "tutor", content: "Let's work on solenoid field calculations. First, write down the formula for the magnetic field inside a solenoid and identify each variable.", createdAt: "2024-01-15T12:28:00Z" },
  { id: "msg_8s2_4", threadId: "thr_8_s2", stageId: "stg_8s2_w", role: "student", content: "B = \u03bc\u2080nI = \u03bc\u2080(N/L)I, where N is total turns, L is the solenoid length, and I is the current.", createdAt: "2024-01-15T12:31:00Z" },
  { id: "msg_8s2_5", threadId: "thr_8_s2", stageId: "stg_8s2_w", role: "tutor", content: "Great! That's right. Now, let's practice: a solenoid has 400 turns, is 20 cm long, and carries 3A. You can do this by substituting into B = \u03bc\u2080(N/L)I. What is B?", createdAt: "2024-01-15T12:33:00Z" },
  { id: "msg_8s2_6", threadId: "thr_8_s2", stageId: "stg_8s2_w", role: "student", content: "n = 400/0.20 = 2000 turns/m. B = 4\u03c0 \u00d7 10\u207b\u2077 \u00d7 2000 \u00d7 3 = 4\u03c0 \u00d7 6 \u00d7 10\u207b\u2074 = 7.54 \u00d7 10\u207b\u00b3 T \u2248 7.54 mT.", createdAt: "2024-01-15T12:36:00Z" },
  { id: "msg_8s2_7", threadId: "thr_8_s2", stageId: "stg_8s2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T12:38:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage - student working on it
  { id: "msg_8s2_8", threadId: "thr_8_s2", stageId: "stg_8s2_c", role: "student", content: "We need B = 0.01 T with I = 2A. From B = \u03bc\u2080(N/L)I, we get N/L = B/(\u03bc\u2080I) = 0.01/(4\u03c0 \u00d7 10\u207b\u2077 \u00d7 2) = 3979 turns/m. So if L = 0.25 m, N = 3979 \u00d7 0.25 = 995 turns. If L = 0.5 m, N = 1990 turns.", createdAt: "2024-01-15T12:42:00Z" },
  { id: "msg_8s2_9", threadId: "thr_8_s2", stageId: "stg_8s2_c", role: "tutor", content: "Excellent calculation! You've correctly found the turns-per-length requirement. Can you also discuss practical considerations \u2014 what would happen if the solenoid is too short relative to its diameter, and how might a ferromagnetic core change your design?", createdAt: "2024-01-15T12:45:00Z" },

  // ========== Thread 8_s3 - Faraday's Law Calculations (not_started - begin done, on walkthrough) ==========

  // Begin stage
  { id: "msg_8s3_1", threadId: "thr_8_s3", stageId: "stg_8s3_b", role: "student", content: "The induced EMF increases because EMF = -N d\u03a6/dt. Moving the magnet faster means the flux changes more quickly, so d\u03a6/dt is larger and the EMF is greater.", createdAt: "2024-01-15T12:50:00Z" },
  { id: "msg_8s3_2", threadId: "thr_8_s3", stageId: "stg_8s3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T12:55:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough just started
  { id: "msg_8s3_3", threadId: "thr_8_s3", stageId: "stg_8s3_w", role: "tutor", content: "Let's work on Faraday's law calculations. First, can you write out Faraday's law and explain the meaning of the negative sign?", createdAt: "2024-01-15T12:58:00Z" },

  // ========== Thread 8_s4 - Transformer Calculations (not_started) ==========
  { id: "msg_8s4_0", threadId: "thr_8_s4", stageId: "stg_8s4_b", role: "tutor", content: "Hi! Let's work on transformers. If a transformer has 100 turns on the primary and 500 turns on the secondary, is it a step-up or step-down transformer? Tell me why!", createdAt: "2024-01-15T09:00:00Z" },

  // ========== Thread 8_s5 - Lorentz Force (not_started) ==========
  { id: "msg_8s5_0", threadId: "thr_8_s5", stageId: "stg_8s5_b", role: "tutor", content: "Hey! We're going to explore the Lorentz force. What happens to a charged particle moving through a magnetic field? Share your thinking.", createdAt: "2024-01-15T09:00:00Z" },

  // ========== Thread 8_s6 - Magnetic Circuit Problems (challenge_complete) ==========

  // Begin stage
  { id: "msg_8s6_1", threadId: "thr_8_s6", stageId: "stg_8s6_b", role: "student", content: "A magnetic circuit is a closed path through which magnetic flux flows, analogous to an electric circuit. Magnetomotive force (MMF = NI) is like voltage, magnetic flux (\u03a6) is like current, and reluctance (R = l/\u03bcA) is like resistance. Ohm's law for magnetics: \u03a6 = MMF/R.", createdAt: "2024-01-15T14:40:00Z" },
  { id: "msg_8s6_2", threadId: "thr_8_s6", stageId: "stg_8s6_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-15T14:45:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_8s6_3", threadId: "thr_8_s6", stageId: "stg_8s6_w", role: "tutor", content: "Let's work on magnetic circuit analysis. First, can you list the three key quantities in a magnetic circuit and their electric circuit analogs?", createdAt: "2024-01-15T14:48:00Z" },
  { id: "msg_8s6_4", threadId: "thr_8_s6", stageId: "stg_8s6_w", role: "student", content: "1. Magnetomotive force (MMF = NI) is like EMF/voltage. 2. Magnetic flux (\u03a6) is like current. 3. Reluctance (R = l/(\u03bcA)) is like resistance. The governing equation is \u03a6 = MMF / R, analogous to Ohm's law.", createdAt: "2024-01-15T14:51:00Z" },
  { id: "msg_8s6_5", threadId: "thr_8_s6", stageId: "stg_8s6_w", role: "tutor", content: "Great! That's right. Now, we need to handle circuits with multiple sections. You can do this by adding reluctances in series, just like resistors. If a magnetic circuit has an iron section and an air gap, how do you find the total reluctance?", createdAt: "2024-01-15T14:54:00Z" },
  { id: "msg_8s6_6", threadId: "thr_8_s6", stageId: "stg_8s6_w", role: "student", content: "Total reluctance = R_iron + R_air. R_iron = l_iron / (\u03bc_iron \u00d7 A) and R_air = l_gap / (\u03bc\u2080 \u00d7 A). Since \u03bc\u2080 is much smaller than \u03bc_iron, the air gap usually dominates the total reluctance even when it is very thin.", createdAt: "2024-01-15T14:57:00Z" },
  { id: "msg_8s6_7", threadId: "thr_8_s6", stageId: "stg_8s6_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-15T14:59:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_8s6_8", threadId: "thr_8_s6", stageId: "stg_8s6_c", role: "student", content: "Given: mean radius = 10 cm, so mean circumference = 2\u03c0(0.1) = 0.6283 m. Cross-section A = 4 cm\u00b2 = 4 \u00d7 10\u207b\u2074 m\u00b2. \u03bcr = 2000, air gap = 1 mm = 0.001 m, N = 500 turns, I = 2A.\n\nMMF = NI = 500 \u00d7 2 = 1000 A\u00b7turns.\n\nLength of iron path: l_iron = 0.6283 - 0.001 = 0.6273 m.\n\u03bc_iron = \u03bcr\u03bc\u2080 = 2000 \u00d7 4\u03c0 \u00d7 10\u207b\u2077 = 2.513 \u00d7 10\u207b\u00b3 H/m.\nR_iron = 0.6273 / (2.513 \u00d7 10\u207b\u00b3 \u00d7 4 \u00d7 10\u207b\u2074) = 624,100 A\u00b7turns/Wb.\n\nR_air = 0.001 / (4\u03c0 \u00d7 10\u207b\u2077 \u00d7 4 \u00d7 10\u207b\u2074) = 1,989,400 A\u00b7turns/Wb.\n\nR_total = 624,100 + 1,989,400 = 2,613,500 A\u00b7turns/Wb.\n\n\u03a6 = MMF / R_total = 1000 / 2,613,500 = 3.83 \u00d7 10\u207b\u2074 Wb = 0.383 mWb.\n\nNote: the air gap contributes about 76% of the total reluctance despite being only 0.16% of the path length.", createdAt: "2024-01-15T14:55:00Z" },
  { id: "msg_8s6_9", threadId: "thr_8_s6", stageId: "stg_8s6_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-15T15:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 8_c1 - Explain Magnetism & Motors (not_started) ==========
  { id: "msg_8c1_0", threadId: "thr_8_c1", stageId: "stg_8c1_b", role: "tutor", content: "Welcome to your capstone! Here you'll explain the concepts from this unit in your own words. How do magnetic fields, electromagnets, and electromagnetic induction work together in something like an electric motor? Teach it back using what you learned.", createdAt: "2024-01-15T09:00:00Z" },

  // ========== Thread 8_c2 - Explain EM Waves (not_started) ==========
  { id: "msg_8c2_0", threadId: "thr_8_c2", stageId: "stg_8c2_b", role: "tutor", content: "Hi! This capstone is about explaining what you learned. In your own words, how are changing electric and magnetic fields related to the propagation of electromagnetic waves? Use the ideas from the lesson.", createdAt: "2024-01-15T09:00:00Z" },

  // ======================================================================
  //  UNIT 1 MESSAGES - COLONIAL AMERICA (ALL COMPLETED)
  // ======================================================================

  // ========== Thread 1_k1 - Jamestown Settlement (challenge_complete) ==========

  // Begin stage
  { id: "msg_1k1_1", threadId: "thr_1_k1", stageId: "stg_1k1_b", role: "student", content: "Jamestown was established in 1607 by the Virginia Company as a commercial venture. The settlers faced starvation, disease, conflicts with the Powhatan Confederacy, and poor leadership during the early years.", createdAt: "2024-01-02T09:10:00Z" },
  { id: "msg_1k1_2", threadId: "thr_1_k1", stageId: "stg_1k1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-02T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_1k1_3", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "tutor", content: "Good foundation! Let's dig deeper into Jamestown's survival. First, what was the 'starving time' and when did it occur?", createdAt: "2024-01-02T09:20:00Z" },
  { id: "msg_1k1_4", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "student", content: "The starving time was the winter of 1609-1610. The colonists were trapped inside the fort due to conflicts with the Powhatan and ran out of food. Only about 60 of the 500 settlers survived.", createdAt: "2024-01-02T09:25:00Z" },
  { id: "msg_1k1_5", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "tutor", content: "That's right. Now, John Smith had already left by then. But earlier, what policy did Smith implement that helped the colony survive, and why was it controversial?", createdAt: "2024-01-02T09:30:00Z" },
  { id: "msg_1k1_6", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "student", content: "Smith enforced a 'he who shall not work shall not eat' policy. It was controversial because many of the gentlemen colonists considered manual labor beneath them, but Smith forced everyone to contribute to building and farming.", createdAt: "2024-01-02T09:35:00Z" },
  { id: "msg_1k1_7", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "tutor", content: "Excellent! Now let's consider the economic turning point. What role did John Rolfe play in Jamestown's long-term survival, and how did his contribution change the colony's future?", createdAt: "2024-01-02T09:40:00Z" },
  { id: "msg_1k1_8", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "student", content: "John Rolfe introduced a sweeter strain of tobacco from the Caribbean around 1612. This became a cash crop that made Jamestown profitable, attracting more settlers and investment. It also led to the plantation system and eventually the importation of enslaved Africans in 1619.", createdAt: "2024-01-02T09:45:00Z" },
  { id: "msg_1k1_9", threadId: "thr_1_k1", stageId: "stg_1k1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-02T09:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1k1_10", threadId: "thr_1_k1", stageId: "stg_1k1_c", role: "student", content: "Jamestown's survival was due more to economic factors than leadership, though both mattered. While Smith's discipline kept colonists alive short-term, the colony nearly failed again after he left. It was Rolfe's tobacco cultivation that provided a sustainable economic reason for the colony's existence. The Virginia Company finally saw returns on investment, which attracted more settlers, supplies, and eventually women and families. Tobacco created a permanent economic foundation, whereas good leadership was temporary and person-dependent. The headright system, which gave land to those who paid for passage, further tied survival to economics. However, leadership and economics were intertwined: without Smith's early discipline, there might not have been a colony left for Rolfe to save.", createdAt: "2024-01-02T09:55:00Z" },
  { id: "msg_1k1_11", threadId: "thr_1_k1", stageId: "stg_1k1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-02T10:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_k2 - Mayflower Compact (challenge_complete) ==========

  // Begin stage
  { id: "msg_1k2_1", threadId: "thr_1_k2", stageId: "stg_1k2_b", role: "student", content: "The Mayflower Compact was an agreement signed in 1620 by the Pilgrims aboard the Mayflower. It was significant because it established the principle of self-government and majority rule in the Plymouth Colony.", createdAt: "2024-01-02T10:10:00Z" },
  { id: "msg_1k2_2", threadId: "thr_1_k2", stageId: "stg_1k2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-02T10:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_1k2_3", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "tutor", content: "Good start! Let's explore why the Compact was written in the first place. The Pilgrims were supposed to land in Virginia, but ended up in Massachusetts. Why did this create a political crisis on the ship?", createdAt: "2024-01-02T10:20:00Z" },
  { id: "msg_1k2_4", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "student", content: "Their patent from the Virginia Company was only valid for Virginia. Landing in Massachusetts meant they had no legal authority to govern. Some of the non-Pilgrim passengers, called 'Strangers,' said they would do as they pleased since no laws applied to them.", createdAt: "2024-01-02T10:25:00Z" },
  { id: "msg_1k2_5", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "tutor", content: "Exactly right! So the Compact was a practical solution to a real problem. Now, what did the signers actually agree to in the document? Think about two key principles it established.", createdAt: "2024-01-02T10:30:00Z" },
  { id: "msg_1k2_6", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "student", content: "They agreed to two main things: first, to form a 'civil body politic' -- basically a government by the consent of the governed. Second, to create and obey 'just and equal laws' made for the general good of the colony. This meant majority rule and the idea that laws should apply equally.", createdAt: "2024-01-02T10:35:00Z" },
  { id: "msg_1k2_7", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "tutor", content: "That's a strong analysis. Now, why is this document considered a stepping stone toward American democracy, even though it was quite limited?", createdAt: "2024-01-02T10:40:00Z" },
  { id: "msg_1k2_8", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "student", content: "It's a stepping stone because it was the first time European colonists in America created their own government based on the consent of the governed, rather than receiving authority from a king or company. But it was limited because only adult male church members could sign it -- women, servants, and non-church members were excluded.", createdAt: "2024-01-02T10:45:00Z" },
  { id: "msg_1k2_9", threadId: "thr_1_k2", stageId: "stg_1k2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-02T10:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1k2_10", threadId: "thr_1_k2", stageId: "stg_1k2_c", role: "student", content: "The Mayflower Compact shares several principles with modern democracy: government by consent, majority rule, and laws for the common good. These ideas later influenced the Declaration of Independence and the Constitution. However, the Compact was revolutionary only in a limited sense. It excluded women, servants, and non-members of the Separatist congregation. It also operated under the assumption of a religious community, not a secular state. Modern democracy extends rights to all citizens regardless of gender, religion, or social status. The Compact was a first step -- establishing that ordinary people could create their own government -- but it took centuries to expand 'the governed' to include everyone.", createdAt: "2024-01-02T10:55:00Z" },
  { id: "msg_1k2_11", threadId: "thr_1_k2", stageId: "stg_1k2_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-02T11:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_k3 - Colonial Government (challenge_complete) ==========

  // Begin stage
  { id: "msg_1k3_1", threadId: "thr_1_k3", stageId: "stg_1k3_b", role: "student", content: "The main forms were royal colonies governed by the king through appointed governors, proprietary colonies owned by individuals granted charters, and charter colonies that elected their own governors and had the most self-governance.", createdAt: "2024-01-02T11:10:00Z" },
  { id: "msg_1k3_2", threadId: "thr_1_k3", stageId: "stg_1k3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-02T11:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1k3_3", threadId: "thr_1_k3", stageId: "stg_1k3_w", role: "tutor", content: "Good overview! Let's compare these in more detail. In a royal colony like Virginia, who held the real power -- the governor or the colonial assembly?", createdAt: "2024-01-02T11:20:00Z" },
  { id: "msg_1k3_4", threadId: "thr_1_k3", stageId: "stg_1k3_w", role: "student", content: "The governor was appointed by the king and had veto power, but the colonial assembly controlled taxation and spending. Over time, assemblies gained more power by using their control of the purse to influence the governor.", createdAt: "2024-01-02T11:25:00Z" },
  { id: "msg_1k3_5", threadId: "thr_1_k3", stageId: "stg_1k3_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-02T11:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1k3_6", threadId: "thr_1_k3", stageId: "stg_1k3_c", role: "student", content: "The House of Burgesses (1619) was the first elected legislative body in America, establishing that colonists had a voice in governance. New England town meetings gave every male property owner a direct vote on local issues. Together, these institutions created a tradition of self-governance that colonists came to see as their right. When Parliament later tried to impose taxes without colonial representation, colonists could point to over a century of governing themselves. These institutions were the practical foundation of American representative democracy.", createdAt: "2024-01-02T11:55:00Z" },
  { id: "msg_1k3_7", threadId: "thr_1_k3", stageId: "stg_1k3_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-02T12:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_k4 - Mercantilism (challenge_complete) ==========

  // Begin stage
  { id: "msg_1k4_1", threadId: "thr_1_k4", stageId: "stg_1k4_b", role: "student", content: "Mercantilism was an economic system where colonies existed to enrich the mother country by providing raw materials and buying manufactured goods. The Navigation Acts required colonists to trade only with England.", createdAt: "2024-01-02T12:10:00Z" },
  { id: "msg_1k4_2", threadId: "thr_1_k4", stageId: "stg_1k4_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-02T12:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1k4_3", threadId: "thr_1_k4", stageId: "stg_1k4_w", role: "tutor", content: "Correct! Now, the Navigation Acts sound restrictive, but some historians argue colonists actually benefited in certain ways. Can you think of any advantages the mercantilist system offered the colonies?", createdAt: "2024-01-02T12:20:00Z" },
  { id: "msg_1k4_4", threadId: "thr_1_k4", stageId: "stg_1k4_w", role: "student", content: "Colonists had a guaranteed market for their goods in England, protection by the British navy, and access to credit from British merchants. Tobacco planters, for example, always had a buyer.", createdAt: "2024-01-02T12:25:00Z" },
  { id: "msg_1k4_5", threadId: "thr_1_k4", stageId: "stg_1k4_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-02T12:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1k4_6", threadId: "thr_1_k4", stageId: "stg_1k4_c", role: "student", content: "Mercantilism both helped and hindered colonial development. On one hand, the triangular trade gave colonies access to markets, naval protection, and capital. On the other hand, the Navigation Acts prevented colonies from developing manufacturing, forced them to use British ships (raising costs), and kept them dependent. Widespread smuggling showed colonists resented the restrictions. Ultimately, mercantilism hindered long-term development by preventing economic diversification and creating grievances that fueled revolution.", createdAt: "2024-01-02T12:55:00Z" },
  { id: "msg_1k4_7", threadId: "thr_1_k4", stageId: "stg_1k4_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-02T13:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_k5 - Great Awakening (challenge_complete) ==========

  // Begin stage
  { id: "msg_1k5_1", threadId: "thr_1_k5", stageId: "stg_1k5_b", role: "student", content: "The Great Awakening was a religious revival movement in the 1730s-1740s that swept through the American colonies. It emphasized personal religious experience and emotional preaching.", createdAt: "2024-01-02T13:10:00Z" },
  { id: "msg_1k5_2", threadId: "thr_1_k5", stageId: "stg_1k5_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-02T13:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1k5_3", threadId: "thr_1_k5", stageId: "stg_1k5_w", role: "tutor", content: "Good! Jonathan Edwards and George Whitefield approached preaching very differently. How did their styles compare, and why were they both so effective?", createdAt: "2024-01-02T13:20:00Z" },
  { id: "msg_1k5_4", threadId: "thr_1_k5", stageId: "stg_1k5_w", role: "student", content: "Edwards used terrifying imagery, like in 'Sinners in the Hands of an Angry God,' to scare people into repentance. Whitefield was a charismatic outdoor preacher who drew enormous crowds with his theatrical delivery. Both bypassed traditional church authority and spoke directly to ordinary people.", createdAt: "2024-01-02T13:25:00Z" },
  { id: "msg_1k5_5", threadId: "thr_1_k5", stageId: "stg_1k5_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-02T13:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1k5_6", threadId: "thr_1_k5", stageId: "stg_1k5_c", role: "student", content: "The Great Awakening contributed to American identity by creating shared experiences across colonial boundaries -- Whitefield preached from Georgia to New England. It challenged established authority by teaching that individuals could have a direct relationship with God without clergy as intermediaries. This anti-authoritarian attitude later transferred to politics. It also democratized religion by appealing to ordinary people, women, and even enslaved Africans, planting seeds of egalitarianism. The proliferation of new denominations strengthened the case for religious tolerance, prefiguring the First Amendment.", createdAt: "2024-01-02T13:55:00Z" },
  { id: "msg_1k5_7", threadId: "thr_1_k5", stageId: "stg_1k5_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-02T14:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_s1 - Primary Source Analysis (challenge_complete) ==========

  // Begin stage
  { id: "msg_1s1_1", threadId: "thr_1_s1", stageId: "stg_1s1_b", role: "student", content: "Smith's perspective is that of a leader trying to justify his actions and portray the colony positively. His potential biases include self-promotion, exaggeration of dangers to make himself look heroic, and downplaying conflicts that were his fault.", createdAt: "2024-01-03T09:10:00Z" },
  { id: "msg_1s1_2", threadId: "thr_1_s1", stageId: "stg_1s1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-03T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_1s1_3", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "tutor", content: "Good eye for bias! Let's practice the SOAP method systematically. Start with 'S' for Speaker. When analyzing a colonial-era document, what questions should you ask about the speaker?", createdAt: "2024-01-03T09:20:00Z" },
  { id: "msg_1s1_4", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "student", content: "Who wrote or created the source? What was their social position, education, and background? Were they an eyewitness or writing from secondhand accounts? What stake did they have in the events described?", createdAt: "2024-01-03T09:25:00Z" },
  { id: "msg_1s1_5", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "tutor", content: "Excellent questions! Now let's move to 'O' for Occasion and 'A' for Audience. Why do these matter when analyzing a colonial source?", createdAt: "2024-01-03T09:30:00Z" },
  { id: "msg_1s1_6", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "student", content: "Occasion tells us what was happening when the source was created -- was it written during a crisis, after the fact, or for a specific event? Audience matters because writers shape their message for their readers. A letter to the king would be more formal and flattering than a private diary entry. Both affect reliability and bias.", createdAt: "2024-01-03T09:35:00Z" },
  { id: "msg_1s1_7", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "tutor", content: "That's a sophisticated understanding. Finally, 'P' for Purpose. How does understanding purpose help us evaluate the source's reliability?", createdAt: "2024-01-03T09:40:00Z" },
  { id: "msg_1s1_8", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "student", content: "Purpose reveals why the source was created. If it was meant to persuade investors, it might exaggerate opportunities. If it was a legal document, it might be more factual. If it was propaganda, it could be heavily biased. Knowing the purpose helps us figure out what the source can reliably tell us and what we should be skeptical about.", createdAt: "2024-01-03T09:45:00Z" },
  { id: "msg_1s1_9", threadId: "thr_1_s1", stageId: "stg_1s1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-03T09:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1s1_10", threadId: "thr_1_s1", stageId: "stg_1s1_c", role: "student", content: "The Puritan leader writes from a position of authority, emphasizing religious duty, community order, and God's providence in colonial success. His purpose is to justify the colony's mission and encourage continued settlement. The indentured servant writes from a position of hardship, describing backbreaking labor, meager food, and harsh punishments. His purpose is to warn others or seek sympathy. Together, they reveal that colonial society was deeply stratified: the same colony could be a 'city upon a hill' for its leaders and a place of suffering for its laborers. Neither source alone gives the full picture -- the leader omits exploitation, while the servant may exaggerate hardship. Cross-referencing both gives a more complete understanding of colonial life.", createdAt: "2024-01-03T09:55:00Z" },
  { id: "msg_1s1_11", threadId: "thr_1_s1", stageId: "stg_1s1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-03T10:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_s2 - Map Reading / Colonial Geography (challenge_complete) ==========

  // Begin stage
  { id: "msg_1s2_1", threadId: "thr_1_s2", stageId: "stg_1s2_b", role: "student", content: "The three regions are New England (e.g., Massachusetts), Middle Colonies (e.g., Pennsylvania), and Southern Colonies (e.g., Virginia).", createdAt: "2024-01-03T10:10:00Z" },
  { id: "msg_1s2_2", threadId: "thr_1_s2", stageId: "stg_1s2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-03T10:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_1s2_3", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "tutor", content: "Good identification! Now let's think about how geography shaped life in each region. Start with New England: what was the terrain and climate like, and how did that affect what people did for a living?", createdAt: "2024-01-03T10:20:00Z" },
  { id: "msg_1s2_4", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "student", content: "New England had rocky soil, harsh winters, and a short growing season, so large-scale farming was difficult. Instead, people turned to fishing, shipbuilding, and trade. The coastline with many harbors made maritime commerce natural.", createdAt: "2024-01-03T10:25:00Z" },
  { id: "msg_1s2_5", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "tutor", content: "Exactly! Now contrast that with the Southern colonies. How did their geography create a completely different economic model?", createdAt: "2024-01-03T10:30:00Z" },
  { id: "msg_1s2_6", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "student", content: "The South had flat, fertile land, a warm climate, and a long growing season -- perfect for large-scale agriculture. Rivers provided transportation for heavy crops. This led to plantation farming of tobacco, rice, and indigo, which required large labor forces and led to reliance on enslaved labor.", createdAt: "2024-01-03T10:35:00Z" },
  { id: "msg_1s2_7", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "tutor", content: "Great connection between geography and labor systems! And where do the Middle Colonies fit in this spectrum?", createdAt: "2024-01-03T10:40:00Z" },
  { id: "msg_1s2_8", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "student", content: "The Middle Colonies had moderate climate and fertile soil, making them the 'breadbasket' colonies -- they grew wheat, corn, and other grains. They also had good harbors like New York and Philadelphia for trade, so they had a diverse economy mixing farming and commerce.", createdAt: "2024-01-03T10:45:00Z" },
  { id: "msg_1s2_9", threadId: "thr_1_s2", stageId: "stg_1s2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-03T10:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1s2_10", threadId: "thr_1_s2", stageId: "stg_1s2_c", role: "student", content: "The Southern colonies developed a plantation economy because their flat, fertile coastal plains and warm climate were ideal for labor-intensive cash crops like tobacco and rice. Navigable rivers allowed planters to ship directly from their plantations. This geography rewarded large landholdings and created demand for forced labor. New England's rocky soil and cold winters made plantation agriculture impossible. Instead, the deep harbors, abundant timber, and proximity to fishing grounds of the Grand Banks pushed colonists toward shipbuilding, fishing, and trade. Manufacturing developed because people needed goods they could not grow. Geography did not just influence economics -- it shaped entire social systems, from the South's hierarchical plantation society to New England's merchant and artisan communities.", createdAt: "2024-01-03T10:55:00Z" },
  { id: "msg_1s2_11", threadId: "thr_1_s2", stageId: "stg_1s2_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-03T11:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_s3 - Comparing Colonial Regions (challenge_complete) ==========

  // Begin stage
  { id: "msg_1s3_1", threadId: "thr_1_s3", stageId: "stg_1s3_b", role: "student", content: "New England focused on trade and fishing, the Middle Colonies were the breadbasket with diverse farming, and the Southern Colonies depended on plantation agriculture using enslaved labor.", createdAt: "2024-01-03T11:10:00Z" },
  { id: "msg_1s3_2", threadId: "thr_1_s3", stageId: "stg_1s3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-03T11:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1s3_3", threadId: "thr_1_s3", stageId: "stg_1s3_w", role: "tutor", content: "Let's build a more detailed comparison. Beyond economics, how did religion differ across the three regions?", createdAt: "2024-01-03T11:20:00Z" },
  { id: "msg_1s3_4", threadId: "thr_1_s3", stageId: "stg_1s3_w", role: "student", content: "New England was dominated by Puritans who enforced strict religious conformity. The Middle Colonies were the most religiously diverse, with Quakers, Dutch Reformed, Lutherans, and others practicing tolerance. The South was mainly Anglican but religion played a less central role in daily governance.", createdAt: "2024-01-03T11:25:00Z" },
  { id: "msg_1s3_5", threadId: "thr_1_s3", stageId: "stg_1s3_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-03T11:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1s3_6", threadId: "thr_1_s3", stageId: "stg_1s3_c", role: "student", content: "The Middle Colonies were best positioned for long-term economic success because of their diversified economy. Unlike the South's dependence on cash crops (vulnerable to price fluctuations and soil depletion) or New England's limited agricultural base, the Middle Colonies combined productive farming, active trade, and early manufacturing. Their religious and ethnic diversity fostered tolerance and attracted immigrants with varied skills. Philadelphia and New York became major commercial centers. This diversification provided resilience that single-crop economies lacked.", createdAt: "2024-01-03T11:55:00Z" },
  { id: "msg_1s3_7", threadId: "thr_1_s3", stageId: "stg_1s3_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-03T12:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_s4 - Timeline Construction (challenge_complete) ==========

  // Begin stage
  { id: "msg_1s4_1", threadId: "thr_1_s4", stageId: "stg_1s4_b", role: "student", content: "Chronological order: Jamestown founding (1607), Mayflower Compact (1620), Bacon's Rebellion (1676), Salem Witch Trials (1692).", createdAt: "2024-01-03T12:10:00Z" },
  { id: "msg_1s4_2", threadId: "thr_1_s4", stageId: "stg_1s4_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-03T12:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1s4_3", threadId: "thr_1_s4", stageId: "stg_1s4_w", role: "tutor", content: "Correct! Now let's think about cause and effect. How did Bacon's Rebellion (1676) lead to changes in the labor system in Virginia?", createdAt: "2024-01-03T12:20:00Z" },
  { id: "msg_1s4_4", threadId: "thr_1_s4", stageId: "stg_1s4_w", role: "student", content: "After Bacon's Rebellion, planters feared armed former indentured servants. They shifted to enslaved African labor, which was permanent and created a racial caste system that prevented the kind of cross-class rebellion Bacon had led.", createdAt: "2024-01-03T12:25:00Z" },
  { id: "msg_1s4_5", threadId: "thr_1_s4", stageId: "stg_1s4_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-03T12:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1s4_6", threadId: "thr_1_s4", stageId: "stg_1s4_c", role: "student", content: "Key timeline with cause-effect links: Jamestown (1607) establishes commercial colonization model; Mayflower Compact (1620) establishes self-governance precedent; Navigation Acts (1651-1673) impose mercantilist control, breeding resentment; Bacon's Rebellion (1676) shifts labor to slavery; Salem Witch Trials (1692) expose dangers of theocratic governance; Great Awakening (1730s-1740s) unifies colonies culturally and challenges authority; French and Indian War (1754-1763) creates British debt leading to taxation. Each event built upon previous ones: commercial colonies needed governance, governance created assemblies, economic restrictions created grievances, and shared experiences created a colonial identity ready for revolution.", createdAt: "2024-01-03T12:55:00Z" },
  { id: "msg_1s4_7", threadId: "thr_1_s4", stageId: "stg_1s4_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-03T13:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_s5 - Persuasive Essay Writing (challenge_complete) ==========

  // Begin stage
  { id: "msg_1s5_1", threadId: "thr_1_s5", stageId: "stg_1s5_b", role: "student", content: "Key elements include a clear thesis statement, supporting evidence from primary and secondary sources, addressing counterarguments, logical organization, and a strong conclusion that reinforces the thesis.", createdAt: "2024-01-03T13:10:00Z" },
  { id: "msg_1s5_2", threadId: "thr_1_s5", stageId: "stg_1s5_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-03T13:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1s5_3", threadId: "thr_1_s5", stageId: "stg_1s5_w", role: "tutor", content: "Good list! Let's practice writing a thesis statement. If the topic is 'life in colonial New England,' what would be a strong, arguable thesis?", createdAt: "2024-01-03T13:20:00Z" },
  { id: "msg_1s5_4", threadId: "thr_1_s5", stageId: "stg_1s5_w", role: "student", content: "Thesis: 'Despite their emphasis on religious purity and community, Puritan New England colonies were shaped more by economic ambition than spiritual ideals, as evidenced by the rapid growth of trade, the decline of church membership, and conflicts over land.'", createdAt: "2024-01-03T13:25:00Z" },
  { id: "msg_1s5_5", threadId: "thr_1_s5", stageId: "stg_1s5_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-03T13:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1s5_6", threadId: "thr_1_s5", stageId: "stg_1s5_c", role: "student", content: "Indentured servitude was primarily a system of exploitation disguised as opportunity. While servants were promised land and freedom after their term, the reality was harsh: brutal working conditions, extended contracts for minor infractions, high mortality rates (especially in the Chesapeake), and limited actual land grants upon completion. The system benefited landowners who received cheap labor and headright land grants. However, the small percentage who survived and prospered -- like some who became landowners after Bacon's Rebellion -- show it could occasionally function as advertised. The system's replacement by racial slavery after 1676 further reveals its exploitative nature: planters simply found an even more brutal labor source.", createdAt: "2024-01-03T13:55:00Z" },
  { id: "msg_1s5_7", threadId: "thr_1_s5", stageId: "stg_1s5_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-03T14:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 1_c1 - Was Colonial America a Land of Opportunity? (challenge_complete) ==========

  // Begin stage
  { id: "msg_1c1_1", threadId: "thr_1_c1", stageId: "stg_1c1_b", role: "student", content: "'Land of opportunity' means a place where people could improve their social and economic standing through hard work, regardless of their background. In Colonial America, this applied mainly to white male property owners, not to enslaved people, most women, or Native Americans.", createdAt: "2024-01-04T09:10:00Z" },
  { id: "msg_1c1_2", threadId: "thr_1_c1", stageId: "stg_1c1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-04T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_1c1_3", threadId: "thr_1_c1", stageId: "stg_1c1_w", role: "tutor", content: "Great nuance! Let's examine each group. For wealthy English landowners who came to Virginia, was colonial America a land of opportunity?", createdAt: "2024-01-04T09:20:00Z" },
  { id: "msg_1c1_4", threadId: "thr_1_c1", stageId: "stg_1c1_w", role: "student", content: "Yes -- they could acquire vast tracts of land through headrights, grow profitable crops like tobacco, and rise to positions of political power in colonial assemblies. Some became wealthier than they ever could have in England's rigid class system.", createdAt: "2024-01-04T09:25:00Z" },
  { id: "msg_1c1_5", threadId: "thr_1_c1", stageId: "stg_1c1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-04T09:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_1c1_6", threadId: "thr_1_c1", stageId: "stg_1c1_c", role: "student", content: "Colonial America was a land of opportunity for some, but a land of exploitation for many others. For European men with capital, it offered cheap land, economic mobility, and political participation impossible in the rigid class systems of Europe. The headright system, abundant land, and growing trade created real pathways to prosperity. However, this opportunity was built on the dispossession of Native Americans, whose lands were taken through treaties, warfare, and disease. Enslaved Africans had no opportunity at all -- they were the labor force that made others' opportunities possible. Indentured servants occupied a middle ground: promised opportunity, but often exploited, with only a minority achieving the promised land and freedom. Women of all backgrounds had limited legal rights and economic independence. Therefore, calling Colonial America a 'land of opportunity' is only accurate if we acknowledge it was opportunity for a specific group, built on the systematic denial of opportunity to others.", createdAt: "2024-01-04T09:55:00Z" },
  { id: "msg_1c1_7", threadId: "thr_1_c1", stageId: "stg_1c1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-04T10:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ======================================================================
  //  UNIT 2 MESSAGES - REVOLUTIONARY WAR (MIXED PROGRESS)
  // ======================================================================

  // ========== Thread 2_k1 - Causes of Revolution (challenge_complete) ==========

  // Begin stage
  { id: "msg_2k1_1", threadId: "thr_2_k1", stageId: "stg_2k1_b", role: "student", content: "The main causes were taxation without representation (Stamp Act, Townshend Acts, Tea Act), the legacy of the French and Indian War which left Britain in debt, restriction of colonial self-governance through the Intolerable Acts, and Enlightenment ideas about natural rights.", createdAt: "2024-01-06T09:10:00Z" },
  { id: "msg_2k1_2", threadId: "thr_2_k1", stageId: "stg_2k1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-06T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_2k1_3", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "tutor", content: "Strong overview! Let's trace this chain more carefully. After the French and Indian War ended in 1763, Britain was deeply in debt. What was their reasoning for taxing the colonies, and why did colonists object?", createdAt: "2024-01-06T09:20:00Z" },
  { id: "msg_2k1_4", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "student", content: "Britain argued the war had been fought partly to protect the colonies, so colonists should help pay for it. They also needed to fund the 10,000 troops stationed in North America. Colonists objected not to the idea of taxes, but to taxes imposed by Parliament where they had no elected representatives -- 'no taxation without representation.'", createdAt: "2024-01-06T09:25:00Z" },
  { id: "msg_2k1_5", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "tutor", content: "Good distinction! Now, the Stamp Act of 1765 was the first direct tax on the colonies. How did the colonial response to the Stamp Act differ from earlier responses to the Navigation Acts, and why was that shift important?", createdAt: "2024-01-06T09:30:00Z" },
  { id: "msg_2k1_6", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "student", content: "The Navigation Acts were trade regulations that colonists mostly evaded through smuggling. The Stamp Act was different because it was a direct internal tax that affected everyone -- lawyers, printers, merchants, even card players. The response was organized: the Stamp Act Congress brought nine colonies together for the first time to issue a joint protest. This shift from individual evasion to collective political action was a major step toward unity.", createdAt: "2024-01-06T09:35:00Z" },
  { id: "msg_2k1_7", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "tutor", content: "Excellent analysis of the escalation pattern! Each British action produced a stronger colonial reaction. Let's look at the final escalation: how did the Intolerable Acts of 1774 push the colonies from protest to revolution?", createdAt: "2024-01-06T09:40:00Z" },
  { id: "msg_2k1_8", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "student", content: "The Intolerable Acts punished Massachusetts for the Boston Tea Party by closing Boston Harbor, revoking Massachusetts' charter, and requiring colonists to house British soldiers. Instead of isolating Massachusetts, this united the other colonies in sympathy. The First Continental Congress met in September 1774, and colonies began organizing militias. The Acts showed that Britain could strip any colony of its rights, making all colonies feel threatened.", createdAt: "2024-01-06T09:45:00Z" },
  { id: "msg_2k1_9", threadId: "thr_2_k1", stageId: "stg_2k1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-06T09:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_2k1_10", threadId: "thr_2_k1", stageId: "stg_2k1_c", role: "student", content: "I rank the top three causes as: 1) The principle of 'no taxation without representation' -- this was the ideological foundation that united diverse colonies around a shared grievance and gave the revolution moral legitimacy. 2) The Intolerable Acts -- these transformed protest into revolution by demonstrating Britain would use collective punishment, uniting previously hesitant colonies. 3) The French and Indian War's legacy -- this was the root cause that triggered everything else, creating the debt that led to taxation. Enlightenment ideas were important but insufficient alone; the colonists needed concrete grievances to act on abstract principles.", createdAt: "2024-01-06T09:55:00Z" },
  { id: "msg_2k1_11", threadId: "thr_2_k1", stageId: "stg_2k1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-06T10:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 2_k2 - Boston Tea Party (challenge_complete) ==========

  // Begin stage
  { id: "msg_2k2_1", threadId: "thr_2_k2", stageId: "stg_2k2_b", role: "student", content: "On December 16, 1773, the Sons of Liberty disguised as Mohawk Indians boarded three ships in Boston Harbor and dumped 342 chests of East India Company tea into the water. They did it to protest the Tea Act, which gave the East India Company a monopoly on tea sales and maintained the tax on tea.", createdAt: "2024-01-06T10:10:00Z" },
  { id: "msg_2k2_2", threadId: "thr_2_k2", stageId: "stg_2k2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-06T10:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage
  { id: "msg_2k2_3", threadId: "thr_2_k2", stageId: "stg_2k2_w", role: "tutor", content: "Good factual summary! Now let's think about the Tea Act more carefully. Ironically, the Tea Act actually lowered the price of tea. So why were colonists still angry about it?", createdAt: "2024-01-06T10:20:00Z" },
  { id: "msg_2k2_4", threadId: "thr_2_k2", stageId: "stg_2k2_w", role: "student", content: "Even though the tea was cheaper, it still included a tax that Parliament imposed without colonial consent. Colonists feared that if they accepted this tax, it would set a precedent for Parliament to tax them on anything. Also, the monopoly cut out colonial merchants and smugglers who had been selling Dutch tea.", createdAt: "2024-01-06T10:25:00Z" },
  { id: "msg_2k2_5", threadId: "thr_2_k2", stageId: "stg_2k2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-06T10:30:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_2k2_6", threadId: "thr_2_k2", stageId: "stg_2k2_c", role: "student", content: "From the Patriot perspective, the Boston Tea Party was justified protest against tyranny. The colonists had petitioned peacefully for years and been ignored. The Tea Act threatened both their principle of self-governance and their economic livelihoods. The careful targeting of only tea (they damaged no other property and even replaced a broken padlock) shows it was principled resistance, not mob violence. From the Loyalist perspective, it was criminal destruction of private property worth about 10,000 pounds. The colonists had legal channels to protest and could have simply refused to buy the tea. Destroying another's property is never justified in a society of laws. I find the Patriot interpretation more compelling because the colonists had exhausted peaceful options, but I acknowledge the Loyalist point that property destruction set a dangerous precedent and directly provoked the harsh Intolerable Acts.", createdAt: "2024-01-06T10:55:00Z" },
  { id: "msg_2k2_7", threadId: "thr_2_k2", stageId: "stg_2k2_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-06T11:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 2_k3 - Declaration of Independence (challenge_started) ==========

  // Begin stage
  { id: "msg_2k3_1", threadId: "thr_2_k3", stageId: "stg_2k3_b", role: "student", content: "The Declaration of Independence was adopted on July 4, 1776 by the Second Continental Congress. Its main ideas were that all men are created equal with unalienable rights to life, liberty, and the pursuit of happiness, and that government derives its power from the consent of the governed.", createdAt: "2024-01-06T11:10:00Z" },
  { id: "msg_2k3_2", threadId: "thr_2_k3", stageId: "stg_2k3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-06T11:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_2k3_3", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "tutor", content: "Good summary! Let's look at the structure more carefully. The Declaration has three main sections. Can you identify what the preamble does philosophically -- what argument is Jefferson building?", createdAt: "2024-01-06T11:20:00Z" },
  { id: "msg_2k3_4", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "student", content: "The preamble lays out a philosophical framework based on Enlightenment ideas, especially John Locke's social contract theory. It argues that people have natural rights, that governments exist to protect those rights, and that when a government fails to do so, the people have the right to alter or abolish it. Jefferson is building a universal argument that makes revolution not just justified, but a moral duty.", createdAt: "2024-01-06T11:25:00Z" },
  { id: "msg_2k3_5", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "tutor", content: "Excellent analysis of the rhetorical strategy! Now, the middle section lists specific grievances against King George III. Why did Jefferson focus on the king rather than Parliament?", createdAt: "2024-01-06T11:30:00Z" },
  { id: "msg_2k3_6", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "student", content: "Jefferson blamed the king because the colonists had already rejected Parliament's authority over them. By framing the conflict as being between the colonies and the king personally -- listing 'He has...' grievances -- Jefferson made it a clear case of a tyrant violating a social contract. This also made it easier to justify breaking away from the Crown specifically.", createdAt: "2024-01-06T11:35:00Z" },
  { id: "msg_2k3_7", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "tutor", content: "That's a sophisticated reading of the political strategy. Finally, how did Enlightenment thinkers like Locke directly influence the language and ideas Jefferson used?", createdAt: "2024-01-06T11:40:00Z" },
  { id: "msg_2k3_8", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "student", content: "Locke wrote about 'life, liberty, and property' as natural rights and the idea that government is a social contract. Jefferson adapted this to 'life, liberty, and the pursuit of happiness,' broadening the concept. Locke also argued that people could overthrow a government that violated the social contract -- Jefferson used this as the logical foundation for the entire Declaration.", createdAt: "2024-01-06T11:45:00Z" },
  { id: "msg_2k3_9", threadId: "thr_2_k3", stageId: "stg_2k3_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-06T11:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage - student working on it, not completed
  { id: "msg_2k3_10", threadId: "thr_2_k3", stageId: "stg_2k3_c", role: "student", content: "The contradiction between 'all men are created equal' and slavery was significant. Jefferson himself enslaved over 600 people during his lifetime. He actually included a passage condemning the slave trade in his draft, but the Continental Congress removed it because delegates from South Carolina and Georgia objected, and Northern merchants who profited from the slave trade also opposed it.", createdAt: "2024-01-06T11:55:00Z" },
  { id: "msg_2k3_11", threadId: "thr_2_k3", stageId: "stg_2k3_c", role: "tutor", content: "Good historical context! You've identified the political compromise. Can you now analyze the long-term consequences of this contradiction? How did the tension between the Declaration's ideals and the reality of slavery shape American history in the following decades?", createdAt: "2024-01-06T12:00:00Z" },

  // ========== Thread 2_k4 - Key Battles (not_started - begin done, on walkthrough) ==========

  // Begin stage
  { id: "msg_2k4_1", threadId: "thr_2_k4", stageId: "stg_2k4_b", role: "student", content: "Three major battles: Lexington and Concord (April 1775) started the war with 'the shot heard round the world'; Saratoga (October 1777) was the turning point that convinced France to ally with America; Yorktown (October 1781) was the final major battle where Cornwallis surrendered, effectively ending the war.", createdAt: "2024-01-06T12:10:00Z" },
  { id: "msg_2k4_2", threadId: "thr_2_k4", stageId: "stg_2k4_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-06T12:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough just started
  { id: "msg_2k4_3", threadId: "thr_2_k4", stageId: "stg_2k4_w", role: "tutor", content: "Good choices! Let's start with Saratoga. What was the British strategy in 1777, and why did their plan fail so badly?", createdAt: "2024-01-06T12:20:00Z" },

  // ========== Thread 2_k5 - Foreign Alliances (not_started) ==========
  { id: "msg_2k5_0", threadId: "thr_2_k5", stageId: "stg_2k5_b", role: "tutor", content: "Hi! Let's explore foreign alliances during the Revolution. Which foreign nations helped the American colonies and why do you think they got involved?", createdAt: "2024-01-06T09:00:00Z" },

  // ========== Thread 2_k6 - Treaty of Paris (not_started) ==========
  { id: "msg_2k6_0", threadId: "thr_2_k6", stageId: "stg_2k6_b", role: "tutor", content: "Welcome! We're looking at the Treaty of Paris of 1783. What were the key terms of this treaty? Share what you know or your best guess.", createdAt: "2024-01-06T09:00:00Z" },

  // ========== Thread 2_s1 - Analyzing Political Cartoons (challenge_complete) ==========

  // Begin stage
  { id: "msg_2s1_1", threadId: "thr_2_s1", stageId: "stg_2s1_b", role: "student", content: "Political cartoonists use symbolism (like animals representing nations), exaggeration and caricature, labels and captions, irony, and visual metaphors to convey their messages quickly and memorably.", createdAt: "2024-01-07T09:10:00Z" },
  { id: "msg_2s1_2", threadId: "thr_2_s1", stageId: "stg_2s1_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-07T09:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_2s1_3", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "tutor", content: "Good list! Let's apply these to Benjamin Franklin's 'Join, or Die' cartoon from 1754. First, describe what you see in the image: a snake cut into eight segments. What does the snake represent?", createdAt: "2024-01-07T09:20:00Z" },
  { id: "msg_2s1_4", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "student", content: "Each segment represents a colony or group of colonies. The snake is cut apart to show that the colonies are divided and therefore weak. The message is that the colonies must unite ('join') or they will perish ('die').", createdAt: "2024-01-07T09:25:00Z" },
  { id: "msg_2s1_5", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "tutor", content: "Right! Now consider the context. Franklin originally published this in 1754 during the French and Indian War to promote the Albany Plan of Union. But it was reprinted during the Revolution. How did its meaning change in the new context?", createdAt: "2024-01-07T09:30:00Z" },
  { id: "msg_2s1_6", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "student", content: "In 1754, 'die' meant being defeated by the French and their Native allies. During the Revolution, 'die' meant being crushed by British tyranny. The image took on a more urgent political meaning -- unity against Britain rather than unity for a military alliance. The same symbol was reinterpreted for a new cause.", createdAt: "2024-01-07T09:35:00Z" },
  { id: "msg_2s1_7", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "tutor", content: "Excellent analysis of how context changes meaning! What does the choice of a snake specifically suggest about how Franklin wanted colonists to see themselves?", createdAt: "2024-01-07T09:40:00Z" },
  { id: "msg_2s1_8", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "student", content: "There was a folk belief that a cut snake could rejoin and survive if the pieces were put together before sunset. So the snake symbolized both the danger of staying divided and the possibility of survival through unity. The snake was also a common American symbol representing vigilance and defiance -- later used in the 'Don't Tread on Me' Gadsden flag.", createdAt: "2024-01-07T09:45:00Z" },
  { id: "msg_2s1_9", threadId: "thr_2_s1", stageId: "stg_2s1_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-07T09:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage
  { id: "msg_2s1_10", threadId: "thr_2_s1", stageId: "stg_2s1_c", role: "student", content: "The Patriot cartoon shows a British lion being defied by a group of united American animals (representing the colonies working together). It uses the visual rhetoric of David vs. Goliath -- making the underdog appear brave and righteous. The audience is colonists who need encouragement to resist. The Loyalist cartoon shows colonial leaders as puppets being manipulated by France, suggesting the Revolution serves French interests, not American freedom. It uses irony to undermine Patriot claims of independence. The audience is moderate colonists who might be swayed away from revolution. Both cartoons use animal symbolism and exaggeration, but for opposite purposes: one to inspire unity and courage, the other to sow doubt and division.", createdAt: "2024-01-07T09:55:00Z" },
  { id: "msg_2s1_11", threadId: "thr_2_s1", stageId: "stg_2s1_c", role: "tutor", content: "Challenge complete!", createdAt: "2024-01-07T10:00:00Z", metadata: { isSystemMessage: true, progressState: "challenge_complete" as const, isCompletionMessage: true } },

  // ========== Thread 2_s2 - Comparing Perspectives (challenge_started) ==========

  // Begin stage
  { id: "msg_2s2_1", threadId: "thr_2_s2", stageId: "stg_2s2_b", role: "student", content: "It's important because the Revolution was not a simple two-sided conflict. Patriots, Loyalists, enslaved people, Native Americans, women, and neutral colonists all had different experiences and interests. Understanding multiple perspectives gives us a more complete and accurate picture of history.", createdAt: "2024-01-07T10:10:00Z" },
  { id: "msg_2s2_2", threadId: "thr_2_s2", stageId: "stg_2s2_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-07T10:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough stage - rich Socratic tutor flow
  { id: "msg_2s2_3", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "tutor", content: "Excellent point about complexity! Let's use the Stamp Act as our case study. First, how would a Patriot merchant in Boston have viewed the Stamp Act, and what would have been their main concern?", createdAt: "2024-01-07T10:20:00Z" },
  { id: "msg_2s2_4", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "student", content: "A Patriot merchant would see the Stamp Act as an unconstitutional violation of their rights as English subjects. Their main concern would be the precedent: if Parliament can impose this tax without colonial consent, they can impose any tax. It also directly hurt their business by adding costs to legal documents, newspapers, and contracts.", createdAt: "2024-01-07T10:25:00Z" },
  { id: "msg_2s2_5", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "tutor", content: "Good! Now, how would a Loyalist government official -- say a royal customs collector -- view the same situation?", createdAt: "2024-01-07T10:30:00Z" },
  { id: "msg_2s2_6", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "student", content: "A Loyalist official would see the Stamp Act as a reasonable measure. Britain had just fought an expensive war partly for colonial defense, and the colonies should contribute. Parliament has sovereign authority over all British subjects. The colonists are being ungrateful and disorderly. The official might also fear that resistance to lawful authority could lead to anarchy.", createdAt: "2024-01-07T10:35:00Z" },
  { id: "msg_2s2_7", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "tutor", content: "Now for a perspective often left out: how might an enslaved person in Virginia have viewed this conflict between white colonists and the British government?", createdAt: "2024-01-07T10:40:00Z" },
  { id: "msg_2s2_8", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "student", content: "An enslaved person might have seen the irony of colonists demanding 'liberty' while holding others in bondage. They might have been more interested in which side offered freedom. Later, Lord Dunmore's Proclamation (1775) offered freedom to enslaved people who fled Patriot owners and joined the British -- showing that for enslaved people, the British might actually represent more opportunity for freedom than the Patriots.", createdAt: "2024-01-07T10:45:00Z" },
  { id: "msg_2s2_9", threadId: "thr_2_s2", stageId: "stg_2s2_w", role: "tutor", content: "Walkthrough complete", createdAt: "2024-01-07T10:50:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_complete" as const, isCompletionMessage: true } },
  // Challenge stage - student working on it
  { id: "msg_2s2_10", threadId: "thr_2_s2", stageId: "stg_2s2_c", role: "student", content: "Patriot Merchant: 'We fight for liberty -- the right to govern ourselves and not be taxed by a distant Parliament. Every man deserves representation in the body that taxes him. This is our sacred English right!'\n\nLoyalist Official: 'Liberty? You call destroying property and threatening law-abiding citizens liberty? Parliament protects your trade, defends your borders, and you refuse a modest tax? This path leads to chaos.'\n\nEnslaved Person: 'You both speak of freedom, but neither speaks of mine. The merchant who cries for liberty holds me in chains. The British offer freedom to those who join them. Tell me -- whose revolution is this?'", createdAt: "2024-01-07T10:55:00Z" },
  { id: "msg_2s2_11", threadId: "thr_2_s2", stageId: "stg_2s2_c", role: "tutor", content: "That's a powerful start with authentic voices! Can you extend the dialogue to show how each character would respond to the enslaved person's challenge? This is where the contradictions of the Revolution become most visible.", createdAt: "2024-01-07T11:00:00Z" },

  // ========== Thread 2_s3 - Evaluating Primary Sources (not_started - begin done, on walkthrough) ==========

  // Begin stage
  { id: "msg_2s3_1", threadId: "thr_2_s3", stageId: "stg_2s3_b", role: "student", content: "Key questions include: Who created the source and what was their role in events? When was it created relative to the events described? What was the intended audience? What was the purpose -- to inform, persuade, justify, or record? Does it corroborate with other sources? What might be missing or omitted?", createdAt: "2024-01-07T11:10:00Z" },
  { id: "msg_2s3_2", threadId: "thr_2_s3", stageId: "stg_2s3_b", role: "tutor", content: "Walkthrough started", createdAt: "2024-01-07T11:15:00Z", metadata: { isSystemMessage: true, progressState: "walkthrough_started" as const, isCompletionMessage: true } },
  // Walkthrough just started
  { id: "msg_2s3_3", threadId: "thr_2_s3", stageId: "stg_2s3_w", role: "tutor", content: "Great framework! Let's apply these questions to Thomas Paine's 'Common Sense' (1776). Start with authorship: who was Paine, and how does his background affect how we read the pamphlet?", createdAt: "2024-01-07T11:20:00Z" },

  // ========== Thread 2_s4 - Cause and Effect Diagrams (not_started) ==========
  { id: "msg_2s4_0", threadId: "thr_2_s4", stageId: "stg_2s4_b", role: "tutor", content: "Hi! We're going to work with cause-and-effect diagrams. What is a cause-and-effect diagram and how can it help us understand historical events? Let me know your thoughts!", createdAt: "2024-01-07T09:00:00Z" },

  // ========== Thread 2_s5 - Argumentative Writing (not_started) ==========
  { id: "msg_2s5_0", threadId: "thr_2_s5", stageId: "stg_2s5_b", role: "tutor", content: "Welcome! Today we're working on argumentative writing. What is the difference between a persuasive essay and an argumentative essay in historical writing?", createdAt: "2024-01-07T09:00:00Z" },

  // ========== Thread 2_c1 - Explain Revolution (not_started) ==========
  { id: "msg_2c1_0", threadId: "thr_2_c1", stageId: "stg_2c1_b", role: "tutor", content: "Welcome to your capstone! Here you'll explain what you learned in your own words. Using ideas from this unit: do you think the American Revolution was inevitable, or could it have been avoided? Share your reasoning.", createdAt: "2024-01-07T09:00:00Z" },
];

// ============ AWARDS ============
export const awards: Award[] = [
  { id: "awd_1", courseId: "crs_1", title: "Early Riser", subtitle: "Completed 5 lessons before 8 AM", iconKey: "early" },
  { id: "awd_2", courseId: "crs_2", title: "Medium Master", subtitle: "Achieved 80% on 10 quizzes", iconKey: "medium" },
  { id: "awd_3", courseId: "crs_2", title: "Night Owl", subtitle: "Studied for 20 hours after 9 PM", iconKey: "owl" },
];

// ============ FEEDBACK ============
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
    body: "Good progress on Knowledge 2. Keep working on the derivation for electromagnet strength\u2014you're close.",
    ctaLabel: "See more",
    sourceType: "teacher",
    instructorId: "ins_2",
  },
];

// Student-award mapping
export const studentAwards: Record<string, string[]> = {
  stu_1: ["awd_1", "awd_2", "awd_3"],
};
