
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  element: string;
  title: string;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  tourKey: string;
}

export default function GuidedTour({ isOpen, onClose, steps, tourKey }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const previousElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (previousElementRef.current) {
        previousElementRef.current.classList.remove('tour-highlight');
      }

      const selector = steps[currentStep].element;
      const element = document.querySelector(selector) as HTMLElement;

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        const timer = setTimeout(() => {
            setTargetElement(element);
            element.classList.add('tour-highlight');
            previousElementRef.current = element;
        }, 300); // Delay to allow for scroll animation
        
        return () => clearTimeout(timer);
      } else {
        setTargetElement(null); // Hide popover if element not found
      }
    } else {
        if (previousElementRef.current) {
            previousElementRef.current.classList.remove('tour-highlight');
        }
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    if (previousElementRef.current) {
      previousElementRef.current.classList.remove('tour-highlight');
    }
    try {
      localStorage.setItem(tourKey, 'true');
    } catch (error) {
      console.error("Failed to access localStorage. Tour completion state will not be saved.", error);
    }
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 print-hidden" onClick={handleClose} />
      <Popover open={isOpen && !!targetElement}>
        <PopoverAnchor asChild>
          <div
            style={{
              position: 'fixed',
              top: targetElement?.getBoundingClientRect().top,
              left: targetElement?.getBoundingClientRect().left,
              width: targetElement?.getBoundingClientRect().width,
              height: targetElement?.getBoundingClientRect().height,
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          side={steps[currentStep].side || 'bottom'}
          align="center"
          className="z-50 max-w-sm"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="space-y-4">
            <h3 className="font-bold text-lg">{steps[currentStep].title}</h3>
            <div className="text-sm text-muted-foreground">
              {steps[currentStep].content}
            </div>
            
             <Progress value={progress} className="w-full" />
            
            <div className="flex justify-between w-full">
                <Button variant="outline" size="sm" onClick={handleClose}>
                    Skip Tour
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                    <Button onClick={handleNext} size="sm">
                    {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
                    {currentStep < steps.length - 1 ? <ArrowRight className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
