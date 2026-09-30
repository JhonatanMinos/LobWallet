<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('newCard', [DashboardController::class, 'create'])
        ->name('accountCard.create');

    Route::post('card', [DashboardController::class, 'store'])
        ->name('accountCard.store');

    Route::get('store', [StoreController::class, 'index'])->name('store.index');

    Route::post('/sync', SyncController::class)->name('sync');
});

require __DIR__ . '/settings.php';
