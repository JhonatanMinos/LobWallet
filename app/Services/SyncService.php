<?php

namespace App\Services;

use App\Models\MobileSession;
use Illuminate\Support\Facades\DB;

class SyncService
{
    public function __construct(
        protected ApiService $api,
        protected AuthService $auth,
    ) {}

    public function sync(): array
    {
        $token = $this->auth->token();

        if (!$token) {
            throw new \RuntimeException('Usuario no autenticado.');
        }

        $user = $this->auth->user();

        $session = MobileSession::where('user_id', $user['id'])->first();

        $lastSync = $session?->last_sync_at;

        $response = $this->api->get(
            '/sync?since=' . urlencode($lastSync ?? ''),
            $token
        );


        DB::transaction(function () use ($response, $user) {


            foreach ($response['accounts'] ?? [] as $account) {
                DB::table('accounts')->updateOrInsert(
                    [
                        'id' => $account['id'],
                    ],
                    [
                        'account' => $account['cuenta'],
                        'balance' => $account['saldo'],
                        'activo' => $account['estatus'],
                        'pin' => $account['pin'] ?? null,
                        'closes' => $account['cierre'] ?? null,
                        'created_at' => $account['created_at'],
                        'updated_at' => $account['updated_at']
                    ]
                );
            }

            foreach ($response['cards'] ?? [] as $card) {
                DB::table('cards')->updateOrInsert(
                    [
                        'id' => $card['id'],
                    ],
                    [
                        'account_id' => $card['account_id'],
                        'card' => $card['tarjeta'],
                        'status' => $card['estatus'],
                        'created_at' => $card['created_at'],
                        'updated_at' => $card['updated_at']
                    ]
                );
            }

            foreach ($response['transaction'] ?? [] as $transaction) {
                DB::table('transactions')->updateOrInsert(
                    [
                        'id' => $transaction['id'],
                    ],
                    [
                        'account_id' => $transaction['account_id'],
                        'user_id' => $transaction['user_id'],
                        'motion' => $transaction['movimiento'],
                        'amount' => $transaction['monto'],
                        'created_at' => $transaction['created_at'],
                        'updated_at' => $transaction['updated_at']

                    ]
                );
            }

            foreach ($response['owner'] ?? [] as $owner) {
                DB::table('owners')->updateOrInsert(
                    [
                        'id' => $owner['id'],
                    ],
                    [
                        'user_id' => $owner['user_id'],
                        'name' => $owner['nombres'],
                        'last_name' => $owner['apellidos'],
                        'movil' => $owner['movil'],
                        'created_at' => $account['created_at'],
                        'updated_at' => $account['updated_at']
                    ]
                );
            }

            foreach ($response['accountOwner'] ?? [] as $accountOwner) {
                DB::table('account_owner')->updateOrInsert(
                    [
                        'account_id' => $accountOwner['account_id'],
                    ],
                    [
                        'owner_id' => $accountOwner['owner_id'],
                    ]
                );
            }

            MobileSession::updateOrCreate(
                [
                    'user_id' => $user['id'],
                ],
                [
                    'email' => $user['email'],
                    'authenticated_at' => now(),
                    'last_sync_at' => $response['sync_timestamp'],
                ]
            );
        });

        return [
            'success' => true,
            'timestamp' => $response['sync_timestamp'],
        ];
    }
}

