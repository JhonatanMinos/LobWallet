import { Link, usePage } from '@inertiajs/react';
import { WalletCards, Percent, Map } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';

import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as store } from '@/routes/store';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Wallet',
        href: dashboard(),
        icon: WalletCards,
    },
    {
        title: 'Promociones',
        href: '#',
        icon: Percent,
    },
    {
        title: 'Tiendas',
        href: store(),
        icon: Map,
    },
];

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function MobileDockMenu() {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { whenCurrentUrl } = useCurrentUrl();

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <nav
                aria-label="Main navigation"
                className={cn(
                    'pointer-events-auto mx-auto w-fit max-w-[calc(100vw-1rem)]',
                    'flex items-center gap-1 p-2 sm:gap-2',
                    'rounded-full',
                    'bg-white/30 dark:bg-black/35',
                    'backdrop-blur-2xl backdrop-saturate-200',
                    'border border-white/40 dark:border-white/15',
                    'shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.6),0_16px_40px_rgba(0,0,0,0.15)]',
                    'dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15),0_16px_40px_rgba(0,0,0,0.5)]',
                )}
            >
                {mainNavItems.map(({ title, href, icon: Icon }) => (
                    <Link
                        key={title}
                        href={href}
                        aria-label={title}
                        className={cn(
                            'flex h-14 min-w-14 flex-col items-center justify-center gap-0.5 px-1',
                            'rounded-full transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            whenCurrentUrl(href, activeItemStyles),
                        )}
                    >
                        {Icon && <Icon className="h-5 w-5" />}
                        <span className="text-[10px] leading-none font-medium">
                            {title}
                        </span>
                    </Link>
                ))}
                <div className="ml-auto flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-12 rounded-full p-1"
                                aria-label="Abrir menú de usuario"
                                title="Menú de usuario"
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={auth.user?.avatar}
                                        alt={auth.user?.name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user?.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {auth.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>
        </div>
    );
}
