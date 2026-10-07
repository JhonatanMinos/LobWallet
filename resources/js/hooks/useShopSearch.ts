import { useMemo, useState } from 'react';
import type { ShopLocation } from '@/types/shops';

export function useShopSearch(shops: ShopLocation[] = []) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredShops = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return shops;
        }

        return shops.filter((shop) =>
            [
                shop.tienda,
                shop.municipio,
                shop.colonia,
                shop.calle,
                shop.codigo,
            ].some((value) => value?.toLowerCase().includes(query)),
        );
    }, [shops, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        filteredShops,
    };
}
