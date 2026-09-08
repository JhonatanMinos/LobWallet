<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['user_id', 'name', 'last_name', 'movil'])]
class Owner extends Model
{
    /**
     * Relación: Un usuario tiene muchos propietarios
     */
    public function owners(): HasMany
    {
        return $this->hasMany(Owner::class);
    }

    /**
     * Relación: Un usuario tiene muchas cuentas (a través de owners)
     */
    public function accounts(): HasManyThrough
    {
        return $this->hasManyThrough(Account::class, Owner::class);
    }
}
