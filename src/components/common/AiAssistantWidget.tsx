
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { answerHelpQuestion } from '@/ai/flows/answer-help-question';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/lib/types';

interface AiAssistantWidgetProps {
    initialOpen?: boolean;
}

const getWelcomeMessage = (role: UserRole | 'guest') => {
    const baseIntro = "Hello! I'm your AI Assistant. I can answer any questions you have about using this application.";

    if (role === 'owner' || role === 'manager') {
        return `${baseIntro}\n\nFor example, you can ask:\n- "How do I create a job with AI?"\n- "What does the AI Daily Briefing do?"\n- "How are work orders created?"\n\nWhat can I help you with today?`;
    }
    
    return `${baseIntro}\n\nFor example, you can ask:\n- "How do I submit an inspection?"\n- "How do I request time off?"\n- "Where do I see my assigned tasks?"\n\nWhat can I help you with today?`;
}


export default function AiAssistantWidget({ initialOpen = false }: AiAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const userRole = user?.role || 'guest';
  const welcomeMessage = getWelcomeMessage(userRole);

  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true);
    }
  }, [initialOpen]);

  useEffect(() => {
    // Set initial welcome message when the component mounts or user changes
    setAiAnswer(welcomeMessage);
  }, [welcomeMessage]);


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // When opening, reset the chat to the welcome message
      setAiAnswer(welcomeMessage);
      setAiQuestion('');
      setIsAsking(false);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    setIsAsking(true);
    setAiAnswer('');
    try {
      const answer = await answerHelpQuestion({ question: aiQuestion, role: userRole });
      setAiAnswer(answer);
    } catch (error) {
      console.error("AI Help Error:", error);
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: 'Could not get an answer. Please try again.'
      });
      setAiAnswer('Sorry, I encountered an error. Please try asking your question again.');
    } finally {
      setIsAsking(false);
      setAiQuestion('');
    }
  }

  return (
    <>
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                size="icon"
                className="rounded-full w-14 h-14 shadow-lg shadow-primary/30"
                onClick={() => handleOpenChange(true)}
                aria-label="Open AI Assistant"
            >
                <Sparkles className="h-7 w-7" />
            </Button>
        </div>

        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent className="flex flex-col">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                        <Brain className="h-7 w-7 text-primary" />
                        AI Assistant
                    </SheetTitle>
                    <SheetDescription>
                        Ask me anything about how to use the Logan's Excavating app.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-grow py-4 flex flex-col gap-4 min-h-0">
                    <div className="flex-grow p-4 bg-muted/50 rounded-lg border overflow-y-auto">
                        {isAsking ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Finding an answer...</span>
                            </div>
                        ) : (
                            <p className="text-foreground/90 whitespace-pre-wrap">{aiAnswer}</p>
                        )}
                    </div>
                     <div className="flex-shrink-0 flex gap-2">
                        <Input 
                            type="text"
                            placeholder="How do I add a client?"
                            value={aiQuestion}
                            onChange={(e) => setAiQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                        />
                        <Button onClick={handleAskAi} disabled={isAsking}>
                            {isAsking ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ask'}
                        </Button>
                    </div>
                </div>
                <SheetFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">AI can make mistakes. Consider checking important information.</p>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    </>
  );
}
