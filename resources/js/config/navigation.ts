import { Map, Percent, WalletCards } from 'lucide-react';
import { dashboard } from '@/routes';
import { index as promotions } from '@/routes/promotions';
import { index as store } from '@/routes/store';
import type { NavItem } from '@/types';

export const primaryNavItems: NavItem[] = [
    {
        title: 'Wallet',
        href: dashboard(),
        icon: WalletCards,
    },
    {
        title: 'Promociones',
        href: promotions(),
        icon: Percent,
    },
    {
        title: 'Tiendas',
        href: store(),
        icon: Map,
    },
];
