<?php

namespace App\Services;

use Denniskrol\NativePHPGeolocation\Facades\Geolocation;
use RuntimeException;

class LocationService
{
    public function getCurrentLocation(): array
    {
        Geolocation::requestPermission();

        $response = Geolocation::getCurrentPosition(
            highAccuracy: true
        );

        // La librería puede devolver un array o un JSON string
        if (is_string($response)) {
            $location = json_decode($response, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new RuntimeException(
                    'Respuesta inválida de Geolocation: ' . $response
                );
            }
        } elseif (is_array($response)) {
            $location = $response;
        } else {
            throw new RuntimeException(
                'Respuesta inesperada de Geolocation.'
            );
        }

        // Revisamos el resultado normalizado
        if (($location['status'] ?? null) === 'error') {
            throw new RuntimeException(
                $location['message'] ?? 'Error obteniendo ubicación.'
            );
        }

        // Validamos coordenadas
        if (
            !isset($location['latitude']) ||
            !isset($location['longitude'])
        ) {
            throw new RuntimeException(
                'La respuesta de Geolocation no contiene coordenadas.'
            );
        }

        return [
            'latitude' => (float) $location['latitude'],
            'longitude' => (float) $location['longitude'],
            'accuracy' => isset($location['accuracy'])
                ? (float) $location['accuracy']
                : null,
            'timestamp' => $location['timestamp'] ?? null,
        ];
    }
}

