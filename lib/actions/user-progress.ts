'use server';

import { db } from '@/lib/db';
import { users, userModuleProgress, userItemResponses, moduleItems, modules } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function saveUserProgress(userId: string, data: {
    heartCount?: number;
    xp?: number;
    streak?: number;
}) {
    await db.update(users)
        .set({
            heartCount: data.heartCount,
            xp: data.xp,
            streak: data.streak,
            lastActive: new Date(),
        })
        .where(eq(users.id, userId));
}

export async function saveItemResponse(
    userId: string,
    moduleId: string,
    itemId: string,
    userAnswer: string,
    isCorrect: boolean,
    aiData?: {
        score?: number | null;
        feedback?: string | null;
        reason?: string | null;
        model?: string | null;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Check if response already exists
        const existing = await db.select()
            .from(userItemResponses)
            .where(and(
                eq(userItemResponses.userId, userId),
                eq(userItemResponses.itemId, itemId)
            ))
            .get();

        if (existing) {
            // Update attempt count
            await db.update(userItemResponses)
                .set({
                    userAnswer,
                    isCorrect,
                    attemptCount: (existing.attemptCount ?? 1) + 1,
                    answeredAt: new Date(),
                    ...(aiData ? {
                        aiScore: aiData.score ?? null,
                        aiFeedback: aiData.feedback ?? null,
                        aiReason: aiData.reason ?? null,
                        aiModel: aiData.model ?? null,
                        aiGradedAt: new Date(),
                    } : {}),
                })
                .where(eq(userItemResponses.id, existing.id));
        } else {
            await db.insert(userItemResponses).values({
                userId,
                moduleId,
                itemId,
                userAnswer,
                isCorrect,
                aiScore: aiData?.score ?? null,
                aiFeedback: aiData?.feedback ?? null,
                aiReason: aiData?.reason ?? null,
                aiModel: aiData?.model ?? null,
                aiGradedAt: aiData ? new Date() : undefined,
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error saving item response:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function updateModuleProgress(
    userId: string,
    moduleId: string,
    data: {
        currentItemIndex?: number;
        status?: 'not_started' | 'in_progress' | 'completed';
        score?: number;
    }
) {
    // 1. Calculate true total items (ALL types)
    const items = await db.select().from(moduleItems).where(eq(moduleItems.moduleId, moduleId));
    const totalItems = items.length;

    // 2. Calculate completed items
    // For questions: count correct responses
    const responses = await db.select()
        .from(userItemResponses)
        .where(and(
            eq(userItemResponses.userId, userId),
            eq(userItemResponses.moduleId, moduleId),
            eq(userItemResponses.isCorrect, true)
        ));

    // For materials/headers: we assume they are completed if the current index is past them
    // (A limitation: we don't store "read" status for materials explicitly in a separate table, 
    // but relying on currentItemIndex is a reasonable approximation for linear progression)
    const nonQuestionItems = items.filter(i => ['header', 'material'].includes(i.type));
    let completedNonQuestions = 0;

    if (data.status === 'completed') {
        completedNonQuestions = nonQuestionItems.length;
    } else if (data.currentItemIndex !== undefined) {
        // Find how many non-question items are before the current index
        // Note: items array might not be sorted by order here, we should ensure it is or use index logic carefully.
        // Effectively, if user is at index 5, items 0-4 are "done".
        // We count how many of 0-(currentIndex-1) are non-questions.

        // Sort items by order first to match player sequence
        const sortedItems = items.sort((a, b) => a.order - b.order);
        const passedItems = sortedItems.slice(0, data.currentItemIndex);
        completedNonQuestions = passedItems.filter(i => ['header', 'material'].includes(i.type)).length;
    }

    const completedItems = responses.length + completedNonQuestions;

    const existing = await db.select()
        .from(userModuleProgress)
        .where(and(
            eq(userModuleProgress.userId, userId),
            eq(userModuleProgress.moduleId, moduleId)
        ))
        .get();

    if (existing) {
        await db.update(userModuleProgress)
            .set({
                ...data,
                totalItems,
                completedItems,
                completedAt: data.status === 'completed' ? new Date() : undefined,
            })
            .where(eq(userModuleProgress.id, existing.id));
    } else {
        await db.insert(userModuleProgress).values({
            userId,
            moduleId,
            status: 'in_progress',
            totalItems,
            completedItems,
            startedAt: new Date(),
            ...data,
        });
    }
}

export async function getUserProgress(userId: string) {
    return await db.select().from(users).where(eq(users.id, userId)).get();
}

export async function getUserModuleProgress(userId: string, moduleId: string) {
    return await db.select()
        .from(userModuleProgress)
        .where(and(
            eq(userModuleProgress.userId, userId),
            eq(userModuleProgress.moduleId, moduleId)
        ))
        .get();
}

export async function getAllModuleProgress(userId: string) {
    return await db.select()
        .from(userModuleProgress)
        .where(eq(userModuleProgress.userId, userId));
}

// ===== EXPORT STUDENT RESULTS =====

export type StudentResult = {
    userId: string;
    username: string;
    status: string;
    score: number;
    totalItems: number;
    completedItems: number;
    startedAt: Date | null;
    completedAt: Date | null;
    responses: {
        itemId: string;
        question: string;
        userAnswer: string | null;
        correctAnswer: string | null;
        isCorrect: boolean | null;
        aiScore: number | null;
        aiFeedback: string | null;
        aiReason: string | null;
        attemptCount: number;
    }[];
};

export async function getModuleStudentResults(moduleId: string): Promise<StudentResult[]> {
    // Get module info
    const module = await db.select().from(modules).where(eq(modules.id, moduleId)).get();
    if (!module) return [];

    // Get all module items (questions only)
    const items = await db.select()
        .from(moduleItems)
        .where(eq(moduleItems.moduleId, moduleId))
        .orderBy(asc(moduleItems.order));

    const questionItems = items.filter(i => 
        !['header', 'material', 'material_image', 'material_video'].includes(i.type)
    );

    // Get all progress for this module
    const progressList = await db.select()
        .from(userModuleProgress)
        .where(eq(userModuleProgress.moduleId, moduleId));

    // Get user data for all participants
    const userIds = progressList.map(p => p.userId);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // Get all responses for this module
    const allResponses = await db.select()
        .from(userItemResponses)
        .where(eq(userItemResponses.moduleId, moduleId));

    // Build result for each user
    const results: StudentResult[] = [];

    for (const progress of progressList) {
        const user = userMap.get(progress.userId);
        if (!user) continue;

        const userResponses = allResponses.filter(r => r.userId === progress.userId);
        const responseMap = new Map(userResponses.map(r => [r.itemId, r]));

        // Calculate score
        const correctCount = userResponses.filter(r => r.isCorrect).length;
        const score = questionItems.length > 0 
            ? Math.round((correctCount / questionItems.length) * 100) 
            : 0;

        results.push({
            userId: progress.userId,
            username: user.username,
            status: progress.status || 'not_started',
            score,
            totalItems: progress.totalItems || 0,
            completedItems: progress.completedItems || 0,
            startedAt: progress.startedAt,
            completedAt: progress.completedAt,
            responses: questionItems.map(item => {
                const response = responseMap.get(item.id);
                return {
                    itemId: item.id,
                    question: item.question || item.title || '',
                    userAnswer: response?.userAnswer || null,
                    correctAnswer: item.correctAnswer,
                    isCorrect: response?.isCorrect ?? null,
                    aiScore: response?.aiScore ?? null,
                    aiFeedback: response?.aiFeedback || null,
                    aiReason: response?.aiReason || null,
                    attemptCount: response?.attemptCount || 0,
                };
            }),
        });
    }

    return results;
}
