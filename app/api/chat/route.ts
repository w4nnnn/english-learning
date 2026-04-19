import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { modules } from '@/lib/db/schema';
import {
    appendChatMessage,
    getChatMessagesBySession,
    getLatestChatSession,
    getOrCreateChatSession,
    getRecentMessagesForPrompt,
} from '@/lib/chat/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_MEMORY_WINDOW_MESSAGES = 4;

type ChatRequestBody = {
    moduleId?: string;
    sessionId?: string;
    message?: string;
    context?: {
        currentItemType?: string;
        currentQuestion?: string;
        currentTitle?: string;
        currentIndex?: number;
        totalItems?: number;
        moduleTitle?: string;
        moduleDescription?: string;
    };
};

type OpenRouterStreamChunk = {
    choices?: Array<{
        delta?: {
            content?: string | null;
        };
        finish_reason?: string | null;
    }>;
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        cost?: number;
    };
    error?: {
        message?: string;
    };
};

type OpenRouterChatMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

function toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga';
}

function buildTutorSystemPrompt(context?: ChatRequestBody['context']) {
    const contextLines = [
        context?.moduleTitle ? `Judul modul: ${context.moduleTitle}` : null,
        context?.moduleDescription ? `Deskripsi modul: ${context.moduleDescription}` : null,
        context?.currentItemType ? `Tipe konten aktif: ${context.currentItemType}` : null,
        context?.currentTitle ? `Judul bagian aktif: ${context.currentTitle}` : null,
        context?.currentQuestion ? `Pertanyaan aktif: ${context.currentQuestion}` : null,
        typeof context?.currentIndex === 'number' ? `Posisi item: ${context.currentIndex + 1}` : null,
        typeof context?.totalItems === 'number' ? `Total item modul: ${context.totalItems}` : null,
    ].filter(Boolean);

    return [
        'Anda adalah tutor AI untuk aplikasi belajar Bahasa Inggris.',
        'Tujuan utama Anda adalah membantu siswa memahami materi, bukan memberi jawaban instan tanpa penjelasan.',
        'Gunakan bahasa Indonesia yang sederhana dan ramah.',
        'Jika siswa minta jawaban soal, berikan petunjuk bertahap dan alasan, bukan sekadar output akhir.',
        'Batasi jawaban agar tetap relevan dengan konteks modul yang sedang dikerjakan.',
        contextLines.length > 0 ? `Konteks saat ini:\n- ${contextLines.join('\n- ')}` : null,
    ].filter(Boolean).join('\n\n');
}

function sseEncode(event: string, payload: Record<string, unknown>) {
    return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function normalizeOpenRouterRole(role: string): OpenRouterChatMessage['role'] {
    if (role === 'assistant' || role === 'system') {
        return role;
    }
    return 'user';
}

function getMemoryWindowSize() {
    const parsed = Number.parseInt(
        process.env.OPENROUTER_MEMORY_WINDOW || `${DEFAULT_MEMORY_WINDOW_MESSAGES}`,
        10
    );

    if (!Number.isFinite(parsed)) {
        return DEFAULT_MEMORY_WINDOW_MESSAGES;
    }

    return Math.min(Math.max(parsed, 1), 12);
}

async function getAuthorizedUser() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session?.user || !userId) {
        return null;
    }

    return {
        userId,
        role: session.user.role,
    };
}

