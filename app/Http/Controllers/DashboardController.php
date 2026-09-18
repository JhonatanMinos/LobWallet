<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Services\SyncService;
use App\Models\Account;
use App\Models\Card;
use App\Models\Owner;
use App\Models\Transaction;

use Illuminate\Http\Request;
use App\Services\CardService;

class DashboardController extends Controller
{
    public function index(SyncService $sync)
    {
        $sync->sync();
        return Inertia::render('dashboard', [
            'accounts' => Account::all(),
            'owner' => Owner::all(),
            'cards' => Card::all(),
            'transactions' => Transaction::latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/create',[
            'accounts' => Account::all()
        ]);
    }

    public function store(Request $request, CardService $cardService) {
        $validated = $request->validate([
            'card'=> ['required', 'string'],
            'name' => ['required', 'string'],
            'lastName' => ['required','string'],
            'movil' => ['required','string'],
        ]);

        $cardService->store($validated);

        return back()->with('success','Tarjeta agregada correctamente');
    }
}

