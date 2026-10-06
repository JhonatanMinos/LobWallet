import { MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ShopLocation } from '@/types/shops';

interface ShopListProps {
    shops: ShopLocation[];
    onSelect: (shop: ShopLocation) => void;
}

export default function ShopList({ shops, onSelect }: ShopListProps) {
    return (
        <div className="flex h-full min-h-0 w-full flex-col">
            <div className="shrink-0 pb-3">
                <h3 className="truncate text-sm font-semibold text-zinc-100">
                    Tiendas encontradas ({shops.length})
                </h3>
            </div>

            {shops.length > 0 ? (
                <ScrollArea className="min-h-0 flex-1">
                    <div className="grid gap-3 pb-2 sm:grid-cols-2">
                        {shops.map((shop) => (
                            <div
                                key={shop.codigo}
                                onClick={() => onSelect(shop)}
                                className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-300 shadow-sm transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                            >
                                <h4 className="font-semibold text-zinc-50">
                                    {shop.tienda}
                                </h4>
                                <p className="mt-1 flex items-start gap-1 text-zinc-400">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                    <span>
                                        {shop.calle}, {shop.colonia},{' '}
                                        {shop.municipio}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-800">
                    <p className="text-xs text-zinc-500">
                        No se encontraron tiendas que coincidan con la búsqueda.
                    </p>
                </div>
            )}
        </div>
    );
}
