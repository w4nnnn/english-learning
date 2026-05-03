'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createModuleItem, updateModule, updateModuleItem, deleteModuleItem, reorderModuleItems } from '@/lib/actions/modules';
import type { Module, ModuleItem } from '@/lib/actions/modules';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
    Plus,
    GripVertical,
    Trash2,
    FileText,
    Save,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    MessageCircleQuestion,
    Star,
} from 'lucide-react';
import { getModuleIcon, resolveModuleIconKey, type ModuleIconKey } from '@/lib/module-icons';
import ReactMarkdown from 'react-markdown';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import item type components
import { ITEM_TYPES, getItemTypeConfig } from './item-types';
import { HeaderEditor } from './item-types/header-editor';
import { MaterialEditor, MaterialImageEditor, MaterialVideoEditor } from './item-types/material-editor';
import { MultipleChoiceEditor } from './item-types/multiple-choice-editor';
import { ArrangeWordsEditor } from './item-types/arrange-words-editor';
import { SelectImageEditor } from './item-types/select-image-editor';
import { McImageEditor } from './item-types/mc-image-editor';
import { QuestionImageEditor, QuestionVideoEditor } from './item-types/question-media-editor';
import { VoiceAnswerEditor } from './item-types/voice-answer-editor';
import { LongTextEditor, LongTextImageEditor } from './item-types/long-text-editor';
import { ModuleIconPicker } from '@/components/admin/modules/module-icon-picker';

interface ModuleEditorProps {
    module: Module & { items: ModuleItem[] };
}

const AUTOSAVE_DELAY_MS = 1200;

