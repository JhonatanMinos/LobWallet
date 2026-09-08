<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable('account', 'balance', 'activo', 'pin', 'closes')]

class Account extends Model
{
    protected $casts = [
        'active' => 'boolean',
        'balance' => 'decimal:2',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function cards(): HasMany
    {
        return $this->hasMany(Card::class);
    }

    /**
     * Relación: Una cuenta tiene muchos propietarios (Muchos a Muchos)
     */
    public function owners(): BelongsToMany
    {
        return $this->belongsToMany(Owner::class, 'account_owner')
            ->withTimestamps();
    }
}
