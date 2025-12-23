'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, FileBadge } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { ManagedDocument } from '@/lib/types';
import { getDocuments } from '@/lib/firestoreService';
import { useUser } from '@/firebase/provider';


interface PersonalDocumentsClientPageProps {
  initialDocuments: ManagedDocument[];
}

function PersonalDocumentsClientPage({ initialDocuments }: PersonalDocumentsClientPageProps) {
  const { taxDocuments, employmentDocuments } = (initialDocuments || []).reduce(
    (acc, doc) => {
        if (doc.documentType === 'tax') acc.taxDocuments.push(doc);
        if (doc.documentType === 'employment') acc.employmentDocuments.push(doc);
        return acc;
    }, 
    { taxDocuments: [], employmentDocuments: [] } as { taxDocuments: ManagedDocument[], employmentDocuments: ManagedDocument[] }
  );

  const renderDocumentSection = (title: string, Icon: React.ElementType, docs: ManagedDocument[]) => {
    return (
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-3">
            <Icon className="h-7 w-7 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
              <p>No {title.toLowerCase()} available at this time.</p>
            </div>
          ) : (
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
                        src={'https://placehold.co/850x1100.png'} // Use generic placeholder for privacy
                        alt={`Preview of ${doc.title}`}
                        fill
                        className="object-cover object-top transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-10 w-10 text-white" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-12 text-center">
        <FileBadge className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-headline font-bold">Personal Documents</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Your secure and private documents, such as tax and employment forms.
        </p>
      </div>

      <div className="space-y-12">
        {renderDocumentSection("Tax Forms", FileText, taxDocuments)}
        {renderDocumentSection("Employment Forms", FileBadge, employmentDocuments)}
      </div>
    </div>
  );
}

export default async function PersonalDocumentsPage() {
    const { getDocuments } = await import('@/lib/firestoreService');
    const { user } = useUser();
    let initialDocuments: ManagedDocument[] = [];
    if (user) {
        const allDocs = await getDocuments();
        initialDocuments = allDocs.filter(d => d.employeeId === user.uid);
    }
    
    return <PersonalDocumentsClientPage initialDocuments={initialDocuments} />;
}
