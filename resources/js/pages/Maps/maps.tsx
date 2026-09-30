import { Head } from '@inertiajs/react';
import { useState, useMemo, lazy, Suspense } from 'react';
const OpenStreetMap = lazy(() => import('@/components/maps/OpenStreetMap'));
import { SearchForm } from '@/components/search-form';
import { index as store } from '@/routes/store';

export type UserLocation = {
    latitude: number;
    longitude: number;
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

type ShopsResponse = {
    tiendas: ShopLocation[];
};

interface OpenStreetMapLazyProps {
    shops: ShopsResponse;
    location: UserLocation | null;
}

export default function OpenStreetMapLazy({
    shops,
    location,
}: OpenStreetMapLazyProps) {
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
                <div className="min-h-[500px] flex-1 overflow-hidden rounded-xl">
                    <Suspense
                        fallback={
                            <div className="flex h-[500px] items-center justify-center rounded-xl bg-zinc-100">
                                <span className="text-sm text-zinc-500">
                                    Cargando mapa...
                                </span>
                            </div>
                        }
                    >
                        <OpenStreetMap
                            locations={locations}
                            currentLocation={currentLocation}
                        />
                    </Suspense>
                </div>
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
