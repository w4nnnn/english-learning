import { getModules } from '@/lib/actions/modules';
import Link from 'next/link';
import { Plus, Eye, EyeOff, Pencil, BookOpen, Users } from 'lucide-react';
import { DeleteModuleButton, TogglePublishButton } from '@/components/admin/modules/module-actions';
import { getModuleIcon } from '@/lib/module-icons';

export default async function ModulesPage() {
    const modules = await getModules(true);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Modules</h1>
                    <p className="text-muted-foreground mt-1">Manage your learning modules</p>
                </div>
                <Link
                    href="/admin/modules/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-elegant"
                >
                    <Plus className="w-5 h-5" />
                    New Module
                </Link>
            </div>

            {modules.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-elegant border border-border p-12 text-center">
                    <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Modules Yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Create your first learning module to get started
                    </p>
                    <Link
                        href="/admin/modules/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-elegant"
                    >
                        <Plus className="w-5 h-5" />
                        Create Module
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-elegant border border-border overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {modules.length} module{modules.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* Module List */}
                    <div className="divide-y divide-border">
                        {modules.map((module, index) => {
                            const ModuleIcon = getModuleIcon(module.iconKey);

                            return (
                                <div
                                    key={module.id}
                                    className="flex items-center gap-4 p-4 sm:p-6 hover:bg-muted/30 transition-elegant group"
                                >
                                    {/* Order Badge */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                        {module.order || index + 1}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/modules/${module.id}`}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                                                <ModuleIcon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground group-hover:text-primary transition-elegant truncate">
                                                    {module.title}
                                                </h3>
                                                {module.description && (
                                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                                        {module.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="hidden sm:block">
                                        {module.isPublished ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                                                <Eye className="w-3.5 h-3.5" />
                                                Published
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-sm font-medium rounded-full border border-border">
                                                <EyeOff className="w-3.5 h-3.5" />
                                                Draft
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/admin/modules/${module.id}/results`}
                                            className="p-2.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded-xl transition-elegant"
                                            title="Hasil Siswa"
                                        >
                                            <Users className="w-4 h-4" />
                                        </Link>
                                        <TogglePublishButton
                                            moduleId={module.id}
                                            isPublished={module.isPublished ?? false}
                                        />
                                        <Link
                                            href={`/admin/modules/${module.id}`}
                                            className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-elegant"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <DeleteModuleButton moduleId={module.id} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
