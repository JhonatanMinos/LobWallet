<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'email',
    'name',
    'authenticated_at',
    'last_sync_at',
])]
class MobileSession extends Model
{
    protected $table = 'mobile_session';

    protected $casts = [
        'authenticated_at' => 'datetime',
        'last_sync_at' => 'datetime',
    ];
}
