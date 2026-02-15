'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCcw } from 'lucide-react';
import SaveToJob from '@/components/tools/SaveToJob';

interface ResultLine {
    label: string;
    value: string;
    isPrimary?: boolean;
}

interface CalculatorShellProps {
    /** The name shown in the SaveToJob note, e.g. "Concrete Calculator" */
    calculatorName: string;
    /** Input fields rendered inside the form area */
    children: React.ReactNode;
    /** Result lines to display. Pass `null` when inputs are invalid/empty. */
    results: ResultLine[] | null;
    /** Called when the Reset button is pressed — parent should clear its state. */
    onReset: () => void;
    /** Combined string used for the SaveToJob note, e.g. "3.50 cubic yards" */
    resultString?: string;
}

/**
 * Shared wrapper for all calculator tools providing:
 * - Consistent results display with fade-in animation
 * - Reset button to clear inputs
 * - SaveToJob integration
 * - Accessible structure
 */
export default function CalculatorShell({
    calculatorName,
    children,
    results,
    onReset,
    resultString,
}: CalculatorShellProps) {
    const [showResults, setShowResults] = useState(false);
    const prevResults = useRef(results);

    // Animate results on change
    useEffect(() => {
        if (results && results !== prevResults.current) {
            setShowResults(false);
            // Tiny delay so the fade-in re-triggers on each new result
            const timer = setTimeout(() => setShowResults(true), 50);
            prevResults.current = results;
            return () => clearTimeout(timer);
        }
        if (!results) {
            setShowResults(false);
            prevResults.current = null;
        }
    }, [results]);

    const handleReset = useCallback(() => {
        setShowResults(false);
        onReset();
    }, [onReset]);

    return (
        <div className="space-y-4" role="region" aria-label={calculatorName}>
            {/* Input fields from parent */}
            {children}

            {/* Action row */}
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    aria-label="Reset calculator"
                    className="shrink-0"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            {/* Results */}
            {showResults && results && results.length > 0 && (
                <div className="animate-fade-in-up" id={`${calculatorName.replace(/\s+/g, '-').toLowerCase()}-results`}>
                    <div className="text-center pt-2 space-y-1">
                        {results.map((r, i) => (
                            <p
                                key={i}
                                className={
                                    r.isPrimary
                                        ? 'text-2xl font-bold text-primary'
                                        : 'text-lg text-muted-foreground'
                                }
                            >
                                {r.isPrimary ? r.value : (
                                    <>
                                        <span className="text-sm">{r.label}: </span>
                                        {r.value}
                                    </>
                                )}
                                {r.isPrimary && (
                                    <span className="block text-sm font-normal text-muted-foreground">
                                        {r.label}
                                    </span>
                                )}
                            </p>
                        ))}
                    </div>
                    <Separator className="my-4" />
                    {resultString && (
                        <SaveToJob calculatorName={calculatorName} resultString={resultString} />
                    )}
                </div>
            )}
        </div>
    );
}
