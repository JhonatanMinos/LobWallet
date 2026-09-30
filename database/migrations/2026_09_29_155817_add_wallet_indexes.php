<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index([
                'account_id',
                'created_at'
            ], 'transactions_account_created_idx');
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->index(
                'account_id',
                'cards_account_id_idx'
            );
        });

        Schema::table('owners', function (Blueprint $table) {
            $table->index(
                'user_id',
                'owners_user_id_idx'
            );
        });

        Schema::table('account_owner', function (Blueprint $table) {
            $table->index(
                ['account_id', 'owner_id'],
                'account_owner_accunt_owner_idx'
            );
        });

        Schema::table('mobile_session', function (Blueprint $table) {
            $table->unique(
                'user_id',
                'mobile_session_user_id_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_account_created_idx');
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropIndex('cards_account_id_idx');
        });

        Schema::table('owners', function (Blueprint $table) {
            $table->dropIndex('owners_user_id_idx');
        });

        Schema::table('account_owner', function (Blueprint $table) {
            $table->dropIndex('account_owner_accunt_owner_idx');
        });

        Schema::table('mobile_session', function (Blueprint $table) {
            $table->dropIndex('mobile_session_user_id_unique');
        });
    }
};
