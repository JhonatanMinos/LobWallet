<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\ApiService;
use App\Services\AuthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Features;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class RemoteSessionLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $previous;

    private User $next;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Storage::fake('local');
        $this->app->instance(ApiService::class, new ApiService('https://wallet-api.test'));
        $this->previous = User::factory()->withTwoFactor()->create();
        $this->next = User::factory()->create();
        Storage::disk('local')->put('auth/token', 'previous-token');
        Storage::disk('local')->put('auth/user.json', json_encode($this->remoteUser($this->previous), JSON_THROW_ON_ERROR));
        $this->seedSnapshot();
        DB::table('passkeys')->insert([
            'user_id' => $this->previous->id, 'name' => 'Existing passkey',
            'credential_id' => 'test-credential', 'credential' => '{}',
        ]);
    }

    public function test_post_logout_clears_credentials_wallet_and_cursor_but_keeps_local_identity(): void
    {
        $twoFactor = $this->previous->getRawOriginal('two_factor_secret');
        $this->actingAs($this->previous)->post(route('logout'))->assertRedirect(route('home'));

        $this->assertGuest();
        $this->assertCredentialsMissing();
        $this->assertSnapshotEmpty();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseHas('passkeys', ['credential_id' => 'test-credential']);
        $this->assertSame($twoFactor, $this->previous->fresh()->getRawOriginal('two_factor_secret'));
        Http::assertNothingSent();
        $this->auth()->logout();
        $this->assertSnapshotEmpty();
    }

    public function test_successful_login_switches_credentials_and_removes_the_previous_snapshot(): void
    {
        Http::fake([
            'wallet-api.test/login' => Http::response($this->loginResponse()),
            'wallet-api.test/sync*' => Http::response(['sync_timestamp' => '2026-10-13 11:00:00']),
        ]);
        $this->withSession(['probe' => 'preserved']);
        $previousSessionId = $this->app['session']->getId();

        $this->post(route('login.store'), $this->loginFields())->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($this->next);
        $this->assertNotSame($previousSessionId, $this->app['session']->getId());
        $this->assertSame('preserved', $this->app['session']->get('probe'));
        $this->assertSame('next-token', Storage::disk('local')->get('auth/token'));
        $this->assertSame($this->next->id, $this->auth()->user()['id']);
        $this->assertSnapshotEmpty();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('passkeys', 1);
        Http::assertSentCount(1);

        $this->postJson(route('sync'))->assertOk();

        Http::assertSent(function ($request) {
            parse_str(parse_url($request->url(), PHP_URL_QUERY) ?? '', $query);

            return str_contains($request->url(), '/sync') && ($query['since'] ?? null) === ''
                && $request->hasHeader('Authorization', 'Bearer next-token');
        });
        $this->assertDatabaseHas('mobile_session', ['user_id' => $this->next->id, 'last_sync_at' => '2026-10-13 11:00:00']);
    }

    public function test_same_remote_user_login_retains_its_snapshot(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response([
            'token' => 'renewed-token', 'user' => $this->remoteUser($this->previous),
        ])]);
        $before = $this->snapshot();

        $this->auth()->login($this->previous->email, 'password');

        $this->assertSame($before, $this->snapshot());
        $this->assertSame('renewed-token', $this->auth()->token());
    }

    public function test_first_remote_login_can_create_a_local_user_without_deleting_existing_users(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response([
            'token' => 'new-user-token',
            'user' => ['id' => 99, 'name' => 'New User', 'email' => 'new@example.test'],
        ])]);

        $this->post(route('login.store'), ['email' => 'new@example.test', 'password' => 'password'])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseHas('users', ['id' => 99, 'email' => 'new@example.test']);
        $this->assertSnapshotEmpty();
        $this->assertSame('new-user-token', $this->auth()->token());
    }

    public function test_login_without_remote_candidate_clears_another_users_snapshot(): void
    {
        $this->app->instance('request', $this->loginRequest());

        Auth::login($this->next);

        $this->assertAuthenticatedAs($this->next);
        $this->assertCredentialsMissing();
        $this->assertSnapshotEmpty();
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('passkeys', 1);
        Http::assertNothingSent();
    }

    public function test_different_successful_login_does_not_publish_a_pending_two_factor_candidate(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        $request = $this->loginRequest();
        $this->auth()->authenticateForFortify($request);
        $this->app->instance('request', $request);

        Auth::login($this->previous);

        $this->assertAuthenticatedAs($this->previous);
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
        $this->assertFalse($request->session()->has('remote_auth.pending'));
    }

    public function test_failed_remote_authentication_preserves_credentials_and_snapshot(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response([], 401)]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();

        $this->post(route('login.store'), $this->loginFields())->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
    }

    #[DataProvider('invalidLoginResponses')]
    public function test_malformed_remote_login_does_not_publish_credentials(array $response): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($response)]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();

        try {
            $this->auth()->login($this->next->email, 'password');
            $this->fail('Malformed login should fail.');
        } catch (RuntimeException) {
            $this->assertSame($files, $this->credentialFiles());
            $this->assertSame($before, $this->snapshot());
        }
    }

    public static function invalidLoginResponses(): array
    {
        $user = ['id' => 2, 'name' => 'Next', 'email' => 'next@example.test'];

        return [
            'empty token' => [['token' => '', 'user' => $user]],
            'non-string token' => [['token' => [], 'user' => $user]],
            'missing identity' => [['token' => 'next-token', 'user' => []]],
            'non-integer identity' => [['token' => 'next-token', 'user' => [...$user, 'id' => []]]],
            'missing name' => [['token' => 'next-token', 'user' => ['id' => 2, 'email' => 'next@example.test']]],
        ];
    }

    public function test_local_user_save_failure_does_not_publish_remote_credentials(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        User::saving(function (User $user) {
            if ($user->id === $this->next->id) {
                throw new RuntimeException('Simulated local user failure');
            }
        });

        $this->assertNull($this->auth()->authenticateForFortify($this->loginRequest()));
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
    }

    public function test_cancelled_local_user_save_is_not_treated_as_success(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        User::saving(fn (User $user) => $user->id !== $this->next->id);

        $this->assertNull($this->auth()->authenticateForFortify($this->loginRequest()));
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
    }

    #[DataProvider('credentialPaths')]
    public function test_file_publication_failure_restores_credentials_and_database(string $failedPath): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        $disk = Storage::disk('local');
        $mock = Mockery::mock($disk);
        $state = (object) ['failed' => false];
        $mock->shouldReceive('put')->with(Mockery::any(), Mockery::any())->andReturnUsing(
            function ($path, $contents) use ($disk, $failedPath, $state) {
                if ($path === $failedPath && ! $state->failed) {
                    $state->failed = true;
                    $disk->put($path, 'partial-write');

                    return false;
                }

                return $disk->put($path, $contents);
            }
        );
        Storage::shouldReceive('disk')->with('local')->andReturn($mock);

        try {
            $this->auth()->login($this->next->email, 'password');
            $this->fail('Failed credential write should fail login.');
        } catch (RuntimeException $exception) {
            $this->assertSame('No se pudo guardar la sesión local.', $exception->getMessage(), $exception->getPrevious()?->getMessage() ?? '');
            $this->assertSame($files, $this->credentialFiles());
            $this->assertSame($before, $this->snapshot());
        }
    }

    public static function credentialPaths(): array
    {
        return ['token' => ['auth/token'], 'user' => ['auth/user.json']];
    }

    public function test_failed_publication_aborts_the_attempted_laravel_session(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        $disk = Storage::disk('local');
        $mock = Mockery::mock($disk);
        $state = (object) ['failed' => false];
        $mock->shouldReceive('put')->andReturnUsing(function ($path, $contents) use ($disk, $state) {
            if ($path === 'auth/token' && ! $state->failed) {
                $state->failed = true;

                return false;
            }

            return $disk->put($path, $contents);
        });
        Storage::shouldReceive('disk')->with('local')->andReturn($mock);
        $this->withoutExceptionHandling();

        try {
            $this->post(route('login.store'), [...$this->loginFields(), 'remember' => true]);
            $this->fail('Publication failure should abort Laravel login.');
        } catch (RuntimeException $exception) {
            $this->assertSame('No se pudo guardar la sesión local.', $exception->getMessage());
        }

        $this->assertGuest();
        $this->assertFalse($this->app['session']->has('remote_auth.pending'));
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
        $this->assertFalse(app('cookie')->hasQueued(Auth::guard()->getRecallerName()));
    }

    public function test_failed_compensation_removes_credentials_instead_of_leaving_mixed_identity(): void
    {
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $disk = Storage::disk('local');
        $mock = Mockery::mock($disk);
        $mock->shouldReceive('put')->andReturnUsing(function ($path, $contents) use ($disk) {
            return $path === 'auth/user.json' ? false : $disk->put($path, $contents);
        });
        Storage::shouldReceive('disk')->with('local')->andReturn($mock);

        try {
            $this->auth()->login($this->next->email, 'password');
            $this->fail('Failed compensation should fail login.');
        } catch (RuntimeException $exception) {
            $this->assertSame('No se pudo restaurar la sesión local.', $exception->getMessage());
        }

        $this->assertCredentialsMissing();
        $this->assertSame($before, $this->snapshot());
    }

    public function test_failed_logout_file_deletion_rolls_back_snapshot_and_aborts_session(): void
    {
        $before = $this->snapshot();
        $files = $this->credentialFiles();
        $disk = Storage::disk('local');
        $mock = Mockery::mock($disk);
        $mock->shouldReceive('delete')->with(['auth/token', 'auth/user.json'])->andReturnUsing(function () use ($disk) {
            $disk->delete('auth/token');

            return false;
        });
        Storage::shouldReceive('disk')->with('local')->andReturn($mock);
        $this->withoutExceptionHandling();

        try {
            $this->actingAs($this->previous)->post(route('logout'));
            $this->fail('Incomplete credential deletion should fail logout.');
        } catch (RuntimeException $exception) {
            $this->assertSame('No se pudo eliminar la sesión local.', $exception->getMessage());
        }

        $this->assertGuest();
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
    }

    public function test_two_factor_challenge_does_not_publish_the_candidate_session(): void
    {
        $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());
        $this->next->forceFill([
            'two_factor_secret' => encrypt('test-secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['valid-recovery-code'])),
            'two_factor_confirmed_at' => now(),
        ])->save();
        Http::fake(['wallet-api.test/login' => Http::response($this->loginResponse())]);
        $before = $this->snapshot();
        $files = $this->credentialFiles();

        $this->post(route('login.store'), $this->loginFields())
            ->assertRedirect(route('two-factor.login'))->assertSessionHas('login.id', $this->next->id);

        $this->assertGuest();
        $this->assertSame($files, $this->credentialFiles());
        $this->assertSame($before, $this->snapshot());
        $this->post(route('two-factor.login.store'), ['recovery_code' => 'invalid'])
            ->assertSessionHasErrors('recovery_code');
        $this->assertGuest();
        $this->assertSame($files, $this->credentialFiles());
        $this->post(route('two-factor.login.store'), ['recovery_code' => 'valid-recovery-code'])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($this->next);
        $this->assertSame('next-token', $this->auth()->token());
        $this->assertSnapshotEmpty();
        $this->assertDatabaseCount('passkeys', 1);
        Http::assertSentCount(1);
    }

    private function auth(): AuthService
    {
        return $this->app->make(AuthService::class);
    }

    private function loginRequest(): Request
    {
        $request = Request::create('/login', 'POST', $this->loginFields());
        $request->setLaravelSession($this->app['session']->driver());

        return $request;
    }

    private function loginFields(): array
    {
        return ['email' => $this->next->email, 'password' => 'password'];
    }

    private function remoteUser(User $user): array
    {
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    }

    private function loginResponse(): array
    {
        return ['token' => 'next-token', 'user' => $this->remoteUser($this->next)];
    }

    private function credentialFiles(): array
    {
        return [Storage::disk('local')->get('auth/token'), Storage::disk('local')->get('auth/user.json')];
    }

    private function assertCredentialsMissing(): void
    {
        Storage::disk('local')->assertMissing('auth/token');
        Storage::disk('local')->assertMissing('auth/user.json');
    }

    private function snapshot(): array
    {
        $snapshot = [];
        foreach (['accounts', 'cards', 'transactions', 'owners', 'account_owner', 'mobile_session'] as $table) {
            $snapshot[$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
        }

        return $snapshot;
    }

    private function assertSnapshotEmpty(): void
    {
        foreach (array_keys($this->snapshot()) as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    }

    private function seedSnapshot(): void
    {
        DB::table('accounts')->insert(['id' => 10, 'account' => 'previous', 'balance' => 50, 'activo' => true]);
        DB::table('cards')->insert(['account_id' => 10, 'card' => '12345', 'status' => true]);
        DB::table('owners')->insert(['id' => 40, 'user_id' => $this->previous->id, 'name' => 'Previous', 'last_name' => 'Owner']);
        DB::table('account_owner')->insert(['account_id' => 10, 'owner_id' => 40]);
        DB::table('transactions')->insert(['account_id' => 10, 'user_id' => $this->previous->id, 'motion' => 'Compra', 'amount' => -10]);
        DB::table('mobile_session')->insert([
            'user_id' => $this->previous->id, 'email' => $this->previous->email,
            'authenticated_at' => '2026-10-13 08:00:00', 'last_sync_at' => '2026-10-13 08:00:00',
        ]);
    }
}
