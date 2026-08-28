<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoregifdCardRequest;
use App\Http\Requests\UpdategifdCardRequest;
use App\Models\gifdCard;
use Inertia\Inertia;
use Inertia\Response;

class GifdCardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $giftCards = $user->gifdCards;
        $motion = $user->transactions;

        return Inertia::render('dashboard', [
            'card' => $giftCards,
            'motion' => $motion,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoregifdCardRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(gifdCard $gifdCard)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(gifdCard $gifdCard)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdategifdCardRequest $request, gifdCard $gifdCard)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(gifdCard $gifdCard)
    {
        //
    }
}
