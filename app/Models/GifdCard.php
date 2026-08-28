<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'tarjeta', 'status'])]
class GifdCard extends Model
{
    protected $table = 'gifd_cards';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
