import { Search } from 'lucide-react';

import { Label } from '@/components/ui/label';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarInput,
} from '@/components/ui/sidebar';

interface SearchFormProps extends React.ComponentProps<'form'> {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
}

export function SearchForm({
    value,
    onValueChange,
    placeholder = 'Buscar...',
    className,
    ...props
}: SearchFormProps) {
    return (
        <form
            onSubmit={(e) => e.preventDefault()}
            className={className}
            {...props}
        >
            <SidebarGroup className="px-0 py-0">
                <SidebarGroupContent className="relative">
                    <Label htmlFor="search" className="sr-only">
                        Buscar
                    </Label>
                    <SidebarInput
                        id="search"
                        value={value}
                        onChange={(e) => onValueChange?.(e.target.value)}
                        placeholder={placeholder}
                        className="pl-8"
                    />
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 opacity-50 select-none" />
                </SidebarGroupContent>
            </SidebarGroup>
        </form>
    );
}
