<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Services\SyncService;
use App\Models\Account;
use App\Models\Card;
use App\Models\Transaction;


class DashboardController extends Controller
{
    public function index(SyncService $sync)
    {
        $sync->sync();
        return Inertia::render('dashboard', [
            'accounts' => Account::all(),
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
}

