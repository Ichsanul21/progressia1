import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationData<T = Record<string, unknown>> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page?: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

export default function Pagination<T>({ pagination }: { pagination: PaginationData<T> }) {
    if (pagination.last_page <= 1) return null;

    const handlePage = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="flex items-center justify-between pt-4">
            <p className="text-muted-foreground text-sm">
                Showing {pagination.from} to {pagination.to} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
                {pagination.links.map((link, i) => {
                    if (link.label.includes('Previous') || link.label.includes('Next')) {
                        return (
                            <Button key={i} variant="outline" size="sm" disabled={!link.url} onClick={() => handlePage(link.url)}>
                                {link.label.replace('&laquo;', '').replace('&raquo;', '').trim() ||
                                    (link.label.includes('Previous') ? 'Prev' : 'Next')}
                            </Button>
                        );
                    }
                    return (
                        <Button
                            key={i}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            onClick={() => handlePage(link.url)}
                            className="min-w-[36px]"
                        >
                            {link.label}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
