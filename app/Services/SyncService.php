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

    /**
     * @return array{success: true, timestamp: string, has_changes: bool}
     */
    public function sync(): array
    {
        $token = $this->auth->token();

        if (! $token) {
            throw new \RuntimeException('Usuario no autenticado.');
        }

        $user = $this->auth->authenticatedUser();

        $session = MobileSession::where('user_id', $user['id'])->first();

        $lastSync = $session?->last_sync_at;

        $response = $this->api->get(
            '/sync',
            $token,
            ['since' => $lastSync?->toDateTimeString() ?? ''],
        );

        $hasChanges = DB::transaction(function () use ($response, $user): bool {
            $hasChanges = false;

            foreach ($response['accounts'] ?? [] as $account) {
                $hasChanges = $this->upsertWalletRow(
                    'accounts',
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
                        'updated_at' => $account['updated_at'],
                    ]
                ) || $hasChanges;
            }

            foreach ($response['cards'] ?? [] as $card) {
                $hasChanges = $this->upsertWalletRow(
                    'cards',
                    [
                        'id' => $card['id'],
                    ],
                    [
                        'account_id' => $card['account_id'],
                        'card' => $card['tarjeta'],
                        'status' => $card['estatus'],
                        'created_at' => $card['created_at'],
                        'updated_at' => $card['updated_at'],
                    ]
                ) || $hasChanges;
            }

            foreach ($response['transaction'] ?? [] as $transaction) {
                $hasChanges = $this->upsertWalletRow(
                    'transactions',
                    [
                        'id' => $transaction['id'],
                    ],
                    [
                        'account_id' => $transaction['account_id'],
                        'user_id' => $transaction['user_id'],
                        'motion' => $transaction['movimiento'],
                        'amount' => $transaction['monto'],
                        'created_at' => $transaction['created_at'],
                        'updated_at' => $transaction['updated_at'],

                    ]
                ) || $hasChanges;
            }

            foreach ($response['owner'] ?? [] as $owner) {
                $hasChanges = $this->upsertWalletRow(
                    'owners',
                    [
                        'id' => $owner['id'],
                    ],
                    [
                        'user_id' => $owner['user_id'],
                        'name' => $owner['nombres'],
                        'last_name' => $owner['apellidos'],
                        'movil' => $owner['movil'],
                        'created_at' => $owner['created_at'],
                        'updated_at' => $owner['updated_at'],
                    ]
                ) || $hasChanges;
            }

            foreach ($response['accountOwner'] ?? [] as $accountOwner) {
                $hasChanges = $this->upsertWalletRow(
                    'account_owner',
                    [
                        'account_id' => $accountOwner['account_id'],
                        'owner_id' => $accountOwner['owner_id'],
                    ],
                    [],
                ) || $hasChanges;
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

            return $hasChanges;
        });

        return [
            'success' => true,
            'timestamp' => $response['sync_timestamp'],
            'has_changes' => $hasChanges,
        ];
    }

    /**
     * @param  non-empty-array<string, int|numeric-string>  $key
     * @param  array<string, bool|float|int|string|null>  $values
     */
    private function upsertWalletRow(string $table, array $key, array $values): bool
    {
        $walletValues = $values;
        unset($walletValues['updated_at']);

        // Transaction dates affect the displayed history and its ordering.
        if ($table !== 'transactions') {
            unset($walletValues['created_at']);
        }

        // Compare using database types, including numeric strings and nullable fields.
        $hasChanges = ! DB::table($table)->where($key)->where($walletValues)->exists();

        DB::table($table)->updateOrInsert($key, $values);

        return $hasChanges;
    }
}
