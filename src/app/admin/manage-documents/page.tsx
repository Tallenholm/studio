
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadDocuments, saveDocuments } from '@/lib/localStorageService';
import type { ManagedDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, BookCopy, Loader2, Download, Eye, FileUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required.'),
  category: z.string().min(1, 'Category/Group is required.'),
  description: z.string().min(1, 'Description is required.'),
  documentDataUri: z.string().refine((val) => val.startsWith('data:'), {
    message: 'A document file upload is required.',
  }),
});

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      documentDataUri: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setDocuments(loadDocuments());
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveDocuments(documents);
    }
  }, [documents, isMounted]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('documentDataUri', reader.result as string);
        form.clearErrors('documentDataUri');
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof documentSchema>) {
    const newDocument: ManagedDocument = {
      id: `doc-${Date.now()}`,
      ...values,
    };
    setDocuments((prev) => [newDocument, ...prev]);
    toast({ title: 'Document Added', description: `${values.title} has been added.` });
    setIsDialogOpen(false);
    form.reset({
        title: '',
        category: '',
        description: '',
        documentDataUri: '',
    });
  }

  function removeDocument(docId: string) {
    const docToRemove = documents.find(d => d.id === docId);
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    toast({
      title: 'Document Removed',
      description: `${docToRemove?.title} has been removed.`,
      variant: 'destructive',
    });
  }

  const groupedDocuments = documents.reduce((acc, doc) => {
    (acc[doc.category] = acc[doc.category] || []).push(doc);
    return acc;
  }, {} as Record<string, ManagedDocument[]>);

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Document Manager...</p>
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
                <BookCopy className="h-8 w-8 text-primary" />
                Manage Documents
              </CardTitle>
              <CardDescription className="mt-2">
                Add, view, and remove documents accessible to employees.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                  <DialogDescription>
                    Upload a new document and assign it to a category.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Vehicle Registration 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category / Group</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Truck 01, Company Policies" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="A brief description of the document." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="documentDataUri"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Document File</FormLabel>
                                <FormControl>
                                    <div>
                                    <Input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FileUp className="mr-2 h-4 w-4" />
                                        Upload File
                                    </Button>
                                    {field.value && (
                                        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            <span>File selected. Ready to save.</span>
                                        </div>
                                    )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                      <Button type="submit">Save Document</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {Object.keys(groupedDocuments).length > 0 ? (
                Object.entries(groupedDocuments).map(([category, docs]) => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle>{category}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {docs.map(doc => (
                               <Card key={doc.id} className="flex flex-col">
                                   <CardHeader className="flex-row items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                                            <CardDescription>{doc.description}</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeDocument(doc.id)} aria-label={`Delete ${doc.title}`}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                   </CardHeader>
                                   <CardContent className="flex-grow flex items-center justify-center pt-0">
                                       <Link href={doc.documentDataUri} target="_blank" rel="noopener noreferrer" className="block relative group w-32 h-40 rounded-md overflow-hidden border">
                                          <Image
                                            src={doc.documentDataUri.startsWith('data:image') ? doc.documentDataUri : 'https://placehold.co/850x1100.png'}
                                            alt={`Preview of ${doc.title}`}
                                            fill
                                            className="object-cover object-top transition-transform group-hover:scale-105"
                                          />
                                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Download className="h-8 w-8 text-white"/>
                                            </div>
                                        </Link>
                                   </CardContent>
                               </Card>
                           ))}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">No documents have been uploaded yet.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
