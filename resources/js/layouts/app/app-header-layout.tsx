import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { MobileDockMenu } from '@/components/app-dock-menu';
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
                    <MobileDockMenu />
                    <AppContent className="mt-4 pt-8" variant="header">
                        {children}
                    </AppContent>
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
