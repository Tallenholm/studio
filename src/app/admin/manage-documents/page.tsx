
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDocuments, addDocument, deleteDocument, getFleetAssets, getUsers, getClients } from '@/lib/firestoreService';
import type { ManagedDocument, User, FleetAsset, Client } from '@/lib/types';
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
import { PlusCircle, Trash2, BookOpen, Loader2, Download, FileUp, Files, User as UserIcon, Wrench, FileBadge, Building2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { uploadFile, useUser } from '@/firebase';


const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required.'),
  category: z.string().optional(),
  employeeId: z.string().optional(),
  assetId: z.string().optional(),
  clientId: z.string().optional(),
  documentType: z.enum(['general', 'tax', 'employment', 'maintenance', 'registration', 'insurance', 'contract'], { required_error: 'Document type is required.' }),
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
    if ((data.documentType === 'maintenance' || data.documentType === 'registration' || data.documentType === 'insurance') && !data.assetId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A vehicle/asset must be selected for this document type.',
            path: ['assetId'],
        });
    }
    if (data.documentType === 'contract' && !data.clientId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A client must be selected for contracts.',
            path: ['clientId'],
        });
    }
});

export default function ManageDocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useUser();
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
            const [docs, assets, usersData, clientsData] = await Promise.all([
                getDocuments(),
                getFleetAssets(),
                getUsers(),
                getClients(),
            ]);
            setDocuments(docs);
            setFleetAssets(assets);
            setUsers(usersData);
            setClients(clientsData);
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
    return ['Company Policies', 'Handbooks', 'Safety Manuals'];
  }, []);

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
    let clientName: string | undefined = undefined;

    if (['maintenance', 'registration', 'insurance'].includes(values.documentType) && values.assetId) {
        const asset = fleetAssets.find(a => a.id === values.assetId);
        docCategory = asset?.name || 'Unknown Asset';
    } else if ((values.documentType === 'employment' || values.documentType === 'tax') && values.employeeId) {
        const employee = users.find(u => u.id === values.employeeId);
        if (employee) {
            docCategory = employee.name;
            employeeName = employee.name;
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
            return;
        }
    } else if (values.documentType === 'contract' && values.clientId) {
        const client = clients.find(c => c.id === values.clientId);
         if (client) {
            docCategory = client.name;
            clientName = client.name;
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected client not found.' });
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
      assetId: values.assetId,
      clientId: values.clientId,
      employeeName: employeeName,
      clientName: clientName,
    };

    const newDocId = await addDocument(newDocumentData);
    setDocuments((prev) => [{ id: newDocId, ...newDocumentData }, ...prev]);
    toast({ title: 'Document Added', description: `${values.title} has been added.` });
    setIsDialogOpen(false);
    form.reset({
        title: '', category: '', documentType: 'general',
        description: '', documentUrl: '', assetId: undefined, employeeId: undefined, clientId: undefined
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

  const { generalDocuments, assetDocuments, personalDocuments, contractDocuments } = useMemo(() => {
    return documents
        .reduce((acc, doc) => {
            if (doc.documentType === 'general') {
                (acc.generalDocuments[doc.category] = acc.generalDocuments[doc.category] || []).push(doc);
            } else if (['maintenance', 'registration', 'insurance'].includes(doc.documentType)) {
                 (acc.assetDocuments[doc.category] = acc.assetDocuments[doc.category] || []).push(doc);
            } else if (['tax', 'employment'].includes(doc.documentType)) {
                 (acc.personalDocuments[doc.employeeName || 'Unassigned'] = acc.personalDocuments[doc.employeeName || 'Unassigned'] || []).push(doc);
            } else if (doc.documentType === 'contract') {
                (acc.contractDocuments[doc.clientName || 'Unassigned'] = acc.contractDocuments[doc.clientName || 'Unassigned'] || []).push(doc);
            }
            return acc;
        }, { 
            generalDocuments: {} as Record<string, ManagedDocument[]>,
            assetDocuments: {} as Record<string, ManagedDocument[]>,
            personalDocuments: {} as Record<string, ManagedDocument[]>,
            contractDocuments: {} as Record<string, ManagedDocument[]>,
        });
  }, [documents]);

  const renderGroupedDocumentSection = (title: string, Icon: React.ElementType, groupedDocs: Record<string, ManagedDocument[]>, emptyText: string) => {
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
                    <h3 className="text-xl font-semibold text-foreground">No Documents Yet</h3>
                    <p className="mt-2">{emptyText}</p>
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
            {Object.entries(groupedDocs).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, docs]) => (
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
                Upload and manage company-wide documents, policies, contracts, and sensitive employee forms.
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
                    Upload a document and fill in the details.
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
                                <SelectItem value="contract">Client Contract</SelectItem>
                                <SelectItem value="general">Policy or General Document</SelectItem>
                                <SelectItem value="registration">Vehicle Registration</SelectItem>
                                <SelectItem value="insurance">Vehicle Insurance</SelectItem>
                                <SelectItem value="maintenance">Maintenance Manual/Checklist</SelectItem>
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
                    {watchedDocType === 'contract' ? (
                       <FormField
                          control={form.control}
                          name="clientId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Assign to Client</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a client" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {clients.map(client => (
                                      <SelectItem key={client.id} value={client.id}>
                                          {client.name}
                                      </SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    ) : null}
                    {watchedDocType === 'tax' || watchedDocType === 'employment' ? (
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
                    ) : null}
                    {['maintenance', 'registration', 'insurance'].includes(watchedDocType) ? (
                        <FormField
                          control={form.control}
                          name="assetId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Assign to Vehicle/Asset</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an asset" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {fleetAssets.map(asset => (
                                      <SelectItem key={asset.id} value={asset.id}>
                                          {asset.name}
                                      </SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    ) : null}
                    {watchedDocType === 'general' ? (
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
                    ) : null}
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
            {renderGroupedDocumentSection("Client Contracts", Building2, contractDocuments, "No client contracts have been uploaded.")}
            {renderGroupedDocumentSection("General Documents", Files, generalDocuments, "No general company documents have been uploaded.")}
            {renderGroupedDocumentSection("Asset-Specific Documents", Wrench, assetDocuments, "No documents have been assigned to specific assets.")}
            {renderGroupedDocumentSection("Personal Employee Documents", FileBadge, personalDocuments, "No sensitive documents have been assigned to employees.")}
        </CardContent>
      </Card>
    </div>
  );
}

    