<?php

namespace App\Services;

use RuntimeException;

class PromotionService
{
    public function __construct(
        protected ApiService $api,
        protected AuthService $auth,
    ) {}

    public function promotions(): array
    {
        $token = $this->auth->token();

        if (! $token) {
            throw new RuntimeException('Usuario no autenticado');
        }

        $response = $this->api->get('promotions', $token);

        if (array_is_list($response)) {
            return ['promotions' => $response];
        }

        return [
            'promotions' => $response['promotions']
                ?? $response['data']
                ?? [],
        ];
    }
}
