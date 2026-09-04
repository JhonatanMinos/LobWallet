<?php

namespace App\Services;

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
            throw new \RuntimeException(
                'Usuario no autenticado.'
            );
        }

        $lastSync = $this->lastSync();

        $response = $this->api->get(
            '/sync?since=' . urlencode($lastSync ?? ''),
            $token
        );

        DB::transaction(function () use ($response) {

            foreach ($response['customers'] ?? [] as $customer) {
                DB::table('customers')->updateOrInsert(
                    [
                        'id' => $customer['id'],
                    ],
                    [
                        'name' => $customer['name'],
                        'email' => $customer['email'],
                        'updated_at' => $customer['updated_at'],
                    ]
                );
            }

            foreach ($response['products'] ?? [] as $product) {
                DB::table('products')->updateOrInsert(
                    [
                        'id' => $product['id'],
                    ],
                    [
                        'name' => $product['name'],
                        'price' => $product['price'],
                        'updated_at' => $product['updated_at'],
                    ]
                );
            }
        });

        $this->saveLastSync(
            $response['sync_timestamp']
        );

        return [
            'success' => true,
            'timestamp' => $response['sync_timestamp'],
        ];
    }

    protected function lastSync(): ?string
    {
        $value = DB::table('sync_state')
            ->where('key', 'last_sync')
            ->value('value');

        return $value;
    }

    protected function saveLastSync(string $timestamp): void
    {
        DB::table('sync_state')->updateOrInsert(
            [
                'key' => 'last_sync',
            ],
            [
                'value' => $timestamp,
            ]
        );
    }
}

