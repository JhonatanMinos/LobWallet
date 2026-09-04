<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class AuthService
{
    public function __construct(
        protected ApiService $api,
    ) {}

    public function login(
        string $email,
        string $password
    ): array {
        $response = $this->api->post('/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $token = $response['token'];

        Storage::disk('local')->put(
            'auth/token',
            $token
        );

        Storage::disk('local')->put(
            'auth/user.json',
            json_encode($response['user'])
        );

        return $response['user'];
    }

    public function token(): ?string
    {
        if (!Storage::disk('local')->exists('auth/token')) {
            return null;
        }

        return Storage::disk('local')->get('auth/token');
    }

    public function user(): ?array
    {
        if (!Storage::disk('local')->exists('auth/user.json')) {
            return null;
        }

        return json_decode(
            Storage::disk('local')->get('auth/user.json'),
            true
        );
    }

    public function logout(): void
    {
        Storage::disk('local')->delete([
            'auth/token',
            'auth/user.json',
        ]);
    }

    public function isAuthenticated(): bool
    {
        return $this->token() !== null;
    }
}

