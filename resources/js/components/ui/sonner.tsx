import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            offset={{ top: '1rem', right: '1rem' }}
            mobileOffset={{
                top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
                right: '1rem',
                left: '1rem',
            }}
            closeButton
            duration={4500}
            richColors
            expand={false}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'group toast w-[calc(100vw-2rem)] sm:w-auto group-[.toaster]:border-border group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:shadow-lg',
                    title: 'group-[.toast]:font-semibold',
                    description: 'group-[.toast]:text-muted-foreground',
                    actionButton:
                        'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                    cancelButton:
                        'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };
