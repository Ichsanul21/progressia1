import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Projects', href: '/projects' },
    { title: 'Tasks', href: '' },
    { title: 'Create', href: '' },
];

export default function TasksCreate({
    project,
    members,
    phases,
    subVendors = [],
    currentPhase = null,
}: {
    project: { id: number; name: string };
    members: { id: number; name: string }[];
    phases: { id: number; name: string }[];
    subVendors?: { id: number; name: string }[];
    currentPhase?: { id: number; name: string } | null;
}) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        phase_id: currentPhase?.id?.toString() ?? '',
        assigned_to: '',
        sub_vendor_id: '',
        priority: 'medium',
        start_date: '',
        due_date: '',
        is_recurring: false,
        recurrence_frequency: 'weekly',
        recurrence_interval: 1,
        recurrence_end_date: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('projects.tasks.store', project.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Task" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Link href={route('projects.tasks.index', project.id)}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>
                <h1 className="text-2xl font-bold">Create Task</h1>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-base">Task Details — {currentPhase?.name ?? project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Task Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Task name" />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Task description"
                                    rows={4}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phase_id">Phase</Label>
                                <select
                                    id="phase_id"
                                    value={data.phase_id}
                                    onChange={(e) => setData('phase_id', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">No phase</option>
                                    {phases.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.phase_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <InputError message={errors.priority} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="assigned_to">Assign To</Label>
                                <select
                                    id="assigned_to"
                                    value={data.assigned_to}
                                    onChange={(e) => setData('assigned_to', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.assigned_to} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sub_vendor_id">Sub-Vendor (opsional)</Label>
                                <select
                                    id="sub_vendor_id"
                                    value={data.sub_vendor_id}
                                    onChange={(e) => setData('sub_vendor_id', e.target.value)}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <option value="">Tidak ada</option>
                                    {subVendors.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-muted-foreground text-xs">Bila diisi, semua user sub-vendor bisa update task ini.</p>
                                <InputError message={errors.sub_vendor_id} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input id="due_date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                                    <InputError message={errors.due_date} />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_recurring"
                                        checked={data.is_recurring}
                                        onChange={(e) => setData('is_recurring', e.target.checked)}
                                        className="border-input rounded"
                                    />
                                    <Label htmlFor="is_recurring" className="text-sm font-medium">
                                        Recurring Task
                                    </Label>
                                </div>

                                {data.is_recurring && (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="recurrence_frequency">Frequency</Label>
                                            <select
                                                id="recurrence_frequency"
                                                value={data.recurrence_frequency}
                                                onChange={(e) => setData('recurrence_frequency', e.target.value)}
                                                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                                <option value="yearly">Yearly</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="recurrence_interval">Every</Label>
                                            <Input
                                                id="recurrence_interval"
                                                type="number"
                                                min={1}
                                                value={data.recurrence_interval}
                                                onChange={(e) => setData('recurrence_interval', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="recurrence_end_date">Until</Label>
                                            <Input
                                                id="recurrence_end_date"
                                                type="date"
                                                value={data.recurrence_end_date}
                                                onChange={(e) => setData('recurrence_end_date', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
