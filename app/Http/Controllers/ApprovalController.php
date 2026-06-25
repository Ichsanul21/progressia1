<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Approval;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->isSuperAdmin() || $user->isAdminVendor();

        $query = Approval::with([
            'requester:id,name',
            'reviewer:id,name',
            'approvable',
        ])->latest();

        if (!$isAdmin) {
            $query->where('requested_by', $user->id);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $approvals = $query->paginate(20)->appends($request->only('status'));

        return Inertia::render('approvals/index', [
            'approvals' => $approvals,
            'isAdmin' => $isAdmin,
            'filters' => $request->only('status'),
        ]);
    }

    public function approve(Request $request, Approval $approval): RedirectResponse
    {
        $this->authorize('review', $approval);

        if (!$approval->isPending()) {
            return back()->with('error', __('Approval already processed.'));
        }

        $approval->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $approvable = $approval->approvable;
        if ($approvable) {
            $approvable->updateQuietly(['status' => $approval->target_status]);
            if (method_exists($approvable, 'recalculateProgress')) {
                $approvable->recalculateProgress();
            }
        }

        ActivityLog::create([
            'subject_type' => $approval->approvable_type,
            'subject_id' => $approval->approvable_id,
            'event' => 'approved',
            'description' => __(':type :name approved (status changed from :old to :new)', [
                'type' => class_basename($approval->approvable_type),
                'name' => $approvable?->name ?? '—',
                'old' => $approval->old_status,
                'new' => $approval->target_status,
            ]),
            'user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('approvals.index', Arr::only($request->query(), ['status']))
            ->with('success', __('Approval approved.'));
    }

    public function reject(Request $request, Approval $approval): RedirectResponse
    {
        $this->authorize('review', $approval);

        if (!$approval->isPending()) {
            return back()->with('error', __('Approval already processed.'));
        }

        $validated = $request->validate([
            'comment' => ['required', 'string', 'min:5', 'max:' . config('validation.comment_max')],
        ]);

        $approval->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'comment' => $validated['comment'],
        ]);

        $approvable = $approval->approvable;
        if ($approvable) {
            $approvable->updateQuietly(['status' => $approval->old_status]);
            if (method_exists($approvable, 'recalculateProgress')) {
                $approvable->recalculateProgress();
            }
        }

        ActivityLog::create([
            'subject_type' => $approval->approvable_type,
            'subject_id' => $approval->approvable_id,
            'event' => 'rejected',
            'description' => __(':type :name rejected (reverted to :old)', [
                'type' => class_basename($approval->approvable_type),
                'name' => $approvable?->name ?? '—',
                'old' => $approval->old_status,
            ]),
            'user_id' => $request->user()->id,
        ]);

        return redirect()
            ->route('approvals.index', Arr::only($request->query(), ['status']))
            ->with('success', __('Approval rejected.'));
    }
}
