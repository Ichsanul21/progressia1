<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\SubVendorController;
use App\Http\Controllers\VendorController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('vendors', VendorController::class)->except(['show']);
    Route::post('vendors/{id}/restore', [VendorController::class, 'restore'])->name('vendors.restore');

    Route::get('users', [UserController::class, 'index'])->name('users.index');

    Route::resource('registrants', \App\Http\Controllers\RegistrantController::class)->only(['index', 'show', 'destroy']);
    Route::patch('registrants/{registrant}/status', [\App\Http\Controllers\RegistrantController::class, 'updateStatus'])->name('registrants.update-status');
    Route::post('registrants/{registrant}/convert', [\App\Http\Controllers\RegistrantController::class, 'convert'])->name('registrants.convert');

    Route::get('users/contact-history', [UserController::class, 'contactHistory'])->name('users.contact-history');
});

Route::middleware(['auth', 'role:super_admin,admin_vendor'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('sub-vendors', SubVendorController::class)->except(['show']);
    Route::post('sub-vendors/{subVendor}/users', [SubVendorController::class, 'attachUser'])->name('sub-vendors.users.attach');
    Route::delete('sub-vendors/{subVendor}/users/{user}', [SubVendorController::class, 'detachUser'])->name('sub-vendors.users.detach');

    Route::get('team', [UserController::class, 'team'])->name('team.index');
    Route::get('project-managers', [UserController::class, 'projectManagers'])->name('project-managers.index');
    Route::get('clients', [UserController::class, 'clients'])->name('clients.index');
    Route::get('sub-vendor-users', [UserController::class, 'subVendorUsers'])->name('sub-vendor-users.index');

    Route::get('users/search', [UserController::class, 'search'])->name('users.search');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
});
