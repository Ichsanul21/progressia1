import { Head, Link, router, usePage } from '@inertiajs/react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Trash', href: '/projects/trash' },
];

interface Project {
    id: number;
    name: string;
    description: string | null;
    vendor: { id: number; name: string } | null;
    deleted_at: string;
}

export default function ProjectsTrash({
    projects,
}: {
    projects: {
        data: Project[];
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}) {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const isSuperAdmin = auth.user.role === 'super_admin';
    const [deleting, setDeleting] = useState<Project | null>(null);

    const handleRestore = (id: number) => {
        router.post(route('projects.restore', id));
    };

    const handleConfirmForceDelete = () => {
        if (!deleting) return;
        router.delete(route('projects.force-delete', deleting.id), {
            onSuccess: () => setDeleting(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deleted Projects" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Deleted Projects</h1>
                        <p className="text-muted-foreground text-sm">Restore or permanently delete projects</p>
                    </div>
                    <Link href={route('projects.index')}>
                        <Button variant="outline">Back to Projects</Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    {projects.data.map((project) => (
                        <Card key={project.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{project.name}</CardTitle>
                                        <p className="text-muted-foreground text-sm">
                                            {project.vendor?.name ?? 'No vendor'} &middot; Deleted{' '}
                                            {new Date(project.deleted_at).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isSuperAdmin && (
                                            <Button variant="destructive" size="sm" onClick={() => setDeleting(project)}>
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                Delete Forever
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => handleRestore(project.id)}>
                                            <RotateCcw className="mr-1 h-3 w-3" />
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>{project.description && <p className="text-muted-foreground text-sm">{project.description}</p>}</CardContent>
                        </Card>
                    ))}

                    <Pagination pagination={projects} />

                    {projects.data.length === 0 && (
                        <div className="text-muted-foreground py-12 text-center">
                            <p>No deleted projects.</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmForceDelete}
                title="Hapus Permanen"
                description={`Yakin ingin menghapus permanen proyek "${deleting?.name}"? Tindakan ini tidak dapat dibatalkan.`}
            />
        </AppLayout>
    );
}
