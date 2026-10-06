import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    MapContainer,
    Marker,
    Popup,
    Polyline,
    TileLayer,
    useMap,
    Tooltip,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapLocation } from '@/types/shops';

interface OpenStreetMapProps {
    locations: MapLocation[];
    currentLocation?: MapLocation;
    selectedLocation?: MapLocation;
    onSelectMarker?: (id: string) => void;
}

const userIcon = L.divIcon({
    className: '',
    html: `
        <div
            style="
                width: 18px;
                height: 18px;
                background: #000;
                border: 3px solid black;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                box-shadow: 0 0 0 4px rgba(37,99,235,.25);
            "
        >
            <span style="
                width: 6px;
                height: 6px;
                background: #fff;
                border-radius: 50%;
                display: block;
                "
            ></span>
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const shopIcon = L.divIcon({
    className: '',
    html: `
        <div
            style="
                width: 20px;
                height: 20px;
                background: #fff;
                border: 3px solid black;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                box-shadow: 0 2px 5px rgba(0,0,0,.3);
            "
        >
            <span style="
                    width: 6px;
                    height: 6px;
                    background: #000;
                    border-radius: 50%;
                    display: block;
                "
            ></span>
        </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

function MapCenter({ location }: { location?: MapLocation }) {
    const map = useMap();

    useEffect(() => {
        if (!location) {
            return;
        }

        map.setView([location.lat, location.lng], 14, {
            animate: true,
        });
    }, [location, map]);

    return null;
}

function LocationButton({ location }: { location?: MapLocation }) {
    const map = useMap();

    const goToLocation = () => {
        if (!location) {
            return;
        }

        map.flyTo([location.lat, location.lng], 16, {
            animate: true,
            duration: 0.8,
        });
    };

    return (
        <button
            type="button"
            onClick={goToLocation}
            disabled={!location}
            className="absolute top-3 right-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Ir a mi ubicación"
            aria-label="Ir a mi ubicación"
        >
            <Navigation />
        </button>
    );
}

function RoutePath({ from, to }: { from?: MapLocation; to?: MapLocation }) {
    const map = useMap();
    const [route, setRoute] = useState<[number, number][]>([]);
    const fromLat = from?.lat;
    const fromLng = from?.lng;
    const toLat = to?.lat;
    const toLng = to?.lng;

    useEffect(() => {
        if (
            fromLat === undefined ||
            fromLng === undefined ||
            toLat === undefined ||
            toLng === undefined
        ) {
            return;
        }

        const controller = new AbortController();

        async function loadRoute() {
            try {
                const coordinates = [
                    `${fromLng},${fromLat}`,
                    `${toLng},${toLat}`,
                ].join(';');

                const url =
                    `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
                    `?overview=full&geometries=geojson`;

                const response = await fetch(url, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('No se pudo obtener la ruta');
                }

                const data = await response.json();

                if (data.code !== 'Ok' || !data.routes?.length) {
                    setRoute([]);

                    return;
                }

                const coordinantes = data.routes[0].geometry.coordinates;

                const leafletRoute = coordinantes.map(
                    ([lng, lat]: [number, number]) =>
                        [lat, lng] as [number, number],
                );

                setRoute(leafletRoute);

                if (leafletRoute.length > 0) {
                    map.fitBounds(leafletRoute, {
                        padding: [40, 40],
                        animate: true,
                    });
                }
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                console.error('Error obteniendo ruta: ', error);
                setRoute([]);
            }
        }

        void loadRoute();

        return () => {
            controller.abort();
        };
    }, [fromLat, fromLng, toLat, toLng, map]);

    if (
        fromLat === undefined ||
        fromLng === undefined ||
        toLat === undefined ||
        toLng === undefined ||
        route.length === 0
    ) {
        return null;
    }

    return (
        <Polyline
            positions={route}
            pathOptions={{
                color: '#000000',
                weight: 5,
                opacity: 0.8,
            }}
        />
    );
}

export default function OpenStreetMap({
    locations,
    currentLocation,
    selectedLocation,
    onSelectMarker,
}: OpenStreetMapProps) {
    const currentLatitude = currentLocation?.lat;
    const currentLongitude = currentLocation?.lng;
    const defaultLocation = useMemo<[number, number]>(() => {
        if (currentLatitude !== undefined && currentLongitude !== undefined) {
            return [currentLatitude, currentLongitude];
        }

        return [20.6597, -103.23496];
    }, [currentLatitude, currentLongitude]);

    return (
        <div className="h-full min-h-[420px] w-full lg:min-h-[500px]">
            <MapContainer
                center={defaultLocation}
                zoom={14}
                scrollWheelZoom
                zoomControl={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapCenter location={currentLocation} />

                <LocationButton location={currentLocation} />

                <RoutePath from={currentLocation} to={selectedLocation} />

                {currentLocation && (
                    <Marker
                        position={[currentLocation.lat, currentLocation.lng]}
                        icon={userIcon}
                    >
                        <Tooltip
                            permanent
                            direction="top"
                            offset={[0, -10]}
                            className="user-location-tooltip"
                        >
                            Usted está aquí
                        </Tooltip>
                    </Marker>
                )}

                {locations.map((location) => (
                    <Marker
                        key={location.id}
                        position={[location.lat, location.lng]}
                        icon={shopIcon}
                        eventHandlers={{
                            click: () => onSelectMarker?.(location.id),
                        }}
                    >
                        <Popup>{location.label ?? 'Tienda'}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
