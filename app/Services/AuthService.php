<?php

namespace App\Services;

use RuntimeException;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

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

        if (
            !isset($response['token']) ||
            !isset($response['user'])
        ) {
            throw new RuntimeException(
                'Respuesta de autenticación inválida.'
            );
        }

        $this->storeToken($response['token']);
        $this->storeUser($response['user']);

        return $response['user'];
    }

    /**
     * Método utilizado por Fortify.
     *
     * Fortify necesita un User de Laravel o null.
     */
    public function authenticateForFortify(
        Request $request
    ): ?User {
        $email = $request->string('email')->toString();
        $password = $request->string('password')->toString();

        try {
            $apiUser = $this->login(
                $email,
                $password
            );

            return $this->syncLocalUser($apiUser);
        } catch (\Throwable $e) {
            report($e);

        return null;
        }
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
        $disk = Storage::disk('local');

        if (!$disk->exists('auth/user.json')) {
            return null;
        }

        return json_decode(
            $disk->get('auth/user.json'),
            true,
            512,
            JSON_THROW_ON_ERROR
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
        $token = $this->token();

        if (!$token) {
            return false;
        }

        try {
            $this->me($token);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Guarda el token remoto.
     */
    private function storeToken(string $token): void
    {
        Storage::disk('local')->put(
            'auth/token',
            $token
        );
    }

    /**
     * Guarda información del usuario remoto.
     */
    private function storeUser(array $user): void
    {
        Storage::disk('local')->put(
            'auth/user.json',
            json_encode(
                $user,
                JSON_THROW_ON_ERROR
            )
        );
    }

    /**
     * Sincroniza el usuario remoto con el User local
     * utilizado por Laravel/Fortify.
     */
    private function syncLocalUser(array $apiUser): User
    {
        $user = User::where('email', $apiUser['email'])->first();
        if (!$user) {
            $user = new User();
        }

        $user->id = $apiUser['id'];
        $user->name = $apiUser['name'];
        $user->email = $apiUser['email'];

        $user->save();

        return $user;
    }
}
