'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Heart, Zap, CheckCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WordOrdering } from '@/components/question-types/word-ordering';
import { MultipleChoice } from '@/components/question-types/multiple-choice';
import { ImageSelect } from '@/components/question-types/image-select';
import { LongTextAnswer } from '@/components/question-types/long-text-answer';
import { SpeakButton } from '@/components/ui/speak-button';
import { VoiceInputButton } from '@/components/ui/voice-input-button';
import { ModuleChatbot } from '@/components/modules/module-chatbot';
import {
    saveUserProgress,
    saveItemResponse,
    updateModuleProgress,
} from '@/lib/actions/user-progress';
import type { Module, ModuleItem } from '@/lib/actions/modules';

interface ModulePlayerProps {
    module: Module & { items: ModuleItem[] };
    userId: string;
    initialProgress: any;
}

export function ModulePlayer({ module, userId, initialProgress }: ModulePlayerProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(initialProgress?.currentItemIndex ?? 0);
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [userAnswer, setUserAnswer] = useState<any>(null);
    const [hearts, setHearts] = useState(5);
    const [xp, setXp] = useState(0);

    const items = module.items;
    const currentItem = items[currentIndex];
    const totalItems = items.length;
    const progress = ((currentIndex + 1) / totalItems) * 100;

    const contentTypes = ['header', 'material', 'material_image', 'material_video'];
    const openEndedTypes = ['long_text', 'long_text_image'];

    // Save progress periodically
    useEffect(() => {
        const timer = setTimeout(() => {
            saveUserProgress(userId, { heartCount: hearts, xp });
            updateModuleProgress(userId, module.id, {
                currentItemIndex: currentIndex,
                status: currentIndex >= items.length - 1 ? 'completed' : 'in_progress',
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [currentIndex, hearts, xp, userId, module.id, items.length]);

    const handleNext = async () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setStatus('idle');
            setUserAnswer(null);
        } else {
            // Finish
            await updateModuleProgress(userId, module.id, {
                currentItemIndex: currentIndex,
                status: 'completed'
            });
            toast.success('🎉 Modul selesai!', {
                description: `Kamu mendapat ${xp} XP`,
            });
            router.push('/');
        }
    };

    const handleCheck = async () => {
        if (!currentItem) return;

        // Content types that don't need answer checking
        if (contentTypes.includes(currentItem.type)) {
            handleNext();
            return;
        }

        const normalizedAnswer = typeof userAnswer === 'string' ? userAnswer.trim() : userAnswer;
        const hasAnswer = typeof normalizedAnswer === 'string'
            ? normalizedAnswer.length > 0
            : Boolean(normalizedAnswer);
        const isOpenEnded = openEndedTypes.includes(currentItem.type);

        if (status === 'idle') {
            if (!hasAnswer) return;

            const isCorrect = isOpenEnded
                ? true
                : String(normalizedAnswer).toLowerCase() === currentItem.correctAnswer?.toLowerCase();

            if (isCorrect) {
                setStatus('correct');
                setXp(xp + (currentItem.xpReward || 10));
                toast.success('Benar! 🎉', { duration: 2000 });
            } else {
                setStatus('wrong');
                setHearts(Math.max(0, hearts - 1));
                toast.error('Salah', {
                    description: 'Semangat! Coba lagi.',
                    duration: 2000,
                });
            }

            // Save response and force progress update if correct
            try {
                const result = await saveItemResponse(
                    userId,
                    module.id,
                    currentItem.id,
                    String(userAnswer ?? ''),
                    isCorrect
                );
                if (!result.success) {
                    console.error('Failed to save response:', result.error);
                }
                if (isCorrect) {
                    await updateModuleProgress(userId, module.id, {
                        currentItemIndex: currentIndex,
                        status: 'in_progress'
                    });
                }
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        } else {
            handleNext();
        }
    };

    const handleOrderChange = useCallback((words: string[]) => {
        setUserAnswer(words.join(' '));
    }, []);

    const handleRetry = () => {
        setStatus('idle');
        setUserAnswer(null);
    };

    if (!currentItem) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-elegant">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    const isContentType = contentTypes.includes(currentItem.type);
    const isOpenEndedType = openEndedTypes.includes(currentItem.type);
    const hasAnswer = typeof userAnswer === 'string'
        ? userAnswer.trim().length > 0
        : Boolean(userAnswer);

    return (
        <div className="min-h-screen bg-gradient-elegant flex flex-col">
            {/* Top Bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-muted rounded-xl transition-elegant"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </Link>

                    {/* Progress Bar */}
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-success transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Hearts */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full">
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        <span className="font-bold text-red-600 text-sm">{hearts}</span>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-amber-600 text-sm">{xp}</span>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
                {/* Header Type */}
                {currentItem.type === 'header' && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant-lg">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <h1 className="text-3xl font-bold text-foreground">
                                    {currentItem.title}
                                </h1>
                                <SpeakButton text={currentItem.title || ''} size="lg" />
                            </div>
                            <p className="text-muted-foreground">
                                Tekan lanjutkan untuk mulai
                            </p>
                        </div>
                    </div>
                )}

                {/* Material Type */}
                {currentItem.type === 'material' && (
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-foreground">
                                {currentItem.title}
                            </h2>
                            <SpeakButton text={currentItem.title || ''} />
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-elegant border border-border">
                            <div>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0" {...props} />,
                                        h2: ({ node, ...props }: any) => <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0" {...props} />,
                                        h3: ({ node, ...props }: any) => <h3 className="text-lg font-medium text-foreground mb-2 mt-4" {...props} />,
                                        p: ({ node, ...props }: any) => <p className="text-base text-slate-700 mb-4 leading-relaxed" {...props} />,
                                        ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-4 space-y-1 text-slate-700" {...props} />,
                                        ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-4 space-y-1 text-slate-700" {...props} />,
                                        li: ({ node, ...props }: any) => <li className="pl-1" {...props} />,
                                        blockquote: ({ node, ...props }: any) => (
                                            <blockquote className="border-l-4 border-primary/30 pl-4 py-1 my-4 bg-slate-50 italic text-slate-600 rounded-r" {...props} />
                                        ),
                                        a: ({ node, ...props }: any) => (
                                            <a className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />
                                        ),
                                        code: ({ node, className, children, ...props }: any) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            const isInline = !match && !String(children).includes('\n');
                                            return isInline ? (
                                                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className="block bg-slate-900 text-slate-50 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 shadow-sm" {...props}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        img: ({ node, ...props }: any) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img className="rounded-xl border border-border shadow-sm my-4 max-w-full h-auto" {...props} alt={props.alt || ''} />
                                        ),
                                        table: ({ node, ...props }: any) => <div className="overflow-x-auto my-6 rounded-lg border border-border"><table className="w-full text-sm text-left" {...props} /></div>,
                                        thead: ({ node, ...props }: any) => <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold" {...props} />,
                                        tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-border" {...props} />,
                                        tr: ({ node, ...props }: any) => <tr className="bg-white hover:bg-slate-50 transition-colors" {...props} />,
                                        th: ({ node, ...props }: any) => <th className="px-6 py-3 whitespace-nowrap" {...props} />,
                                        td: ({ node, ...props }: any) => <td className="px-6 py-4" {...props} />,
                                    }}
                                >
                                    {currentItem.content || ''}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* Material Image Type */}
                {
                    currentItem.type === 'material_image' && (
                        <div className="flex-1">
                            {currentItem.title && (
                                <div className="flex items-center gap-2 mb-6">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {currentItem.title}
                                    </h2>
                                    <SpeakButton text={currentItem.title} />
                                </div>
                            )}
                            <div className="bg-white rounded-2xl shadow-elegant border border-border overflow-hidden">
                                {currentItem.content && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={currentItem.content}
                                        alt={currentItem.title || 'Material'}
                                        className="w-full h-auto"
                                    />
                                )}
                            </div>
                            {currentItem.caption && (
                                <div className="mt-4 text-sm text-slate-600">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" {...props} />
                                        }}
                                    >
                                        {currentItem.caption}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* Material Video Type */}
                {
                    currentItem.type === 'material_video' && (() => {
                        const content = currentItem.content || '';
                        // Extract YouTube ID
                        const ytMatch = content.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
                        const youtubeId = ytMatch ? ytMatch[1] : null;
                        // Extract Vimeo ID
                        const vimeoMatch = content.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                        const vimeoId = vimeoMatch ? vimeoMatch[1] : null;
                        // Check if direct video
                        const isDirectVideo = content.match(/\.(mp4|webm|ogg)/i);

                        return (
                            <div className="flex-1">
                                {currentItem.title && (
                                    <div className="flex items-center gap-2 mb-6">
                                        <h2 className="text-2xl font-bold text-foreground">
                                            {currentItem.title}
                                        </h2>
                                        <SpeakButton text={currentItem.title} />
                                    </div>
                                )}
                                <div className="bg-black rounded-2xl shadow-elegant overflow-hidden">
                                    {youtubeId && (
                                        <div className="aspect-video">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                    {vimeoId && (
                                        <div className="aspect-video">
                                            <iframe
                                                src={`https://player.vimeo.com/video/${vimeoId}`}
                                                className="w-full h-full"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                    {isDirectVideo && (
                                        <video
                                            src={content}
                                            controls
                                            className="w-full h-auto"
                                        />
                                    )}
                                    {!youtubeId && !vimeoId && !isDirectVideo && content && (
                                        <div className="aspect-video flex items-center justify-center text-white/50">
                                            <p>Unsupported video format</p>
                                        </div>
                                    )}
                                </div>
                                {currentItem.caption && (
                                    <div className="mt-4 text-sm text-slate-600">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" {...props} />
                                            }}
                                        >
                                            {currentItem.caption}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                }

                {/* Question Types */}
                {
                    !['header', 'material', 'material_image', 'material_video'].includes(currentItem.type) && (
                        <div className="flex-1 space-y-8">
                            <div className="text-center">
                                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                                    Pertanyaan {currentIndex + 1} dari {totalItems}
                                </span>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="text-2xl font-bold text-foreground">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }: any) => <div {...props} />,
                                                strong: ({ node, ...props }: any) => <span className="text-primary" {...props} />
                                            }}
                                        >
                                            {currentItem.question || ''}
                                        </ReactMarkdown>
                                    </div>
                                    <SpeakButton text={currentItem.question || ''} size="lg" />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-elegant border border-border">
                                {currentItem.type === 'arrange_words' && (
                                    <WordOrdering
                                        key={currentItem.id}
                                        initialWords={Array.isArray(currentItem.options) ? currentItem.options : []}
                                        onOrderChange={handleOrderChange}
                                        disabled={status !== 'idle'}
                                    />
                                )}

                                {currentItem.type === 'multiple_choice' && (
                                    <MultipleChoice
                                        key={currentItem.id}
                                        options={Array.isArray(currentItem.options) ? currentItem.options : []}
                                        selectedOptionId={userAnswer}
                                        onSelect={(id) => setUserAnswer(id)}
                                        disabled={status !== 'idle'}
                                    />
                                )}

                                {currentItem.type === 'select_image' && (
                                    <ImageSelect
                                        key={currentItem.id}
                                        options={Array.isArray(currentItem.options) ? currentItem.options : []}
                                        selectedOptionId={userAnswer}
                                        onSelect={(id) => setUserAnswer(id)}
                                        disabled={status !== 'idle'}
                                    />
                                )}

                                {/* MC Image - same as select_image UI */}
                                {currentItem.type === 'mc_image' && (
                                    <ImageSelect
                                        key={currentItem.id}
                                        options={Array.isArray(currentItem.options) ? currentItem.options : []}
                                        selectedOptionId={userAnswer}
                                        onSelect={(id) => setUserAnswer(id)}
                                        disabled={status !== 'idle'}
                                    />
                                )}

                                {/* Question Image - show image then options */}
                                {currentItem.type === 'question_image' && (
                                    <div className="space-y-4">
                                        {currentItem.content && (
                                            <div className="rounded-xl overflow-hidden border border-border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentItem.content}
                                                    alt="Question"
                                                    className="w-full h-auto max-h-64 object-contain bg-slate-100"
                                                />
                                            </div>
                                        )}
                                        <MultipleChoice
                                            key={currentItem.id}
                                            options={Array.isArray(currentItem.options) ? currentItem.options : []}
                                            selectedOptionId={userAnswer}
                                            onSelect={(id) => setUserAnswer(id)}
                                            disabled={status !== 'idle'}
                                        />
                                    </div>
                                )}

                                {/* Question Video - show video then options */}
                                {currentItem.type === 'question_video' && (
                                    <div className="space-y-4">
                                        {currentItem.content && (
                                            <div className="rounded-xl overflow-hidden bg-black">
                                                <video
                                                    src={currentItem.content}
                                                    controls
                                                    className="w-full h-auto max-h-64"
                                                />
                                            </div>
                                        )}
                                        <MultipleChoice
                                            key={currentItem.id}
                                            options={Array.isArray(currentItem.options) ? currentItem.options : []}
                                            selectedOptionId={userAnswer}
                                            onSelect={(id) => setUserAnswer(id)}
                                            disabled={status !== 'idle'}
                                        />
                                    </div>
                                )}

                                {/* Long Text - essay answer */}
                                {currentItem.type === 'long_text' && (
                                    <LongTextAnswer
                                        value={typeof userAnswer === 'string' ? userAnswer : ''}
                                        onChange={(value) => setUserAnswer(value)}
                                        disabled={status !== 'idle'}
                                    />
                                )}

                                {/* Long Text with Image */}
                                {currentItem.type === 'long_text_image' && (
                                    <div className="space-y-4">
                                        {currentItem.content && (
                                            <div className="rounded-xl overflow-hidden border border-border bg-slate-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={currentItem.content}
                                                    alt="Question"
                                                    className="w-full h-auto max-h-64 object-contain"
                                                />
                                            </div>
                                        )}
                                        <LongTextAnswer
                                            value={typeof userAnswer === 'string' ? userAnswer : ''}
                                            onChange={(value) => setUserAnswer(value)}
                                            disabled={status !== 'idle'}
                                        />
                                    </div>
                                )}

                                {/* Voice Answer */}
                                {currentItem.type === 'voice_answer' && (
                                    <div className="space-y-4">
                                        {/* Hint */}
                                        {currentItem.content && (
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                <p className="text-sm text-blue-700">
                                                    <span className="font-medium">Hint:</span> {currentItem.content}
                                                </p>
                                            </div>
                                        )}

                                        {/* Voice Input Area */}
                                        <div className="flex flex-col items-center gap-4 py-6">
                                            <VoiceInputButton
                                                onTranscript={(text) => setUserAnswer(text)}
                                                size="lg"
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Klik mikrofon dan ucapkan jawabanmu
                                            </p>

                                            {/* Current Answer Display */}
                                            {userAnswer && (
                                                <div className="w-full p-4 bg-slate-100 rounded-xl">
                                                    <p className="text-sm text-muted-foreground mb-1">Jawabanmu:</p>
                                                    <p className="text-lg font-medium text-foreground">{userAnswer}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </main >

            {/* Footer */}
            < footer className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-border px-4 py-4" >
                <div className="max-w-2xl mx-auto">
                    {/* Feedback Messages */}
                    {status === 'correct' && (
                        <div className="flex items-center gap-3 mb-4 p-4 bg-green-50 rounded-2xl border border-green-200">
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-green-700">Benar!</p>
                                <p className="text-sm text-green-600">+{currentItem.xpReward || 10} XP</p>
                            </div>
                        </div>
                    )}

                    {status === 'wrong' && (
                        <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 rounded-2xl border border-red-200">
                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                                <X className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-red-700">Salah</p>
                                <p className="text-sm text-red-600">Coba lagi!</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {status === 'wrong' ? (
                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 py-4 rounded-2xl font-bold text-lg border-2 border-primary text-primary hover:bg-primary/10 transition-elegant"
                            >
                                Coba Lagi
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 py-4 rounded-2xl font-bold text-lg bg-slate-500 hover:bg-slate-600 text-white transition-elegant flex items-center justify-center gap-2"
                            >
                                <span>Lanjutkan</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleCheck}
                            disabled={hearts === 0 || (status === 'idle' && !hasAnswer && !isContentType)}
                            className={`
                                w-full py-4 rounded-2xl font-bold text-lg
                                flex items-center justify-center gap-2
                                transition-elegant disabled:opacity-50 disabled:cursor-not-allowed
                                ${status === 'correct'
                                    ? 'bg-gradient-success text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gradient-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                                }
                            `}
                        >
                            <span>
                                {status === 'idle'
                                    ? isContentType
                                        ? 'Lanjutkan'
                                        : isOpenEndedType
                                            ? 'Kirim Jawaban'
                                            : 'Periksa Jawaban'
                                    : 'Lanjutkan'
                                }
                            </span>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </footer >
            <ModuleChatbot
                moduleId={module.id}
                moduleTitle={module.title}
                moduleDescription={module.description}
                currentItemType={currentItem.type}
                currentTitle={currentItem.title}
                currentQuestion={currentItem.question}
                currentIndex={currentIndex}
                totalItems={totalItems}
            />
        </div >
    );
}
