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
  KnowledgeTopic,
  KnowledgeQueueItem,
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
  // Skills (5)
  { id: "obj_6_s1", unitId: "unit_ph_6", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_6_s2", unitId: "unit_ph_6", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_6_s3", unitId: "unit_ph_6", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_6_s4", unitId: "unit_ph_6", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_6_s5", unitId: "unit_ph_6", kind: "skill", title: "Skill 5", order: 5 },
  // Capstone (1)
  { id: "obj_6_c1", unitId: "unit_ph_6", kind: "capstone", title: "Capstone 1", order: 1 },

  // -------- Unit 8 (Magnetism) - IN PROGRESS --------
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
  // Skills (5)
  { id: "obj_1_s1", unitId: "unit_ah_1", kind: "skill", title: "Skill 1", order: 1 },
  { id: "obj_1_s2", unitId: "unit_ah_1", kind: "skill", title: "Skill 2", order: 2 },
  { id: "obj_1_s3", unitId: "unit_ah_1", kind: "skill", title: "Skill 3", order: 3 },
  { id: "obj_1_s4", unitId: "unit_ah_1", kind: "skill", title: "Skill 4", order: 4 },
  { id: "obj_1_s5", unitId: "unit_ah_1", kind: "skill", title: "Skill 5", order: 5 },
  // Capstone (1)
  { id: "obj_1_c1", unitId: "unit_ah_1", kind: "capstone", title: "Capstone 1", order: 1 },

  // -------- Unit 2 (Revolutionary War) - IN PROGRESS --------
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

  // --- (Knowledge topics moved to knowledgeTopics / studentKnowledgeQueues below) ---

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

  // --- (Knowledge topics moved to knowledgeTopics / studentKnowledgeQueues below) ---

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

  // --- (Knowledge topics moved to knowledgeTopics / studentKnowledgeQueues below) ---

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
  // S1 completed; rest not started
  { studentId: "stu_1", objectiveId: "obj_6_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s2", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s3", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s4", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_6_s5", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },
  // C1 not started
  { studentId: "stu_1", objectiveId: "obj_6_c1", progressState: "not_started", currentStageType: "begin", updatedAt: "2024-01-12T16:00:00Z" },

  // -------- Unit 8 - Magnetism (MIXED PROGRESS) --------
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
  { studentId: "stu_1", objectiveId: "obj_1_s1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T10:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s2", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T11:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s3", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T12:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s4", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T13:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_s5", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-03T14:00:00Z" },
  { studentId: "stu_1", objectiveId: "obj_1_c1", progressState: "challenge_complete", currentStageType: "challenge", updatedAt: "2024-01-04T10:00:00Z" },

  // -------- Unit 2 - Revolutionary War (MIXED PROGRESS) --------
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
  { id: "thr_6_s1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s2", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s3", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s4", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_s5", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-12T16:00:00Z" },
  { id: "thr_6_c1", unitId: "unit_ph_6", courseId: "crs_2", objectiveId: "obj_6_c1", title: "Explain: Thermodynamics", kind: "capstone", lastMessageAt: "2024-01-12T16:00:00Z" },

  // -------- Unit 8 Threads --------
  { id: "thr_8_s1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-15T12:15:00Z" },
  { id: "thr_8_s2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-15T12:45:00Z" },
  { id: "thr_8_s3", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s4", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s5", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-15T13:00:00Z" },
  { id: "thr_8_s6", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_s6", title: "Skill 6", kind: "skill", lastMessageAt: "2024-01-15T15:00:00Z" },
  { id: "thr_8_c1", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_c1", title: "Explain: Magnetism & motors", kind: "capstone", lastMessageAt: "2024-01-15T15:00:00Z" },
  { id: "thr_8_c2", unitId: "unit_ph_8", courseId: "crs_2", objectiveId: "obj_8_c2", title: "Explain: EM waves", kind: "capstone", lastMessageAt: "2024-01-15T15:00:00Z" },

  // -------- Unit 1 (Colonial America) Threads --------
  { id: "thr_1_s1", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s1", title: "Skill 1", kind: "skill", lastMessageAt: "2024-01-03T10:00:00Z" },
  { id: "thr_1_s2", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s2", title: "Skill 2", kind: "skill", lastMessageAt: "2024-01-03T11:00:00Z" },
  { id: "thr_1_s3", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s3", title: "Skill 3", kind: "skill", lastMessageAt: "2024-01-03T12:00:00Z" },
  { id: "thr_1_s4", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s4", title: "Skill 4", kind: "skill", lastMessageAt: "2024-01-03T13:00:00Z" },
  { id: "thr_1_s5", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_s5", title: "Skill 5", kind: "skill", lastMessageAt: "2024-01-03T14:00:00Z" },
  { id: "thr_1_c1", unitId: "unit_ah_1", courseId: "crs_1", objectiveId: "obj_1_c1", title: "Explain: Colonial America", kind: "capstone", lastMessageAt: "2024-01-04T10:00:00Z" },

  // -------- Unit 2 (Revolutionary War) Threads --------
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

// ============ KNOWLEDGE TOPICS (teacher-visible) ============
export const knowledgeTopics: KnowledgeTopic[] = [
  // -------- Unit 6 (Thermodynamics) — 5 topics --------
  { id: "kt_6_1", unitId: "unit_ph_6", knowledgeTopic: "Laws of Thermodynamics", order: 1 },
  { id: "kt_6_2", unitId: "unit_ph_6", knowledgeTopic: "Heat Transfer Mechanisms", order: 2 },
  { id: "kt_6_3", unitId: "unit_ph_6", knowledgeTopic: "Entropy and Disorder", order: 3 },
  { id: "kt_6_4", unitId: "unit_ph_6", knowledgeTopic: "Heat Engines and Efficiency", order: 4 },
  { id: "kt_6_5", unitId: "unit_ph_6", knowledgeTopic: "Phase Transitions and Latent Heat", order: 5 },

  // -------- Unit 8 (Magnetism) — 7 topics --------
  { id: "kt_8_1", unitId: "unit_ph_8", knowledgeTopic: "Magnetic Fields Around Wires", order: 1 },
  { id: "kt_8_2", unitId: "unit_ph_8", knowledgeTopic: "Electromagnets", order: 2 },
  { id: "kt_8_3", unitId: "unit_ph_8", knowledgeTopic: "Electromagnetic Induction", order: 3 },
  { id: "kt_8_4", unitId: "unit_ph_8", knowledgeTopic: "Lenz's Law", order: 4 },
  { id: "kt_8_5", unitId: "unit_ph_8", knowledgeTopic: "Magnetic Flux", order: 5 },
  { id: "kt_8_6", unitId: "unit_ph_8", knowledgeTopic: "Magnetic Materials / Ferromagnetism", order: 6 },
  { id: "kt_8_7", unitId: "unit_ph_8", knowledgeTopic: "Earth's Magnetic Field", order: 7 },

  // -------- Unit 1 (Colonial America) — 5 topics --------
  { id: "kt_1_1", unitId: "unit_ah_1", knowledgeTopic: "Jamestown Settlement", order: 1 },
  { id: "kt_1_2", unitId: "unit_ah_1", knowledgeTopic: "Mayflower Compact", order: 2 },
  { id: "kt_1_3", unitId: "unit_ah_1", knowledgeTopic: "Colonial Government Forms", order: 3 },
  { id: "kt_1_4", unitId: "unit_ah_1", knowledgeTopic: "Mercantilism and Navigation Acts", order: 4 },
  { id: "kt_1_5", unitId: "unit_ah_1", knowledgeTopic: "Great Awakening", order: 5 },

  // -------- Unit 2 (Revolutionary War) — 6 topics --------
  { id: "kt_2_1", unitId: "unit_ah_2", knowledgeTopic: "Causes of the Revolution", order: 1 },
  { id: "kt_2_2", unitId: "unit_ah_2", knowledgeTopic: "Boston Tea Party", order: 2 },
  { id: "kt_2_3", unitId: "unit_ah_2", knowledgeTopic: "Declaration of Independence", order: 3 },
  { id: "kt_2_4", unitId: "unit_ah_2", knowledgeTopic: "Key Battles of the Revolution", order: 4 },
  { id: "kt_2_5", unitId: "unit_ah_2", knowledgeTopic: "Foreign Alliances", order: 5 },
  { id: "kt_2_6", unitId: "unit_ah_2", knowledgeTopic: "Treaty of Paris 1783", order: 6 },
];

// ============ STUDENT KNOWLEDGE QUEUES ============
// Key format: `${unitId}_${studentId}`
// Only items with status !== "pending" are visible to the student.
export const studentKnowledgeQueues: Record<string, KnowledgeQueueItem[]> = {
  // -------- Unit 6 (Thermodynamics) — all 5 topics completed correctly --------
  "unit_ph_6_stu_1": [
    { id: "kqi_6_1", unitId: "unit_ph_6", studentId: "stu_1", knowledgeTopicId: "kt_6_1", labelIndex: 1, order: 1, status: "completed_correct", is_correct: true, questionPrompt: "State and explain all three laws of thermodynamics. How does the zeroth law relate to the others?", createdAt: "2024-01-05T09:00:00Z" },
    { id: "kqi_6_2", unitId: "unit_ph_6", studentId: "stu_1", knowledgeTopicId: "kt_6_2", labelIndex: 2, order: 2, status: "completed_correct", is_correct: true, questionPrompt: "Compare conduction, convection, and radiation as heat transfer mechanisms. Give a real-world example of each and explain which is most efficient in a vacuum.", createdAt: "2024-01-05T09:10:00Z" },
    { id: "kqi_6_3", unitId: "unit_ph_6", studentId: "stu_1", knowledgeTopicId: "kt_6_3", labelIndex: 3, order: 3, status: "completed_correct", is_correct: true, questionPrompt: "What is entropy and why does it always increase in an isolated system? How does this relate to the arrow of time?", createdAt: "2024-01-05T09:20:00Z" },
    { id: "kqi_6_4", unitId: "unit_ph_6", studentId: "stu_1", knowledgeTopicId: "kt_6_4", labelIndex: 4, order: 4, status: "completed_correct", is_correct: true, questionPrompt: "Explain how a Carnot heat engine works and derive its maximum theoretical efficiency. Why can no real engine reach this limit?", createdAt: "2024-01-05T09:30:00Z" },
    { id: "kqi_6_5", unitId: "unit_ph_6", studentId: "stu_1", knowledgeTopicId: "kt_6_5", labelIndex: 5, order: 5, status: "completed_correct", is_correct: true, questionPrompt: "What is latent heat? Explain what happens at the molecular level during a phase transition and why temperature stays constant during the transition.", createdAt: "2024-01-05T09:40:00Z" },
  ],

  // -------- Unit 8 (Magnetism) — in progress --------
  // K1 correct, K2 correct, K3 incorrect (retry enqueued as K8), K4 active, K5-K7 + retry K8 pending
  "unit_ph_8_stu_1": [
    { id: "kqi_8_1", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_1", labelIndex: 1, order: 1, status: "completed_correct", is_correct: true, questionPrompt: "Using the right-hand rule, explain how to determine the direction of the magnetic field around a current-carrying wire. How does field strength vary with distance from the wire?", createdAt: "2026-01-10T10:00:00Z" },
    { id: "kqi_8_2", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_2", labelIndex: 2, order: 2, status: "completed_correct", is_correct: true, questionPrompt: "Explain all the factors that affect the strength of an electromagnet and derive the relationship B = μ₀nI for a solenoid.", createdAt: "2026-01-10T10:10:00Z" },
    { id: "kqi_8_3", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_3", labelIndex: 3, order: 3, status: "completed_incorrect", is_correct: false, questionPrompt: "Describe Faraday's law of electromagnetic induction. What is the mathematical relationship between changing magnetic flux and the induced EMF?", createdAt: "2026-01-10T10:20:00Z" },
    { id: "kqi_8_4", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_4", labelIndex: 4, order: 4, status: "active", is_correct: undefined, questionPrompt: "What does Lenz's law tell us about the direction of an induced current? Give a concrete example showing how the induced current opposes the change in flux.", suggestedQuestions: ["What happens when you push a magnet into a coil?", "How does the induced current direction oppose change?", "How does Lenz's law apply to regenerative braking?"], createdAt: "2026-01-10T10:21:00Z" },
    { id: "kqi_8_5", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_5", labelIndex: 5, order: 5, status: "pending", is_correct: undefined, questionPrompt: "Define magnetic flux and explain how it changes when the angle between the magnetic field and a coil changes. What angle gives maximum flux?", createdAt: "2026-01-10T10:22:00Z" },
    { id: "kqi_8_6", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_6", labelIndex: 6, order: 6, status: "pending", is_correct: undefined, questionPrompt: "What makes a material ferromagnetic? Explain the role of magnetic domains and how an external field can permanently magnetize a material.", createdAt: "2026-01-10T10:23:00Z" },
    { id: "kqi_8_7", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_7", labelIndex: 7, order: 7, status: "pending", is_correct: undefined, questionPrompt: "Describe Earth's magnetic field: its approximate orientation, its origin in the liquid outer core, and why it is important for life on Earth.", createdAt: "2026-01-10T10:24:00Z" },
    // Retry for kt_8_3 (Electromagnetic Induction) enqueued at end
    { id: "kqi_8_8", unitId: "unit_ph_8", studentId: "stu_1", knowledgeTopicId: "kt_8_3", labelIndex: 8, order: 8, status: "pending", is_correct: undefined, questionPrompt: "Revisit Faraday's law: explain electromagnetic induction using the concept of magnetic flux. How does the number of coil turns (N) affect the induced EMF, and what is the significance of the negative sign in Faraday's equation?", createdAt: "2026-01-10T10:25:00Z" },
  ],

  // -------- Unit 1 (Colonial America) — all 5 topics completed correctly --------
  "unit_ah_1_stu_1": [
    { id: "kqi_1_1", unitId: "unit_ah_1", studentId: "stu_1", knowledgeTopicId: "kt_1_1", labelIndex: 1, order: 1, status: "completed_correct", is_correct: true, questionPrompt: "Explain the key challenges Jamestown faced in its early years and identify the single most important factor in its eventual survival. Justify your choice.", createdAt: "2024-01-02T09:00:00Z" },
    { id: "kqi_1_2", unitId: "unit_ah_1", studentId: "stu_1", knowledgeTopicId: "kt_1_2", labelIndex: 2, order: 2, status: "completed_correct", is_correct: true, questionPrompt: "What was the Mayflower Compact and why was it written? Explain how it connects to modern democratic principles, including its limitations.", createdAt: "2024-01-02T10:00:00Z" },
    { id: "kqi_1_3", unitId: "unit_ah_1", studentId: "stu_1", knowledgeTopicId: "kt_1_3", labelIndex: 3, order: 3, status: "completed_correct", is_correct: true, questionPrompt: "Compare royal, proprietary, and charter colonies. How did colonial assemblies like the House of Burgesses build a tradition of self-governance?", createdAt: "2024-01-02T11:00:00Z" },
    { id: "kqi_1_4", unitId: "unit_ah_1", studentId: "stu_1", knowledgeTopicId: "kt_1_4", labelIndex: 4, order: 4, status: "completed_correct", is_correct: true, questionPrompt: "Explain mercantilism and analyze whether the Navigation Acts ultimately helped or hindered colonial economic development.", createdAt: "2024-01-02T12:00:00Z" },
    { id: "kqi_1_5", unitId: "unit_ah_1", studentId: "stu_1", knowledgeTopicId: "kt_1_5", labelIndex: 5, order: 5, status: "completed_correct", is_correct: true, questionPrompt: "How did the Great Awakening contribute to a shared colonial identity and an anti-authoritarian spirit that later influenced the American Revolution?", createdAt: "2024-01-02T13:00:00Z" },
  ],

  // -------- Unit 2 (Revolutionary War) — K1+K2 correct, K3 active, K4-K6 pending --------
  "unit_ah_2_stu_1": [
    { id: "kqi_2_1", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_1", labelIndex: 1, order: 1, status: "completed_correct", is_correct: true, questionPrompt: "Rank the top three causes of the American Revolution in order of importance and justify your ranking with specific evidence.", createdAt: "2024-01-06T09:00:00Z" },
    { id: "kqi_2_2", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_2", labelIndex: 2, order: 2, status: "completed_correct", is_correct: true, questionPrompt: "Was the Boston Tea Party justified political protest or criminal destruction of property? Argue from both the Patriot and Loyalist perspectives, then give your own verdict.", createdAt: "2024-01-06T10:00:00Z" },
    { id: "kqi_2_3", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_3", labelIndex: 3, order: 3, status: "active", is_correct: undefined, questionPrompt: "Analyze the Declaration of Independence: explain its philosophical foundations (especially Locke's influence), its rhetorical strategy of blaming the king, and the contradiction between its ideals and the reality of slavery.", suggestedQuestions: ["How did Locke's social contract theory influence Jefferson?", "Why did Jefferson blame the king rather than Parliament?", "How did slavery contradict the Declaration's 'all men are created equal'?"], createdAt: "2024-01-06T11:00:00Z" },
    { id: "kqi_2_4", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_4", labelIndex: 4, order: 4, status: "pending", is_correct: undefined, questionPrompt: "Explain why the Battle of Saratoga was the turning point of the Revolutionary War. What was the British strategy in 1777 and why did it fail?", createdAt: "2024-01-06T11:01:00Z" },
    { id: "kqi_2_5", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_5", labelIndex: 5, order: 5, status: "pending", is_correct: undefined, questionPrompt: "Why did France, Spain, and the Netherlands ally with the American colonies against Britain? What did each nation hope to gain?", createdAt: "2024-01-06T11:02:00Z" },
    { id: "kqi_2_6", unitId: "unit_ah_2", studentId: "stu_1", knowledgeTopicId: "kt_2_6", labelIndex: 6, order: 6, status: "pending", is_correct: undefined, questionPrompt: "What were the key terms of the Treaty of Paris (1783)? How did these terms reflect the military and diplomatic outcome of the war?", createdAt: "2024-01-06T11:03:00Z" },
  ],
};

// ============ KNOWLEDGE QUEUE MESSAGES ============
// Pre-populated chat history for completed knowledge items.
// Key = KnowledgeQueueItem.id. Uses the queue item id as threadId.
export const knowledgeQueueMessages: Record<string, ChatMessage[]> = {

  // ── Unit 6: Thermodynamics (all correct) ────────────────────────────────

  "kqi_6_1": [
    { id: "kqi_6_1_m1", threadId: "kqi_6_1", role: "student", content: "The zeroth law establishes what temperature means: if object A is in thermal equilibrium with C, and B is also with C, then A and B are in equilibrium with each other — this lets us define a temperature scale. The first law is energy conservation: ΔU = Q − W, meaning internal energy changes when heat flows in or work is done. The second law says entropy always increases in an isolated system, so processes like heat flowing from cold to hot never happen spontaneously. The third law states entropy approaches zero as temperature approaches absolute zero, making absolute zero unattainable.", createdAt: "2024-01-05T09:02:00Z" },
    { id: "kqi_6_1_m2", threadId: "kqi_6_1", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-05T09:03:00Z" },
    { id: "kqi_6_1_m3", threadId: "kqi_6_1", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-05T09:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_6_2": [
    { id: "kqi_6_2_m1", threadId: "kqi_6_2", role: "student", content: "Conduction is heat moving through direct contact between particles — a metal spoon in hot soup is a classic example. Convection is transfer through fluid movement: hot air near a radiator becomes less dense and rises while cooler air sinks, creating a circulation loop. Radiation is electromagnetic wave energy transmission and needs no medium — the sun's warmth reaching Earth is pure radiation. In a vacuum, only radiation works since there are no particles to conduct or convect through.", createdAt: "2024-01-05T09:12:00Z" },
    { id: "kqi_6_2_m2", threadId: "kqi_6_2", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-05T09:13:00Z" },
    { id: "kqi_6_2_m3", threadId: "kqi_6_2", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-05T09:14:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_6_3": [
    { id: "kqi_6_3_m1", threadId: "kqi_6_3", role: "student", content: "Entropy is a measure of the number of possible microscopic arrangements of a system — essentially its disorder. The second law says it always increases in an isolated system because there are vastly more disordered states than ordered ones, so random processes trend toward disorder. This gives time a direction: an ice cube melts but a puddle doesn't spontaneously freeze, and broken eggs don't reassemble. The arrow of time points in the direction of increasing entropy.", createdAt: "2024-01-05T09:22:00Z" },
    { id: "kqi_6_3_m2", threadId: "kqi_6_3", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-05T09:23:00Z" },
    { id: "kqi_6_3_m3", threadId: "kqi_6_3", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-05T09:24:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_6_4": [
    { id: "kqi_6_4_m1", threadId: "kqi_6_4", role: "student", content: "A Carnot engine runs between a hot reservoir at T_H and a cold sink at T_C (in Kelvin). Its four-step cycle is: isothermal expansion (absorbs heat from T_H), adiabatic expansion (temperature drops to T_C), isothermal compression (releases heat to T_C), and adiabatic compression (returns to T_H). The maximum efficiency is η = 1 − T_C/T_H. No real engine can reach this because friction, imperfect insulation, and finite-speed processes all create irreversible entropy increases that eat into efficiency.", createdAt: "2024-01-05T09:32:00Z" },
    { id: "kqi_6_4_m2", threadId: "kqi_6_4", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-05T09:33:00Z" },
    { id: "kqi_6_4_m3", threadId: "kqi_6_4", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-05T09:34:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_6_5": [
    { id: "kqi_6_5_m1", threadId: "kqi_6_5", role: "student", content: "Latent heat is the energy absorbed or released during a phase change without a temperature change. At the molecular level, during melting the added energy breaks intermolecular bonds rather than increasing kinetic energy — so temperature stays at 0°C while ice and liquid coexist. The same principle applies to vaporization. On a heating curve you see flat horizontal plateaus exactly at the phase transition temperatures, which is the visual signature of latent heat being absorbed at constant temperature.", createdAt: "2024-01-05T09:42:00Z" },
    { id: "kqi_6_5_m2", threadId: "kqi_6_5", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-05T09:43:00Z" },
    { id: "kqi_6_5_m3", threadId: "kqi_6_5", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-05T09:44:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  // ── Unit 8: Magnetism (K1 correct, K2 correct, K3 incorrect) ────────────

  "kqi_8_1": [
    { id: "kqi_8_1_m1", threadId: "kqi_8_1", role: "student", content: "The right-hand rule: point your thumb in the direction of conventional current flow, and your fingers curl in the direction of the magnetic field lines. For a wire with current flowing upward, the field circles counterclockwise when viewed from above. Field strength follows B = μ₀I / (2πr), so it's inversely proportional to the distance r — double the distance, halve the field.", createdAt: "2026-01-10T10:02:00Z" },
    { id: "kqi_8_1_m2", threadId: "kqi_8_1", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2026-01-10T10:03:00Z" },
    { id: "kqi_8_1_m3", threadId: "kqi_8_1", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2026-01-10T10:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_8_2": [
    { id: "kqi_8_2_m1", threadId: "kqi_8_2", role: "student", content: "Electromagnet strength depends on: (1) current — more current, stronger field; (2) number of turns per unit length n — more coils concentrate the field; (3) core material — a ferromagnetic core like iron greatly amplifies strength through its permeability μ. For a solenoid, each loop contributes a B field, and with n turns per meter all fields add linearly: B = μ₀nI. With a core, it becomes B = μμ₀nI where μ can be hundreds or thousands for iron.", createdAt: "2026-01-10T10:12:00Z" },
    { id: "kqi_8_2_m2", threadId: "kqi_8_2", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2026-01-10T10:13:00Z" },
    { id: "kqi_8_2_m3", threadId: "kqi_8_2", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2026-01-10T10:14:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_8_3": [
    { id: "kqi_8_3_m1", threadId: "kqi_8_3", role: "student", content: "Electromagnetic induction is when a moving magnet near a wire creates a current. Faraday discovered this. The faster you move the magnet the more current you get. I think the formula involves the velocity of the magnet times the magnetic field, like EMF = Bv, but I'm not sure about the exact relationship with flux.", createdAt: "2026-01-10T10:22:00Z" },
    { id: "kqi_8_3_m2", threadId: "kqi_8_3", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2026-01-10T10:23:00Z" },
    { id: "kqi_8_3_m3", threadId: "kqi_8_3", role: "tutor", content: "Good try, we'll revisit this.", createdAt: "2026-01-10T10:24:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  // ── Unit 1: Colonial America (all correct) ───────────────────────────────

  "kqi_1_1": [
    { id: "kqi_1_1_m1", threadId: "kqi_1_1", role: "student", content: "Jamestown faced starvation, disease (especially malaria in the swampy location), conflicts with the Powhatan Confederacy, and poor planning — too many gentlemen, not enough farmers. The most important factor in survival was John Rolfe's introduction of tobacco as a cash crop around 1612. Smith's discipline kept colonists alive short-term, but tobacco gave the Virginia Company a return on investment, which drew more settlers, supplies, and capital. Without that economic foundation, the colony had no reason to persist.", createdAt: "2024-01-02T09:02:00Z" },
    { id: "kqi_1_1_m2", threadId: "kqi_1_1", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-02T09:03:00Z" },
    { id: "kqi_1_1_m3", threadId: "kqi_1_1", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-02T09:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_1_2": [
    { id: "kqi_1_2_m1", threadId: "kqi_1_2", role: "student", content: "The Mayflower Compact was a 1620 agreement signed by the Pilgrims because they had landed in Massachusetts without a valid charter — their Virginia Company patent didn't cover it. To prevent lawlessness among the non-Pilgrim 'Strangers,' they created a government by consent with majority rule. It connects to modern democracy through those principles, but was limited: only adult male church members could sign, excluding women, servants, and non-Separatists. It was a foundational step, not a full democracy.", createdAt: "2024-01-02T10:02:00Z" },
    { id: "kqi_1_2_m2", threadId: "kqi_1_2", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-02T10:03:00Z" },
    { id: "kqi_1_2_m3", threadId: "kqi_1_2", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-02T10:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_1_3": [
    { id: "kqi_1_3_m1", threadId: "kqi_1_3", role: "student", content: "Royal colonies were governed directly by the Crown through an appointed governor — Virginia was one. Proprietary colonies were granted to individuals by the king, like Pennsylvania to William Penn. Charter colonies like Connecticut and Rhode Island elected their own governors and had the most self-governance. The House of Burgesses (1619) was crucial: as the first elected legislature in America, it gave colonists real experience governing themselves, and assemblies used control of taxation to build de facto power even in royal colonies.", createdAt: "2024-01-02T11:02:00Z" },
    { id: "kqi_1_3_m2", threadId: "kqi_1_3", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-02T11:03:00Z" },
    { id: "kqi_1_3_m3", threadId: "kqi_1_3", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-02T11:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_1_4": [
    { id: "kqi_1_4_m1", threadId: "kqi_1_4", role: "student", content: "Mercantilism held that colonies existed to enrich the mother country — providing raw materials and buying manufactured goods. The Navigation Acts enforced this by requiring colonial trade to go through England on English ships. It hindered development more than it helped: it prevented manufacturing, raised costs, and kept colonies economically dependent. Yes, colonists had guaranteed markets and naval protection, but widespread smuggling shows they resented the restrictions. Ultimately it prevented economic diversification and generated the grievances that fueled revolution.", createdAt: "2024-01-02T12:02:00Z" },
    { id: "kqi_1_4_m2", threadId: "kqi_1_4", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-02T12:03:00Z" },
    { id: "kqi_1_4_m3", threadId: "kqi_1_4", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-02T12:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_1_5": [
    { id: "kqi_1_5_m1", threadId: "kqi_1_5", role: "student", content: "The Great Awakening was a religious revival of the 1730s–1740s that spread across all colonies, creating a shared experience that crossed colonial boundaries. Preachers like Whitefield and Edwards challenged established church authority by saying individuals could have a direct relationship with God — this anti-authoritarian message later transferred to politics. By appealing to ordinary people regardless of social rank, it planted egalitarian seeds. The proliferation of new denominations also strengthened arguments for religious tolerance, which prefigured the First Amendment.", createdAt: "2024-01-02T13:02:00Z" },
    { id: "kqi_1_5_m2", threadId: "kqi_1_5", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-02T13:03:00Z" },
    { id: "kqi_1_5_m3", threadId: "kqi_1_5", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-02T13:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  // ── Unit 2: Revolutionary War (K1 correct, K2 correct) ──────────────────

  "kqi_2_1": [
    { id: "kqi_2_1_m1", threadId: "kqi_2_1", role: "student", content: "My ranking: 1) 'No taxation without representation' — this was the ideological glue that united diverse colonies around a shared grievance and gave the revolution moral legitimacy. 2) The Intolerable Acts — these transformed protest into revolution. By punishing all of Massachusetts collectively, Britain showed it could strip any colony of its rights, forcing previously hesitant colonies to unify. 3) The French and Indian War's debt — this was the root trigger, creating the financial pressure that led to every subsequent tax. Enlightenment ideas were essential as a framework but needed concrete grievances to activate.", createdAt: "2024-01-06T09:02:00Z" },
    { id: "kqi_2_1_m2", threadId: "kqi_2_1", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-06T09:03:00Z" },
    { id: "kqi_2_1_m3", threadId: "kqi_2_1", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-06T09:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],

  "kqi_2_2": [
    { id: "kqi_2_2_m1", threadId: "kqi_2_2", role: "student", content: "Patriot view: justified resistance. Colonists had petitioned peacefully for years and been ignored. The Tea Act threatened both principle (taxing without consent) and livelihood (monopoly that cut out colonial merchants). The careful targeting — only tea destroyed, no personal harm, a broken padlock replaced — shows principled protest, not mob violence. Loyalist view: criminal. Legal channels existed; they could simply have refused to buy the tea. Destroying private property worth £10,000 set a dangerous precedent and directly provoked the Intolerable Acts that hurt ordinary colonists far more. I find the Patriot view more compelling, but acknowledge the Loyalists were right that property destruction escalated the crisis in ways the colonists couldn't fully control.", createdAt: "2024-01-06T10:02:00Z" },
    { id: "kqi_2_2_m2", threadId: "kqi_2_2", role: "tutor", content: "Thanks for your response! When you're ready, click \"Grade my answer\" to submit.", createdAt: "2024-01-06T10:03:00Z" },
    { id: "kqi_2_2_m3", threadId: "kqi_2_2", role: "tutor", content: "Correct! Great work on this topic.", createdAt: "2024-01-06T10:04:00Z", metadata: { isSystemMessage: true, isCompletionMessage: true } },
  ],
};
