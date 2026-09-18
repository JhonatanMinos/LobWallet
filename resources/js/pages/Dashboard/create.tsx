import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { router } from '@inertiajs/react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import card from '@/routes/card';

const cardSchema = z.object({
    card: z
        .string()
        .min(1, 'La tarjeta es obligatoria')
        .regex(/^\d+$/, 'La tarjeta solo debe contener números'),

    name: z.string().min(1, 'El nombre es obligatorio'),

    lastName: z.string().min(1, 'El apellido es obligatorio'),

    movil: z
        .string()
        .min(1, 'El móvil es obligatorio')
        .regex(/^\d+$/, 'El móvil solo debe contener números'),
});

type CardForm = z.infer<typeof cardSchema>;

export default function AddCard() {
    const [isDefault, setIsDefault] = useState(true);
    const form = useForm<CardForm>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            card: '',
            name: '',
            lastName: '',
            movil: '',
        },
    });

    const {
        control,
        handleSubmit,
        reset,
        watch,
        formState: { isSubmitting },
    } = form;

    const cardNumber = watch('card');
    const name = watch('name');
    const lastName = watch('lastName');

    const [previewCard, setPreviewCard] = useState('•••• •••• •••• ••••');
    const [previewName, setPreviewName] = useState('NOMBRE DEL TITULAR');

    useEffect(() => {
        const value = cardNumber?.replace(/\s+/g, '') || '';

        if (!value) {
            setPreviewCard('•••• •••• •••• ••••');
            return;
        }

        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;

        setPreviewCard(formatted);
    }, [cardNumber]);

    useEffect(() => {
        const fullName = `${name?.trim() || ''} ${
            lastName?.trim() || ''
        }`.trim();

        setPreviewName(
            fullName.length > 0 ? fullName.toUpperCase() : 'NOMBRE DEL TITULAR',
        );
    }, [name, lastName]);

    const submit = async (data: CardForm) => {
        router.post(
            card.store().url,
            {
                ...data,
                card: data.card.replace(/\s/g, ''),
                movil: data.movil.replace(/\s/g, ''),
            },
            {
                preserveScroll: true,
                preserveState: true,

                onSuccess: () => {
                    reset();
                },
            },
        );
    };

    return (
        <main className="flex min-h-screen w-full justify-center bg-zinc-950 text-zinc-100">
            <div className="relative flex min-h-screen w-full max-w-md flex-col border-x border-zinc-800/40 bg-zinc-950 pb-8 shadow-2xl">
                {/* CONTENT */}
                <section className="flex-1 space-y-6 px-5 pt-5 pb-6">
                    {/* CARD PREVIEW */}
                    <Card className="relative overflow-hidden rounded-2xl border-zinc-700/60 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 shadow-xl">
                        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-zinc-700/15 blur-2xl" />

                        <CardContent className="relative z-10 h-36 p-5">
                            <div className="flex h-full flex-col justify-between">
                                {/* CARD HEADER */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center rounded bg-zinc-100 px-2 py-1 text-xs font-black tracking-tighter text-zinc-950">
                                            LOB
                                        </span>

                                        <span className="text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
                                            Tarjeta Digital
                                        </span>
                                    </div>
                                </div>

                                {/* CARD NUMBER */}
                                <div className="space-y-1">
                                    <span className="block font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                                        Número de tarjeta
                                    </span>

                                    <p className="font-mono text-base tracking-widest text-zinc-200">
                                        {previewCard}
                                    </p>
                                </div>

                                {/* CARD META */}
                                <div className="flex items-end justify-between border-t border-zinc-800/80 pt-1">
                                    <div>
                                        <span className="block text-[9px] tracking-wider text-zinc-400 uppercase">
                                            Titular
                                        </span>

                                        <p className="max-w-[190px] truncate text-xs font-semibold text-zinc-300">
                                            {previewName}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span className="block text-[9px] tracking-wider text-zinc-400 uppercase">
                                            Vigencia
                                        </span>

                                        <span className="font-mono text-xs text-zinc-300">
                                            12/28
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* FORM */}
                    <Form {...form}>
                        <form
                            id="add-card-form"
                            onSubmit={handleSubmit(submit)}
                            className="space-y-4"
                        >
                            {/* CARD NUMBER */}
                            <FormField
                                control={control}
                                name="card"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-medium text-zinc-300">
                                                Número de tarjeta
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </FormLabel>

                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                                            >
                                                <svg
                                                    fill="none"
                                                    height="13"
                                                    stroke="currentColor"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                    width="13"
                                                >
                                                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                                    <circle
                                                        cx="12"
                                                        cy="13"
                                                        r="3"
                                                    />
                                                </svg>
                                                Escanear
                                            </button>
                                        </div>

                                        <FormControl>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                                                    <svg
                                                        fill="none"
                                                        height="16"
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                        width="16"
                                                    >
                                                        <rect
                                                            height="14"
                                                            rx="2"
                                                            width="20"
                                                            x="2"
                                                            y="5"
                                                        />
                                                        <line
                                                            x1="2"
                                                            x2="22"
                                                            y1="10"
                                                            y2="10"
                                                        />
                                                    </svg>
                                                </div>

                                                <Input
                                                    {...field}
                                                    id="card"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="cc-number"
                                                    placeholder="Ej. 2027 0024 2389"
                                                    maxLength={19}
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            );

                                                        field.onChange(
                                                            value.slice(0, 16),
                                                        );
                                                    }}
                                                    className="border-zinc-800 bg-zinc-900/90 py-2.5 pr-10 pl-9 font-mono text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-700 focus:ring-zinc-400"
                                                />

                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
                                                    <svg
                                                        fill="none"
                                                        height="15"
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                        width="15"
                                                    >
                                                        <rect
                                                            height="14"
                                                            rx="2"
                                                            ry="2"
                                                            width="14"
                                                            x="8"
                                                            y="8"
                                                        />
                                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </FormControl>

                                        <p className="text-[11px] text-zinc-400">
                                            Ingresa los 10 o 16 dígitos al
                                            frente de tu plástico o cupón
                                            digital.
                                        </p>

                                        <FormMessage className="text-[11px] text-rose-400" />
                                    </FormItem>
                                )}
                            />
                            {/* NAME + LAST NAME */}
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-zinc-300">
                                                Nombre{' '}
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </FormLabel>

                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    id="name"
                                                    type="text"
                                                    autoComplete="given-name"
                                                    placeholder="Ej. Juan"
                                                    className="border-zinc-800 bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-400"
                                                />
                                            </FormControl>

                                            <FormMessage className="text-[11px] text-rose-400" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-zinc-300">
                                                Apellido{' '}
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </FormLabel>

                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    id="lastName"
                                                    type="text"
                                                    autoComplete="family-name"
                                                    placeholder="Ej. Pérez Morales"
                                                    className="border-zinc-800 bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-400"
                                                />
                                            </FormControl>

                                            <FormMessage className="text-[11px] text-rose-400" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* MOBILE */}
                            <FormField
                                control={control}
                                name="movil"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-xs font-medium text-zinc-300">
                                                Móvil asociado{' '}
                                                <span className="text-rose-400">
                                                    *
                                                </span>
                                            </FormLabel>

                                            <span className="text-[11px] text-zinc-400">
                                                Para código SMS OTP
                                            </span>
                                        </div>

                                        <FormControl>
                                            <div className="flex overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/90 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-400">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 border-r border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                                                >
                                                    <span className="text-sm">
                                                        🇲🇽
                                                    </span>

                                                    <span>+52</span>

                                                    <svg
                                                        className="ml-0.5 text-zinc-500"
                                                        fill="none"
                                                        height="12"
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        viewBox="0 0 24 24"
                                                        width="12"
                                                    >
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </button>

                                                <Input
                                                    {...field}
                                                    id="movil"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    autoComplete="tel"
                                                    placeholder="55 1234 5678"
                                                    onChange={(event) => {
                                                        const value =
                                                            event.target.value.replace(
                                                                /\D/g,
                                                                '',
                                                            );

                                                        field.onChange(
                                                            value.slice(0, 10),
                                                        );
                                                    }}
                                                    className="border-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-0"
                                                />
                                            </div>
                                        </FormControl>

                                        <FormMessage className="text-[11px] text-rose-400" />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                    {/* SECURITY NOTICE */}
                    <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-3">
                        <svg
                            className="mt-0.5 shrink-0 text-emerald-400"
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="16"
                        >
                            <rect height="11" rx="2" width="18" x="3" y="11" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>

                        <p className="text-[11px] leading-relaxed text-zinc-400">
                            Tus datos están protegidos con cifrado de nivel
                            bancario. Al registrarte aceptas los{' '}
                            <a
                                href="#"
                                className="text-zinc-300 underline underline-offset-2"
                            >
                                Términos de Monedero LOB
                            </a>
                            .
                        </p>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="sticky bottom-0 z-20 space-y-2.5 border-t border-zinc-800/80 bg-zinc-950/90 px-5 pt-3 pb-4 backdrop-blur-lg">
                    <Button
                        type="submit"
                        form="add-card-form"
                        disabled={isSubmitting}
                        className="h-11 w-full rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
                    >
                        <svg
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                            width="16"
                        >
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>

                        {isSubmitting ? 'Guardando...' : 'Agregar tarjeta'}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="h-9 w-full rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    >
                        Cancelar
                    </Button>

                    <div className="pt-1 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-400">
                            <svg
                                fill="none"
                                height="10"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="10"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            </svg>
                            Operado de forma segura por LOB Retail • Cifrado SSL
                            256-bit
                        </span>
                    </div>
                </footer>
            </div>
        </main>
    );
}
