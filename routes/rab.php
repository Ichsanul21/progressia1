<?php

use App\Http\Controllers\RabOverviewController;
use App\Http\Controllers\RabTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin,admin_vendor'])->group(function () {
    Route::get('/rab', [RabOverviewController::class, 'index'])->name('rab.index');
    Route::get('/rab/templates/{rabTemplate}/download', [RabTemplateController::class, 'download'])->name('rab.templates.download');
    Route::delete('/rab/templates/{rabTemplate}', [RabTemplateController::class, 'destroy'])->name('rab.templates.destroy');
});
