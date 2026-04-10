import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

router.post("/ai/misconception", async (req, res): Promise<void> => {
  const token = extractToken(req.headers.authorization);
  if (token) {
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }
  }

  const { question, correctAnswer, userAnswer, explanation } = req.body;

  if (!question || !correctAnswer || !userAnswer) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const prompt = `A student answered a question incorrectly. Identify the specific misconception and explain it clearly in 2-3 sentences.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Standard Explanation: ${explanation ?? ""}

Respond with a focused, empathetic explanation of WHY the student's specific choice was wrong — not just what the correct answer is. Help them understand the underlying concept they confused. Be concise and encouraging.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const misconception = completion.choices[0]?.message?.content ?? "Could not generate explanation.";
    res.json({ misconception });
  } catch (err: any) {
    res.status(500).json({ error: "AI service error", message: err.message });
  }
});

export default router;
