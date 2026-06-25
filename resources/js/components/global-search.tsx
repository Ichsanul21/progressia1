import { router } from '@inertiajs/react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Building2, FolderKanban, Layers, ListTodo, Search, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface SearchResult {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    url: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
    project: <FolderKanban className="mr-2 h-4 w-4" />,
    task: <ListTodo className="mr-2 h-4 w-4" />,
    vendor: <Building2 className="mr-2 h-4 w-4" />,
    client: <User className="mr-2 h-4 w-4" />,
    phase: <Layers className="mr-2 h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
    project: 'Projects',
    task: 'Tasks',
    vendor: 'Vendors',
    client: 'Clients',
    phase: 'Phases',
};

function groupResults(results: SearchResult[]): Record<string, SearchResult[]> {
    return results.reduce(
        (acc, r) => {
            if (!acc[r.type]) acc[r.type] = [];
            acc[r.type].push(r);
            return acc;
        },
        {} as Record<string, SearchResult[]>,
    );
}

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        setLoading(true);

        fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
        })
            .then((res) => res.json())
            .then((data) => {
                setResults(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        return () => controller.abort();
    }, [query]);

    const handleSelect = useCallback((result: SearchResult) => {
        setOpen(false);
        if (result.url) {
            router.visit(result.url);
        }
    }, []);

    const grouped = groupResults(results);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search projects, tasks, vendors..." value={query} onValueChange={setQuery} />
            <CommandList>
                <CommandEmpty>{loading ? 'Searching...' : query.length < 2 ? 'Type at least 2 characters' : 'No results found.'}</CommandEmpty>
                {Object.entries(grouped).map(([type, items]) => (
                    <CommandGroup key={type} heading={typeLabels[type] || type}>
                        {items.map((item) => (
                            <CommandItem key={item.id} value={`${type}-${item.title}`} onSelect={() => handleSelect(item)}>
                                {typeIcons[type] || <Search className="mr-2 h-4 w-4" />}
                                <div className="flex flex-col">
                                    <span>{item.title}</span>
                                    {item.subtitle && <span className="text-muted-foreground text-xs">{item.subtitle}</span>}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </CommandDialog>
    );
}
