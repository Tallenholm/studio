'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDocuments, addDocument, deleteDocument, getFleetAssets, getUsers } from '@/lib/firestoreService';
import type { ManagedDocument, User, FleetAsset } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PlusCircle, Trash2, BookOpen, Loader2, Download, Eye, FileUp, Files, User as UserIcon, Brain } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { uploadFile } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';


const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required.'),
  category: z.string().optional(),
  employeeId: z.string().optional(),
  documentType: z.enum(['general', 'tax', 'employment'], { required_error: 'Document type is required.' }),
  description: z.string().min(1, 'Description is required.'),
  documentUrl: z.string().url({ message: 'A document file upload is required.' }),
}).superRefine((data, ctx) => {
    if ((data.documentType === 'employment' || data.documentType === 'tax') && !data.employeeId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'An employee must be selected for this document type.',
            path: ['employeeId'],
        });
    }
    if (data.documentType === 'general' && (!data.category || data.category.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Category is required for General documents.',
            path: ['category'],
        });
    }
});

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      category: '',
      documentType: 'general',
      description: '',
      documentUrl: '',
    },
  });

  const watchedDocType = form.watch('documentType');

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [docs, assets, usersData] = await Promise.all([
                getDocuments(),
                getFleetAssets(),
                getUsers(),
            ]);
            setDocuments(docs);
            setFleetAssets(assets);
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load document data.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);


  const generalCategories = useMemo(() => {
    const assetNames = fleetAssets.map(asset => asset.name);
    return ['Company Policies', 'Handbooks', ...assetNames];
  }, [fleetAssets]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && adminUser) {
      setIsProcessingFile(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const dataUriPromise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
      });

      try {
        const uploadPromise = uploadFile(file, `documents/${adminUser.uid}/${Date.now()}-${file.name}`);
        const dataUri = await dataUriPromise;
        const ocrPromise = summarizeDocument({ documentDataUri: dataUri });

        const [downloadUrl, summary] = await Promise.all([uploadPromise, ocrPromise]);
        
        form.setValue('documentUrl', downloadUrl);
        form.clearErrors('documentUrl');
        if (summary.title) form.setValue('title', summary.title);
        if (summary.description) form.setValue('description', summary.description);
        
        toast({ title: 'AI Assistant', description: 'Document title and description have been pre-filled.' });

      } catch (error) {
        console.error("File processing error:", error);
        toast({ variant: 'destructive', title: "Processing Failed", description: "Could not upload or scan document."});
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  async function onSubmit(values: z.infer<typeof documentSchema>) {
    let docCategory = '';
    let employeeName: string | undefined = undefined;

    if ((values.documentType === 'employment' || values.documentType === 'tax') && values.employeeId) {
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
    
    const newDocumentData: Omit<ManagedDocument, 'id'> = {
      title: values.title,
      description: values.description,
      documentType: values.documentType,
      documentUrl: values.documentUrl,
      category: docCategory,
      employeeId: values.employeeId,
      employeeName: employeeName,
    };

    const newDocId = await addDocument(newDocumentData);
    setDocuments((prev) => [{ id: newDocId, ...newDocumentData }, ...prev]);
    toast({ title: 'Document Added', description: `${values.title} has been added.` });
    setIsDialogOpen(false);
    form.reset({
        title: '', category: '', documentType: 'general',
        description: '', documentUrl: '',
    });
  }

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

  const generalDocuments = useMemo(() => {
    return documents
        .filter(d => d.documentType === 'general')
        .reduce((acc, doc) => {
            (acc[doc.category] = acc[doc.category] || []).push(doc);
            return acc;
        }, {} as Record<string, ManagedDocument[]>);
  }, [documents]);

  const renderGroupedDocumentSection = (title: string, Icon: React.ElementType, groupedDocs: Record<string, ManagedDocument[]>) => {
    if (Object.keys(groupedDocs).length === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                    <Icon className="h-6 w-6 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <Files className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                    <h3 className="text-xl font-semibold text-foreground">No General Documents</h3>
                    <p className="mt-2">No documents have been uploaded for this category yet.</p>
                </div>
            </CardContent>
        </Card>
      );
    }

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
                                   <Link href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group w-32 h-40 rounded-md overflow-hidden border">
                                      <Image
                                        src={doc.documentUrl.includes('placehold.co') ? doc.documentUrl : 'https://placehold.co/850x1100.png'}
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
                </div>
            ))}
            </CardContent>
        </Card>
    );
  };

  if (isLoading) {
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
                <BookOpen className="h-8 w-8 text-primary" />
                Manage Policies & Documents
              </CardTitle>
              <CardDescription className="mt-2">
                Upload and manage company-wide documents, policies, and sensitive employee forms.
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
                    Upload a document and the AI will help fill in the details.
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
                                <SelectItem value="general">Policy or General Document</SelectItem>
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
                        name="documentUrl"
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
                                        disabled={isProcessingFile}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessingFile}
                                    >
                                        {isProcessingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                        {isProcessingFile ? 'Processing...' : 'Upload File'}
                                    </Button>
                                    </div>
                                </FormControl>
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
                    {watchedDocType === 'employment' || watchedDocType === 'tax' ? (
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {generalCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                    
                    <DialogFooter>
                      <Button type="submit" disabled={isProcessingFile}>Save Document</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            {renderGroupedDocumentSection("General Documents", Files, generalDocuments)}
        </CardContent>
      </Card>
    </div>
  );
}
