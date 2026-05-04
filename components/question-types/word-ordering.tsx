
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragStartEvent,
    useDroppable,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableWord } from './sortable-word';
import { cn } from '@/lib/utils';

interface WordOrderingProps {
    initialWords: string[];
    onOrderChange: (words: string[]) => void;
    disabled?: boolean;
}

// Helper Droppable Component
function DroppableContainer({
    id,
    items,
    children,
    className
}: {
    id: UniqueIdentifier;
    items: UniqueIdentifier[];
    children: React.ReactNode;
    className?: string;
}) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <SortableContext id={id as string} items={items} strategy={rectSortingStrategy}>
            <div ref={setNodeRef} className={className}>
                {children}
            </div>
        </SortableContext>
    );
}

export function WordOrdering({ initialWords, onOrderChange, disabled }: WordOrderingProps) {
    const [items, setItems] = useState<{
        bank: { id: string; word: string }[];
        answer: { id: string; word: string }[];
    }>({
        bank: [],
        answer: []
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const initialWordsKey = useMemo(() => JSON.stringify(initialWords), [initialWords]);
    const lastInitialWordsKeyRef = useRef<string | null>(null);
    const lastAnswerRef = useRef<string>('');

    useEffect(() => {
        if (lastInitialWordsKeyRef.current === initialWordsKey) {
            return;
        }

        lastInitialWordsKeyRef.current = initialWordsKey;
        setItems({
            bank: initialWords.map((word, index) => ({ id: `${word}-${index}`, word })),
            answer: []
        });
    }, [initialWords, initialWordsKey]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string) => {
        if (items.bank.find((item) => item.id === id)) return 'bank';
        if (items.answer.find((item) => item.id === id)) return 'answer';
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (disabled) return;
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (disabled) return;
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id as string);
        const overContainer = (overId === 'bank' || overId === 'answer')
            ? overId
            : findContainer(overId as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setItems((prev) => {
            const activeItems = prev[activeContainer as keyof typeof prev];
            const overItems = prev[overContainer as keyof typeof prev];
            const activeIndex = activeItems.findIndex((item) => item.id === active.id);
            const overIndex = (overId === 'bank' || overId === 'answer')
                ? overItems.length + 1
                : overItems.findIndex((item) => item.id === overId);

            let newIndex;
            if (overId === 'bank' || overId === 'answer') {
                newIndex = overItems.length;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer as keyof typeof prev].filter((item) => item.id !== active.id)
                ],
                [overContainer]: [
                    ...prev[overContainer as keyof typeof prev].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer as keyof typeof prev].slice(newIndex, prev[overContainer as keyof typeof prev].length)
                ]
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (disabled) return;
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = over ? ((over.id === 'bank' || over.id === 'answer') ? over.id : findContainer(over.id as string)) : null;

        if (
            activeContainer &&
            overContainer &&
            activeContainer === overContainer &&
            over
        ) {
            const activeIndex = items[activeContainer as keyof typeof items].findIndex((item) => item.id === active.id);
            const overIndex = items[overContainer as keyof typeof items].findIndex((item) => item.id === over.id);

            if (activeIndex !== overIndex) {
                setItems((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer as keyof typeof prev], activeIndex, overIndex)
                }));
            }
        }

        setActiveId(null);
    };

    useEffect(() => {
        const answerText = items.answer.map(i => i.word).join(' ');
        if (lastAnswerRef.current === answerText) {
            return;
        }

        lastAnswerRef.current = answerText;
        onOrderChange(items.answer.map(i => i.word));
    }, [items.answer, onOrderChange]);

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    const activeItem = activeId ? (items.bank.find(i => i.id === activeId) || items.answer.find(i => i.id === activeId)) : null;


    // Memoize ids to prevent infinite re-renders in SortableContext
    const answerIds = useMemo(() => items.answer.map(i => i.id), [items.answer]);
    const bankIds = useMemo(() => items.bank.map(i => i.id), [items.bank]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6">
                {/* Answer Zone */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Jawaban Anda
                    </label>
                    <DroppableContainer
                        id="answer"
                        items={answerIds}
                        className={cn(
                            "min-h-[80px] rounded-2xl border-2 border-slate-200 p-2 flex flex-wrap gap-2 transition-colors justify-center",
                            items.answer.length === 0 ? "bg-slate-50 border-dashed" : "bg-white border-solid border-b-4"
                        )}
                    >
                        {items.answer.map((item) => (
                            <SortableWord key={item.id} id={item.id} word={item.word} disabled={disabled} />
                        ))}
                        {items.answer.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                                Tarik kata ke sini
                            </div>
                        )}
                    </DroppableContainer>
                </div>

                {/* Bank Zone */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                        Pilihan Kata
                    </label>
                    <DroppableContainer
                        id="bank"
                        items={bankIds}
                        className="min-h-[100px] bg-slate-100 p-4 rounded-2xl flex flex-wrap gap-2 justify-center"
                    >
                        {items.bank.map((item) => (
                            <SortableWord key={item.id} id={item.id} word={item.word} disabled={disabled} />
                        ))}
                    </DroppableContainer>
                </div>
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeItem ? <SortableWord id={activeItem.id} word={activeItem.word} isOverlay /> : null}
            </DragOverlay>

        </DndContext>
    );
}

