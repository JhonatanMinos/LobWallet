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
import { CreditCard } from 'lucide-react';
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

    cards: {
        id: number;
        account_id: number;
        card: string;
        status: number;
    }[];

    transactions: {
        id: number;
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
    console.log(serialCard);

    return (
        <>
            <Head title="Wallet" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="max-x-sm w-full">
                    <CardHeader>
                        <CardTitle>Tarjeta LOB</CardTitle>
                        <CardDescription>
                            En tienda mostrar esta tarjeta para hacer uso del
                            saldo disponible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <div className="rounded-xl bg-white p-4">
                            {serialCard ? (
                                <div className="rounded-xl bg-white p-4">
                                    <p className="text-center text-sm text-muted-foreground">
                                        Saldo disponible
                                    </p>

                                    <h1 className="mt-2 text-center text-4xl font-semibold text-black">
                                        $
                                        {account?.balance?.toLocaleString(
                                            'es-MX',
                                            {
                                                minimumFractionDigits: 2,
                                            },
                                        ) ?? '0.00'}
                                    </h1>

                                    <Barcode
                                        value={serialCard}
                                        format="CODE128"
                                        width={2.5}
                                        height={80}
                                        displayValue={true}
                                        background="#ffffff"
                                        lineColor="#000000"
                                        margin={0}
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No hay tarjeta disponible.
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={() => router.get(cardCreate.create().url)}
                            variant="secondary"
                            className="flex items-center gap-2"
                        >
                            <CreditCard className="h-5 w-5" />
                            <span>Agregar tarjeta</span>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ultimas actividades</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between border-b pb-3"
                            >
                                <div>
                                    <p className="font-medium">
                                        {transaction.motion}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Cuenta #{transaction.account_id}
                                    </p>
                                </div>

                                <p className="font-semibold">
                                    ${transaction.amount}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
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
