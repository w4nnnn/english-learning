import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { chatMessages, chatSessions } from '@/lib/db/schema';

export type ChatRole = 'user' | 'assistant' | 'system';

interface UsagePayload {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    cost?: string;
}

interface AppendChatMessageInput {
    sessionId: string;
    userId: string;
    moduleId: string;
    role: ChatRole;
    content: string;
    model?: string;
    usage?: UsagePayload;
}

function createSessionId() {
    return `chat-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMessageId() {
    return `chat-msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getLatestChatSession(userId: string, moduleId: string) {
    return db.select()
        .from(chatSessions)
        .where(and(eq(chatSessions.userId, userId), eq(chatSessions.moduleId, moduleId)))
        .orderBy(desc(chatSessions.updatedAt))
        .limit(1)
        .get();
}

export async function getChatSessionById(sessionId: string, userId: string, moduleId: string) {
    return db.select()
        .from(chatSessions)
        .where(and(
            eq(chatSessions.id, sessionId),
            eq(chatSessions.userId, userId),
            eq(chatSessions.moduleId, moduleId)
        ))
        .get();
}

export async function createChatSession(userId: string, moduleId: string, title?: string) {
    const id = createSessionId();

    await db.insert(chatSessions).values({
        id,
        userId,
        moduleId,
        title,
    });

    const created = await db.select().from(chatSessions).where(eq(chatSessions.id, id)).get();

    if (!created) {
        throw new Error('Gagal membuat sesi chat');
    }

    return created;
}

export async function getOrCreateChatSession(userId: string, moduleId: string, sessionId?: string) {
    if (sessionId) {
        const existing = await getChatSessionById(sessionId, userId, moduleId);
        if (existing) {
            return existing;
        }
    }

    const latest = await getLatestChatSession(userId, moduleId);
    if (latest) {
        return latest;
    }

    return createChatSession(userId, moduleId);
}

export async function touchChatSession(sessionId: string) {
    await db.update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId));
}

export async function getChatMessagesBySession(sessionId: string, limit = 80) {
    const rows = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

    return rows.reverse();
}

export async function appendChatMessage(input: AppendChatMessageInput) {
    const id = createMessageId();

    await db.insert(chatMessages).values({
        id,
        sessionId: input.sessionId,
        userId: input.userId,
        moduleId: input.moduleId,
        role: input.role,
        content: input.content,
        model: input.model,
        promptTokens: input.usage?.promptTokens,
        completionTokens: input.usage?.completionTokens,
        totalTokens: input.usage?.totalTokens,
        cost: input.usage?.cost,
    });

    await touchChatSession(input.sessionId);

    return db.select().from(chatMessages).where(eq(chatMessages.id, id)).get();
}

export async function getRecentMessagesForPrompt(sessionId: string, limit = 20) {
    const rows = await db.select({
        role: chatMessages.role,
        content: chatMessages.content,
    })
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

    return rows.reverse();
}

export async function clearChatSession(sessionId: string, userId: string) {
    await db.delete(chatMessages)
        .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.userId, userId)));

    await db.update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}
