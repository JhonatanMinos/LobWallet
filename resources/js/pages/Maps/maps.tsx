import { Head, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import OpenStreetMap from '@/components/maps/OpenStreetMap';
import { SearchForm } from '@/components/search-form';
import { index as store } from '@/routes/store';

export type UserLocation = {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
};

interface ShopLocation {
    codigo: string;
    tienda: string;
    calle: string;
    colonia: string;
    municipio: string;
    telefono: string;
    horario: string;
    latitud: string;
    longitud: string;
}

interface OpenStreetMapLazyProps {
    shops: ShopLocation[];
}

export default function OpenStreetMapLazy({ shops }: OpenStreetMapLazyProps) {
    const { location } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');

    // Filtrar las tiendas en base al texto ingresado en el buscador
    const filteredShops = useMemo(() => {
        const tiendasList = shops?.tiendas ?? [];

        if (!searchQuery.trim()) {
            return tiendasList;
        }

        const query = searchQuery.toLowerCase().trim();

        return tiendasList.filter((tienda) => {
            return (
                tienda.tienda?.toLowerCase().includes(query) ||
                tienda.municipio?.toLowerCase().includes(query) ||
                tienda.colonia?.toLowerCase().includes(query) ||
                tienda.calle?.toLowerCase().includes(query) ||
                tienda.codigo?.toLowerCase().includes(query)
            );
        });
    }, [shops?.tiendas, searchQuery]);

    const locations = filteredShops.map((tienda) => ({
        lat: Number(tienda.latitud),
        lng: Number(tienda.longitud),
        label: tienda.tienda,
    }));

    const currentLocation = location
        ? {
              lat: location.latitude,
              lng: location.longitude,
          }
        : undefined;

    return (
        <>
            <Head title="Tiendas" />
            <div className="m-5">
                <SearchForm
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Buscar por tienda, municipio, colonia..."
                    className="mb-4 w-full"
                />
                <OpenStreetMap
                    locations={locations}
                    currentLocation={currentLocation}
                />
            </div>
        </>
    );
}

OpenStreetMapLazy.layout = {
    breadcrumbs: [
        {
            title: 'Mapa',
            href: store(),
        },
    ],
};
