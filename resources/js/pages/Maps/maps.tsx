import { Head } from '@inertiajs/react';
import { useState, useMemo, lazy, Suspense } from 'react';
const OpenStreetMap = lazy(() => import('@/components/maps/OpenStreetMap'));
import { SearchForm } from '@/components/search-form';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShopSearch } from '@/hooks/useShopSearch';
import { index as store } from '@/routes/store';
import type { ShopLocation, ShopsResponse, UserLocation } from '@/types/shops';
import ShopDetail from './ShopDetail';
import ShopList from './ShopList';

interface OpenStreetMapLazyProps {
    shops: ShopsResponse;
    location: UserLocation | null;
}

export default function Maps({ shops, location }: OpenStreetMapLazyProps) {
    const [selectedShop, setSelectedShop] = useState<ShopLocation | null>(null);
    const { searchQuery, setSearchQuery, filteredShops } = useShopSearch(
        shops?.tiendas ?? [],
    );
    const isDesktop = !useIsMobile();

    const locations = useMemo(() => {
        return filteredShops
            .map((shop) => ({
                id: shop.codigo,
                lat: Number(shop.latitud),
                lng: Number(shop.longitud),
                label: shop.tienda,
            }))
            .filter(
                (location) =>
                    Number.isFinite(location.lat) &&
                    Number.isFinite(location.lng),
            );
    }, [filteredShops]);

    const currentLocation = location
        ? {
              id: 'current-location',
              lat: location.latitude,
              lng: location.longitude,
          }
        : undefined;

    const selectedLocation = useMemo(() => {
        if (!selectedShop) {
            return undefined;
        }

        const location = locations.find(
            (item) => item.id === selectedShop.codigo,
        );

        return location;
    }, [locations, selectedShop]);

    const handleMarkerSelect = (locationId: string) => {
        const shop = filteredShops.find((item) => item.codigo === locationId);

        if (!shop) {
            return;
        }

        setSelectedShop(shop);
    };

    return (
        <>
            <Head title="Tiendas" />
            <div className="mx-4 my-4 sm:m-5">
                <SearchForm
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Buscar por tienda, municipio, colonia..."
                    className="mb-4 w-full"
                />
                <ResizablePanelGroup
                    orientation={isDesktop ? 'horizontal' : 'vertical'}
                    className="min-h-[560px] flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 lg:min-h-[650px]"
                >
                    <ResizablePanel
                        defaultSize={60}
                        minSize={30}
                        className="relative min-h-0 overflow-hidden"
                    >
                        <Suspense
                            fallback={
                                <div className="flex h-full min-h-[500px] items-center justify-center rounded-xl bg-zinc-100">
                                    <span className="text-sm text-zinc-500">
                                        Cargando mapa...
                                    </span>
                                </div>
                            }
                        >
                            <OpenStreetMap
                                locations={locations}
                                currentLocation={currentLocation}
                                selectedLocation={selectedLocation}
                                onSelectMarker={handleMarkerSelect}
                            />
                        </Suspense>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel
                        defaultSize={40}
                        className="min-h-0 overflow-hidden p-4"
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

Maps.layout = {
    breadcrumbs: [
        {
            title: 'Mapa',
            href: store(),
        },
    ],
};
