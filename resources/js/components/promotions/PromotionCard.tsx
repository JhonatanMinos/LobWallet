import { Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Percent } from 'lucide-react';
import { index as store } from '@/routes/store';
import type { Promotion } from '@/types/promotions';

type PromotionCardProps = {
    promotion: Promotion;
};

function formatDate(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
    const validUntil = formatDate(promotion.valid_until);
    const storeUrl = promotion.store_code
        ? store({ query: { shop: promotion.store_code } }).url
        : store().url;

    return (
        <article className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-[0_0_25px_-5px_rgba(255,255,255,0.05)] transition duration-200 hover:border-zinc-700 hover:bg-zinc-900">
            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-500/30 via-zinc-900 to-zinc-950">
                {promotion.image_url ? (
                    <img
                        src={promotion.image_url}
                        alt={promotion.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full flex-col justify-between p-5">
                        <Percent className="h-8 w-8 text-emerald-300" />
                        <span className="max-w-[14rem] text-2xl font-bold tracking-tight text-white">
                            {promotion.discount || 'Oferta especial'}
                        </span>
                    </div>
                )}

                {promotion.discount && (
                    <span className="absolute top-3 left-3 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-emerald-950 shadow-lg">
                        {promotion.discount}
                    </span>
                )}
            </div>

            <div className="space-y-4 p-4">
                <div>
                    {promotion.category && (
                        <span className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                            {promotion.category}
                        </span>
                    )}
                    <h2 className="mt-1 text-base font-semibold text-zinc-50">
                        {promotion.title}
                    </h2>
                    {promotion.description && (
                        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                            {promotion.description}
                        </p>
                    )}
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                    {promotion.store_name && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                            <span className="truncate">
                                {promotion.store_name}
                            </span>
                        </div>
                    )}
                    {validUntil && (
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
                            <span>Válida hasta {validUntil}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Link
                        href={promotion.cta_url || storeUrl}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-white"
                    >
                        {promotion.cta_label || 'Ver promoción'}
                    </Link>
                    {promotion.store_code && (
                        <Link
                            href={storeUrl}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                        >
                            Tienda
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
