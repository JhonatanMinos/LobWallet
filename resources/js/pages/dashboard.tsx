import { Head, router, usePage } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import Barcode from 'react-barcode';
import { CreditCard, CircleDollarSign, ShoppingBag } from 'lucide-react';
import card from '@/routes/card';
import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';

type PageProps = {
    accounts: {
        id: number;
        account: string;
        balance: number;
        activo: string;
        pin: number | null;
    }[];

    owner: {
        name: string;
        last_name: string;
    }[];

    cards: {
        id: number;
        account_id: number;
        card: string;
        status: number;
    }[];

    transactions: {
        motion: string;
        amount: number;
    }[];
};

export default function Dashboard() {
    const { accounts, cards, transactions } = usePage<PageProps>().props;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            await sync();
        } catch (error) {
            console.error('Error sincronizando:', error);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const account = accounts[0];
    const cardGift = cards[0];
    const serialCard = cardGift?.card;
    const balance = account?.balance ?? 0;

    const formatAmount = (amount: number) => {
        return amount.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    return (
        <>
            <Head title="Wallet" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-[0_0_25px_-5px_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-5">
                    {/* Card header */}
                    <div className="mb-4 flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                                    Tarjeta LOB
                                </h2>

                                <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                                    Digital
                                </span>
                            </div>

                            <p className="text-xs leading-relaxed text-zinc-400">
                                En tienda mostrar esta tarjeta para hacer uso
                                del saldo disponible.
                            </p>
                        </div>
                    </div>

                    {/* Digital voucher */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 text-center text-zinc-950 shadow-[0_20px_30px_-10px_rgba(0,0,0,0.5),0_0_1px_1px_rgba(255,255,255,0.05)] transition-transform duration-200 hover:scale-[1.01]">
                        {serialCard ? (
                            <>
                                {/* Balance */}
                                <span className="mb-1 text-xs font-medium tracking-wider text-zinc-500 uppercase">
                                    Saldo disponible
                                </span>

                                <div className="mb-5 text-4xl font-extrabold tracking-tight text-zinc-900">
                                    ${formatAmount(balance)}
                                    <span className="ml-1 text-xs font-normal tracking-normal text-zinc-500">
                                        MXN
                                    </span>
                                </div>

                                {/* Barcode */}
                                <div className="flex w-full flex-col items-center justify-center space-y-2.5">
                                    <div className="w-full max-w-[280px] overflow-hidden rounded-sm bg-white">
                                        <Barcode
                                            value={serialCard}
                                            format="CODE128"
                                            width={2}
                                            height={85}
                                            displayValue={false}
                                            background="#ffffff"
                                            lineColor="#09090b"
                                            margin={0}
                                            fontSize={12}
                                        />
                                    </div>
                                </div>

                                {/* Card status */}
                                <div className="mt-4 flex w-full items-center justify-between border-t border-dashed border-zinc-200 pt-3 text-[11px] text-zinc-400">
                                    <span>
                                        Cuenta #
                                        {account?.account ?? account?.id}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex min-h-[250px] w-full flex-col items-center justify-center">
                                <CreditCard className="mb-3 h-10 w-10 text-zinc-300" />

                                <p className="text-sm font-medium text-zinc-700">
                                    No hay tarjeta disponible.
                                </p>

                                <p className="mt-1 text-xs text-zinc-400">
                                    Agrega una tarjeta para comenzar.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Add card */}
                    <div className="mt-5 flex justify-center">
                        <button
                            type="button"
                            onClick={() => router.get(card.create().url)}
                            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium whitespace-nowrap text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 sm:w-auto"
                        >
                            <CreditCard className="h-3.5 w-3.5 text-zinc-400" />

                            <span>Agregar tarjeta</span>
                        </button>
                    </div>
                </section>
                {/* Recent activity */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-[0_0_25px_-5px_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold tracking-tight text-zinc-50">
                                Últimas actividades
                            </h3>

                            <p className="text-[11px] text-zinc-400">
                                Historial reciente de transacciones y uso de
                                saldo
                            </p>
                        </div>

                        <button
                            type="button"
                            className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                        >
                            Ver todo
                        </button>
                    </div>

                    {/* Transactions */}
                    <div className="divide-y divide-zinc-800/60">
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => {
                                const isPositive = transaction.amount >= 0;

                                return (
                                    <div
                                        key={transaction.id}
                                        className="group flex items-center justify-between gap-3 py-3"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors group-hover:border-zinc-700">
                                                {isPositive ? (
                                                    <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                                                ) : (
                                                    <ShoppingBag className="h-4 w-4 text-rose-400" />
                                                )}
                                            </div>

                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium text-zinc-50 capitalize">
                                                    {transaction.motion}
                                                </p>

                                                <p className="font-mono text-[11px] text-zinc-400">
                                                    Cuenta #
                                                    {transaction.account_id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span
                                                className={`font-mono text-xs font-semibold tracking-tight ${
                                                    isPositive
                                                        ? 'text-emerald-400'
                                                        : 'text-rose-400'
                                                }`}
                                            >
                                                {isPositive ? '+' : '-'}$
                                                {formatAmount(
                                                    Math.abs(
                                                        transaction.amount,
                                                    ),
                                                )}
                                            </span>

                                            <span className="block text-[10px] text-zinc-500">
                                                Movimiento
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-xs text-zinc-400">
                                    No hay actividades recientes.
                                </p>
                            </div>
                        )}
                    </div>
                </section>{' '}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
