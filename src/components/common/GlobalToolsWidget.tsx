
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useGlobalTools } from '@/hooks/use-global-tools';
import ToolsGrid from '@/components/tools/ToolsGrid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator } from 'lucide-react';


export default function GlobalToolsWidget() {
  const { isOpen, close } = useGlobalTools();

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent className="w-full sm:w-3/4 lg:w-2/3 xl:max-w-4xl" side="right">
          <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-2xl">
                  <Calculator className="h-7 w-7 text-primary" />
                  Operations Toolkit
              </SheetTitle>
              <SheetDescription>
                  A comprehensive suite of calculators for project estimation and planning.
              </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-4rem)] pr-6">
            <div className="py-4">
              <ToolsGrid />
            </div>
          </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
