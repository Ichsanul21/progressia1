import { Head, router } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, FileCheck, XCircle } from 'lucide-react';
import { useState } from 'react';

import ConfirmDialog from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Approvals', href: '' },
];

interface ApprovalData {
    id: number;
    approvable_type: string;
    approvable: { id: number; name: string; status: string } | null;
    target_status: string;
    old_status: string;
    status: string;
    comment: string | null;
    requested_by: string | null;
    reviewer: { id: number; name: string } | null;
    requester: { id: number; name: string } | null;
    reviewed_at: string | null;
    created_at: string;
}

const statusBadge: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
};

export default function ApprovalsIndex({
    approvals,
    isAdmin,
    filters,
}: {
    approvals: { data: ApprovalData[]; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null };
    isAdmin: boolean;
    filters?: { status?: string };
}) {
    const [filter, setFilter] = useState<string>(filters?.status ?? 'pending');
    const [rejectComment, setRejectComment] = useState<Record<number, string>>({});
    const [rejecting, setRejecting] = useState<number | null>(null);
    const [approving, setApproving] = useState<ApprovalData | null>(null);

    const filtered = approvals.data.filter((a) => filter === 'all' || a.status === filter);

    const handlePage = (url: string | null) => {
        if (url) router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const handleFilter = (status: string) => {
        setFilter(status);
        router.get(route('approvals.index'), { status: status === 'all' ? undefined : status }, { preserveState: true });
    };

    const handleConfirmApprove = () => {
        if (!approving) return;
        router.post(
            route('approvals.approve', approving.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setApproving(null),
            },
        );
    };

    const handleReject = (approval: ApprovalData) => {
        const comment = rejectComment[approval.id];
        if (!comment || comment.length < 5) {
            alert('Please provide a reason (min 5 characters).');
            return;
        }
        router.post(
            route('approvals.reject', approval.id),
            { comment },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejecting(null);
                    setRejectComment((prev) => {
                        const next = { ...prev };
                        delete next[approval.id];
                        return next;
                    });
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approvals" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold">Approvals</h1>
                    <p className="text-muted-foreground text-sm">Review status change requests</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => handleFilter(f)}>
                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-muted-foreground py-16 text-center">
                            <FileCheck className="mx-auto mb-4 h-12 w-12" />
                            <p>No {filter !== 'all' ? filter : ''} approvals found.</p>
                        </div>
                    ) : (
                        filtered.map((approval) => {
                            const typeLabel = approval.approvable_type === 'App\\Models\\Task' ? 'Task' : 'Project';
                            return (
                                <Card key={approval.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Badge
                                                        variant={
                                                            statusBadge[approval.status] as
                                                                | 'default'
                                                                | 'secondary'
                                                                | 'destructive'
                                                                | 'outline'
                                                                | 'warning'
                                                                | 'success'
                                                        }
                                                        className="text-[10px]"
                                                    >
                                                        {approval.status}
                                                    </Badge>
                                                    <span>{approval.approvable?.name ?? '—'}</span>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {typeLabel}
                                                    </Badge>
                                                </CardTitle>
                                            </div>
                                            <span className="text-muted-foreground shrink-0 text-[10px]">
                                                {new Date(approval.created_at).toLocaleDateString('id-ID', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {approval.old_status.replace('_', ' ')}
                                            </Badge>
                                            <ArrowRight className="h-3 w-3" />
                                            <Badge variant="secondary" className="text-[10px]">
                                                {approval.target_status.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-xs">by {approval.requester?.name ?? 'System'}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="text-muted-foreground text-xs">
                                                {approval.status === 'approved' && approval.reviewer && (
                                                    <span>
                                                        Reviewed by {approval.reviewer.name} on {new Date(approval.reviewed_at!).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {approval.status === 'rejected' && (
                                                    <div>
                                                        <span className="text-destructive">Rejected: {approval.comment}</span>
                                                        {approval.reviewer && <span className="ml-2">by {approval.reviewer.name}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isAdmin && approval.status === 'pending' && (
                                                    <>
                                                        {rejecting === approval.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <Textarea
                                                                    placeholder="Reason for rejection..."
                                                                    value={rejectComment[approval.id] || ''}
                                                                    onChange={(e) =>
                                                                        setRejectComment((prev) => ({ ...prev, [approval.id]: e.target.value }))
                                                                    }
                                                                    className="h-8 w-48 text-xs"
                                                                />
                                                                <Button size="sm" variant="destructive" onClick={() => handleReject(approval)}>
                                                                    Reject
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Button size="sm" variant="default" onClick={() => setApproving(approval)}>
                                                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => setRejecting(approval.id)}>
                                                                    <XCircle className="mr-1 h-3 w-3" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {approvals.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <Button variant="outline" size="sm" disabled={!approvals.prev_page_url} onClick={() => handlePage(approvals.prev_page_url)}>
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <span className="text-muted-foreground text-xs">
                            Page {approvals.current_page} of {approvals.last_page}
                        </span>
                        <Button variant="outline" size="sm" disabled={!approvals.next_page_url} onClick={() => handlePage(approvals.next_page_url)}>
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!approving}
                onOpenChange={(open) => !open && setApproving(null)}
                onConfirm={handleConfirmApprove}
                title="Setujui Perubahan"
                description={`Yakin ingin menyetujui perubahan status ke "${approving?.target_status.replace('_', ' ')}"?`}
                confirmText="Setujui"
            />
        </AppLayout>
    );
}
