import {
    BookOpen,
    Sparkles,
    Target,
    Trophy,
    Users,
    Star,
    MessageCircleQuestion,
    Heart,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const moduleIcons = {
    BookOpen,
    Sparkles,
    Target,
    Trophy,
    Users,
    Star,
    MessageCircleQuestion,
    Heart,
    Zap,
} as const;

export type ModuleIconKey = keyof typeof moduleIcons;

export const DEFAULT_MODULE_ICON_KEY: ModuleIconKey = 'BookOpen';

export const MODULE_ICON_OPTIONS: Array<{ key: ModuleIconKey; label: string }> = [
    { key: 'BookOpen', label: 'Book' },
    { key: 'Sparkles', label: 'Sparkles' },
    { key: 'Target', label: 'Target' },
    { key: 'Trophy', label: 'Trophy' },
    { key: 'Users', label: 'Users' },
    { key: 'Star', label: 'Star' },
    { key: 'MessageCircleQuestion', label: 'Question' },
    { key: 'Heart', label: 'Heart' },
    { key: 'Zap', label: 'Zap' },
];

export function resolveModuleIconKey(key?: string | null): ModuleIconKey {
    if (key && key in moduleIcons) {
        return key as ModuleIconKey;
    }

    return DEFAULT_MODULE_ICON_KEY;
}

export function getModuleIcon(key?: string | null): LucideIcon {
    if (!key) {
        return moduleIcons[DEFAULT_MODULE_ICON_KEY];
    }

    return moduleIcons[key as ModuleIconKey] ?? moduleIcons[DEFAULT_MODULE_ICON_KEY];
}
