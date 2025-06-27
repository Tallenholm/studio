
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface TourStep {
  title: string;
  content: React.ReactNode;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  tourKey: string;
}

export default function GuidedTour({ isOpen, onClose, steps, tourKey }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

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
    try {
        localStorage.setItem(tourKey, 'true');
    } catch (error) {
        console.error("Failed to access localStorage:", error);
    }
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{steps[currentStep].title}</DialogTitle>
          <DialogDescription>
            Welcome! Here's a quick tour of the key features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-sm text-muted-foreground min-h-[100px]">
            {steps[currentStep].content}
          </div>
        </div>

        <DialogFooter className="flex justify-between w-full">
           <Button variant="outline" onClick={handleClose}>
             Skip Tour
           </Button>
           <div className="flex gap-2">
            <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              {currentStep < steps.length - 1 ? <ArrowRight className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
            </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
