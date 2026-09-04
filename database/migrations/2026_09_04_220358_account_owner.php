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
        Schema::create('account_owner', function (Blueprint $table) {
            $table->foreignId('account_id')->constrained()->cascadeOnDelete();
    $table->foreignId('owner_id')->constrained()->cascadeOnDelete();

    $table->primary(['account_id', 'owner_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::dropIfExists('account_owner');
    }
};
