import { Head } from '@inertiajs/react';
import { BadgePercent } from 'lucide-react';
import PromotionCard from '@/components/promotions/PromotionCard';
import { index as promotions } from '@/routes/promotions';
import type { PromotionsResponse } from '@/types/promotions';

type PromotionsPageProps = {
    promotions: PromotionsResponse;
};

export default function Promotions({
    promotions: response,
}: PromotionsPageProps) {
    const items = response?.promotions ?? [];

    return (
        <>
            <Head title="Promociones" />

            <div className="mx-4 my-4 space-y-5 sm:m-5 sm:space-y-6">
                <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-zinc-900/80 to-zinc-950 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                            <BadgePercent className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                                Beneficios LOB
                            </p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
                                Promociones para ti
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
                                Descubre descuentos y beneficios disponibles en
                                las tiendas participantes.
                            </p>
                        </div>
                    </div>
                </section>

                {items.length > 0 ? (
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((promotion) => (
                            <PromotionCard
                                key={promotion.id}
                                promotion={promotion}
                            />
                        ))}
                    </section>
                ) : (
                    <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-6 text-center">
                        <BadgePercent className="mb-3 h-9 w-9 text-zinc-600" />
                        <h2 className="text-sm font-semibold text-zinc-200">
                            Aún no hay promociones disponibles
                        </h2>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
                            Vuelve pronto para consultar nuevos beneficios en
                            las tiendas participantes.
                        </p>
                    </section>
                )}
            </div>
        </>
    );
}

Promotions.layout = {
    breadcrumbs: [
        {
            title: 'Promociones',
            href: promotions(),
        },
    ],
};
