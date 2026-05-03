'use client';

import { createModule } from '@/lib/actions/modules';
import { DEFAULT_MODULE_ICON_KEY, type ModuleIconKey } from '@/lib/module-icons';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ModuleIconPicker } from '@/components/admin/modules/module-icon-picker';

export default function NewModulePage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        iconKey: ModuleIconKey;
    }>({
        title: '',
        description: '',
        iconKey: DEFAULT_MODULE_ICON_KEY,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        startTransition(async () => {
            const result = await createModule({
                title: formData.title,
                description: formData.description || undefined,
                iconKey: formData.iconKey,
                isPublished: false,
            });

            toast.success('Module created!');
            router.push(`/admin/modules/${result.id}`);
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/modules"
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-elegant"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">New Module</h1>
                        <p className="text-sm text-muted-foreground">Create a new learning module</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-2xl shadow-elegant border border-border p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Title <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Noun Phrase - Introduction"
                            className="w-full px-4 py-3 border border-border rounded-xl bg-background focus-elegant transition-elegant"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of this module..."
                            rows={4}
                            className="w-full px-4 py-3 border border-border rounded-xl bg-background focus-elegant transition-elegant resize-none"
                        />
                    </div>

                    <ModuleIconPicker
                        value={formData.iconKey}
                        onChange={(iconKey) => setFormData({ ...formData, iconKey })}
                        description="Pick an icon to represent this module."
                    />

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-elegant disabled:opacity-50"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Create Module
                                </>
                            )}
                        </button>
                        <Link
                            href="/admin/modules"
                            className="px-6 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-elegant font-medium"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
