import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
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

const OpenStreetMap = lazy(() => import('@/components/maps/OpenStreetMap'));

interface OpenStreetMapLazyProps {
    shops: ShopsResponse;
    location: UserLocation | null;
}

export default function Maps({ shops, location }: OpenStreetMapLazyProps) {
    const [selectedShop, setSelectedShop] = useState<ShopLocation | null>(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
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
        setMobileSheetOpen(true);
    };

    const mapFallback = (
        <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl bg-zinc-100">
            <span className="text-sm text-zinc-500">Cargando mapa...</span>
        </div>
    );

    const map = (
        <Suspense fallback={mapFallback}>
            <OpenStreetMap
                locations={locations}
                currentLocation={currentLocation}
                selectedLocation={selectedLocation}
                onSelectMarker={handleMarkerSelect}
            />
        </Suspense>
    );

    const shopPanel = selectedShop ? (
        <ShopDetail shop={selectedShop} onBack={() => setSelectedShop(null)} />
    ) : (
        <ShopList
            shops={filteredShops}
            onSelect={(shop) => {
                setSelectedShop(shop);
                setMobileSheetOpen(true);
            }}
        />
    );

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
                {isDesktop ? (
                    <ResizablePanelGroup
                        orientation="horizontal"
                        className="min-h-[560px] flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 lg:h-[calc(100svh-9rem)] lg:min-h-0"
                    >
                        <ResizablePanel
                            defaultSize={60}
                            minSize={30}
                            className="relative min-h-0 overflow-hidden"
                        >
                            {map}
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel
                            defaultSize={40}
                            className="min-h-0 overflow-hidden p-4"
                        >
                            {shopPanel}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="relative mb-20 h-[calc(100svh-13rem)] min-h-[560px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
                        <div className="absolute inset-0">{map}</div>

                        <section
                            className={`absolute inset-x-0 bottom-0 z-[1001] flex flex-col overflow-hidden rounded-t-3xl border-t border-zinc-700 bg-zinc-950/95 shadow-[0_-12px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[height] duration-300 ${mobileSheetOpen ? 'h-[68%]' : 'h-20'}`}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileSheetOpen((isOpen) => !isOpen)
                                }
                                className="flex min-h-20 shrink-0 flex-col items-center justify-center gap-1 px-4 text-zinc-100"
                                aria-expanded={mobileSheetOpen}
                                aria-controls="mobile-shop-sheet"
                            >
                                <GripHorizontal className="h-5 w-5 text-zinc-500" />
                                <span className="flex items-center gap-2 text-sm font-semibold">
                                    {selectedShop?.tienda ??
                                        `${filteredShops.length} tiendas encontradas`}
                                    {mobileSheetOpen ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </span>
                            </button>

                            <div
                                id="mobile-shop-sheet"
                                className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
                            >
                                {shopPanel}
                            </div>
                        </section>
                    </div>
                )}
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
