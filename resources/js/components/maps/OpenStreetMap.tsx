import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export type MapLocation = {
    lat: number;
    lng: number;
    label?: string;
};

interface OpenStreetMapProps {
    locations: MapLocation[];
    currentLocation?: MapLocation;
}

const userIcon = L.divIcon({
    className: '',
    html: `
        <div
            style="
                width: 18px;
                height: 18px;
                background: #2563eb;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 0 4px rgba(37,99,235,.25);
            "
        ></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

const shopIcon = L.divIcon({
    className: '',
    html: `
        <div
            style="
                width: 18px;
                height: 18px;
                background: #dc2626;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,.3);
            "
        ></div>
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

export default function OpenStreetMap({
    locations,
    currentLocation,
}: OpenStreetMapProps) {
    const defaultLocation: [number, number] = currentLocation
        ? [currentLocation.lat, currentLocation.lng]
        : [20.6597, -103.3496];

    return (
        <div className="h-[500px] w-full">
            <MapContainer
                center={defaultLocation}
                zoom={14}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapCenter location={currentLocation} />

                <LocationButton location={currentLocation} />

                {currentLocation && (
                    <Marker
                        position={[currentLocation.lat, currentLocation.lng]}
                        icon={userIcon}
                    >
                        <Popup>Tu ubicación</Popup>
                    </Marker>
                )}

                {locations.map((location, index) => (
                    <Marker
                        key={`${location.lat}-${location.lng}-${index}`}
                        position={[location.lat, location.lng]}
                        icon={shopIcon}
                    >
                        <Popup>{location.label ?? 'Tienda'}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
