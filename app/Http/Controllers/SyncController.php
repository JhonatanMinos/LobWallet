<?php

namespace App\Http\Controllers;

use App\Services\SyncService;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    public function __invoke(SyncService $sync): JsonResponse
    {
        return response()->json(
            $sync->sync()
        );
    }
}
