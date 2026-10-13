import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useShopSearch } from '@/hooks/useShopSearch';

const shops = [
    {
        tienda: 'Café Centro',
        municipio: 'Puebla',
        colonia: 'Centro',
        calle: 'Reforma 10',
        codigo: '72000',
    },
    {
        tienda: 'Mercado Norte',
        municipio: 'Monterrey',
        colonia: 'Obispado',
        calle: 'Hidalgo 20',
        codigo: '64000',
    },
];

describe('useShopSearch', () => {
    it('returns all shops when the query is empty', () => {
        const { result } = renderHook(() => useShopSearch(shops));

        expect(result.current.filteredShops).toEqual(shops);
    });

    it('filters by any searchable field without case sensitivity', () => {
        const { result } = renderHook(() => useShopSearch(shops));

        act(() => result.current.setSearchQuery('  MONTERREY '));

        expect(result.current.filteredShops).toEqual([shops[1]]);
    });

    it('updates results when the shop collection changes', () => {
        const { result, rerender } = renderHook(
            ({ items }) => useShopSearch(items),
            { initialProps: { items: shops } },
        );

        act(() => result.current.setSearchQuery('72000'));
        expect(result.current.filteredShops).toEqual([shops[0]]);

        rerender({ items: [shops[1]] });
        expect(result.current.filteredShops).toEqual([]);
    });

    it('handles missing collections by returning an empty result', () => {
        const { result } = renderHook(() => useShopSearch());

        expect(result.current.filteredShops).toEqual([]);
    });
});
