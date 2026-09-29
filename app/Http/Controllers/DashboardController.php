<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Account;
use App\Models\Card;
use App\Models\Transaction;

use Illuminate\Http\Request;
use App\Services\CardService;
use App\Services\WalletService;

class DashboardController extends Controller
{
    public function index(WalletService $wallet)
    {
        return Inertia::render('dashboard', [
            ...$wallet->dashboard(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/create', [
            'accounts' => Account::all()
        ]);
    }

    public function store(Request $request, CardService $cardService)
    {
        $validated = $request->validate([
            'card' => ['required', 'string'],
            'name' => ['required', 'string'],
            'lastName' => ['required', 'string'],
            'movil' => ['required', 'string'],
        ]);

        $cardService->store($validated);

        return back()->with('success', 'Tarjeta agregada correctamente');
    }
}
