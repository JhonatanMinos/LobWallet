import { router } from '@inertiajs/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncWallet } from '@/services/sync';

vi.mock('@inertiajs/react', () => ({ router: { reload: vi.fn() } }));

type ReloadOptions = Parameters<typeof router.reload>[0];

const fetchMock = vi.fn<typeof fetch>();
const reloadMock = vi.mocked(router.reload);

function respond(hasChanges: unknown): void {
    fetchMock.mockResolvedValue(
        new Response(
            JSON.stringify({ success: true, has_changes: hasChanges }),
        ),
    );
}

describe('syncWallet', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', fetchMock);
        document.head.innerHTML =
            '<meta name="csrf-token" content="test-csrf">';
        reloadMock.mockImplementation((options) => options?.onFinish?.());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.head.innerHTML = '';
    });

    it('posts with CSRF and reloads the singular dashboard props after changes', async () => {
        respond(true);

        expect(await syncWallet()).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith('/sync', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': 'test-csrf',
            },
        });
        expect(reloadMock).toHaveBeenCalledWith(
            expect.objectContaining({
                only: ['account', 'card', 'transactions'],
            }),
        );
    });

    it.each([false, undefined, 'true', 1])(
        'does not reload without an explicit true has_changes (%s)',
        async (hasChanges) => {
            respond(hasChanges);

            expect(await syncWallet()).toBe(false);
            expect(reloadMock).not.toHaveBeenCalled();
        },
    );

    it('works without a CSRF meta tag', async () => {
        document.head.innerHTML = '';
        respond(false);

        await syncWallet();

        expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty(
            'X-CSRF-TOKEN',
        );
    });

    it('suppresses concurrent sync until the request finishes', async () => {
        let resolveFetch!: (response: Response) => void;
        fetchMock.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveFetch = resolve;
            }),
        );
        const pending = syncWallet();

        expect(await syncWallet()).toBe(false);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        resolveFetch(new Response(JSON.stringify({ has_changes: false })));
        expect(await pending).toBe(false);
        respond(false);
        await syncWallet();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('waits for reload completion and keeps concurrent sync suppressed', async () => {
        respond(true);
        let options: ReloadOptions;
        let completed = false;
        reloadMock.mockImplementation((value) => {
            options = value;
        });
        const pending = syncWallet().then((result) => {
            completed = true;

            return result;
        });

        await vi.waitFor(() => expect(reloadMock).toHaveBeenCalledOnce());
        expect(completed).toBe(false);
        expect(await syncWallet()).toBe(false);
        options?.onFinish?.();
        expect(await pending).toBe(true);
    });

    it('rejects HTTP errors without reloading and permits a later retry', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

        await expect(syncWallet()).rejects.toThrow('sync failed: 503');
        expect(reloadMock).not.toHaveBeenCalled();
        respond(true);
        expect(await syncWallet()).toBe(true);
    });

    it('preserves network errors and permits a later retry', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('offline'));

        await expect(syncWallet()).rejects.toThrow('offline');
        expect(reloadMock).not.toHaveBeenCalled();
        respond(false);
        expect(await syncWallet()).toBe(false);
    });

    it('rejects reload errors and releases the sync guard', async () => {
        respond(true);
        const errors = { wallet: 'reload failed' };
        reloadMock.mockImplementationOnce((options) => {
            options?.onError?.(errors);
            options?.onFinish?.();
        });

        await expect(syncWallet()).rejects.toEqual(errors);
        respond(false);
        expect(await syncWallet()).toBe(false);
    });
});
