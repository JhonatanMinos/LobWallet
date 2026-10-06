import { ArrowLeft, Clock, MapPin, Phone, X } from 'lucide-react';
import type { ShopLocation } from '@/types/shops';

interface ShopDetailProps {
    shop: ShopLocation;
    onBack: () => void;
}

export default function ShopsDetail({ shop, onBack }: ShopDetailProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver a la lista</span>
                </button>

                <button
                    type="button"
                    onClick={onBack}
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <span className="inline-block rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Código: {shop.codigo}
                    </span>
                    <h3 className="mt-1 text-base font-semibold text-zinc-50">
                        {shop.tienda}
                    </h3>
                </div>

                <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-300">
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span>
                            {shop.calle}, {shop.colonia}, {shop.municipio}
                        </span>
                    </div>

                    {shop.telefono && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                            <a
                                href={`tel:${shop.telefono}`}
                                className="text-emerald-400 hover:underline"
                            >
                                {shop.telefono}
                            </a>
                        </div>
                    )}

                    {shop.horario && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span>{shop.horario}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
