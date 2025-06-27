
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadDocuments, saveDocuments, loadUsers } from '@/lib/localStorageService';
import type { ManagedDocument, User } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, BookCopy, Loader2, Download, Eye, FileUp, Files, FileText, FileBadge } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required.'),
  category: z.string().optional(),
  employeeId: z.string().optional(),
  documentType: z.enum(['general', 'tax', 'employment'], { required_error: 'Document type is required.' }),
  description: z.string().min(1, 'Description is required.'),
  documentDataUri: z.string().refine((val) => val.startsWith('data:'), {
    message: 'A document file upload is required.',
  }),
}).superRefine((data, ctx) => {
    if (data.documentType === 'employment' && !data.employeeId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'An employee must be selected for employment forms.',
            path: ['employeeId'],
        });
    }
    if (data.documentType !== 'employment' && (!data.category || data.category.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Category is required for this document type.',
            path: ['category'],
        });
    }
});

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      category: '',
      documentType: 'general',
      description: '',
      documentDataUri: '',
    },
  });

  const watchedDocType = form.watch('documentType');

  useEffect(() => {
    setIsMounted(true);
    setDocuments(loadDocuments());
    setUsers(loadUsers());
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
    let docCategory = '';
    let employeeName: string | undefined = undefined;

    if (values.documentType === 'employment' && values.employeeId) {
        const employee = users.find(u => u.id === values.employeeId);
        if (employee) {
            docCategory = employee.name;
            employeeName = employee.name;
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
            return;
        }
    } else {
        docCategory = values.category!;
    }
    
    const newDocument: ManagedDocument = {
      id: `doc-${Date.now()}`,
      title: values.title,
      description: values.description,
      documentType: values.documentType,
      documentDataUri: values.documentDataUri,
      category: docCategory,
      employeeId: values.employeeId,
      employeeName: employeeName,
    };

    setDocuments((prev) => [newDocument, ...prev]);
    toast({ title: 'Document Added', description: `${values.title} has been added.` });
    setIsDialogOpen(false);
    form.reset({
        title: '',
        category: '',
        documentType: 'general',
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
    if (Object.keys(groupedDocs).length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                    <Icon className="h-6 w-6 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {Object.entries(groupedDocs).map(([category, docs]) => (
                <div key={category}>
                    <h3 className="font-semibold text-lg text-muted-foreground mb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map(doc => (
                           <Card key={doc.id} className="flex flex-col bg-muted/20">
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
                    </div>
                </div>
            ))}
            </CardContent>
        </Card>
    );
  };

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
                Add, view, and remove documents. Employment forms are assigned to specific employees.
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
                    Upload a new document and assign it to a category or employee.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Document Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a document type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="general">General Document</SelectItem>
                                <SelectItem value="tax">Tax Form</SelectItem>
                                <SelectItem value="employment">Employment Form</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
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
                    {watchedDocType === 'employment' ? (
                       <FormField
                          control={form.control}
                          name="employeeId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Assign to Employee</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an employee" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {users.filter(u => u.role === 'employee').map(user => (
                                      <SelectItem key={user.id} value={user.id}>
                                          {user.name}
                                      </SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    ) : (
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
                    )}
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
            {renderDocumentSection("General Documents", Files, generalDocuments)}
            {renderDocumentSection("Tax Forms", FileText, taxDocuments)}
            {renderDocumentSection("Employment Forms", FileBadge, employmentDocuments)}
            {documents.length === 0 && (
                 <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">No documents have been uploaded yet.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
