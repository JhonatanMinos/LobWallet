<?php

use App\Http\Controllers\GifdCardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard')
        ->name('dashboard');
});

require __DIR__ . '/settings.php';
