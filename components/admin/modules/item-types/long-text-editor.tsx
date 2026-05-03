'use client';

import { MessageCircleQuestion, FileText, ImageIcon, Star } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MediaUploader } from '@/components/ui/media-uploader';
import { Textarea } from '@/components/ui/textarea';
import type { ItemEditorProps } from './types';

export function LongTextEditor({ item, onUpdate }: ItemEditorProps) {
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

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Sample Answer (optional)
                </label>
                <Textarea
                    value={item.correctAnswer || ''}
                    onChange={(event) => onUpdate({ correctAnswer: event.target.value })}
                    placeholder="Provide a sample answer or rubric notes..."
                    rows={6}
                    className="bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                    Jawaban panjang tidak dinilai otomatis. Jawaban siswa akan tetap disimpan.
                </p>
            </div>

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

export function LongTextImageEditor({ item, onUpdate }: ItemEditorProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <ImageIcon className="w-4 h-4 text-teal-500" />
                    Question Image
                </label>
                <MediaUploader
                    value={item.content || ''}
                    onChange={(url) => onUpdate({ content: url })}
                    accept="image"
                />
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MessageCircleQuestion className="w-4 h-4 text-teal-500" />
                    Question
                </label>
                <RichTextEditor
                    value={item.question || ''}
                    onChange={(value) => onUpdate({ question: value })}
                    mode="minimal"
                    placeholder="Enter your question..."
                />
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Sample Answer (optional)
                </label>
                <Textarea
                    value={item.correctAnswer || ''}
                    onChange={(event) => onUpdate({ correctAnswer: event.target.value })}
                    placeholder="Provide a sample answer or rubric notes..."
                    rows={6}
                    className="bg-white"
                />
                <p className="text-xs text-slate-500 mt-2">
                    Jawaban panjang tidak dinilai otomatis. Jawaban siswa akan tetap disimpan.
                </p>
            </div>

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
