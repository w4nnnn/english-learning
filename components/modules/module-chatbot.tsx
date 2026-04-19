'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, SendHorizonal, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    createdAt?: string;
    pending?: boolean;
}

interface ModuleChatbotProps {
    moduleId: string;
    moduleTitle: string;
    moduleDescription?: string | null;
    currentItemType?: string;
    currentTitle?: string | null;
    currentQuestion?: string | null;
    currentIndex: number;
    totalItems: number;
}

interface ChatApiResponse {
    success: boolean;
    error?: string;
    data?: {
        sessionId: string | null;
        messages: ChatMessage[];
    };
}

function parseSseEventBlock(block: string) {
    const lines = block.split('\n');
    let event = 'message';
    let dataText = '';

    for (const line of lines) {
        if (line.startsWith('event:')) {
            event = line.slice(6).trim();
            continue;
        }

        if (line.startsWith('data:')) {
            dataText += line.slice(5).trim();
        }
    }

    if (!dataText) {
        return null;
    }

    try {
        return {
            event,
            data: JSON.parse(dataText) as Record<string, unknown>,
        };
    } catch {
        return null;
    }
}

function createLocalMessageId(prefix: 'user' | 'assistant') {
    return `local-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ModuleChatbot({
    moduleId,
    moduleTitle,
    moduleDescription,
    currentItemType,
    currentTitle,
    currentQuestion,
    currentIndex,
    totalItems,
}: ModuleChatbotProps) {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const chatContext = useMemo(() => ({
        moduleTitle,
        moduleDescription,
        currentItemType,
        currentTitle,
        currentQuestion,
        currentIndex,
        totalItems,
    }), [
        moduleTitle,
        moduleDescription,
        currentItemType,
        currentTitle,
        currentQuestion,
        currentIndex,
        totalItems,
    ]);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    const loadHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        setStreamError(null);

        try {
            const response = await fetch(`/api/chat?moduleId=${encodeURIComponent(moduleId)}`, {
                method: 'GET',
                cache: 'no-store',
            });

            const payload = await response.json() as ChatApiResponse;
            if (!response.ok || !payload.success || !payload.data) {
                throw new Error(payload.error || 'Gagal memuat riwayat chat');
            }

            setSessionId(payload.data.sessionId);
            setMessages(payload.data.messages ?? []);
        } catch (error) {
            setStreamError(error instanceof Error ? error.message : 'Gagal memuat riwayat chat');
        } finally {
            setIsLoadingHistory(false);
            setIsInitialized(true);
        }
    }, [moduleId]);

    const refreshHistory = useCallback(async () => {
        try {
            const response = await fetch(`/api/chat?moduleId=${encodeURIComponent(moduleId)}`, {
                method: 'GET',
                cache: 'no-store',
            });

            const payload = await response.json() as ChatApiResponse;
            if (response.ok && payload.success && payload.data) {
                setSessionId(payload.data.sessionId);
                setMessages(payload.data.messages ?? []);
            }
        } catch {
            // Ignore refresh error; optimistic state remains visible.
        }
    }, [moduleId]);

    const handleSend = useCallback(async () => {
        const userMessage = inputText.trim();
        if (!userMessage || isStreaming) {
            return;
        }

        const userLocalId = createLocalMessageId('user');
        const assistantLocalId = createLocalMessageId('assistant');

        setInputText('');
        setStreamError(null);
        setIsStreaming(true);

        setMessages((prev) => ([
            ...prev,
            {
                id: userLocalId,
                role: 'user',
                content: userMessage,
                createdAt: new Date().toISOString(),
            },
            {
                id: assistantLocalId,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
                pending: true,
            },
        ]));

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moduleId,
                    sessionId,
                    message: userMessage,
                    context: chatContext,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error || 'Gagal mengirim pesan ke chatbot');
            }

            if (!response.body) {
                throw new Error('Stream tidak tersedia dari server');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let sseBuffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });
                const blocks = sseBuffer.split('\n\n');
                sseBuffer = blocks.pop() ?? '';

                for (const block of blocks) {
                    const parsed = parseSseEventBlock(block);
                    if (!parsed) continue;

                    if (parsed.event === 'meta') {
                        const incomingSessionId = parsed.data.sessionId;
                        if (typeof incomingSessionId === 'string' && incomingSessionId.length > 0) {
                            setSessionId(incomingSessionId);
                        }
                    }

                    if (parsed.event === 'token') {
                        const token = parsed.data.text;
                        if (typeof token === 'string') {
                            setMessages((prev) => prev.map((message) => {
                                if (message.id !== assistantLocalId) return message;
                                return {
                                    ...message,
                                    content: `${message.content}${token}`,
                                };
                            }));
                        }
                    }

                    if (parsed.event === 'error') {
                        const message = parsed.data.message;
                        if (typeof message === 'string' && message.length > 0) {
                            setStreamError(message);
                        }
                    }
                }
            }

            setMessages((prev) => prev
                .map((message) => (message.id === assistantLocalId ? { ...message, pending: false } : message))
                .filter((message) => !(message.id === assistantLocalId && !message.content.trim())));

            await refreshHistory();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Gagal berkomunikasi dengan chatbot';
            setStreamError(message);

            setMessages((prev) => prev
                .map((item) => (item.id === assistantLocalId ? {
                    ...item,
                    pending: false,
                    content: item.content.trim().length > 0 ? item.content : 'Maaf, respons gagal diproses. Coba kirim ulang pertanyaan kamu.',
                } : item)));
        } finally {
            setIsStreaming(false);
        }
    }, [chatContext, inputText, isStreaming, moduleId, refreshHistory, sessionId]);

    useEffect(() => {
        if (!open || isInitialized) {
            return;
        }

        void loadHistory();
    }, [isInitialized, loadHistory, open]);

    useEffect(() => {
        setIsInitialized(false);
        setSessionId(null);
        setMessages([]);
        setInputText('');
        setStreamError(null);
    }, [moduleId]);

    useEffect(() => {
        if (!open) return;
        scrollToBottom();
    }, [messages, open, scrollToBottom]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    type="button"
                    className="fixed right-4 bottom-24 z-40 h-12 w-12 rounded-full shadow-elegant-lg sm:right-6"
                    size="icon"
                    aria-label="Buka chatbot pembelajaran"
                >
                    <MessageCircle className="h-5 w-5" />
                </Button>
            </SheetTrigger>

            <SheetContent
                side={isMobile ? 'bottom' : 'right'}
                className={isMobile ? 'h-[78dvh] rounded-t-2xl p-0' : 'w-full p-0 sm:max-w-md'}
            >
                <SheetHeader className="border-b border-border pb-3">
                    <SheetTitle className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        Chatbot Tutor
                    </SheetTitle>
                    <SheetDescription>
                        Tanya materi modul ini dan dapatkan penjelasan bertahap.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex h-full min-h-0 flex-col">
                    <ScrollArea className="min-h-0 flex-1 px-4 py-4" role="log" aria-live="polite">
                        {isLoadingHistory ? (
                            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                                <Spinner className="mr-2" />
                                Memuat riwayat chat...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                                Belum ada percakapan. Coba tanya hal yang kamu belum paham dari modul ini.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => {
                                    const isUser = message.role === 'user';

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isUser && (
                                                <Avatar className="h-7 w-7 border border-border">
                                                    <AvatarFallback className="bg-primary/10 text-primary">
                                                        <Bot className="h-3.5 w-3.5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}

                                            <div
                                                className={[
                                                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm',
                                                    isUser
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-foreground',
                                                ].join(' ')}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                                {message.pending && (
                                                    <div className="mt-2 flex items-center text-xs opacity-80">
                                                        <Spinner className="mr-1 h-3 w-3" />
                                                        Mengetik...
                                                    </div>
                                                )}
                                            </div>

                                            {isUser && (
                                                <Avatar className="h-7 w-7 border border-border">
                                                    <AvatarFallback className="bg-accent text-accent-foreground">
                                                        <User className="h-3.5 w-3.5" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </ScrollArea>

                    <div className="border-t border-border p-4">
                        {streamError && (
                            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {streamError}
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <Textarea
                                value={inputText}
                                onChange={(event) => setInputText(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder="Contoh: Tolong jelaskan kenapa jawaban saya tadi salah"
                                className="min-h-[72px] resize-none"
                                maxLength={2000}
                                disabled={isStreaming}
                            />
                            <Button
                                type="button"
                                size="icon"
                                className="h-10 w-10 shrink-0 rounded-full"
                                onClick={() => void handleSend()}
                                disabled={isStreaming || !inputText.trim()}
                                aria-label="Kirim pesan"
                            >
                                {isStreaming ? <Spinner className="h-4 w-4" /> : <SendHorizonal className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Enter untuk kirim, Shift+Enter untuk baris baru.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
