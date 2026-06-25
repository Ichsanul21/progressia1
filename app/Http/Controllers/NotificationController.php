<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Notification::where('user_id', $request->user()->id);

        if ($request->get('read') === 'unread') {
            $query->unread();
        } elseif ($request->get('read') === 'read') {
            $query->where('is_read', true);
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        $notifications = $query->latest()->paginate(20);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'filters' => $request->only('read', 'type'),
        ]);
    }

    public function unread(): \Illuminate\Http\JsonResponse
    {
        $count = Notification::where('user_id', request()->user()->id)
            ->unread()
            ->count();

        $latest = Notification::where('user_id', request()->user()->id)
            ->unread()
            ->latest()
            ->take(5)
            ->get();

        return response()->json(['count' => $count, 'latest' => $latest]);
    }

    public function markRead(Notification $notification): RedirectResponse
    {
        if ($notification->user_id !== request()->user()->id) {
            abort(403);
        }

        $notification->update(['is_read' => true]);

        return back();
    }

    public function markAllRead(): RedirectResponse
    {
        Notification::where('user_id', request()->user()->id)
            ->unread()
            ->update(['is_read' => true]);

        return back();
    }
}
