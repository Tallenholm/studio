'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Consistent empty-state placeholder for data tables and lists.
 * Replaces the ad-hoc dashed-border empty divs used across pages.
 */
export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center border-2 border-dashed rounded-lg animate-fade-in-up">
            <div className="rounded-full bg-muted p-3">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-foreground">{title}</p>
                {message && <p className="text-sm text-muted-foreground max-w-xs">{message}</p>}
            </div>
            {actionLabel && onAction && (
                <Button variant="outline" size="sm" onClick={onAction} className="mt-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
