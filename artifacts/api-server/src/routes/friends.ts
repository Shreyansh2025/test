import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { db, usersTable, friendRequestsTable, friendshipsTable } from "@workspace/db";
import { SendFriendRequestBody, AcceptFriendRequestParams, RejectFriendRequestParams } from "@workspace/api-zod";
import { extractToken, verifyToken } from "../lib/auth";

const router: IRouter = Router();

function getAuthUserId(req: any): number | null {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

router.get("/friends", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const friendships = await db.select().from(friendshipsTable)
    .where(eq(friendshipsTable.userId, userId));

  const friends = await Promise.all(friendships.map(async f => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, f.friendId)).limit(1);
    return user ? {
      id: f.id,
      userId: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      onlineStatus: "offline" as const,
    } : null;
  }));

  res.json(friends.filter(Boolean));
});

router.get("/friends/requests", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const requests = await db.select({
    req: friendRequestsTable,
    from: usersTable,
  }).from(friendRequestsTable)
    .leftJoin(usersTable, eq(friendRequestsTable.fromUserId, usersTable.id))
    .where(and(eq(friendRequestsTable.toUserId, userId), eq(friendRequestsTable.status, "pending")));

  res.json(requests.map(r => ({
    id: r.req.id,
    fromUserId: r.req.fromUserId,
    fromDisplayName: r.from?.displayName ?? "Unknown",
    fromAvatarUrl: r.from?.avatarUrl ?? null,
    toUserId: r.req.toUserId,
    status: r.req.status,
    createdAt: r.req.createdAt,
  })));
});

router.post("/friends/requests", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SendFriendRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [toUser] = await db.select().from(usersTable)
    .where(eq(usersTable.username, parsed.data.toUsername)).limit(1);
  if (!toUser) { res.status(404).json({ error: "User not found" }); return; }
  if (toUser.id === userId) { res.status(400).json({ error: "Cannot send request to yourself" }); return; }

  const [existing] = await db.select().from(friendRequestsTable)
    .where(and(eq(friendRequestsTable.fromUserId, userId), eq(friendRequestsTable.toUserId, toUser.id)))
    .limit(1);
  if (existing) { res.status(400).json({ error: "Request already sent" }); return; }

  const [request] = await db.insert(friendRequestsTable).values({
    fromUserId: userId,
    toUserId: toUser.id,
    status: "pending",
  }).returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: request.id,
    fromUserId: request.fromUserId,
    fromDisplayName: fromUser?.displayName ?? "Unknown",
    fromAvatarUrl: fromUser?.avatarUrl ?? null,
    toUserId: request.toUserId,
    status: request.status,
    createdAt: request.createdAt,
  });
});

router.post("/friends/requests/:id/accept", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [request] = await db.select().from(friendRequestsTable).where(eq(friendRequestsTable.id, id)).limit(1);
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }

  await db.update(friendRequestsTable).set({ status: "accepted" }).where(eq(friendRequestsTable.id, id));

  await db.insert(friendshipsTable).values([
    { userId: request.toUserId, friendId: request.fromUserId },
    { userId: request.fromUserId, friendId: request.toUserId },
  ]);

  const [friend] = await db.select().from(usersTable).where(eq(usersTable.id, request.fromUserId)).limit(1);
  res.json({
    id: request.id,
    userId: friend?.id ?? request.fromUserId,
    displayName: friend?.displayName ?? "Unknown",
    avatarUrl: friend?.avatarUrl ?? null,
    xp: friend?.xp ?? 0,
    level: friend?.level ?? 1,
    streak: friend?.streak ?? 0,
    onlineStatus: "offline",
  });
});

router.post("/friends/requests/:id/reject", async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(friendRequestsTable).set({ status: "rejected" }).where(eq(friendRequestsTable.id, id));
  res.sendStatus(204);
});

export default router;
