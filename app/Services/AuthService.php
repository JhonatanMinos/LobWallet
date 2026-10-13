<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use JsonException;
use RuntimeException;

class AuthService
{
    private const PENDING_SESSION = 'remote_auth.pending';

    public function __construct(
        protected ApiService $api,
        protected WalletService $wallet,
    ) {}

    /**
     * @return array{id: int, name: string, email: string}
     */
    public function login(string $email, string $password): array
    {
        $credentials = $this->requestCredentials($email, $password);
        $this->persistSession($credentials);

        return $credentials['user'];
    }

    /**
     * Método utilizado por Fortify.
     *
     * Fortify necesita un User de Laravel o null.
     */
    public function authenticateForFortify(Request $request): ?User
    {
        // Fortify invokes this callback for both the two-factor precheck and login.
        $validatedUser = $request->attributes->get('remote_auth.user');
        if ($validatedUser instanceof User) {
            return $validatedUser;
        }

        $request->session()->forget(self::PENDING_SESSION);

        try {
            $credentials = $this->requestCredentials(
                $request->string('email')->toString(),
                $request->string('password')->toString(),
            );
            $user = DB::transaction(fn () => $this->syncLocalUser($credentials['user']));
            $request->session()->put(self::PENDING_SESSION, $credentials);
            $request->attributes->set('remote_auth.user', $user);

            return $user;
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    public function completeLogin(User $user, Request $request): void
    {
        $pending = $request->session()->pull(self::PENDING_SESSION);

        // Passkey/remember-me logins have no new remote credentials to publish.
        if ($pending === null) {
            if (($this->user()['id'] ?? null) != $user->id) {
                $this->logout();
            }

            return;
        }

        $credentials = $this->validateCredentials($pending);
        if ($credentials['user']['id'] != $user->id) {
            // A different successful passkey login must not publish a pending challenge.
            if (($this->user()['id'] ?? null) != $user->id) {
                $this->logout();
            }

            return;
        }

        $this->persistSession($credentials);
    }

    public function token(): ?string
    {
        $disk = Storage::disk('local');
        if (! $disk->exists('auth/token')) {
            return null;
        }

        $token = $disk->get('auth/token');

        return $this->validToken($token) ? $token : null;
    }

    /**
     * @return array{id: int, email: string, name?: string}|null
     */
    public function user(): ?array
    {
        $disk = Storage::disk('local');
        if (! $disk->exists('auth/user.json')) {
            return null;
        }

        $contents = $disk->get('auth/user.json');
        if ($contents === null) {
            return null;
        }

        try {
            return $this->validateUser(json_decode($contents, true, 512, JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return null;
        }
    }

    /**
     * @return array{id: int, email: string, name?: string}
     */
    public function authenticatedUser(): array
    {
        $user = $this->user();
        $localId = Auth::id();
        if ($this->token() === null || $user === null || $localId === null || $user['id'] != $localId) {
            throw new RuntimeException('Usuario no autenticado.');
        }

        return $user;
    }

    public function logout(): void
    {
        $this->persistSession(null);
    }

    public function isAuthenticated(): bool
    {
        try {
            $this->authenticatedUser();

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    private function validToken(mixed $token): bool
    {
        return is_string($token) && $token !== '' && preg_match('/[\x00-\x20\x7f]/', $token) === 0;
    }

    /**
     * @return array{id: int, email: string, name?: string}|null
     */
    private function validateUser(mixed $user): ?array
    {
        if (! is_array($user) || ! isset($user['id'], $user['email'])) {
            return null;
        }

        $id = $user['id'];
        if ((! is_int($id) && (! is_string($id) || ! ctype_digit($id)))
            || ! is_string($user['email']) || trim($user['email']) === ''
            || (array_key_exists('name', $user) && ! is_string($user['name']))) {
            return null;
        }

        // Validate the database integer range before comparing identities.
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (! is_int($id) || $id <= 0) {
            return null;
        }

        $validated = ['id' => $id, 'email' => $user['email']];
        if (array_key_exists('name', $user)) {
            $validated['name'] = $user['name'];
        }

        return $validated;
    }

    /**
     * @return array{token: string, user: array{id: int, name: string, email: string}}
     */
    private function validateCredentials(mixed $response): array
    {
        $user = is_array($response) ? $this->validateUser($response['user'] ?? null) : null;
        if (! is_array($response) || ! is_string($response['token'] ?? null) || ! $this->validToken($response['token'])
            || $user === null || ! is_string($user['name'] ?? null) || trim($user['name']) === '') {
            throw new RuntimeException('Respuesta de autenticación inválida.');
        }

        return ['token' => $response['token'], 'user' => [
            'id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        ]];
    }

    /**
     * @return array{token: string, user: array{id: int, name: string, email: string}}
     */
    private function requestCredentials(string $email, string $password): array
    {
        return $this->validateCredentials($this->api->post('/login', [
            'email' => $email,
            'password' => $password,
        ]));
    }

    /**
     * @param  array{token: string, user: array{id: int, name: string, email: string}}|null  $credentials
     */
    private function persistSession(?array $credentials): void
    {
        $disk = Storage::disk('local');
        $previous = [];
        foreach (['auth/token', 'auth/user.json'] as $path) {
            $exists = $disk->exists($path);
            $previous[$path] = $exists ? $disk->get($path) : null;
            if ($exists && $previous[$path] === null) {
                throw new RuntimeException('No se pudo leer la sesión local.');
            }
        }

        try {
            DB::transaction(function () use ($credentials, $disk): void {
                if ($credentials === null) {
                    $this->wallet->resetSnapshot();
                    if (! $disk->delete(['auth/token', 'auth/user.json'])) {
                        throw new RuntimeException('No se pudo eliminar la sesión local.');
                    }

                    return;
                }

                $previousId = $this->user()['id'] ?? null;
                $this->syncLocalUser($credentials['user']);
                if ($previousId != $credentials['user']['id']) {
                    $this->wallet->resetSnapshot();
                }

                if (! $disk->put('auth/user.json', json_encode($credentials['user'], JSON_THROW_ON_ERROR))
                    || ! $disk->put('auth/token', $credentials['token'])) {
                    throw new RuntimeException('No se pudo guardar la sesión local.');
                }
            });
        } catch (\Throwable $exception) {
            // SQL rollback cannot restore files, including writes that returned false.
            try {
                foreach ($previous as $path => $contents) {
                    $restored = $contents === null ? $disk->delete($path) : $disk->put($path, $contents);
                    if (! $restored) {
                        throw new RuntimeException('No se pudo restaurar la sesión local.');
                    }
                }
            } catch (\Throwable $restoreFailure) {
                if (! $disk->delete(['auth/token', 'auth/user.json'])) {
                    throw new RuntimeException('No se pudo limpiar la sesión local tras el fallo.', previous: $restoreFailure);
                }

                throw new RuntimeException('No se pudo restaurar la sesión local.', previous: $restoreFailure);
            }

            throw $exception;
        }
    }

    /**
     * Sincroniza el usuario remoto con el User local
     * utilizado por Laravel/Fortify.
     *
     * @param  array{id: int, name: string, email: string}  $apiUser
     */
    private function syncLocalUser(array $apiUser): User
    {
        $user = User::where('email', $apiUser['email'])->first();
        if (! $user) {
            $user = new User;
        }

        $user->id = $apiUser['id'];
        $user->name = $apiUser['name'];
        $user->email = $apiUser['email'];
        if (! $user->save()) {
            throw new RuntimeException('No se pudo guardar el usuario local.');
        }

        return $user;
    }
}
