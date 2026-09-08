<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['account_id', 'card', 'status'])]
class Card extends Model
{
    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Relación: Una tarjeta pertenece a una cuenta
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
