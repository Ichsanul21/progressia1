<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $query = Task::with(['project:id,name', 'phase:id,name']);

        if ($user->isSubVendor()) {
            $query->where('sub_vendor_id', $user->sub_vendor_id);
        } else {
            $query->where('assigned_to', $user->id);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $tasks = $query
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 1 WHEN 'review' THEN 2 WHEN 'not_started' THEN 3 WHEN 'done' THEN 4 ELSE 5 END")
            ->orderBy('due_date')
            ->paginate(20);

        return Inertia::render('tasks/inbox', [
            'tasks' => $tasks,
            'filters' => $request->only('status'),
        ]);
    }
}