// Sortable Item Wrapper Component
function SortableModuleItem({
    item,
    isExpanded,
    onToggleExpand,
    onDelete,
    onUpdate,
    children,
}: {
    item: ModuleItem;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onDelete: () => void;
    onUpdate: (data: Partial<ModuleItem>) => void;
    children: React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    const typeConfig = getItemTypeConfig(item.type);
    const Icon = typeConfig?.icon || FileText;

    return (
        <div
            ref={setNodeRef}
            style={style as React.CSSProperties}
            className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${isExpanded ? 'border-blue-300' : 'border-slate-200'} ${isDragging ? 'shadow-xl' : ''}`}
        >
            {/* Item Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={onToggleExpand}
            >
                {/* Drag Handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing touch-none"
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4 text-slate-400" />
                </button>

                <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-slate-100'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <span>{children}</span>,
                                strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                            }}
                        >
                            {item.title || item.question || `${typeConfig?.label} Item`}
                        </ReactMarkdown>
                    </div>
                    <p className="text-xs text-slate-500">{typeConfig?.label}</p>
                </div>
                <div className="flex items-center gap-1">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                    </div>
                                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                </div>
                                <AlertDialogDescription className="pt-2">
                                    Are you sure you want to delete this item? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={onDelete}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <div className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Item Editor */}
            {isExpanded && (
                <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
                    {children}
                </div>
            )}
        </div>
    );
}

// Drag Overlay Item (shown while dragging)
function DragOverlayItem({ item }: { item: ModuleItem }) {
    const typeConfig = getItemTypeConfig(item.type);
    const Icon = typeConfig?.icon || FileText;

    return (
        <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-400 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-slate-100'}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <span>{children}</span>,
                                strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                            }}
                        >
                            {item.title || item.question || `${typeConfig?.label} Item`}
                        </ReactMarkdown>
                    </div>
                    <p className="text-xs text-slate-500">{typeConfig?.label}</p>
                </div>
            </div>
        </div>
    );
}

export function ModuleEditor({ module }: ModuleEditorProps) {
    const [isPending, startTransition] = useTransition();
    const [items, setItems] = useState(module.items);
    const initialModuleIconKey = resolveModuleIconKey(module.iconKey);
    const [moduleInfo, setModuleInfo] = useState<{
        title: string;
        description: string;
        iconKey: ModuleIconKey;
    }>({
        title: module.title,
        description: module.description || '',
        iconKey: initialModuleIconKey,
    });
    const moduleInfoAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const moduleInfoInitializedRef = useRef(false);
    const lastSavedModuleInfoRef = useRef({
        title: module.title,
        description: module.description || '',
        iconKey: initialModuleIconKey,
    });
    const itemUpdateTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});
    const pendingItemUpdatesRef = useRef<Record<string, Partial<ModuleItem>>>({});
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [showPublishDialog, setShowPublishDialog] = useState(false);
    const SelectedIcon = getModuleIcon(moduleInfo.iconKey);

    useEffect(() => {
        if (!moduleInfoInitializedRef.current) {
            moduleInfoInitializedRef.current = true;
            return;
        }

        const lastSaved = lastSavedModuleInfoRef.current;
        const isUnchanged =
            moduleInfo.title === lastSaved.title &&
            moduleInfo.description === lastSaved.description &&
            moduleInfo.iconKey === lastSaved.iconKey;

        if (isUnchanged) {
            return;
        }

        if (moduleInfoAutosaveTimerRef.current) {
            clearTimeout(moduleInfoAutosaveTimerRef.current);
        }

        moduleInfoAutosaveTimerRef.current = setTimeout(() => {
            const payload = {
                title: moduleInfo.title,
                description: moduleInfo.description || undefined,
                iconKey: moduleInfo.iconKey,
            };

            void updateModule(module.id, payload)
                .then(() => {
                    lastSavedModuleInfoRef.current = {
                        title: moduleInfo.title,
                        description: moduleInfo.description || '',
                        iconKey: moduleInfo.iconKey,
                    };
                })
                .catch((error) => {
                    console.error('Module autosave failed:', error);
                });
        }, AUTOSAVE_DELAY_MS);

        return () => {
            if (moduleInfoAutosaveTimerRef.current) {
                clearTimeout(moduleInfoAutosaveTimerRef.current);
            }
        };
    }, [module.id, moduleInfo.description, moduleInfo.iconKey, moduleInfo.title, updateModule]);

    useEffect(() => {
        return () => {
            Object.values(itemUpdateTimersRef.current).forEach((timer) => {
                if (timer) {
                    clearTimeout(timer);
                }
            });

            Object.entries(pendingItemUpdatesRef.current).forEach(([itemId, data]) => {
                if (Object.keys(data).length > 0) {
                    void updateModuleItem(itemId, data);
                }
            });
        };
    }, [updateModuleItem]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const toggleExpand = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const handleSaveClick = () => {
        setShowPublishDialog(true);
    };

    const handleSaveModule = (shouldPublish: boolean) => {
        if (moduleInfoAutosaveTimerRef.current) {
            clearTimeout(moduleInfoAutosaveTimerRef.current);
        }

        startTransition(async () => {
            await updateModule(module.id, {
                title: moduleInfo.title,
                description: moduleInfo.description || undefined,
                iconKey: moduleInfo.iconKey,
                isPublished: shouldPublish,
            });
            lastSavedModuleInfoRef.current = {
                title: moduleInfo.title,
                description: moduleInfo.description || '',
                iconKey: moduleInfo.iconKey,
            };
            setShowPublishDialog(false);
            toast.success(shouldPublish ? 'Module saved & published!' : 'Module saved as draft!');
        });
    };

    const handleAddItem = (type: string) => {
        setShowAddMenu(false);
        startTransition(async () => {
            const defaultOptions = type === 'multiple_choice' || type === 'question_image' || type === 'question_video'
                ? [{ id: 'a', label: 'Option A', isCorrect: true }, { id: 'b', label: 'Option B', isCorrect: false }]
                : type === 'arrange_words'
                    ? ['word1', 'word2', 'word3']
                    : type === 'mc_image' || type === 'select_image'
                        ? []
                        : null;

            const result = await createModuleItem({
                moduleId: module.id,
                type,
                title: type === 'header' ? 'New Section' : undefined,
                question: !['header', 'material', 'material_image', 'material_video'].includes(type) ? 'Enter your question here...' : undefined,
                content: type === 'material' ? '# Enter your content here\n\nStart writing...' : undefined,
                options: defaultOptions,
                correctAnswer: type === 'multiple_choice' || type === 'question_image' || type === 'question_video'
                    ? 'a'
                    : type === 'arrange_words'
                        ? 'word1 word2 word3'
                        : undefined,
            });

            setItems([...items, {
                id: result.id,
                moduleId: module.id,
                type,
                order: items.length + 1,
                title: type === 'header' ? 'New Section' : null,
                content: type === 'material' ? '# Enter your content here\n\nStart writing...' : null,
                caption: null,
                question: !['header', 'material', 'material_image', 'material_video'].includes(type) ? 'Enter your question here...' : null,
                correctAnswer: type === 'multiple_choice' || type === 'question_image' || type === 'question_video'
                    ? 'a'
                    : type === 'arrange_words'
                        ? 'word1 word2 word3'
                        : null,
                options: defaultOptions,
                xpReward: 10,
                isRequired: true,
                createdAt: new Date(),
            }]);
            setExpandedItems(new Set([...expandedItems, result.id]));
            toast.success('Item added!');
        });
    };

    const handleUpdateItem = (itemId: string, data: Partial<ModuleItem>) => {
        setItems((prevItems) => prevItems.map(item =>
            item.id === itemId ? { ...item, ...data } : item
        ));

        pendingItemUpdatesRef.current[itemId] = {
            ...(pendingItemUpdatesRef.current[itemId] || {}),
            ...data,
        };

        if (itemUpdateTimersRef.current[itemId]) {
            clearTimeout(itemUpdateTimersRef.current[itemId]);
        }

        itemUpdateTimersRef.current[itemId] = setTimeout(() => {
            const pendingUpdate = pendingItemUpdatesRef.current[itemId];

            if (!pendingUpdate) {
                return;
            }

            void updateModuleItem(itemId, pendingUpdate)
                .catch((error) => {
                    console.error('Item autosave failed:', error);
                })
                .finally(() => {
                    delete pendingItemUpdatesRef.current[itemId];
                    itemUpdateTimersRef.current[itemId] = null;
                });
        }, AUTOSAVE_DELAY_MS);
    };

    const handleDeleteItem = (itemId: string) => {
        const timer = itemUpdateTimersRef.current[itemId];
        if (timer) {
            clearTimeout(timer);
        }
        delete itemUpdateTimersRef.current[itemId];
        delete pendingItemUpdatesRef.current[itemId];
        setItems((prevItems) => prevItems.filter(item => item.id !== itemId));
        startTransition(async () => {
            await deleteModuleItem(itemId);
            toast.success('Item deleted');
        });
    };

    // DnD Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            // Persist to database
            startTransition(async () => {
                await reorderModuleItems(module.id, newItems.map(i => i.id));
            });
        }
    };

    const activeItem = activeId ? items.find(item => item.id === activeId) : null;

    // Group item types by category for the add menu
    const contentTypes = ITEM_TYPES.filter(t => t.category === 'content');
    const questionTypes = ITEM_TYPES.filter(t => t.category === 'question');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Module Info */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
                    <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <SelectedIcon className="w-4 h-4 text-primary" />
                        Module Info
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={moduleInfo.title}
                                onChange={(e) => setModuleInfo({ ...moduleInfo, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <RichTextEditor
                                value={moduleInfo.description}
                                onChange={(value) => setModuleInfo({ ...moduleInfo, description: value })}
                                mode="minimal"
                                placeholder="Describe this module..."
                            />
                        </div>

                        <ModuleIconPicker
                            value={moduleInfo.iconKey}
                            onChange={(iconKey) => setModuleInfo({ ...moduleInfo, iconKey })}
                            description="Choose an icon for this module."
                        />

                        <button
                            onClick={handleSaveClick}
                            disabled={isPending}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Module
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-medium text-slate-600 mb-3">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {items.filter(i => ['material', 'material_image', 'material_video'].includes(i.type)).length}
                                </p>
                                <p className="text-xs text-blue-600">Materials</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {items.filter(i => !['header', 'material', 'material_image', 'material_video'].includes(i.type)).length}
                                </p>
                                <p className="text-xs text-green-600">Questions</p>
                            </div>
                        </div>
                    </div>

                    {/* Drag hint */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            <GripVertical className="w-3 h-3" />
                            Drag items to reorder
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column - Items */}
            <div className="lg:col-span-2 space-y-4">
                {/* Items List */}
                {items.length === 0 && (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
                        <p className="text-slate-500 mb-2">No items yet</p>
                        <p className="text-slate-400 text-sm">Click &quot;Add Item&quot; below to start building your module</p>
                    </div>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {items.map((item) => (
                                <SortableModuleItem
                                    key={item.id}
                                    item={item}
                                    isExpanded={expandedItems.has(item.id)}
                                    onToggleExpand={() => toggleExpand(item.id)}
                                    onDelete={() => handleDeleteItem(item.id)}
                                    onUpdate={(data) => handleUpdateItem(item.id, data)}
                                >
                                    <ItemEditor
                                        item={item}
                                        onUpdate={(data) => handleUpdateItem(item.id, data)}
                                    />
                                </SortableModuleItem>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeItem ? <DragOverlayItem item={activeItem} /> : null}
                    </DragOverlay>
                </DndContext>

                {/* Add Item Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Add Item
                    </button>

                    {showAddMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowAddMenu(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-20 max-h-96 overflow-y-auto">
                                {/* Content Types */}
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">Content</p>
                                <div className="grid gap-1 mb-3">
                                    {contentTypes.map(({ type, label, icon: TypeIcon, color, description }) => (
                                        <button
                                            key={type}
                                            onClick={() => handleAddItem(type)}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                                        >
                                            <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700">{label}</p>
                                                <p className="text-xs text-slate-500">{description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Question Types */}
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2 pt-2 border-t border-slate-200">Questions</p>
                                <div className="grid gap-1">
                                    {questionTypes.map(({ type, label, icon: TypeIcon, color, description }) => (
                                        <button
                                            key={type}
                                            onClick={() => handleAddItem(type)}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-left transition-colors group"
                                        >
                                            <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-700">{label}</p>
                                                <p className="text-xs text-slate-500">{description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Publish Confirmation Dialog */}
            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Simpan Module</DialogTitle>
                        <DialogDescription>
                            Apakah Anda ingin langsung mempublish module ini atau simpan sebagai draft?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex !gap-2 sm:gap-0">
                        <button
                            onClick={() => setShowPublishDialog(false)}
                            className="px-4 py-2 text-sm border border-input rounded-lg hover:bg-muted transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleSaveModule(false)}
                            disabled={isPending}
                            className="px-4 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        >
                            Simpan sebagai Draft
                        </button>
                        <button
                            onClick={() => handleSaveModule(true)}
                            disabled={isPending}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            Simpan & Publish
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Item Editor Component - Routes to appropriate editor based on type
function ItemEditor({
    item,
    onUpdate,
}: {
    item: ModuleItem;
    onUpdate: (data: Partial<ModuleItem>) => void;
}) {
    switch (item.type) {
        case 'header':
            return <HeaderEditor item={item} onUpdate={onUpdate} />;

        case 'material':
            return <MaterialEditor item={item} onUpdate={onUpdate} />;

        case 'material_image':
            return <MaterialImageEditor item={item} onUpdate={onUpdate} />;

        case 'material_video':
            return <MaterialVideoEditor item={item} onUpdate={onUpdate} />;

        case 'question_image':
            return <QuestionImageEditor item={item} onUpdate={onUpdate} />;

        case 'question_video':
            return <QuestionVideoEditor item={item} onUpdate={onUpdate} />;

        case 'long_text':
            return <LongTextEditor item={item} onUpdate={onUpdate} />;

        case 'long_text_image':
            return <LongTextImageEditor item={item} onUpdate={onUpdate} />;

        case 'voice_answer':
            return <VoiceAnswerEditor item={item} onUpdate={onUpdate} />;

        default:
            // Question types with shared structure
            return <QuestionEditor item={item} onUpdate={onUpdate} />;
    }
}

// Generic Question Editor for multiple_choice, arrange_words, select_image, mc_image
function QuestionEditor({
    item,
    onUpdate,
}: {
    item: ModuleItem;
    onUpdate: (data: Partial<ModuleItem>) => void;
}) {
    const options = Array.isArray(item.options) ? item.options : [];

    return (
        <div className="space-y-4">
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MessageCircleQuestion className="w-4 h-4 text-green-500" />
                    Question
                </label>
                <RichTextEditor
                    value={item.question || ''}
                    onChange={(value) => onUpdate({ question: value })}
                    mode="minimal"
                    placeholder="Enter your question..."
                />
            </div>

            {item.type === 'arrange_words' && (
                <ArrangeWordsEditor
                    options={options as string[]}
                    correctAnswer={item.correctAnswer || ''}
                    onUpdate={onUpdate}
                />
            )}

            {item.type === 'multiple_choice' && (
                <MultipleChoiceEditor
                    options={options as Array<{ id: string; label: string; isCorrect?: boolean }>}
                    correctAnswer={item.correctAnswer || ''}
                    onUpdate={onUpdate}
                />
            )}

            {item.type === 'select_image' && (
                <SelectImageEditor
                    options={options as Array<{ id: string; imageUrl: string; label?: string }>}
                    correctAnswer={item.correctAnswer || ''}
                    onUpdate={onUpdate}
                />
            )}

            {item.type === 'mc_image' && (
                <McImageEditor
                    options={options as Array<{ id: string; imageUrl: string; label?: string }>}
                    correctAnswer={item.correctAnswer || ''}
                    onUpdate={onUpdate}
                />
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="flex-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                        <Star className="w-4 h-4 text-amber-500" />
                        XP Reward
                    </label>
                    <input
                        type="number"
                        value={item.xpReward || 10}
                        onChange={(e) => onUpdate({ xpReward: parseInt(e.target.value) || 10 })}
                        min={0}
                        max={100}
                        className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
