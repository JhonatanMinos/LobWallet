<?php

namespace App\Services;

use RuntimeException;

class CardService
{
    public function __construct(
        protected ApiService $api,
        protected AuthService $auth,
    )
        {}

            public function store(array $data): array
            {
                $token = $this->auth->token();

                if(!$token){
                    throw new RuntimeException('El usuario no esta autenticado');
                }

                return $this->api->post(
                    '/card',$data,$token
                );
            }


}
