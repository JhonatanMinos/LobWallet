import { router } from '@inertiajs/react';

let syncing = false;

export async function syncWallet(): Promise<boolean> {
    if (syncing) {
        return false;
    }

    syncing = true;

    try {
        const csrf = document.querySelector<HTMLMetaElement>(
            'meta[name="csrf-token"]',
        )?.content;

        const response = await fetch('/sync', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrf
                    ? {
                          'X-CSRF-TOKEN': csrf,
                      }
                    : {}),
            },
        });

        if (!response.ok) {
            throw new Error(`sync failed: ${response.status}`);
        }

        const result = await response.json();

        if (result.has_changes) {
            await reloadWallet();
        }

        return result.has_changes === true;
    } finally {
        syncing = false;
    }
}

export function reloadWallet(): Promise<void> {
    return new Promise((resolve, reject) => {
        router.reload({
            only: ['accounts', 'cards', 'transactions'],
            onFinish: () => {
                resolve();
            },
            onError: (errors) => {
                reject(errors);
            },
        });
    });
}
