import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "mathmindsecret2024";

export function signToken(userId: number): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { userId: number };
    return payload;
  } catch {
    return null;
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}
