<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ApiService
{
    public function __construct(
        protected string $baseUrl,
    ) {}

    public function get(string $endpoint, ?string $token = null): array
    {
        $request = Http::baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30);

        if ($token) {
            $request->withToken($token);
        }

        $response = $request->get($endpoint);

        if ($response->failed()) {
            throw new RuntimeException(
                "API Error {$response->status()}: {$response->body()}"
            );
        }

        return $response->json();
    }

    public function post(
        string $endpoint,
        array $data = [],
        ?string $token = null
    ): array {
        $request = Http::baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30);

        if ($token) {
            $request->withToken($token);
        }

        $response = $request->post($endpoint, $data);

        if ($response->failed()) {
            throw new RuntimeException(
                "API Error {$response->status()}: {$response->body()}"
            );
        }

        return $response->json();
    }
}

