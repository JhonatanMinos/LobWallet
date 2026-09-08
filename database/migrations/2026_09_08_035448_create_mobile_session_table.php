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
        Schema::create('mobile_session', function (Blueprint $table) {
            $table->id();

            $table->string('user_id');
            $table->string('email');
            $table->string('name')->nullable();

            $table->timestamp('authenticated_at');
            $table->timestamp('last_sync_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_session');
    }
};
