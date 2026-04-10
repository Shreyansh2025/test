import { db } from "./index";
import { subjectsTable, topicsTable, questionsTable, badgesTable } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Subjects
  const [math, physics, chemistry, prog] = await db
    .insert(subjectsTable)
    .values([
      { name: "Mathematics", nameHi: "गणित", description: "Algebra, Calculus, Geometry, Statistics", icon: "∑", color: "#8b5cf6", order: 1 },
      { name: "Physics", nameHi: "भौतिकी", description: "Mechanics, Thermodynamics, Waves, Electromagnetism", icon: "⚡", color: "#0ea5e9", order: 2 },
      { name: "Chemistry", nameHi: "रसायन", description: "Organic, Inorganic, Physical Chemistry", icon: "⚗", color: "#10b981", order: 3 },
      { name: "Programming", nameHi: "प्रोग्रामिंग", description: "Algorithms, Data Structures, Coding", icon: "{}", color: "#f59e0b", order: 4 },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("✅ Subjects seeded");

  if (!math) { console.log("Subjects already exist, skipping topics and questions..."); return; }

  // Topics for Mathematics
  const mathTopics = await db
    .insert(topicsTable)
    .values([
      { subjectId: math.id, name: "Algebra Basics", nameHi: "बीजगणित की मूल बातें", order: 1 },
      { subjectId: math.id, name: "Quadratic Equations", nameHi: "द्विघात समीकरण", order: 2 },
      { subjectId: math.id, name: "Linear Algebra", nameHi: "रेखीय बीजगणित", order: 3 },
      { subjectId: math.id, name: "Calculus — Differentiation", nameHi: "कलन — अवकलन", order: 4 },
      { subjectId: math.id, name: "Calculus — Integration", nameHi: "कलन — समाकलन", order: 5 },
      { subjectId: math.id, name: "Trigonometry", nameHi: "त्रिकोणमिति", order: 6 },
      { subjectId: math.id, name: "Probability & Statistics", nameHi: "प्रायिकता और सांख्यिकी", order: 7 },
      { subjectId: math.id, name: "Geometry", nameHi: "ज्यामिति", order: 8 },
    ])
    .returning();

  // Topics for Physics
  const physicsTopics = await db
    .insert(topicsTable)
    .values([
      { subjectId: physics.id, name: "Newton's Laws", nameHi: "न्यूटन के नियम", order: 1 },
      { subjectId: physics.id, name: "Kinematics", nameHi: "गतिकी", order: 2 },
      { subjectId: physics.id, name: "Energy & Work", nameHi: "ऊर्जा और कार्य", order: 3 },
      { subjectId: physics.id, name: "Waves & Sound", nameHi: "तरंगें और ध्वनि", order: 4 },
      { subjectId: physics.id, name: "Electrostatics", nameHi: "स्थिरवैद्युतिकी", order: 5 },
    ])
    .returning();

  // Topics for Chemistry
  await db
    .insert(topicsTable)
    .values([
      { subjectId: chemistry.id, name: "Periodic Table", nameHi: "आवर्त सारणी", order: 1 },
      { subjectId: chemistry.id, name: "Chemical Bonding", nameHi: "रासायनिक बंधन", order: 2 },
      { subjectId: chemistry.id, name: "Organic Chemistry Basics", nameHi: "जैविक रसायन की मूल बातें", order: 3 },
    ])
    .returning();

  // Topics for Programming
  await db
    .insert(topicsTable)
    .values([
      { subjectId: prog.id, name: "Arrays & Strings", nameHi: "सरणियाँ और तार", order: 1 },
      { subjectId: prog.id, name: "Time Complexity", nameHi: "समय जटिलता", order: 2 },
      { subjectId: prog.id, name: "Recursion", nameHi: "पुनरावर्तन", order: 3 },
      { subjectId: prog.id, name: "Sorting Algorithms", nameHi: "क्रमबद्ध एल्गोरिदम", order: 4 },
    ])
    .returning();

  console.log("✅ Topics seeded");

  // Questions for Algebra Basics
  if (mathTopics[0]) {
    await db
      .insert(questionsTable)
      .values([
        {
          topicId: mathTopics[0].id,
          text: "If 3x + 7 = 22, what is the value of x?",
          textHi: "अगर 3x + 7 = 22, तो x का मान क्या है?",
          options: ["A) 3", "B) 5", "C) 7", "D) 9"],
          correctAnswer: "B) 5",
          explanation: "Subtract 7 from both sides: 3x = 15, then divide by 3: x = 5",
          explanationHi: "दोनों तरफ से 7 घटाएं: 3x = 15, फिर 3 से भाग दें: x = 5",
          steps: ["3x + 7 = 22", "3x = 22 - 7 = 15", "x = 15 ÷ 3 = 5"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
        {
          topicId: mathTopics[0].id,
          text: "Simplify: 4(2x - 3) + 2(x + 5)",
          textHi: "सरल करें: 4(2x - 3) + 2(x + 5)",
          options: ["A) 10x - 2", "B) 10x + 2", "C) 8x - 2", "D) 10x - 7"],
          correctAnswer: "A) 10x - 2",
          explanation: "Expand: 8x - 12 + 2x + 10 = 10x - 2",
          explanationHi: "विस्तार करें: 8x - 12 + 2x + 10 = 10x - 2",
          steps: ["4(2x - 3) = 8x - 12", "2(x + 5) = 2x + 10", "8x - 12 + 2x + 10 = 10x - 2"],
          difficulty: "easy",
          points: 10,
          timeLimit: 45,
        },
        {
          topicId: mathTopics[0].id,
          text: "Which form is y = mx + b?",
          textHi: "y = mx + b किस रूप का है?",
          options: ["A) Standard form", "B) Slope-intercept form", "C) Point-slope form", "D) Vertex form"],
          correctAnswer: "B) Slope-intercept form",
          explanation: "y = mx + b is slope-intercept form where m is slope and b is y-intercept",
          explanationHi: "y = mx + b ढाल-अंत:खंड रूप है जहाँ m ढाल है और b y-अंत:खंड है",
          steps: ["Slope-intercept form: y = mx + b", "m = slope", "b = y-intercept"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
        {
          topicId: mathTopics[0].id,
          text: "Solve for x: 2(x + 4) = 16",
          textHi: "x के लिए हल करें: 2(x + 4) = 16",
          options: ["A) x = 4", "B) x = 6", "C) x = 8", "D) x = 3"],
          correctAnswer: "A) x = 4",
          explanation: "Divide both sides by 2: x + 4 = 8, then subtract 4: x = 4",
          explanationHi: "दोनों तरफ से 2 से भाग दें: x + 4 = 8, फिर 4 घटाएं: x = 4",
          steps: ["2(x + 4) = 16", "x + 4 = 8 (divide both sides by 2)", "x = 8 - 4 = 4"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
      ])
      .onConflictDoNothing();
  }

  // Questions for Quadratic Equations
  if (mathTopics[1]) {
    await db
      .insert(questionsTable)
      .values([
        {
          topicId: mathTopics[1].id,
          text: "What are the roots of x² - 5x + 6 = 0?",
          textHi: "x² - 5x + 6 = 0 के मूल क्या हैं?",
          options: ["A) x = 2, 3", "B) x = -2, -3", "C) x = 1, 6", "D) x = -1, 6"],
          correctAnswer: "A) x = 2, 3",
          explanation: "Factor: (x-2)(x-3) = 0, so x = 2 or x = 3",
          explanationHi: "गुणनखंड: (x-2)(x-3) = 0, इसलिए x = 2 या x = 3",
          steps: ["x² - 5x + 6 = 0", "Find factors of 6 that add to -5: -2 and -3", "(x-2)(x-3) = 0", "x = 2 or x = 3"],
          difficulty: "medium",
          points: 15,
          timeLimit: 60,
        },
        {
          topicId: mathTopics[1].id,
          text: "What is the discriminant of 2x² + 3x - 2 = 0?",
          textHi: "2x² + 3x - 2 = 0 का विवेचक क्या है?",
          options: ["A) 7", "B) 9", "C) 25", "D) 16"],
          correctAnswer: "C) 25",
          explanation: "Discriminant = b² - 4ac = 9 - 4(2)(-2) = 9 + 16 = 25",
          explanationHi: "विवेचक = b² - 4ac = 9 - 4(2)(-2) = 9 + 16 = 25",
          steps: ["a=2, b=3, c=-2", "Δ = b² - 4ac", "Δ = 9 + 16 = 25"],
          difficulty: "medium",
          points: 15,
          timeLimit: 60,
        },
        {
          topicId: mathTopics[1].id,
          text: "Using the quadratic formula, solve x² + 4x + 4 = 0",
          textHi: "द्विघात सूत्र का उपयोग करके हल करें: x² + 4x + 4 = 0",
          options: ["A) x = -2 (double root)", "B) x = 2", "C) x = -4", "D) x = 4"],
          correctAnswer: "A) x = -2 (double root)",
          explanation: "x² + 4x + 4 = (x+2)² = 0, so x = -2 (double root)",
          explanationHi: "x² + 4x + 4 = (x+2)² = 0, इसलिए x = -2 (दोहरा मूल)",
          steps: ["x² + 4x + 4 = 0", "This is a perfect square: (x+2)² = 0", "x + 2 = 0", "x = -2"],
          difficulty: "medium",
          points: 15,
          timeLimit: 60,
        },
      ])
      .onConflictDoNothing();
  }

  // Questions for Newton's Laws
  if (physicsTopics[0]) {
    await db
      .insert(questionsTable)
      .values([
        {
          topicId: physicsTopics[0].id,
          text: "A 5 kg object accelerates at 4 m/s². What force is applied?",
          textHi: "एक 5 kg की वस्तु 4 m/s² से त्वरित होती है। कितना बल लगाया गया?",
          options: ["A) 10 N", "B) 15 N", "C) 20 N", "D) 25 N"],
          correctAnswer: "C) 20 N",
          explanation: "F = ma = 5 × 4 = 20 N (Newton's Second Law)",
          explanationHi: "F = ma = 5 × 4 = 20 N (न्यूटन का दूसरा नियम)",
          steps: ["F = ma (Newton's Second Law)", "F = 5 kg × 4 m/s²", "F = 20 N"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
        {
          topicId: physicsTopics[0].id,
          text: "An object at rest stays at rest unless acted upon by an external force. This is Newton's ___ law.",
          textHi: "यह न्यूटन का ___ नियम है जिसमें विराम अवस्था में वस्तु विराम में रहती है।",
          options: ["A) First", "B) Second", "C) Third", "D) Fourth"],
          correctAnswer: "A) First",
          explanation: "Newton's First Law is the law of inertia.",
          explanationHi: "न्यूटन का पहला नियम जड़त्व का नियम है।",
          steps: ["Newton's 1st Law = Law of Inertia", "Objects at rest stay at rest", "Objects in motion stay in motion", "Unless acted upon by external force"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
        {
          topicId: physicsTopics[0].id,
          text: "For every action, there is an equal and opposite reaction. This is Newton's ___ law.",
          textHi: "प्रत्येक क्रिया के लिए एक समान और विपरीत प्रतिक्रिया होती है। यह न्यूटन का ___ नियम है।",
          options: ["A) First", "B) Second", "C) Third", "D) Zero-th"],
          correctAnswer: "C) Third",
          explanation: "Newton's Third Law: For every action, there is an equal and opposite reaction.",
          explanationHi: "न्यूटन का तीसरा नियम: प्रत्येक क्रिया के लिए समान और विपरीत प्रतिक्रिया होती है।",
          steps: ["3rd Law = Action-Reaction Law", "If A exerts force on B", "Then B exerts equal and opposite force on A"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
      ])
      .onConflictDoNothing();
  }

  // Calculus Questions
  if (mathTopics[3]) {
    await db
      .insert(questionsTable)
      .values([
        {
          topicId: mathTopics[3].id,
          text: "What is the derivative of f(x) = x³ + 2x²?",
          textHi: "f(x) = x³ + 2x² का अवकलज क्या है?",
          options: ["A) 3x² + 4x", "B) 3x² + 2x", "C) x² + 4x", "D) 3x + 4"],
          correctAnswer: "A) 3x² + 4x",
          explanation: "Using power rule: d/dx(x³) = 3x², d/dx(2x²) = 4x",
          explanationHi: "घात नियम का उपयोग: d/dx(x³) = 3x², d/dx(2x²) = 4x",
          steps: ["f(x) = x³ + 2x²", "d/dx(x³) = 3x² (power rule)", "d/dx(2x²) = 4x (power rule)", "f'(x) = 3x² + 4x"],
          difficulty: "medium",
          points: 15,
          timeLimit: 60,
        },
        {
          topicId: mathTopics[3].id,
          text: "What is the derivative of sin(x)?",
          textHi: "sin(x) का अवकलज क्या है?",
          options: ["A) -cos(x)", "B) cos(x)", "C) -sin(x)", "D) tan(x)"],
          correctAnswer: "B) cos(x)",
          explanation: "The derivative of sin(x) is cos(x) — a standard result.",
          explanationHi: "sin(x) का अवकलज cos(x) है — यह एक मानक परिणाम है।",
          steps: ["d/dx[sin(x)] = cos(x)", "This is a standard trigonometric derivative", "Must be memorized"],
          difficulty: "easy",
          points: 10,
          timeLimit: 30,
        },
      ])
      .onConflictDoNothing();
  }

  console.log("✅ Questions seeded");

  // Badges
  await db
    .insert(badgesTable)
    .values([
      { name: "First Steps", description: "Answer your first question", icon: "🎯", rarity: "common", condition: "answer_1" },
      { name: "Quick Learner", description: "Answer 10 questions", icon: "⚡", rarity: "common", condition: "answer_10" },
      { name: "Math Enthusiast", description: "Answer 50 questions", icon: "📚", rarity: "rare", condition: "answer_50" },
      { name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", rarity: "common", condition: "streak_3" },
      { name: "On Fire", description: "Maintain a 7-day streak", icon: "🌟", rarity: "rare", condition: "streak_7" },
      { name: "Unstoppable", description: "Maintain a 30-day streak", icon: "💎", rarity: "legendary", condition: "streak_30" },
      { name: "Sharpshooter", description: "Get 10 correct in a row", icon: "🎯", rarity: "rare", condition: "correct_10" },
      { name: "Battle Winner", description: "Win your first battle", icon: "⚔️", rarity: "rare", condition: "battle_win_1" },
      { name: "Battle Champion", description: "Win 10 battles", icon: "🏆", rarity: "epic", condition: "battle_win_10" },
      { name: "Speed Demon", description: "Answer correctly in under 5s", icon: "💨", rarity: "rare", condition: "speed_5" },
      { name: "XP Collector", description: "Earn 1000 XP", icon: "⭐", rarity: "rare", condition: "xp_1000" },
      { name: "Math Legend", description: "Reach Level 10", icon: "👑", rarity: "legendary", condition: "level_10" },
    ])
    .onConflictDoNothing();

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
