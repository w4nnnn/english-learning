import { getModuleWithItems } from '@/lib/actions/modules';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { ModuleEditor } from '@/components/admin/modules/module-editor';
import { getModuleIcon } from '@/lib/module-icons';

export default async function EditModulePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const moduleData = await getModuleWithItems(id);

    if (!moduleData) {
        notFound();
    }

    const ModuleIcon = getModuleIcon(moduleData.iconKey);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/modules"
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-elegant"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                            <ModuleIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{moduleData.title}</h1>
                            <p className="text-sm text-muted-foreground">{moduleData.items.length} items</p>
                        </div>
                    </div>
                </div>

                <Link
                    href={`/admin/modules/${id}/results`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-elegant"
                >
                    <Users className="w-4 h-4" />
                    Hasil Siswa
                </Link>
            </div>

            <ModuleEditor module={moduleData} />
        </div>
    );
}
