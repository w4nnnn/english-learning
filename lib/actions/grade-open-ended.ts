'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { moduleItems, modules } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export type GradeOpenEndedInput = {
    moduleId: string;
    itemId: string;
    question?: string | null;
    expectedAnswer?: string | null;
    userAnswer: string;
    itemType?: string | null;
};

export type GradeOpenEndedResult = {
    isCorrect: boolean;
    score: number;
    feedback: string;
    reason?: string;
    model: string;
};

function toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga';
}

function extractJson(content: string) {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error('Format penilaian AI tidak valid');
    }

    return JSON.parse(match[0]) as Record<string, unknown>;
}

function normalizeGrade(result: Record<string, unknown>, model: string): GradeOpenEndedResult {
    const scoreRaw = typeof result.score === 'number'
        ? result.score
        : Number.parseFloat(String(result.score ?? '0'));

    const score = Number.isFinite(scoreRaw)
        ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
        : 0;

    const isCorrectRaw = result.isCorrect;
    const isCorrect = typeof isCorrectRaw === 'boolean'
        ? isCorrectRaw
        : score >= 70;

    const feedback = typeof result.feedback === 'string'
        ? result.feedback.trim()
        : isCorrect
            ? 'Jawaban sudah tepat.'
            : 'Jawaban belum sesuai dengan kriteria.';

    const reason = typeof result.reason === 'string' ? result.reason.trim() : undefined;

    return {
        isCorrect,
        score,
        feedback,
        reason,
        model,
    };
}

async function validateModuleAccess(moduleId: string, role?: string) {
    const moduleData = await db.select().from(modules).where(eq(modules.id, moduleId)).get();
    if (!moduleData) {
        throw new Error('Modul tidak ditemukan');
    }

    const isStaff = role === 'admin' || role === 'guru';
    if (!moduleData.isPublished && !isStaff) {
        throw new Error('Modul belum dipublikasikan');
    }

    return moduleData;
}

export async function gradeOpenEndedAnswer(input: GradeOpenEndedInput): Promise<GradeOpenEndedResult> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session?.user || !userId) {
        throw new Error('Unauthorized');
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
        throw new Error('OPENROUTER_API_KEY belum di-set');
    }

    const moduleId = input.moduleId.trim();
    const itemId = input.itemId.trim();
    const answer = input.userAnswer.trim();

    if (!moduleId || !itemId) {
        throw new Error('moduleId dan itemId wajib diisi');
    }

    if (!answer) {
        throw new Error('Jawaban tidak boleh kosong');
    }

    await validateModuleAccess(moduleId, session.user.role);

    const item = await db.select().from(moduleItems).where(eq(moduleItems.id, itemId)).get();
    if (!item || item.moduleId !== moduleId) {
        throw new Error('Item tidak ditemukan');
    }

    const question = item.question || input.question || '';
    if (!question) {
        throw new Error('Pertanyaan tidak valid');
    }

    const expectedAnswer = item.correctAnswer || input.expectedAnswer || '';
    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
    const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const appTitle = process.env.OPENROUTER_APP_NAME || 'Questly English Learning';
    const appReferer = process.env.OPENROUTER_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const systemPrompt = [
        'Anda adalah penilai AI untuk jawaban isian/essay pada pembelajaran Bahasa Inggris.',
        'Nilai dengan jujur, rasional, dan konservatif jika bukti jawaban kurang.',
        'Gunakan pertanyaan dan kunci/rubrik jika tersedia.',
        'Jika kunci/rubrik tidak tersedia, berikan skor rendah bila jawaban tidak jelas benar.',
        'Jika ragu, nyatakan tidak yakin dan beri skor rendah serta isCorrect=false.',
        'Balasan WAJIB berupa JSON tunggal dengan format:',
        '{"isCorrect": boolean, "score": number, "feedback": string, "reason": string}',
        'Feedback ringkas 1-3 kalimat dalam bahasa Indonesia.',
    ].join('\n');

    const userPrompt = [
        `Tipe soal: ${input.itemType || item.type}`,
        `Pertanyaan: ${question}`,
        `Kunci/Contoh jawaban: ${expectedAnswer || '(tidak tersedia)'}`,
        `Jawaban siswa: ${answer}`,
    ].join('\n');

    const upstream = await fetch(`${openRouterUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': appReferer,
            'X-OpenRouter-Title': appTitle,
        },
        body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 400,
            user: userId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        }),
    });

    if (!upstream.ok) {
        const errorText = await upstream.text();
        throw new Error(`Gagal menilai jawaban: ${errorText.slice(0, 400)}`);
    }

    const json = await upstream.json() as {
        choices?: Array<{ message?: { content?: string } }>;
    };

    const content = json.choices?.[0]?.message?.content?.trim() || '';
    if (!content) {
        throw new Error('Jawaban AI kosong');
    }

    try {
        const parsed = extractJson(content);
        return normalizeGrade(parsed, model);
    } catch (error) {
        throw new Error(toErrorMessage(error));
    }
}
