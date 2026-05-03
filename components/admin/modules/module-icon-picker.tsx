'use client';

import { moduleIcons, MODULE_ICON_OPTIONS, ModuleIconKey } from '@/lib/module-icons';

interface ModuleIconPickerProps {
    value: ModuleIconKey;
    onChange: (value: ModuleIconKey) => void;
    label?: string;
    description?: string;
}

export function ModuleIconPicker({
    value,
    onChange,
    label = 'Icon',
    description,
}: ModuleIconPickerProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {description && (
                <p className="text-xs text-slate-500 mb-3">{description}</p>
            )}
            <div className="grid grid-cols-3 gap-2">
                {MODULE_ICON_OPTIONS.map(({ key, label: optionLabel }) => {
                    const Icon = moduleIcons[key];
                    const isActive = key === value;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange(key)}
                            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            aria-pressed={isActive}
                            title={optionLabel}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="leading-none">{optionLabel}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
