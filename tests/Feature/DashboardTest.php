<?php

namespace Tests\Feature;

use App\Services\CardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use App\Models\User;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_dashboard_returns_the_wallet_data_needed_by_react(): void
    {
        $user = User::factory()->create();
        $accountId = DB::table('accounts')->insertGetId([
            'account' => 'LOB-001',
            'balance' => 1250.50,
            'activo' => true,
            'pin' => '1234',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $cardId = DB::table('cards')->insertGetId([
            'account_id' => $accountId,
            'card' => '202700242389',
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $transactionId = DB::table('transactions')->insertGetId([
            'account_id' => $accountId,
            'user_id' => $user->id,
            'motion' => 'Compra',
            'amount' => -50.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('account.id', $accountId)
            ->where('account.account', 'LOB-001')
            ->where('account.balance', 1250.5)
            ->where('card.id', $cardId)
            ->where('card.card', '202700242389')
            ->where('transactions.0.id', $transactionId)
            ->where('transactions.0.amount', -50)
            ->etc()
        );
    }

    public function test_authenticated_users_can_open_the_add_card_form(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('accountCard.create'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/create')
            ->has('accounts')
        );
    }

    public function test_add_card_requires_all_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('accountCard.store'), []);

        $response->assertSessionHasErrors(['card', 'name', 'lastName', 'movil']);
    }

    public function test_add_card_sends_validated_data_to_the_card_service(): void
    {
        $user = User::factory()->create();
        $cardService = $this->mock(CardService::class);
        $cardService->shouldReceive('store')
            ->once()
            ->with([
                'card' => '202700242389',
                'name' => 'Ada',
                'lastName' => 'Lovelace',
                'movil' => '5512345678',
            ])
            ->andReturn(['success' => true]);

        $response = $this->actingAs($user)->post(route('accountCard.store'), [
            'card' => '202700242389',
            'name' => 'Ada',
            'lastName' => 'Lovelace',
            'movil' => '5512345678',
        ]);

        $response->assertRedirect(route('dashboard'));
    }
}
