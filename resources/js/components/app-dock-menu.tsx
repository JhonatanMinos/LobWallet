import { WalletCards, Percent, Map } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { UserMenuContent } from '@/components/user-menu-content';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

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
        href: '#',
        icon: Map,
    },
];

const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

export function MobileDockMenu() {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <nav
            aria-label="Main navigation"
            className={cn(
                'fixed inset-x-0 bottom-3 z-50 mx-auto w-fit',
                'flex items-center gap-1 p-1.5',
                'rounded-[22px]',
                'border border-black/[0.08] dark:border-white/[0.10]',
                'bg-white/70 dark:bg-black/55',
                'shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
                'backdrop-blur-2xl backdrop-saturate-150',
                'supports-[backdrop-filter]:bg-white/55',
                'dark:supports-[backdrop-filter]:bg-black/45',
            )}
        >
            {mainNavItems.map(({ title, href, icon: Icon }) => (
                <Link
                    key={title}
                    href={href}
                    aria-label={title}
                    className={cn(
                        'flex size-10 items-center justify-center',
                        'rounded-full transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        whenCurrentUrl(href, activeItemStyles),
                    )}
                >
                    <Icon className="h-5 w-5" />
                </Link>
            ))}
            <div className="ml-auto flex items-center space-x-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-10 rounded-full p-1"
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
    );
}
