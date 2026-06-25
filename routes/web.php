<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\PublicReportController;
use App\Http\Controllers\SearchController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('landing');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('calendar', CalendarController::class)->name('calendar');
    Route::get('tasks/inbox', InboxController::class)->name('tasks.inbox');
    Route::get('approvals', [ApprovalController::class, 'index'])->name('approvals.index');
    Route::post('approvals/{approval}/approve', [ApprovalController::class, 'approve'])->name('approvals.approve');
    Route::post('approvals/{approval}/reject', [ApprovalController::class, 'reject'])->name('approvals.reject');
    Route::get('api/search', SearchController::class)->name('api.search');
});

Route::get('/r/{token}', [PublicReportController::class, 'show'])->name('public.report.show');
Route::post('/r/{token}', [PublicReportController::class, 'unlock'])
    ->middleware('throttle:10,1')
    ->name('public.report.unlock');
Route::post('/r/{token}/logout', [PublicReportController::class, 'logout'])->name('public.report.logout');
Route::get('/r/{token}/pdf', [PublicReportController::class, 'pdf'])->name('public.report.pdf');
Route::get('/r/{token}/csv', [PublicReportController::class, 'csv'])->name('public.report.csv');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
