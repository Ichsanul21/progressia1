import HistoryEntry, { type TimelineEntry } from '@/components/history-entry';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FilterType = 'all' | 'activity' | 'progress';

export default function TaskHistory({
    projectId,
    taskId,
    initialEntries,
    initialHasMore,
}: {
    projectId: number;
    taskId: number;
    initialEntries: TimelineEntry[];
    initialHasMore: boolean;
}) {
    const [entries, setEntries] = useState<TimelineEntry[]>(initialEntries);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [offset, setOffset] = useState(initialEntries.length);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<FilterType>('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput.trim());
        }, 150);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const params = new URLSearchParams({
            type,
            q: searchQuery,
            offset: '0',
        });
        fetch(`/projects/${projectId}/tasks/${taskId}/timeline?${params.toString()}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setEntries(data.entries ?? []);
                setHasMore(data.has_more ?? false);
                setOffset(data.entries?.length ?? 0);
            })
            .catch(() => {
                if (!cancelled) setEntries([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [projectId, taskId, type, searchQuery]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (observerEntries) => {
                if (observerEntries[0]?.isIntersecting && hasMore && !loading) {
                    const params = new URLSearchParams({
                        type,
                        q: searchQuery,
                        offset: String(offset),
                    });
                    setLoading(true);
                    fetch(`/projects/${projectId}/tasks/${taskId}/timeline?${params.toString()}`, {
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            setEntries((prev) => [...prev, ...(data.entries ?? [])]);
                            setHasMore(data.has_more ?? false);
                            setOffset((prev) => prev + (data.entries?.length ?? 0));
                        })
                        .finally(() => setLoading(false));
                }
            },
            { rootMargin: '120px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, offset, projectId, taskId, type, searchQuery]);

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Cari perubahan..."
                        className="h-9 pr-8 pl-8 text-sm"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => setSearchInput('')}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-md border p-0.5">
                    {(['all', 'activity', 'progress'] as FilterType[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition ${
                                type === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {entries.length === 0 && !loading ? (
                <p className="text-muted-foreground py-6 text-center text-sm">No history entries match.</p>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry) => (
                        <HistoryEntry key={entry.id} entry={entry} />
                    ))}
                </div>
            )}

            <div ref={sentinelRef} className="flex justify-center py-2">
                {loading && <LoaderCircle className="text-muted-foreground h-4 w-4 animate-spin" />}
                {!hasMore && entries.length > 0 && <p className="text-muted-foreground text-xs">Sudah sampai bawah.</p>}
            </div>
        </div>
    );
}
