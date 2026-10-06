import { Head, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

type ErrorPageProps = {
    status: number;
};

const errorContent: Record<number, { title: string; message: string }> = {
    403: {
        title: 'Acceso no autorizado',
        message: 'No tienes permisos para consultar esta pantalla.',
    },
    404: {
        title: 'Página no encontrada',
        message: 'La pantalla que buscas no existe o ya no está disponible.',
    },
    419: {
        title: 'Sesión expirada',
        message: 'Tu sesión expiró. Recarga la pantalla para continuar.',
    },
    429: {
        title: 'Demasiadas solicitudes',
        message: 'Espera un momento antes de volver a intentarlo.',
    },
    500: {
        title: 'Ocurrió un error',
        message: 'No pudimos completar la solicitud. Inténtalo nuevamente.',
    },
    503: {
        title: 'Servicio temporalmente no disponible',
        message: 'Estamos trabajando para restablecer el servicio.',
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const content =
        errorContent[status] ?? errorContent[500] ?? errorContent[404];

    return (
        <>
            <Head title={`${status} - ${content.title}`} />

            <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
                <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-xl sm:p-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-8 w-8" />
                    </div>

                    <p className="mt-6 text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                        Error {status}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight">
                        {content.title}
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {content.message}
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-11"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Button>
                        <Button
                            type="button"
                            className="min-h-11"
                            onClick={() => router.visit(dashboard().url)}
                        >
                            <Home className="h-4 w-4" />
                            Ir al inicio
                        </Button>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 min-h-11 w-full"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reintentar
                    </Button>
                </section>
            </main>
        </>
    );
}
