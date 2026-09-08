<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
     Route::get('dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');
     Route::get('newCard', [DashboardController::class, 'create'])
        ->name('card.create');

    Route::post('card', [DashboardController::class, 'store'])
        ->name('card.store');});

require __DIR__ . '/settings.php';
