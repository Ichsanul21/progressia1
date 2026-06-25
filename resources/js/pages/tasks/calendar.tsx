import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string | null;
    url: string;
    project: string;
    status: string;
    assigned_to: string | null;
}

const statusColors: Record<string, string> = {
    not_started: '#94a3b8',
    in_progress: '#3b82f6',
    review: '#f59e0b',
    done: '#22c55e',
    milestone: '#8b5cf6',
};

export default function Calendar({ events, project }: { events: CalendarEvent[]; project?: { id: number; name: string } }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        ...(project
            ? [
                  { title: project.name, href: route('projects.show', project.id) },
                  { title: 'Calendar', href: '' },
              ]
            : [{ title: 'Calendar', href: '' }]),
    ];

    const fcEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        url: e.url,
        backgroundColor: statusColors[e.status] || '#64748b',
        borderColor: statusColors[e.status] || '#64748b',
        textColor: '#fff',
        extendedProps: {
            project: e.project,
            assigned_to: e.assigned_to,
            status: e.status,
        },
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={project ? `Calendar - ${project.name}` : 'Calendar'} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    {project ? (
                        <Link href={route('projects.tasks.index', project.id)}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold">{project ? `${project.name} — ` : ''}Calendar</h1>
                        <p className="text-muted-foreground text-sm">{events.length} events</p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-4">
                        <div className="calendar-container [&_.fc-today]:bg-accent/50 [&_.fc-day-today]:bg-accent/30 [&_.fc-button]:!shadow-none">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={fcEvents}
                                eventClick={(info) => {
                                    info.jsEvent.preventDefault();
                                    if (info.event.url) {
                                        window.location.href = info.event.url;
                                    }
                                }}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek,dayGridDay',
                                }}
                                height="auto"
                                firstDay={1}
                                dayMaxEvents={3}
                                eventTimeFormat={{
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    meridiem: false,
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: '#94a3b8' }} /> Not Started
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: '#3b82f6' }} /> In Progress
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: '#f59e0b' }} /> Review
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: '#22c55e' }} /> Done
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: '#8b5cf6' }} /> Milestone
                    </span>
                </div>
            </div>
        </AppLayout>
    );
}
