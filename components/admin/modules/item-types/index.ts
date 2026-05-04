import {
    Type,
    FileText,
    HelpCircle,
    ListOrdered,
    Image,
    Video,
    ImageIcon,
    Mic,
    PenLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ItemTypeConfig {
    type: string;
    label: string;
    icon: LucideIcon;
    color: string;
    description: string;
    category: 'content' | 'question';
}

export const ITEM_TYPES: ItemTypeConfig[] = [
    // Content types
    { type: 'header', label: 'Header', icon: Type, color: 'bg-purple-100 text-purple-600', description: 'Section divider with title', category: 'content' },
    { type: 'material', label: 'Material', icon: FileText, color: 'bg-blue-100 text-blue-600', description: 'Rich text content', category: 'content' },
    { type: 'material_image', label: 'Material (Image)', icon: ImageIcon, color: 'bg-blue-100 text-blue-600', description: 'Image-based content', category: 'content' },
    { type: 'material_video', label: 'Material (Video)', icon: Video, color: 'bg-blue-100 text-blue-600', description: 'Video-based content', category: 'content' },

    // Question types
    { type: 'multiple_choice', label: 'Multiple Choice', icon: HelpCircle, color: 'bg-green-100 text-green-600', description: 'Question with text options', category: 'question' },
    { type: 'mc_image', label: 'MC (Image Options)', icon: Image, color: 'bg-green-100 text-green-600', description: 'Question with image options', category: 'question' },
    { type: 'arrange_words', label: 'Arrange Words', icon: ListOrdered, color: 'bg-orange-100 text-orange-600', description: 'Arrange words in order', category: 'question' },
    { type: 'select_image', label: 'Select Image', icon: Image, color: 'bg-pink-100 text-pink-600', description: 'Choose correct image', category: 'question' },
    { type: 'question_image', label: 'Question (Image)', icon: ImageIcon, color: 'bg-teal-100 text-teal-600', description: 'Text question with image', category: 'question' },
    { type: 'question_video', label: 'Question (Video)', icon: Video, color: 'bg-teal-100 text-teal-600', description: 'Text question with video', category: 'question' },
    { type: 'short_answer', label: 'Short Answer', icon: PenLine, color: 'bg-indigo-100 text-indigo-600', description: 'Short text response', category: 'question' },
    { type: 'long_text', label: 'Long Text', icon: FileText, color: 'bg-indigo-100 text-indigo-600', description: 'Essay-style answer', category: 'question' },
    { type: 'long_text_image', label: 'Long Text (Image)', icon: ImageIcon, color: 'bg-indigo-100 text-indigo-600', description: 'Essay answer with image', category: 'question' },
    { type: 'voice_answer', label: 'Voice Answer', icon: Mic, color: 'bg-red-100 text-red-600', description: 'Answer with voice', category: 'question' },
];

export function getItemTypeConfig(type: string): ItemTypeConfig | undefined {
    return ITEM_TYPES.find(t => t.type === type);
}
