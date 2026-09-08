import { useRef, useState } from 'react';

export default function PullToRefresh({ onRefresh, children }) {
    const startY = useRef(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (window.scrollY !== 0 || refreshing) {
            return;
        }

        const currentY = e.touches[0].clientY;
        const distance = currentY - startY.current;

        if (distance > 0) {
            setPullDistance(Math.min(distance, 100));
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance < 60 || refreshing) {
            setPullDistance(0);
            return;
        }

        setRefreshing(true);
        setPullDistance(60);

        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
            setPullDistance(0);
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="flex justify-center overflow-hidden transition-all"
                style={{
                    height: pullDistance,
                }}
            >
                {pullDistance > 0 && (
                    <div className="py-3 text-sm text-muted-foreground">
                        {refreshing
                            ? 'Actualizando...'
                            : pullDistance >= 60
                              ? 'Suelta para actualizar'
                              : 'Desliza para actualizar'}
                    </div>
                )}
            </div>

            {children}
        </div>
    );
}
