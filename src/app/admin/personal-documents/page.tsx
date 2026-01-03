
'use client';

import { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '@/lib/firestoreService';
import type { ManagedDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Trash2, FileBadge } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PersonalDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const docs = await getDocuments();
            setDocuments(docs.filter(d => d.documentType === 'tax' || d.documentType === 'employment'));
        } catch (error) {
            console.error("Failed to load personal documents:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load personal documents.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  async function removeDocument(docId: string) {
    const docToRemove = documents.find(d => d.id === docId);
    await deleteDocument(docId);
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    toast({
      title: 'Document Removed',
      description: `${docToRemove?.title} has been removed.`,
      variant: 'destructive',
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Personal Documents...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <FileBadge className="h-8 w-8 text-primary" />
                Personal Employee Documents
              </CardTitle>
              <CardDescription className="mt-2">
                View and manage sensitive employee documents like tax and employment forms. To add a new document, please use the main <Link href="/admin/manage-documents" className="text-primary hover:underline">document uploader</Link>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {documents.map(doc => (
                    <Card key={doc.id} className="flex flex-col bg-muted/20">
                        <CardHeader className="flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                                <CardDescription>{doc.employeeName || 'Unassigned'}</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeDocument(doc.id)} aria-label={`Delete ${doc.title}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center justify-center pt-0">
                            <Link href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group w-32 h-40 rounded-md overflow-hidden border">
                                <Image
                                src={'https://placehold.co/850x1100.png'}
                                alt={`Preview of ${doc.title}`}
                                fill
                                className="object-cover object-top transition-transform group-hover:scale-105"
                                data-ai-hint="official document"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Download className="h-8 w-8 text-white"/>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <FileBadge className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                    <h3 className="text-xl font-semibold text-foreground">No Personal Documents Found</h3>
                    <p className="mt-2">Use the "Manage Policies & Documents" page to upload and assign sensitive documents to employees.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
