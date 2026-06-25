import { Head, Link, router } from '@inertiajs/react';
import { Archive, Eye, Heart, Plus, Search, Trash2 } from 'lucide-react';

import ConfirmDialog from '@/components/confirm-dialog';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Projects', href: '/projects' }];

interface Project {
    id: number;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    cover_image: string | null;
    vendor: { id: number; name: string } | null;
    phases_count: number;
    tasks_count: number;
    created_at: string;
    is_favorited?: boolean;
}

const statusColors: Record<string, string> = {
    not_started: 'secondary',
    in_progress: 'default',
    review: 'warning',
    done: 'success',
};

export default function ProjectsIndex({
    projects,
    filters,
    archivedCount,
    canCreate,
    canUpdate,
    canDelete,
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
    filters: { search?: string; status?: string };
    archivedCount: number;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<Project | null>(null);

    const handleConfirmDelete = () => {
        if (!deleting) return;
        router.delete(route('projects.destroy', deleting.id), {
            onSuccess: () => setDeleting(null),
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('projects.index'), { ...filters, search }, { preserveState: true });
    };

    const toggleFav = (project: Project) => {
        router.post(route('projects.favorite', project.id), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Projects</h1>
                        <p className="text-muted-foreground text-sm">Manage your construction projects</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {archivedCount > 0 && (
                            <Link href={route('projects.trash')}>
                                <Button variant="outline" size="sm">
                                    <Archive className="mr-1 h-4 w-4" />
                                    Trash ({archivedCount})
                                </Button>
                            </Link>
                        )}
                        {canCreate && (
                            <Link href={route('projects.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Project
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    <Button variant="outline" size="sm" type="submit">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {projects.data.map((project) => (
                        <Card key={project.id} className="hover:border-primary/50 overflow-hidden transition-colors">
                            {project.cover_image && (
                                <div className="h-32 overflow-hidden">
                                    <img src={`/storage/${project.cover_image}`} alt="" className="h-full w-full object-cover" />
                                </div>
                            )}
                            <CardHeader className={project.cover_image ? 'pb-2' : ''}>
                                <div className="flex items-start justify-between">
                                    <Link href={route('projects.show', project.id)} className="min-w-0 flex-1 hover:underline">
                                        <CardTitle className="truncate text-base">{project.name}</CardTitle>
                                    </Link>
                                    <div className="ml-2 flex shrink-0 items-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleFav(project)}>
                                            <Heart className={`h-3.5 w-3.5 ${project.is_favorited ? 'fill-red-500 text-red-500' : ''}`} />
                                        </Button>
                                        <Badge
                                            variant={
                                                statusColors[project.status] as
                                                    | 'default'
                                                    | 'secondary'
                                                    | 'destructive'
                                                    | 'outline'
                                                    | 'warning'
                                                    | 'success'
                                            }
                                            className="text-[10px]"
                                        >
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="text-muted-foreground line-clamp-2 text-sm">{project.description ?? 'No description'}</p>
                            </CardHeader>
                            <CardContent className={project.cover_image ? 'pt-2' : ''}>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-medium">{project.progress}%</span>
                                    </div>
                                    <div className="bg-secondary mt-1 h-2 w-full rounded-full">
                                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                                    </div>
                                </div>
                                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                                    <span>{project.tasks_count} tasks</span>
                                    <span>{project.phases_count} phases</span>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <Link href={route('projects.show', project.id)}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-1 h-3 w-3" />
                                            View
                                        </Button>
                                    </Link>
                                    {canUpdate && (
                                        <Link href={route('projects.edit', project.id)}>
                                            <Button variant="outline" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                    )}
                                    {canDelete && (
                                        <Button variant="ghost" size="sm" onClick={() => setDeleting(project)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Pagination pagination={projects} />

                {projects.data.length === 0 && (
                    <div className="text-muted-foreground py-12 text-center">
                        <p>No projects found.</p>
                        {canCreate && (
                            <Link href={route('projects.create')} className="mt-2 inline-block text-sm underline">
                                Create your first project
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
                onConfirm={handleConfirmDelete}
                title="Hapus Proyek"
                description={`Yakin ingin menghapus proyek "${deleting?.name}"? Proyek akan dipindahkan ke trash dan dapat dipulihkan nanti.`}
            />
        </AppLayout>
    );
}
