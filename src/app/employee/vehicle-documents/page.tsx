
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Download, Truck, Box, FileText as DocumentIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { loadDocuments } from '@/lib/localStorageService';
import type { ManagedDocument } from '@/lib/types';

// Helper function to group documents by category
const groupDocumentsByCategory = (docs: ManagedDocument[]) => {
  return docs.reduce((acc, doc) => {
    (acc[doc.category] = acc[doc.category] || []).push(doc);
    return acc;
  }, {} as Record<string, ManagedDocument[]>);
};

// Helper function to get an icon for a category
const getCategoryIcon = (categoryName: string) => {
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes('truck')) return Truck;
  if (lowerCaseName.includes('trailer')) return Box;
  if (lowerCaseName.includes('policies') || lowerCaseName.includes('manual')) return DocumentIcon;
  return BookOpen;
};

export default function VehicleDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setDocuments(loadDocuments());
  }, []);

  const groupedDocuments = useMemo(() => groupDocumentsByCategory(documents), [documents]);

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Documents...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <BookOpen className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Vehicle & Company Documents</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Access important documents like registration and insurance cards.
        </p>
      </div>

      <div className="space-y-12">
        {Object.keys(groupedDocuments).length > 0 ? (
          Object.entries(groupedDocuments).map(([category, docs]) => {
            const Icon = getCategoryIcon(category);
            return (
              <div key={category}>
                <h2 className="text-2xl font-headline font-semibold flex items-center gap-3 mb-6">
                    <Icon className="h-7 w-7 text-primary" />
                    {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {docs.map((doc) => (
                    <Card key={doc.id} className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-xl">{doc.title}</CardTitle>
                        <CardDescription>{doc.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <Link href={doc.documentDataUri} target="_blank" rel="noopener noreferrer" className="block relative group aspect-[8.5/11] rounded-md overflow-hidden border">
                          <Image
                            src={doc.documentDataUri.startsWith('data:image') ? doc.documentDataUri : 'https://placehold.co/850x1100.png'}
                            alt={`Preview of ${doc.title}`}
                            fill
                            className="object-cover object-top transition-transform group-hover:scale-105"
                            data-ai-hint={doc.dataAiHint}
                          />
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="h-10 w-10 text-white"/>
                            </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Card className="text-center py-12 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
            <CardHeader>
                <DocumentIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl font-headline">No Documents Found</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-lg">
                No documents have been uploaded by an administrator yet.
                </CardDescription>
            </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
