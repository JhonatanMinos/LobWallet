<?php

namespace Tests\Feature\Sync;

use App\Models\MobileSession;
use App\Models\User;
use App\Services\ApiService;
use App\Services\SyncService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\ResponseSequence;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SyncFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private ResponseSequence $responses;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->responses = Http::sequence();
        Http::fake(['wallet-api.test/*' => fn (Request $request) => ($this->responses)($request)]);
        Storage::fake('local');
        $this->app->instance(ApiService::class, new ApiService('https://wallet-api.test'));
        $this->user = User::factory()->create();
        $this->storeRemoteUser($this->user);
        $this->actingAs($this->user);
    }

    public function test_guests_cannot_sync(): void
    {
        $this->app['auth']->forgetGuards();
        $this->postJson(route('sync'))->assertUnauthorized();
        Http::assertNothingSent();
        $this->assertDatabaseCount('mobile_session', 0);
    }

    public function test_missing_remote_token_fails_before_http(): void
    {
        Storage::disk('local')->delete('auth/token');

        try {
            $this->sync();
            $this->fail('Sync should require a remote token.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('Usuario no autenticado.', $exception->getMessage());
        }

        Http::assertNothingSent();
        $this->assertDatabaseCount('mobile_session', 0);
    }

    public function test_authenticated_sync_returns_changes_and_persists_wallet_data(): void
    {
        $this->fakeDelta($this->delta());

        $this->actingAs($this->user)->postJson(route('sync'))
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'timestamp' => '2026-10-13 10:00:00',
                'has_changes' => true,
            ]);

        $this->assertDatabaseHas('accounts', ['id' => 10, 'balance' => 1250.50]);
        $this->assertDatabaseHas('cards', ['id' => 20, 'account_id' => 10, 'card' => '202700242389']);
        $this->assertDatabaseHas('transactions', ['id' => 30, 'motion' => 'Compra', 'amount' => -50]);
        $this->assertDatabaseHas('owners', ['id' => 40, 'user_id' => $this->user->id]);
        $this->assertDatabaseHas('account_owner', ['account_id' => 10, 'owner_id' => 40]);
        Http::assertSent(fn (Request $request) => $request->hasHeader('Authorization', 'Bearer test-token')
            && $this->since($request) === '');
    }

    public function test_empty_delta_advances_cursor_without_wallet_changes(): void
    {
        $this->fakeDelta(['sync_timestamp' => '2026-10-13 10:00:00']);

        $this->assertFalse($this->sync()['has_changes']);
        $this->assertDatabaseHas('mobile_session', [
            'user_id' => $this->user->id,
            'last_sync_at' => '2026-10-13 10:00:00',
        ]);
        $this->assertDatabaseCount('accounts', 0);
    }

    public function test_identical_delta_and_metadata_updates_do_not_report_wallet_changes(): void
    {
        $this->seedWallet();
        $delta = $this->delta();
        $delta['accounts'][0]['saldo'] = '1250.50';
        $delta['cards'][0]['estatus'] = 1;
        $delta['transaction'][0]['monto'] = '-50.00';
        $this->fakeDelta($delta);
        $this->assertFalse($this->sync()['has_changes']);

        foreach (['accounts', 'cards', 'transaction', 'owner'] as $key) {
            $delta[$key][0]['updated_at'] = '2026-10-13 11:00:00';
        }
        $delta['sync_timestamp'] = '2026-10-13 11:00:00';
        $this->fakeDelta($delta);
        $this->assertFalse($this->sync()['has_changes']);
        $this->assertDatabaseHas('accounts', ['id' => 10, 'updated_at' => '2026-10-13 11:00:00']);
        $this->assertDatabaseHas('mobile_session', ['user_id' => $this->user->id, 'last_sync_at' => '2026-10-13 11:00:00']);
    }

    #[DataProvider('walletChanges')]
    public function test_changed_wallet_fields_are_reported(string $collection, string $field, mixed $value): void
    {
        $this->seedWallet();
        $delta = $this->delta();
        $delta[$collection][0][$field] = $value;
        $this->fakeDelta($delta);

        $this->assertTrue($this->sync()['has_changes']);
    }

    public static function walletChanges(): array
    {
        return [
            'balance' => ['accounts', 'saldo', 1200],
            'nullable pin' => ['accounts', 'pin', ''],
            'card status' => ['cards', 'estatus', false],
            'transaction amount' => ['transaction', 'monto', -75],
            'transaction order' => ['transaction', 'created_at', '2026-10-13 09:00:00'],
            'owner name' => ['owner', 'nombres', 'Grace'],
        ];
    }

    public function test_incremental_sync_preserves_rows_and_uses_the_committed_cursor(): void
    {
        $this->responses = Http::sequence()
            ->push($this->delta())
            ->push([
                'transaction' => [array_replace($this->delta()['transaction'][0], ['id' => 31])],
                'sync_timestamp' => '2026-10-13 11:00:00',
            ])
            ->push(['sync_timestamp' => '2026-10-13 12:00:00']);

        $this->sync();
        $this->assertTrue($this->sync()['has_changes']);
        $this->assertFalse($this->sync()['has_changes']);

        $this->assertDatabaseCount('transactions', 2);
        $this->assertDatabaseHas('transactions', ['id' => 30]);
        $this->assertDatabaseHas('transactions', ['id' => 31]);
        $this->assertDatabaseCount('accounts', 1);
        $this->assertDatabaseCount('cards', 1);
        $this->assertDatabaseCount('owners', 1);
        Http::assertSent(fn (Request $request) => $this->since($request) === '2026-10-13 10:00:00');
        Http::assertSent(fn (Request $request) => $this->since($request) === '2026-10-13 11:00:00');
        Http::assertSentCount(3);
    }

    public function test_cursor_is_selected_and_updated_only_for_the_remote_user(): void
    {
        $other = User::factory()->create();
        $this->cursor($this->user, '2026-10-13 08:00:00');
        $this->cursor($other, '2026-10-13 09:00:00');
        $this->storeRemoteUser($other);
        $this->actingAs($other);
        $this->fakeDelta(['sync_timestamp' => '2026-10-13 11:00:00']);

        $this->sync();

        $this->assertSame('2026-10-13 09:00:00', $this->since(Http::recorded()[0][0]));
        $this->assertDatabaseHas('mobile_session', ['user_id' => $this->user->id, 'last_sync_at' => '2026-10-13 08:00:00']);
        $this->assertDatabaseHas('mobile_session', ['user_id' => $other->id, 'last_sync_at' => '2026-10-13 11:00:00']);
    }

    public function test_offline_sync_preserves_the_entire_snapshot_and_cursor(): void
    {
        $this->seedWallet();
        $before = $this->snapshot();
        $this->responses = Http::sequence()->pushFailedConnection();

        try {
            $this->sync();
            $this->fail('Offline sync should fail.');
        } catch (ConnectionException) {
            $this->assertSame($before, $this->snapshot());
        }
    }

    public function test_ingestion_error_rolls_back_wallet_writes_and_cursor(): void
    {
        $this->seedWallet();
        $before = $this->snapshot();
        $delta = $this->delta();
        $delta['accounts'][0]['saldo'] = 999;
        $delta['cards'][0]['tarjeta'] = null;
        $delta['sync_timestamp'] = '2026-10-13 11:00:00';
        $this->fakeDelta($delta);

        try {
            $this->sync();
            $this->fail('A required card value should fail ingestion.');
        } catch (QueryException) {
            $this->assertSame($before, $this->snapshot());
        }
    }

    public function test_two_owners_for_one_account_survive_incremental_and_repeated_sync(): void
    {
        $this->seedWallet();
        $delta = [
            'owner' => [array_replace($this->delta()['owner'][0], ['id' => 41, 'nombres' => 'Grace'])],
            'accountOwner' => [['account_id' => 10, 'owner_id' => 41]],
            'sync_timestamp' => '2026-10-13 11:00:00',
        ];
        $this->fakeDelta($delta);
        $result = $this->sync();

        $this->assertDatabaseCount('account_owner', 2);
        $this->assertDatabaseHas('account_owner', ['account_id' => 10, 'owner_id' => 40]);
        $this->assertDatabaseHas('account_owner', ['account_id' => 10, 'owner_id' => 41]);
        $this->assertTrue($result['has_changes']);
        $this->assertFalse($this->sync()['has_changes']);
        $this->assertDatabaseCount('account_owner', 2);
    }

    public function test_new_ownership_link_alone_reports_changes(): void
    {
        $delta = $this->delta();
        $delta['accountOwner'] = [];
        $this->fakeDelta($delta);
        $this->sync();
        $this->fakeDelta([
            'accountOwner' => [['account_id' => 10, 'owner_id' => 40]],
            'sync_timestamp' => '2026-10-13 11:00:00',
        ]);

        $this->assertTrue($this->sync()['has_changes']);
        $this->assertFalse($this->sync()['has_changes']);
        $this->assertDatabaseHas('account_owner', ['account_id' => 10, 'owner_id' => 40]);
    }

    public function test_failure_to_record_cursor_rolls_back_the_ingested_delta(): void
    {
        $this->seedWallet();
        $before = $this->snapshot();
        $delta = $this->delta();
        $delta['accounts'][0]['saldo'] = 999;
        unset($delta['sync_timestamp']);
        $this->fakeDelta($delta);

        try {
            $this->sync();
            $this->fail('A missing cursor should fail sync.');
        } catch (\ErrorException $exception) {
            $this->assertStringContainsString('sync_timestamp', $exception->getMessage());
            $this->assertSame($before, $this->snapshot());
        }
    }

    private function sync(): array
    {
        return $this->app->make(SyncService::class)->sync();
    }

    private function storeRemoteUser(User $user): void
    {
        Storage::disk('local')->put('auth/token', 'test-token');
        Storage::disk('local')->put('auth/user.json', json_encode([
            'id' => $user->id, 'email' => $user->email,
        ], JSON_THROW_ON_ERROR));
    }

    private function cursor(User $user, string $timestamp): void
    {
        MobileSession::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'authenticated_at' => $timestamp,
            'last_sync_at' => $timestamp,
        ]);
    }

    private function since(Request $request): string
    {
        parse_str(parse_url($request->url(), PHP_URL_QUERY) ?? '', $query);

        return $query['since'] ?? '';
    }

    private function seedWallet(): void
    {
        $this->fakeDelta($this->delta());
        $this->sync();
    }

    private function fakeDelta(array $delta): void
    {
        $this->responses = Http::sequence()->push($delta)->whenEmpty(Http::response($delta));
    }

    private function snapshot(): array
    {
        $snapshot = [];
        foreach (['accounts', 'cards', 'transactions', 'owners', 'account_owner', 'mobile_session'] as $table) {
            $snapshot[$table] = DB::table($table)->get()->map(fn ($row) => (array) $row)->all();
        }

        return $snapshot;
    }

    private function delta(): array
    {
        $timestamps = ['created_at' => '2026-10-13 08:00:00', 'updated_at' => '2026-10-13 08:00:00'];

        return [
            'accounts' => [[
                'id' => 10, 'cuenta' => 'LOB-001', 'saldo' => 1250.50, 'estatus' => true,
                ...$timestamps,
            ]],
            'cards' => [[
                'id' => 20, 'account_id' => 10, 'tarjeta' => '202700242389', 'estatus' => true,
                ...$timestamps,
            ]],
            'transaction' => [[
                'id' => 30, 'account_id' => 10, 'user_id' => $this->user->id,
                'movimiento' => 'Compra', 'monto' => -50,
                ...$timestamps,
            ]],
            'owner' => [[
                'id' => 40, 'user_id' => $this->user->id, 'nombres' => 'Ada', 'apellidos' => 'Lovelace', 'movil' => null,
                ...$timestamps,
            ]],
            'accountOwner' => [['account_id' => 10, 'owner_id' => 40]],
            'sync_timestamp' => '2026-10-13 10:00:00',
        ];
    }
}
