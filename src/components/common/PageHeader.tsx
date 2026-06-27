'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export default function PageHeader({ icon: Icon, title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6 pb-6 border-b border-border/50", className)}>
            <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-0.5 pt-0.5">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 mt-3 sm:mt-0 ml-[52px] sm:ml-0">
                    {children}
                </div>
            )}
        </div>
    );
}
