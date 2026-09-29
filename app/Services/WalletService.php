<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class WalletService
{
    public function dashboard(): array
    {
        return [
            'account' => DB::table('accounts')
                ->select([
                    'id',
                    'account',
                    'balance',
                    'activo',
                    'pin'
                ])
                ->first(),

            'card' => DB::table('cards')
                ->select([
                    'id',
                    'account_id',
                    'card',
                    'status',
                ])->first(),

            'transactions' => DB::table('transactions')
                ->select([
                    'id',
                    'account_id',
                    'motion',
                    'amount',
                    'created_at',
                ])
                ->latest('created_at')
                ->limit(10)
                ->get(),
        ];
    }
}
