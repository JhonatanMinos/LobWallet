import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Account = {
    id: number;
    account: string;
};

type Props = {
    accounts: Account[];
};

export default function AddCard({ accounts }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        account_id: '',
        card: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/cards');
    };

    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle>Agregar tarjeta</CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Cuenta
                        </label>

                        <select
                            value={data.account_id}
                            onChange={(e) =>
                                setData('account_id', e.target.value)
                            }
                            className="w-full rounded-md border bg-background px-3 py-2"
                        >
                            <option value="">Selecciona una cuenta</option>

                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.account}
                                </option>
                            ))}
                        </select>

                        {errors.account_id && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.account_id}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Número de tarjeta
                        </label>

                        <Input
                            type="text"
                            value={data.card}
                            onChange={(e) => setData('card', e.target.value)}
                            placeholder="2027002423"
                        />

                        {errors.card && (
                            <p className="mt-1 text-sm text-red-500">
                                {errors.card}
                            </p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        {processing ? 'Guardando...' : 'Agregar tarjeta'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
