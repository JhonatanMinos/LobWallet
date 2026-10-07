import { Link, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { primaryNavItems } from '@/config/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

const activeItemStyles =
    'bg-neutral-200/90 text-neutral-950 dark:bg-neutral-800 dark:text-neutral-100';

export function MobileDockMenu() {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <nav
                aria-label="Main navigation"
                className={cn(
                    'pointer-events-auto mx-auto max-w-[calc(100vw-1rem)]',
                    'flex w-[calc(100vw-1rem)] items-center gap-1 p-2 sm:w-auto sm:gap-2',
                    'rounded-full',
                    'bg-white/80 dark:bg-black/35',
                    'backdrop-blur-2xl backdrop-saturate-200',
                    'border border-neutral-300/80 dark:border-white/15',
                    'shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.6),0_16px_40px_rgba(0,0,0,0.15)]',
                    'dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.15),0_16px_40px_rgba(0,0,0,0.5)]',
                )}
            >
                {primaryNavItems.map(({ title, href, icon: Icon }) => (
                    <Link
                        key={title}
                        href={href}
                        aria-label={title}
                        aria-current={isCurrentUrl(href) ? 'page' : undefined}
                        className={cn(
                            'flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 sm:min-w-14 sm:flex-none',
                            'rounded-full text-neutral-700 transition-colors dark:text-neutral-300',
                            'hover:bg-neutral-200/70 hover:text-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
                            whenCurrentUrl(href, activeItemStyles),
                        )}
                    >
                        {Icon && <Icon className="h-5 w-5" />}
                        <span className="max-w-full truncate text-[10px] leading-none font-medium">
                            {title}
                        </span>
                    </Link>
                ))}
                <div className="flex shrink-0 items-center border-l border-neutral-300/70 pl-1 dark:border-white/15">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="size-12 rounded-full p-1 focus-visible:ring-2 focus-visible:ring-ring"
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
