
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Truck, Box } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const documents = [
  {
    vehicle: 'Truck - 2021 Chevy 6500',
    icon: Truck,
    items: [
      {
        title: 'Vehicle Registration - 2024',
        description: 'Official state vehicle registration document.',
        url: 'https://placehold.co/850x1100.png',
        dataAiHint: 'official document',
      },
      {
        title: 'Insurance Card - 2024',
        description: 'Proof of liability insurance.',
        url: 'https://placehold.co/850x1100.png',
        dataAiHint: 'insurance card',
      },
    ],
  },
  {
    vehicle: 'Trailer - Tilt Deck',
    icon: Box,
    items: [
      {
        title: 'Trailer Registration - 2024',
        description: 'Official state trailer registration.',
        url: 'https://placehold.co/850x1100.png',
        dataAiHint: 'official document',
      },
    ],
  },
  {
    vehicle: 'Company Policies',
    icon: BookOpen,
    items: [
       {
        title: 'Fleet Safety Manual',
        description: 'Company safety procedures and guidelines.',
        url: 'https://placehold.co/850x1100.png',
        dataAiHint: 'manual safety'
      },
    ]
  }
];

export default function VehicleDocumentsPage() {
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
        {documents.map((section, index) => (
          <div key={index}>
            <h2 className="text-2xl font-headline font-semibold flex items-center gap-3 mb-6">
                <section.icon className="h-7 w-7 text-primary" />
                {section.vehicle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.items.map((doc, docIndex) => (
                <Card key={docIndex} className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-xl">{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Link href={doc.url} target="_blank" rel="noopener noreferrer" className="block relative group aspect-[8.5/11] rounded-md overflow-hidden border">
                      <Image
                        src={doc.url}
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
        ))}
      </div>
    </div>
  );
}
