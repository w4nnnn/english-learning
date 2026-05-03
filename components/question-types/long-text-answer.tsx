'use client';

import { Textarea } from '@/components/ui/textarea';

interface LongTextAnswerProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

export function LongTextAnswer({
    value,
    onChange,
    disabled,
    placeholder = 'Tulis jawabanmu di sini...',
    rows = 6,
    maxLength,
}: LongTextAnswerProps) {
    return (
        <div className="space-y-2">
            <Textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={rows}
                maxLength={maxLength}
                className="min-h-[160px] bg-white"
            />
            {maxLength ? (
                <div className="text-xs text-muted-foreground text-right">
                    {value.length}/{maxLength}
                </div>
            ) : null}
        </div>
    );
}
