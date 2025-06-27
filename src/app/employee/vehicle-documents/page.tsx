
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Files, Download, FileText, FileBadge, Truck, Box, BookOpen as DocumentIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { loadDocuments } from '@/lib/localStorageService';
import type { ManagedDocument } from '@/lib/types';


// Helper function to get an icon for a category
const getCategoryIcon = (categoryName: string) => {
  const lowerCaseName = categoryName.toLowerCase();
  if (lowerCaseName.includes('truck')) return Truck;
  if (lowerCaseName.includes('trailer')) return Box;
  if (lowerCaseName.includes('policies') || lowerCaseName.includes('manual')) return DocumentIcon;
  return DocumentIcon;
};

export default function CompanyDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setDocuments(loadDocuments());
  }, []);

  const { generalDocuments, taxDocuments, employmentDocuments } = useMemo(() => {
    const groupByType = (type: ManagedDocument['documentType']) => {
        return documents
            .filter(d => d.documentType === type)
            .reduce((acc, doc) => {
                (acc[doc.category] = acc[doc.category] || []).push(doc);
                return acc;
            }, {} as Record<string, ManagedDocument[]>);
    };
    return {
        generalDocuments: groupByType('general'),
        taxDocuments: groupByType('tax'),
        employmentDocuments: groupByType('employment'),
    }
  }, [documents]);

  const renderDocumentSection = (title: string, Icon: React.ElementType, groupedDocs: Record<string, ManagedDocument[]>) => {
    const totalDocs = Object.values(groupedDocs).reduce((sum, docs) => sum + docs.length, 0);
    if (totalDocs === 0) {
        return (
            <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
                 <CardHeader>
                    <CardTitle className="text-2xl font-headline flex items-center gap-3">
                        <Icon className="h-7 w-7 text-primary" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <p>No {title.toLowerCase()} available at this time.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

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
                                <Link href={doc.documentDataUri} target="_blank" rel="noopener noreferrer" className="block relative group aspect-[8.5/11] rounded-md overflow-hidden border">
                                <Image
                                    src={doc.documentDataUri.startsWith('data:image') ? doc.documentDataUri : 'https://placehold.co/850x1100.png'}
                                    alt={`Preview of ${doc.title}`}
                                    fill
                                    className="object-cover object-top transition-transform group-hover:scale-105"
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
        <Files className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Company Documents</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Access general, tax, and employment documents.
        </p>
      </div>

      <div className="space-y-12">
        {renderDocumentSection("General Documents", Files, generalDocuments)}
        {renderDocumentSection("Tax Forms", FileText, taxDocuments)}
        {renderDocumentSection("Employment Forms", FileBadge, employmentDocuments)}
      </div>
    </div>
  );
}
