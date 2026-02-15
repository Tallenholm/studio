'use client';

import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    children?: React.ReactNode; // Slot for action buttons
}

/**
 * Consistent page header used across all admin/employee pages.
 * Replaces the repeated CardTitle + CardDescription + icon pattern.
 */
export default function PageHeader({ icon: Icon, title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
                <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
                    <Icon className="h-8 w-8 text-primary shrink-0" />
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground ml-11">{description}</p>
                )}
            </div>
            {children && <div className="flex items-center gap-2 ml-11 sm:ml-0 mt-2 sm:mt-0">{children}</div>}
        </div>
    );
}
