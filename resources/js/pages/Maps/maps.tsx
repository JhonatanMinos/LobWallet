import { Head } from '@inertiajs/react';
import { useState, useMemo, lazy, Suspense } from 'react';
const OpenStreetMap = lazy(() => import('@/components/maps/OpenStreetMap'));
import { SearchForm } from '@/components/search-form';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useShopSearch } from '@/hooks/useShopSearch';
import { index as store } from '@/routes/store';
import ShopDetail from './ShopDetail';
import ShopList from './ShopList';
import { ShopsResponse, UserLocation } from '@/types/shops';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface OpenStreetMapLazyProps {
    shops: ShopsResponse;
    location: UserLocation | null;
}

export default function OpenStreetMapLazy({
    shops,
    location,
}: OpenStreetMapLazyProps) {
    const [selectedShop, setSelectedShop] = useState<ShopLocation | null>(null);
    const { searchQuery, setSearchQuery, filteredShops } = useShopSearch(
        shops?.tiendas,
    );
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const locations = useMemo(() => {
        return filteredShops.map((tienda) => ({
            id: tienda.codigo,
            lat: Number(tienda.latitud),
            lng: Number(tienda.longitud),
            label: tienda.tienda,
        }));
    }, [filteredShops]);

    const currentLocation = location
        ? {
              lat: location.latitude,
              lng: location.longitude,
          }
        : undefined;

    const handleMarkerSelect = (locationId: string) => {
        const shop = filteredShops.find((s) => s.codigo === locationId);

        if (shop) {
            setSelectedShop(shop);
        }
    };

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
                <ResizablePanelGroup
                    orientation={isDesktop ? 'horizontal' : 'vertical'}
                    className="min-h-[650px] flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
                >
                    <ResizablePanel
                        defaultSize={60}
                        minSize={30}
                        className="relative h-full w-full overflow-hidden"
                    >
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
                                onSelectMarker={handleMarkerSelect}
                            />
                        </Suspense>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                        defaultSize={40}
                        className="flex h-full items-center justify-center p-6"
                    >
                        {selectedShop ? (
                            <ShopDetail
                                shop={selectedShop}
                                onBack={() => setSelectedShop(null)}
                            />
                        ) : (
                            <ShopList
                                shops={filteredShops}
                                onSelect={setSelectedShop}
                            />
                        )}
                    </ResizablePanel>
                </ResizablePanelGroup>
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
