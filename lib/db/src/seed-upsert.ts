import { and, eq } from "drizzle-orm";

import { db } from "./index";
import { badgesTable, subjectsTable, topicsTable } from "./schema";

type SubjectSeed = {
  name: string;
  nameHi: string;
  description: string;
  icon: string;
  color: string;
  order: number;
};

type TopicSeed = {
  subject: string;
  name: string;
  nameHi: string;
  order: number;
};

const SUBJECTS: SubjectSeed[] = [
  { name: "Mathematics", nameHi: "गणित", description: "Algebra, Calculus, Geometry, Statistics", icon: "∑", color: "#8b5cf6", order: 1 },
  { name: "Physics", nameHi: "भौतिकी", description: "Mechanics, Thermodynamics, Waves, Electromagnetism", icon: "⚡", color: "#0ea5e9", order: 2 },
  { name: "Chemistry", nameHi: "रसायन", description: "Organic, Inorganic, Physical Chemistry", icon: "⚗", color: "#10b981", order: 3 },
  { name: "Programming", nameHi: "प्रोग्रामिंग", description: "Algorithms, Data Structures, Coding", icon: "{}", color: "#f59e0b", order: 4 },
  { name: "Biology", nameHi: "जीवविज्ञान", description: "Cell biology, genetics, anatomy, ecology", icon: "🧬", color: "#22c55e", order: 5 },
  { name: "Economics", nameHi: "अर्थशास्त्र", description: "Supply-demand, markets, GDP, inflation", icon: "📈", color: "#f97316", order: 6 },
  { name: "History", nameHi: "इतिहास", description: "Civilizations, medieval era, world history", icon: "🏛️", color: "#a855f7", order: 7 },
  { name: "English", nameHi: "अंग्रेज़ी", description: "Grammar, vocabulary, reading and writing", icon: "📖", color: "#ec4899", order: 8 },
  { name: "Geography", nameHi: "भूगोल", description: "Physical geography, climate, maps", icon: "🌍", color: "#06b6d4", order: 9 },
];

const TOPICS: TopicSeed[] = [
  { subject: "Mathematics", name: "Algebra Basics", nameHi: "बीजगणित की मूल बातें", order: 1 },
  { subject: "Mathematics", name: "Quadratic Equations", nameHi: "द्विघात समीकरण", order: 2 },
  { subject: "Mathematics", name: "Linear Algebra", nameHi: "रेखीय बीजगणित", order: 3 },
  { subject: "Mathematics", name: "Calculus — Differentiation", nameHi: "कलन — अवकलन", order: 4 },
  { subject: "Mathematics", name: "Calculus — Integration", nameHi: "कलन — समाकलन", order: 5 },
  { subject: "Mathematics", name: "Trigonometry", nameHi: "त्रिकोणमिति", order: 6 },
  { subject: "Mathematics", name: "Probability & Statistics", nameHi: "प्रायिकता और सांख्यिकी", order: 7 },
  { subject: "Mathematics", name: "Geometry", nameHi: "ज्यामिति", order: 8 },
  { subject: "Physics", name: "Newton's Laws", nameHi: "न्यूटन के नियम", order: 1 },
  { subject: "Physics", name: "Kinematics", nameHi: "गतिकी", order: 2 },
  { subject: "Physics", name: "Energy & Work", nameHi: "ऊर्जा और कार्य", order: 3 },
  { subject: "Physics", name: "Waves & Sound", nameHi: "तरंगें और ध्वनि", order: 4 },
  { subject: "Physics", name: "Electrostatics", nameHi: "स्थिरवैद्युतिकी", order: 5 },
  { subject: "Chemistry", name: "Periodic Table", nameHi: "आवर्त सारणी", order: 1 },
  { subject: "Chemistry", name: "Chemical Bonding", nameHi: "रासायनिक बंधन", order: 2 },
  { subject: "Chemistry", name: "Organic Chemistry Basics", nameHi: "जैविक रसायन की मूल बातें", order: 3 },
  { subject: "Programming", name: "Arrays & Strings", nameHi: "सरणियाँ और तार", order: 1 },
  { subject: "Programming", name: "Time Complexity", nameHi: "समय जटिलता", order: 2 },
  { subject: "Programming", name: "Recursion", nameHi: "पुनरावर्तन", order: 3 },
  { subject: "Programming", name: "Sorting Algorithms", nameHi: "क्रमबद्ध एल्गोरिदम", order: 4 },
  { subject: "Biology", name: "Cell Biology", nameHi: "कोशिका जीव विज्ञान", order: 1 },
  { subject: "Biology", name: "Genetics", nameHi: "आनुवंशिकी", order: 2 },
  { subject: "Biology", name: "Human Anatomy", nameHi: "मानव शरीर रचना", order: 3 },
  { subject: "Biology", name: "Ecology", nameHi: "पारिस्थितिकी", order: 4 },
  { subject: "Biology", name: "Photosynthesis", nameHi: "प्रकाश संश्लेषण", order: 5 },
  { subject: "Economics", name: "Supply & Demand", nameHi: "आपूर्ति और माँग", order: 1 },
  { subject: "Economics", name: "Market Structures", nameHi: "बाज़ार संरचनाएँ", order: 2 },
  { subject: "Economics", name: "GDP & Growth", nameHi: "जीडीपी और विकास", order: 3 },
  { subject: "Economics", name: "Inflation", nameHi: "मुद्रास्फीति", order: 4 },
  { subject: "History", name: "Ancient Civilizations", nameHi: "प्राचीन सभ्यताएँ", order: 1 },
  { subject: "History", name: "Medieval History", nameHi: "मध्यकालीन इतिहास", order: 2 },
  { subject: "History", name: "World Wars", nameHi: "विश्व युद्ध", order: 3 },
  { subject: "History", name: "Indian Independence", nameHi: "भारतीय स्वतंत्रता", order: 4 },
  { subject: "English", name: "Grammar Basics", nameHi: "व्याकरण की मूल बातें", order: 1 },
  { subject: "English", name: "Reading Comprehension", nameHi: "पठन बोध", order: 2 },
  { subject: "English", name: "Vocabulary", nameHi: "शब्द भंडार", order: 3 },
  { subject: "English", name: "Essay Writing", nameHi: "निबंध लेखन", order: 4 },
  { subject: "Geography", name: "Physical Geography", nameHi: "भौतिक भूगोल", order: 1 },
  { subject: "Geography", name: "Climate & Weather", nameHi: "जलवायु और मौसम", order: 2 },
  { subject: "Geography", name: "World Countries", nameHi: "विश्व के देश", order: 3 },
  { subject: "Geography", name: "Maps & Coordinates", nameHi: "मानचित्र और निर्देशांक", order: 4 },
];

