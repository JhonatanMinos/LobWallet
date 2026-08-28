import { Head, usePage } from '@inertiajs/react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import Barcode from 'react-barcode';

type PageProps = {
    card: {
        id: number;
        user_id: number;
        tarjeta: number;
        status: number;
    };
    transaction: {
        user: number;
        motion: string;
        amount: number;
    };
};

export default function Dashboard() {
    const { card, transaction } = usePage<PageProps>().props;
    console.log(card, transaction);

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
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Saldo disponible
                            </p>

                            <h1 className="text-4xl font-black">$2,100</h1>
                        </div>
                        <div className="rounded-xl bg-white p-4">
                            <Barcode
                                value="LOB-123456789"
                                format="CODE128"
                                width={1.5}
                                height={80}
                                displayValue={true}
                                background="#ffffff"
                                lineColor="#000000"
                                margin={0}
                            />
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                            Muestra este código en caja para utilizar tu saldo.
                        </p>{' '}
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
