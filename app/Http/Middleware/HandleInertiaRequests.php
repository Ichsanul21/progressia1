<?php

namespace App\Http\Middleware;

use App\Models\Registrant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $pendingRegistrantsCount = $user && $user->isSuperAdmin()
            ? Registrant::where('status', Registrant::STATUS_PENDING)->count()
            : 0;

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'pendingRegistrantsCount' => $pendingRegistrantsCount,
        ]);
    }
}
