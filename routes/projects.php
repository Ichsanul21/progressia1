<?php

use App\Http\Controllers\BatchTaskController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PhaseController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectReportLinkController;
use App\Http\Controllers\RabItemController;
use App\Http\Controllers\SubTaskController;
use App\Http\Controllers\TaskAttachmentController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('/projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/trash', [ProjectController::class, 'trash'])->name('projects.trash');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::post('/projects/{project}/duplicate', [ProjectController::class, 'duplicate'])->name('projects.duplicate');
    Route::post('/projects/{project}/archive', [ProjectController::class, 'archive'])->name('projects.archive');
    Route::post('/projects/{project}/unarchive', [ProjectController::class, 'unarchive'])->name('projects.unarchive');
    Route::post('/projects/{project}/favorite', [ProjectController::class, 'toggleFavorite'])->name('projects.favorite');
    Route::post('/projects/{project}/tags', [ProjectController::class, 'updateTags'])->name('projects.tags.update');
    Route::post('/projects/{project}/members', [ProjectController::class, 'attachMember'])->name('projects.members.attach');
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'detachMember'])->name('projects.members.detach');
    Route::post('/projects/{project}/clients', [ProjectController::class, 'attachClient'])->name('projects.clients.attach');
    Route::delete('/projects/{project}/clients/{user}', [ProjectController::class, 'detachClient'])->name('projects.clients.detach');
    Route::post('/projects/{id}/restore', [ProjectController::class, 'restore'])->name('projects.restore');
    Route::delete('/projects/{id}/force-delete', [ProjectController::class, 'forceDelete'])->name('projects.force-delete');

    Route::post('/projects/{project}/report-links', [ProjectReportLinkController::class, 'store'])->name('projects.report-links.store');
    Route::get('/projects/{project}/report-links/{link}/reveal', [ProjectReportLinkController::class, 'reveal'])->name('projects.report-links.reveal');
    Route::post('/projects/{project}/report-links/{link}/reset-password', [ProjectReportLinkController::class, 'resetPassword'])->name('projects.report-links.reset-password');
    Route::delete('/projects/{project}/report-links/{link}', [ProjectReportLinkController::class, 'destroy'])->name('projects.report-links.destroy');

    Route::get('/projects/{project}/rab', [RabItemController::class, 'index'])->name('projects.rab.index');
    Route::post('/projects/{project}/rab', [RabItemController::class, 'store'])->name('projects.rab.store');
    Route::put('/projects/{project}/rab/{rabItem}', [RabItemController::class, 'update'])->name('projects.rab.update');
    Route::delete('/projects/{project}/rab/{rabItem}', [RabItemController::class, 'destroy'])->name('projects.rab.destroy');
    Route::post('/projects/{project}/rab/import', [RabItemController::class, 'import'])->name('projects.rab.import');
    Route::get('/projects/{project}/rab/export', [RabItemController::class, 'export'])->name('projects.rab.export');
    Route::get('/projects/{project}/rab/export-template', [RabItemController::class, 'exportTemplate'])->name('projects.rab.export-template');

    Route::post('/projects/{project}/phases', [PhaseController::class, 'store'])->name('phases.store');
    Route::put('/projects/{project}/phases/{phase}', [PhaseController::class, 'update'])->name('phases.update');
    Route::delete('/projects/{project}/phases/{phase}', [PhaseController::class, 'destroy'])->name('phases.destroy');

    Route::post('/projects/{project}/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/projects/{project}/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::delete('/projects/{project}/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');

    Route::get('/projects/{project}/tasks', [TaskController::class, 'index'])->name('projects.tasks.index');
    Route::get('/projects/{project}/tasks/kanban', [TaskController::class, 'kanban'])->name('projects.tasks.kanban');
    Route::get('/projects/{project}/tasks/gantt', [TaskController::class, 'gantt'])->name('projects.tasks.gantt');
    Route::get('/projects/{project}/calendar', [CalendarController::class, 'project'])->name('projects.calendar');
    Route::post('/projects/{project}/tasks/status', [TaskController::class, 'updateStatus'])->name('projects.tasks.update-status');
    Route::get('/projects/{project}/tasks/create', [TaskController::class, 'create'])->name('projects.tasks.create');
    Route::post('/projects/{project}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store');
    Route::get('/projects/{project}/tasks/{task}', [TaskController::class, 'show'])->name('projects.tasks.show');
    Route::get('/projects/{project}/tasks/{task}/edit', [TaskController::class, 'edit'])->name('projects.tasks.edit');
    Route::match(['PUT', 'POST'], '/projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('projects.tasks.update');
    Route::put('/projects/{project}/tasks/{task}/progress', [TaskController::class, 'updateProgress'])->name('tasks.update-progress');
    Route::get('/projects/{project}/tasks/{task}/timeline', [TaskController::class, 'timeline'])->name('tasks.timeline');
    Route::delete('/projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('projects.tasks.destroy');

    Route::post('/projects/{project}/tasks/{task}/sub-tasks', [SubTaskController::class, 'store'])->name('sub-tasks.store');
    Route::put('/projects/{project}/tasks/{task}/sub-tasks/{subTask}', [SubTaskController::class, 'update'])->name('sub-tasks.update');
    Route::put('/projects/{project}/tasks/{task}/sub-tasks/{subTask}/progress', [SubTaskController::class, 'updateProgress'])->name('sub-tasks.update-progress');
    Route::delete('/projects/{project}/tasks/{task}/sub-tasks/{subTask}', [SubTaskController::class, 'destroy'])->name('sub-tasks.destroy');

    Route::post('/projects/{project}/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('task-attachments.store');
    Route::get('/projects/{project}/tasks/{task}/attachments/{attachment}/download', [TaskAttachmentController::class, 'download'])->name('task-attachments.download');
    Route::delete('/projects/{project}/tasks/{task}/attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('task-attachments.destroy');

    Route::post('/projects/{project}/tasks/batch/status', [BatchTaskController::class, 'updateStatus'])->name('projects.tasks.batch.status');
    Route::post('/projects/{project}/tasks/batch/assign', [BatchTaskController::class, 'assign'])->name('projects.tasks.batch.assign');
    Route::post('/projects/{project}/tasks/batch/destroy', [BatchTaskController::class, 'destroy'])->name('projects.tasks.batch.destroy');

    Route::post('/projects/{project}/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('task-comments.store');
    Route::delete('/projects/{project}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])->name('task-comments.destroy');
});