async function validateModuleAccess(moduleId: string, role?: string) {
    const moduleData = await db.select().from(modules).where(eq(modules.id, moduleId)).get();
    if (!moduleData) {
        return { ok: false as const, status: 404, error: 'Modul tidak ditemukan' };
    }

    const isStaff = role === 'admin' || role === 'guru';
    if (!moduleData.isPublished && !isStaff) {
        return { ok: false as const, status: 403, error: 'Modul belum dipublikasikan' };
    }

    return { ok: true as const, module: moduleData };
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthorizedUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const moduleId = request.nextUrl.searchParams.get('moduleId');
        if (!moduleId) {
            return NextResponse.json({ success: false, error: 'moduleId wajib diisi' }, { status: 400 });
        }

        const moduleAccess = await validateModuleAccess(moduleId, user.role);
        if (!moduleAccess.ok) {
            return NextResponse.json({ success: false, error: moduleAccess.error }, { status: moduleAccess.status });
        }

        const latestSession = await getLatestChatSession(user.userId, moduleId);

        if (!latestSession) {
            return NextResponse.json({
                success: true,
                data: {
                    sessionId: null,
                    messages: [],
                },
            });
        }

        const messages = await getChatMessagesBySession(latestSession.id, 120);

        return NextResponse.json({
            success: true,
            data: {
                sessionId: latestSession.id,
                messages: messages.map((message) => ({
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    createdAt: message.createdAt,
                    model: message.model,
                })),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: toErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthorizedUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            return NextResponse.json({ success: false, error: 'OPENROUTER_API_KEY belum di-set' }, { status: 500 });
        }

        const body = await request.json() as ChatRequestBody;
        const moduleId = body.moduleId?.trim();
        const message = body.message?.trim();

        if (!moduleId) {
            return NextResponse.json({ success: false, error: 'moduleId wajib diisi' }, { status: 400 });
        }

        const moduleAccess = await validateModuleAccess(moduleId, user.role);
        if (!moduleAccess.ok) {
            return NextResponse.json({ success: false, error: moduleAccess.error }, { status: moduleAccess.status });
        }

        if (!message) {
            return NextResponse.json({ success: false, error: 'Pesan tidak boleh kosong' }, { status: 400 });
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({
                success: false,
                error: `Pesan terlalu panjang (maksimal ${MAX_MESSAGE_LENGTH} karakter)`,
            }, { status: 400 });
        }

        const session = await getOrCreateChatSession(user.userId, moduleId, body.sessionId);

        await appendChatMessage({
            sessionId: session.id,
            userId: user.userId,
            moduleId,
            role: 'user',
            content: message,
        });

        const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
        const memoryWindowMessages = getMemoryWindowSize();
        const openRouterUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        const appTitle = process.env.OPENROUTER_APP_NAME || 'Questly English Learning';
        const appReferer = process.env.OPENROUTER_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

        const allMessages = await getRecentMessagesForPrompt(session.id, 40);
        const recentMessages = allMessages.slice(-memoryWindowMessages);

        const promptMessages: OpenRouterChatMessage[] = [
            { role: 'system', content: buildTutorSystemPrompt(body.context) },
            ...recentMessages.map((chatMessage) => ({
                role: normalizeOpenRouterRole(chatMessage.role),
                content: chatMessage.content,
            })),
        ];

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
                stream: true,
                temperature: 0.5,
                user: user.userId,
                messages: promptMessages,
            }),
        });

        if (!upstream.ok) {
            const errorText = await upstream.text();
            return NextResponse.json({
                success: false,
                error: 'Gagal memproses request ke OpenRouter',
                details: errorText.slice(0, 600),
            }, { status: upstream.status });
        }

        if (!upstream.body) {
            return NextResponse.json({ success: false, error: 'OpenRouter tidak mengirim stream body' }, { status: 502 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                let assistantText = '';
                let parseBuffer = '';
                let usage: {
                    promptTokens?: number;
                    completionTokens?: number;
                    totalTokens?: number;
                    cost?: string;
                } = {};

                const emit = (event: string, payload: Record<string, unknown>) => {
                    controller.enqueue(encoder.encode(sseEncode(event, payload)));
                };

                const emitError = (message: string) => {
                    emit('error', { message });
                };

                try {
                    emit('meta', {
                        sessionId: session.id,
                        model,
                        memoryWindow: memoryWindowMessages,
                    });

                    const reader = upstream.body!.getReader();

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        parseBuffer += decoder.decode(value, { stream: true });
                        const lines = parseBuffer.split('\n');
                        parseBuffer = lines.pop() ?? '';

                        for (const rawLine of lines) {
                            const line = rawLine.trim();
                            if (!line || !line.startsWith('data:')) {
                                continue;
                            }

                            const payload = line.slice(5).trim();
                            if (!payload) {
                                continue;
                            }

                            if (payload === '[DONE]') {
                                emit('done', { ok: true });
                                continue;
                            }

                            let json: OpenRouterStreamChunk;
                            try {
                                json = JSON.parse(payload) as OpenRouterStreamChunk;
                            } catch {
                                continue;
                            }

                            const upstreamError = json?.error?.message;
                            if (upstreamError) {
                                throw new Error(String(upstreamError));
                            }

                            const deltaText = json?.choices?.[0]?.delta?.content;
                            if (typeof deltaText === 'string' && deltaText.length > 0) {
                                assistantText += deltaText;
                                emit('token', { text: deltaText });
                            }

                            const finishReason = json?.choices?.[0]?.finish_reason;
                            if (finishReason) {
                                emit('finish', { reason: finishReason });
                            }

                            if (json?.usage) {
                                usage = {
                                    promptTokens: json.usage.prompt_tokens,
                                    completionTokens: json.usage.completion_tokens,
                                    totalTokens: json.usage.total_tokens,
                                    cost: json.usage.cost !== undefined ? String(json.usage.cost) : undefined,
                                };
                            }
                        }
                    }

                    if (assistantText.trim().length > 0) {
                        await appendChatMessage({
                            sessionId: session.id,
                            userId: user.userId,
                            moduleId,
                            role: 'assistant',
                            content: assistantText,
                            model,
                            usage,
                        });
                    }

                    emit('complete', {
                        sessionId: session.id,
                        textLength: assistantText.length,
                    });

                    controller.close();
                } catch (error) {
                    if (assistantText.trim().length > 0) {
                        try {
                            await appendChatMessage({
                                sessionId: session.id,
                                userId: user.userId,
                                moduleId,
                                role: 'assistant',
                                content: assistantText,
                                model,
                                usage,
                            });
                        } catch {
                            // Ignore save failures on partial completion.
                        }
                    }

                    emitError(toErrorMessage(error));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: toErrorMessage(error) }, { status: 500 });
    }
}
