<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ApiService
{
    public function __construct(
        protected string $baseUrl,
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    protected function request(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->acceptJson()
        ->asJson()
            ->timeout(30)
            ->connectTimeout(10);
    }

    public function get(
        string $endpoint,
        ?string $token = null,
        array $query = [],
    ): array {
        $request = $this->request();

        if ($token) {
            $request = $request->withToken($token);
        }

        $response = $request->get(
            $endpoint,
            $query
        );

        return $this->handleResponse($response);
    }

    public function post(
        string $endpoint,
        array $data = [],
        ?string $token = null,
    ): array {
        $request = $this->request();

        if ($token) {
            $request = $request->withToken($token);
        }

        $response = $request->post(
            $endpoint,
            $data
        );

        return $this->handleResponse($response);
    }

    protected function handleResponse(
        Response $response
    ): array {
        if ($response->successful()) {
            return $response->json() ?? [];
        }

        if ($response->status() === 401) {
            throw new RuntimeException(
                'UNAUTHENTICATED'
            );
        }

        if ($response->status() === 422) {
            throw new RuntimeException(
                'VALIDATION_ERROR'
            );
        }

        if ($response->serverError()) {
            throw new RuntimeException(
                'SERVER_ERROR'
            );
        }

        throw new RuntimeException(
            "API_ERROR_{$response->status()}"
        );
    }
}
