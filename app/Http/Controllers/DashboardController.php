<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();
        $isSubVendor = $user->isSubVendor();
        $isClient = $user->isClient();

        $projectQuery = Project::query();
        $taskQuery = Task::query();

        if ($isClient) {
            $projectQuery->whereHas('clients', fn ($q) => $q->where('users.id', $user->id));
            $taskQuery->whereHas('project.clients', fn ($q) => $q->where('users.id', $user->id));
        } elseif ($isSubVendor) {
            $projectQuery->whereHas('tasks', fn ($q) => $q->where('sub_vendor_id', $user->sub_vendor_id));
            $taskQuery->where('sub_vendor_id', $user->sub_vendor_id);
        }

        $stats = [
            'total_projects' => (clone $projectQuery)->count(),
            'active_projects' => (clone $projectQuery)->active()->count(),
            'completed_projects' => (clone $projectQuery)->where('status', 'done')->count(),
            'total_tasks' => (clone $taskQuery)->count(),
            'total_team' => ($isSubVendor || $isClient) ? 0 : User::whereIn('role', ['admin_vendor', 'team'])->count(),
            'total_clients' => ($isSubVendor || $isClient) ? 0 : User::where('role', 'client')->count(),
        ];

        $recentProjects = (clone $projectQuery)
            ->with('vendor:id,name')
            ->withCount('tasks')
            ->latest()
            ->take(5)
            ->get();

        $projectStatusBreakdown = (clone $projectQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $taskStatusBreakdown = (clone $taskQuery)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $myProjects = (clone $projectQuery)
            ->active()
            ->withCount('tasks')
            ->latest()
            ->take(6)
            ->get();

        $myTasksQuery = Task::with('project:id,name')->where('status', '!=', 'done');

        if ($isSubVendor) {
            $myTasksQuery->where('sub_vendor_id', $user->sub_vendor_id);
        } else {
            $myTasksQuery->where('assigned_to', $user->id);
        }

        $myTasks = (clone $myTasksQuery)->latest()->take(10)->get();

        $overdueTasks = (clone $myTasksQuery)
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->count();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentProjects' => $recentProjects,
            'projectStatusBreakdown' => $projectStatusBreakdown,
            'taskStatusBreakdown' => $taskStatusBreakdown,
            'myProjects' => $myProjects,
            'myTasks' => $myTasks,
            'overdueTasks' => $overdueTasks,
        ]);
    }
}
