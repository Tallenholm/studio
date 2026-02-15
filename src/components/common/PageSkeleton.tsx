'use client';

/**
 * Shimmer skeleton loading state that replaces bare Loader2 spinners.
 * Shows structural placeholders so users perceive faster loading.
 *
 * @param variant - 'dashboard' shows stat cards + table; 'table' shows a
 *   header + rows; 'form' shows a header + form fields.
 */
export default function PageSkeleton({
    variant = 'table',
}: {
    variant?: 'dashboard' | 'table' | 'form';
}) {
    const shimmerBlock = (className: string) => (
        <div className={`rounded-md animate-shimmer ${className}`} />
    );

    if (variant === 'dashboard') {
        return (
            <div className="container mx-auto py-8 space-y-8 animate-fade-in-up">
                {/* Stat cards row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-6 space-y-3">
                            {shimmerBlock('h-4 w-12')}
                            {shimmerBlock('h-8 w-20')}
                            {shimmerBlock('h-3 w-24')}
                        </div>
                    ))}
                </div>
                {/* Content area */}
                <div className="rounded-xl border p-6 space-y-4">
                    {shimmerBlock('h-6 w-48')}
                    {shimmerBlock('h-4 w-full')}
                    {shimmerBlock('h-4 w-3/4')}
                    {shimmerBlock('h-4 w-5/6')}
                </div>
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
                <div className="space-y-2">
                    {shimmerBlock('h-8 w-64')}
                    {shimmerBlock('h-4 w-96')}
                </div>
                <div className="rounded-xl border p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                {shimmerBlock('h-4 w-24')}
                                {shimmerBlock('h-10 w-full')}
                            </div>
                        ))}
                    </div>
                    {shimmerBlock('h-10 w-32')}
                </div>
            </div>
        );
    }

    // Default: table variant
    return (
        <div className="container mx-auto py-8 space-y-6 animate-fade-in-up">
            <div className="space-y-2">
                {shimmerBlock('h-8 w-64')}
                {shimmerBlock('h-4 w-96')}
            </div>
            <div className="rounded-xl border overflow-hidden">
                {/* Table header */}
                <div className="flex gap-4 p-4 border-b bg-muted/30">
                    {shimmerBlock('h-4 w-32')}
                    {shimmerBlock('h-4 w-24')}
                    {shimmerBlock('h-4 w-28')}
                    {shimmerBlock('h-4 w-20')}
                </div>
                {/* Table rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border-b last:border-0">
                        {shimmerBlock('h-4 w-36')}
                        {shimmerBlock('h-4 w-28')}
                        {shimmerBlock('h-4 w-32')}
                        {shimmerBlock('h-4 w-16')}
                    </div>
                ))}
            </div>
        </div>
    );
}
