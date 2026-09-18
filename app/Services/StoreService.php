<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class StoreService
{
    public function __construct(
        protected ApiService $api,
        protected AuthService $auth,
        ){}

    public function stores(): array
    {
        $token = $this->auth->token();

        if(!$token){
            throw new \RuntimeException(
                'Usuario no autenticado'
            );
        }

        return $this->api->get('stores', $token);
    }
}
