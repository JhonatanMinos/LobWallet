<?php

namespace App\Http\Controllers;

use App\Services\PromotionService;
use Inertia\Inertia;

class PromotionController extends Controller
{
    public function index(PromotionService $promotionService)
    {
        return Inertia::render('promotions', [
            'promotions' => $promotionService->promotions(),
        ]);
    }
}
