import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '@/pages/dashboard';
import { syncWallet } from '@/services/sync';

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    router: { get: vi.fn() },
    usePage: () => ({
        props: {
            account: {
                id: 10,
                account: 'LOB-001',
                balance: 1250.5,
                activo: true,
                pin: null,
            },
            card: {
                id: 20,
                account_id: 10,
                card: '202700242389',
                status: true,
            },
            transactions: [
                {
                    id: 30,
                    account_id: 10,
                    motion: 'Compra',
                    amount: -50,
                    created_at: '2026-10-13 08:00:00',
                },
            ],
        },
    }),
}));
vi.mock('@/services/sync', () => ({ syncWallet: vi.fn() }));
vi.mock('@/routes', () => ({ dashboard: () => '/dashboard' }));
vi.mock('@/routes/accountCard', () => ({
    default: { create: () => ({ url: '/newCard' }) },
}));
vi.mock('react-barcode', () => ({
    default: ({ value }: { value: string }) => (
        <div data-testid="barcode">{value}</div>
    ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const syncMock = vi.mocked(syncWallet);

function expectCachedWallet(): void {
    expect(screen.getByText('$1,250.50')).toBeTruthy();
    expect(screen.getByTestId('barcode').textContent).toBe('202700242389');
    expect(screen.getByText('Cuenta #LOB-001')).toBeTruthy();
    expect(screen.getByText('Compra')).toBeTruthy();
    expect(screen.getByText('-$50.00')).toBeTruthy();
}

describe('dashboard background sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('Unexpected HTTP request')),
        );
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('renders cached balance, card and history while initial sync is deferred', async () => {
        let resolveSync!: (changed: boolean) => void;
        syncMock.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveSync = resolve;
            }),
        );

        render(<Dashboard />);

        expectCachedWallet();
        expect(screen.getByText('Actualizando...')).toBeTruthy();
        expect(
            screen.getByText('Datos disponibles en el dispositivo'),
        ).toBeTruthy();
        expect(
            (
                screen.getByRole('button', {
                    name: 'Actualizar wallet',
                }) as HTMLButtonElement
            ).disabled,
        ).toBe(true);
        expect(syncMock).toHaveBeenCalledOnce();
        await act(async () => resolveSync(false));
        expectCachedWallet();
        expect(screen.getByText('Al día')).toBeTruthy();
    });

    it('keeps cached wallet data visible when background sync rejects', async () => {
        let rejectSync!: (reason: Error) => void;
        syncMock.mockReturnValueOnce(
            new Promise((_resolve, reject) => {
                rejectSync = reject;
            }),
        );
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        render(<Dashboard />);
        expectCachedWallet();
        await act(async () => rejectSync(new Error('offline')));

        expectCachedWallet();
        expect(screen.getByText('Sin conexión')).toBeTruthy();
        expect(
            screen.getByText('Datos disponibles en el dispositivo'),
        ).toBeTruthy();
        expect(
            (
                screen.getByRole('button', {
                    name: 'Actualizar wallet',
                }) as HTMLButtonElement
            ).disabled,
        ).toBe(false);
        expect(consoleError).toHaveBeenCalledOnce();
    });
});
