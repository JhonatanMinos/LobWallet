<?php

namespace Tests\Feature\Sync;

use App\Models\User;
use App\Services\ApiService;
use App\Services\SyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use RuntimeException;
use Tests\TestCase;

class SyncIdentityTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Storage::fake('local');
        $this->app->instance(ApiService::class, new ApiService('https://wallet-api.test'));
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        Storage::disk('local')->put('auth/token', 'test-token');
        Storage::disk('local')->put('auth/user.json', json_encode([
            'id' => $this->user->id, 'email' => $this->user->email,
        ], JSON_THROW_ON_ERROR));
        DB::table('accounts')->insert(['id' => 10, 'account' => 'cached', 'balance' => 50, 'activo' => true]);
        DB::table('mobile_session')->insert([
            'user_id' => $this->user->id, 'email' => $this->user->email,
            'authenticated_at' => '2026-10-13 08:00:00', 'last_sync_at' => '2026-10-13 08:00:00',
        ]);
        Http::fake(['wallet-api.test/*' => Http::response(['sync_timestamp' => '2026-10-13 10:00:00'])]);
    }

    public function test_remote_identity_must_match_the_laravel_session(): void
    {
        $this->actingAs(User::factory()->create());
        $this->assertRejectedWithoutMutation();
    }

    public function test_remote_credentials_without_laravel_authentication_are_rejected(): void
    {
        $this->app['auth']->forgetGuards();
        $this->assertRejectedWithoutMutation();
    }

    #[DataProvider('invalidIdentityFiles')]
    public function test_missing_or_malformed_remote_identity_is_rejected(?string $contents): void
    {
        if ($contents === null) {
            Storage::disk('local')->delete('auth/user.json');
        } else {
            Storage::disk('local')->put('auth/user.json', $contents);
        }
        $this->assertRejectedWithoutMutation();
    }

    public static function invalidIdentityFiles(): array
    {
        return [
            'missing' => [null], 'invalid json' => ['{'], 'json null' => ['null'],
            'scalar' => ['42'], 'missing id' => ['{"email":"user@example.test"}'],
            'array id' => ['{"id":[],"email":"user@example.test"}'],
            'zero id' => ['{"id":0,"email":"user@example.test"}'],
            'invalid id' => ['{"id":"someone","email":"user@example.test"}'],
            'boolean id' => ['{"id":true,"email":"user@example.test"}'],
            'floating id' => ['{"id":1.5,"email":"user@example.test"}'],
            'out-of-range id' => ['{"id":"9223372036854775808","email":"user@example.test"}'],
            'missing email' => ['{"id":1}'], 'array email' => ['{"id":1,"email":[]}'],
            'empty email' => ['{"id":1,"email":""}'], 'null name' => ['{"id":1,"email":"user@example.test","name":null}'],
        ];
    }

    #[DataProvider('invalidTokens')]
    public function test_missing_or_malformed_token_is_rejected(?string $token): void
    {
        if ($token === null) {
            Storage::disk('local')->delete('auth/token');
        } else {
            Storage::disk('local')->put('auth/token', $token);
        }
        $this->assertRejectedWithoutMutation();
    }

    public static function invalidTokens(): array
    {
        return ['missing' => [null], 'empty' => [''], 'whitespace' => ['   '], 'header newline' => ["token\r\nInjected: header"]];
    }

    public function test_matching_numeric_string_identity_can_sync(): void
    {
        Storage::disk('local')->put('auth/user.json', json_encode([
            'id' => strval($this->user->id), 'email' => $this->user->email,
        ], JSON_THROW_ON_ERROR));

        $result = $this->app->make(SyncService::class)->sync();

        $this->assertTrue($result['success']);
        Http::assertSentCount(1);
    }

    private function assertRejectedWithoutMutation(): void
    {
        $before = DB::table('mobile_session')->first();

        try {
            $this->app->make(SyncService::class)->sync();
            $this->fail('Invalid identity should be rejected before sync.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Usuario no autenticado.', $exception->getMessage());
        }

        Http::assertNothingSent();
        $this->assertEquals($before, DB::table('mobile_session')->first());
        $this->assertDatabaseHas('accounts', ['id' => 10, 'balance' => 50]);
    }
}
