
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Files, Download, Truck, Box, BookOpen as DocumentIcon, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { getDocuments } from '@/lib/firestoreService';
import type { ManagedDocument } from '@/lib/types';


// Helper function to get an icon for a category
const getCategoryIcon = (categoryName: string) => {
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes('truck')) return Truck;
  if (lowerCaseName.includes('trailer')) return Box;
  if (lowerCaseName.includes('policies') || lowerCaseName.includes('manual') || lowerCaseName.includes('handbook')) return DocumentIcon;
  return DocumentIcon;
};

export default function CompanyDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const docs = await getDocuments();
        setDocuments(docs.filter(d => d.documentType === 'general'));
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const generalDocuments = useMemo(() => {
    return documents.reduce((acc, doc) => {
            (acc[doc.category] = acc[doc.category] || []).push(doc);
            return acc;
        }, {} as Record<string, ManagedDocument[]>);
  }, [documents]);

  const renderGroupedDocumentSection = (title: string, Icon: React.ElementType, groupedDocs: Record<string, ManagedDocument[]>) => {
    const totalDocs = Object.values(groupedDocs).reduce((sum, docs) => sum + docs.length, 0);
    if (totalDocs === 0) return (
      <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
        <p>No {title.toLowerCase()} available at this time.</p>
      </div>
    );

    return (
        <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                    <Icon className="h-7 w-7 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 {Object.entries(groupedDocs).map(([category, docs]) => {
                    const CategoryIcon = getCategoryIcon(category);
                    return (
                    <div key={category}>
                        <h3 className="text-xl font-semibold flex items-center gap-3 mb-4 text-muted-foreground">
                            <CategoryIcon className="h-6 w-6" />
                            {category}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {docs.map((doc) => (
                            <Card key={doc.id} className="bg-muted/30 flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">{doc.title}</CardTitle>
                                <CardDescription>{doc.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <Link href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group aspect-[8.5/11] rounded-md overflow-hidden border">
                                <Image
                                    src={'https://placehold.co/850x1100.png'} // Use a generic placeholder
                                    alt={`Preview of ${doc.title}`}
                                    fill
                                    className="object-cover object-top transition-transform group-hover:scale-105"
                                    data-ai-hint="official document"
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
                })}
            </CardContent>
        </Card>
    );
  };
  
  if (isLoading) {
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
        <h1 className="text-4xl font-headline font-bold">Company Policies & Documents</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Access general company documents like policies, handbooks, manuals, and vehicle information.
        </p>
      </div>

      <div className="space-y-12">
        {renderGroupedDocumentSection("Policies & Documents", DocumentIcon, generalDocuments)}
      </div>
    </div>
  );
}
