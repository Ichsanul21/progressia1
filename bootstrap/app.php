<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\ForcePasswordChange;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: [__DIR__.'/../routes/web.php', __DIR__.'/../routes/admin.php', __DIR__.'/../routes/projects.php', __DIR__.'/../routes/notifications.php', __DIR__.'/../routes/reports.php', __DIR__.'/../routes/rab.php'],
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->appendToGroup('web', [
            'throttle:web',
            ForcePasswordChange::class,
        ]);

        $middleware->trustProxies(at: '*');

        $middleware->validateCsrfTokens(except: [
            'r',
            'r/*',
        ]);

        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, \Illuminate\Http\Request $request) {
            if (! $request->header('X-Inertia')) {
                return null;
            }

            $fallback = $request->header('Referer') ?: route('dashboard');

            return redirect()->to($fallback, 303)->with('error', 'Anda tidak memiliki akses ke halaman ini.');
        });
    })->create();
