'use client';

import { Input } from '@/components/ui/input';

interface ShortTextAnswerProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
}

export function ShortTextAnswer({
    value,
    onChange,
    disabled,
    placeholder = 'Jawaban singkat...',
    maxLength = 200,
}: ShortTextAnswerProps) {
    return (
        <div className="space-y-2">
            <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
                className="bg-white"
            />
            {maxLength ? (
                <div className="text-xs text-muted-foreground text-right">
                    {value.length}/{maxLength}
                </div>
            ) : null}
        </div>
    );
}
