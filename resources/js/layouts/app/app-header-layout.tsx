import { AppContent } from '@/components/app-content';
import { MobileDockMenu } from '@/components/app-dock-menu';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    const isMovile = useIsMobile();

    return (
        <AppShell variant="header">
            {isMovile ? (
                <>
                    {/* Contenido con padding inferior suficiente para el dock flotante */}
                    <AppContent
                        className="mt-4 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]"
                        variant="header"
                    >
                        {children}
                    </AppContent>
                    {/* Dock flotante fijo en la parte inferior */}
                    <MobileDockMenu />
                </>
            ) : (
                <>
                    <AppHeader breadcrumbs={breadcrumbs} />
                    <AppContent variant="header">{children}</AppContent>
                </>
            )}
        </AppShell>
    );
}