const BADGES = [
  { name: "First Steps", description: "Answer your first question", icon: "🎯", rarity: "common", condition: "answer_1", xpRequired: 0 },
  { name: "Quick Learner", description: "Answer 10 questions", icon: "⚡", rarity: "common", condition: "answer_10", xpRequired: 100 },
  { name: "Math Enthusiast", description: "Answer 50 questions", icon: "📚", rarity: "rare", condition: "answer_50", xpRequired: 500 },
  { name: "Streak Starter", description: "Maintain a 3-day streak", icon: "🔥", rarity: "common", condition: "streak_3", xpRequired: 150 },
  { name: "On Fire", description: "Maintain a 7-day streak", icon: "🌟", rarity: "rare", condition: "streak_7", xpRequired: 350 },
  { name: "Unstoppable", description: "Maintain a 30-day streak", icon: "💎", rarity: "legendary", condition: "streak_30", xpRequired: 1500 },
  { name: "Sharpshooter", description: "Get 10 correct in a row", icon: "🎯", rarity: "rare", condition: "correct_10", xpRequired: 400 },
  { name: "Battle Winner", description: "Win your first battle", icon: "⚔️", rarity: "rare", condition: "battle_win_1", xpRequired: 250 },
  { name: "Battle Champion", description: "Win 10 battles", icon: "🏆", rarity: "epic", condition: "battle_win_10", xpRequired: 900 },
  { name: "Speed Demon", description: "Answer correctly in under 5s", icon: "💨", rarity: "rare", condition: "speed_5", xpRequired: 450 },
  { name: "XP Collector", description: "Earn 1000 XP", icon: "⭐", rarity: "rare", condition: "xp_1000", xpRequired: 1000 },
  { name: "Math Legend", description: "Reach Level 10", icon: "👑", rarity: "legendary", condition: "level_10", xpRequired: 2000 },
];

async function runUpsertSeed() {
  console.log("🌱 Upsert seeding (safe)...");

  const subjectIdByName = new Map<string, number>();

  for (const s of SUBJECTS) {
    const existing = await db
      .select({ id: subjectsTable.id })
      .from(subjectsTable)
      .where(eq(subjectsTable.name, s.name))
      .limit(1);

    if (existing[0]) {
      subjectIdByName.set(s.name, existing[0].id);
      continue;
    }

    const inserted = await db.insert(subjectsTable).values(s).returning({ id: subjectsTable.id });
    if (inserted[0]) subjectIdByName.set(s.name, inserted[0].id);
  }

  for (const t of TOPICS) {
    const subjectId = subjectIdByName.get(t.subject);
    if (!subjectId) continue;

    const existing = await db
      .select({ id: topicsTable.id })
      .from(topicsTable)
      .where(and(eq(topicsTable.subjectId, subjectId), eq(topicsTable.name, t.name)))
      .limit(1);

    if (existing[0]) continue;
    await db.insert(topicsTable).values({
      subjectId,
      name: t.name,
      nameHi: t.nameHi,
      order: t.order,
    });
  }

  for (const b of BADGES) {
    const existing = await db
      .select({ id: badgesTable.id })
      .from(badgesTable)
      .where(eq(badgesTable.name, b.name))
      .limit(1);
    if (existing[0]) continue;
    await db.insert(badgesTable).values(b);
  }

  console.log("✅ Upsert seeding complete (subjects/topics/badges).");
}

runUpsertSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Upsert seed failed:", err);
    process.exit(1);
  });

