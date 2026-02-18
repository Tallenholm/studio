
'use client';

import { useState, useMemo, useRef } from 'react';
import type { ManagedDocument, FleetAsset, User, Client } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDocument, deleteDocument } from '@/lib/firestoreService';
import { uploadFile } from '@/firebase';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, BookOpen, Loader2, Brain, FileUp, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EmptyState from '@/components/common/EmptyState';
import { summarizeDocument } from '@/ai/flows/summarize-document';

const docSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(1, 'Description is required.'),
  category: z.string().min(1, 'Category is required.'),
  documentType: z.enum(['general', 'tax', 'employment', 'maintenance', 'registration', 'insurance', 'contract']),
  documentUrl: z.string().url('A document must be uploaded.'),
  employeeId: z.string().optional(),
  assetId: z.string().optional(),
  clientId: z.string().optional(),
});

interface ManageDocumentsClientPageProps {
  initialDocuments: ManagedDocument[];
  initialFleetAssets: FleetAsset[];
  initialUsers: User[];
  initialClients: Client[];
}

export default function ManageDocumentsClientPage({ initialDocuments, initialFleetAssets, initialUsers, initialClients }: ManageDocumentsClientPageProps) {
  const [documents, setDocuments] = useState<ManagedDocument[]>(initialDocuments);
  const [fleetAssets] = useState<FleetAsset[]>(initialFleetAssets);
  const [users] = useState<User[]>(initialUsers);
  const [clients] = useState<Client[]>(initialClients);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<ManagedDocument | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof docSchema>>({
    resolver: zodResolver(docSchema),
    defaultValues: { documentType: 'general' },
  });

  const watchedDocType = form.watch('documentType');

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ title: '', description: '', category: '', documentType: 'general', documentUrl: '' });
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const dataUriPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
      });

      const uploadPromise = uploadFile(file, `documents/${Date.now()}-${file.name}`);
      const dataUri = await dataUriPromise;
      const summaryPromise = summarizeDocument({ documentDataUri: dataUri });

      const [downloadUrl, summary] = await Promise.all([uploadPromise, summaryPromise]);

      form.setValue('documentUrl', downloadUrl);
      form.setValue('title', summary.title);
      form.setValue('description', summary.description);

      toast({ title: 'AI Scan Complete', description: 'Document uploaded and summary generated.' });
    } catch (error) {
      console.error("File processing error:", error);
      toast({ variant: 'destructive', title: "Processing Failed", description: "Could not upload or analyze the document." });
    } finally {
      setIsProcessing(false);
    }
  };

  async function onSubmit(values: z.infer<typeof docSchema>) {
    let assignedName: { employeeName?: string; clientName?: string } = {};
    if (values.employeeId) {
      assignedName.employeeName = users.find(u => u.id === values.employeeId)?.name;
    }
    if (values.clientId) {
      assignedName.clientName = clients.find(c => c.id === values.clientId)?.name;
    }

    const newDocData = { ...values, ...assignedName };
    const newId = await addDocument(newDocData);
    setDocuments(prev => [...prev, { id: newId, ...newDocData }].sort((a,b) => a.title.localeCompare(b.title)));
    toast({ title: 'Document Added', description: `Document "${values.title}" has been saved.` });
    handleDialogOpenChange(false);
  }

  async function removeDocument(docId: string) {
    const docToRemove = documents.find(d => d.id === docId);
    await deleteDocument(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast({ title: 'Document Removed', description: `"${docToRemove?.title}" has been removed.`, variant: 'destructive' });
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Policies & Documents" description="Manage company-wide policies and employee-specific forms." icon={BookOpen}>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-5 w-5" />Add Document</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
                <DialogDescription>Upload a file and categorize it. The AI will try to summarize it for you.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <FormField control={form.control} name="documentUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document File</FormLabel>
                      <FormControl>
                          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><FileUp className="mr-2 h-4 w-4" />Upload & Analyze File</>}
                          </Button>
                      </FormControl>
                      <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Safety Manuals, Vehicle Docs" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="documentType" render={({ field }) => (
                    <FormItem><FormLabel>Document Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="tax">Tax Form</SelectItem>
                            <SelectItem value="employment">Employment</SelectItem>
                            <SelectItem value="maintenance">Maintenance Record</SelectItem>
                            <SelectItem value="registration">Registration</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent></Select><FormMessage /></FormItem>
                  )} />

                  {['tax', 'employment'].includes(watchedDocType) && <FormField control={form.control} name="employeeId" render={({ field }) => (<FormItem><FormLabel>Assign to Employee</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an employee..."/></SelectTrigger></FormControl><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />}
                  {['maintenance', 'registration', 'insurance'].includes(watchedDocType) && <FormField control={form.control} name="assetId" render={({ field }) => (<FormItem><FormLabel>Assign to Asset</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an asset..."/></SelectTrigger></FormControl><SelectContent>{fleetAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />}
                  {['contract'].includes(watchedDocType) && <FormField control={form.control} name="clientId" render={({ field }) => (<FormItem><FormLabel>Assign to Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client..."/></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />}

                  <DialogFooter><Button type="submit" disabled={isProcessing}>Save Document</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </PageHeader>
        
        <div className="mt-8 animate-fade-in-up">
            {documents.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {documents.map(doc => (
                        <Card key={doc.id} className="flex flex-col">
                            <CardHeader className="flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                                    <CardDescription>{doc.category}</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setDocToDelete(doc)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </CardHeader>
                            <CardContent className="flex-grow flex items-center justify-center">
                                <Link href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="block relative group w-32 h-40 rounded-md overflow-hidden border">
                                    <Image src={doc.documentUrl || 'https://placehold.co/850x1100.png'} alt={`Preview of ${doc.title}`} fill className="object-cover object-top transition-transform group-hover:scale-105" data-ai-hint="official document" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-8 w-8 text-white"/></div>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            ) : (
                <EmptyState icon={BookOpen} title="No Documents Found" message="Click 'Add Document' to upload the first one." actionLabel="Add Document" onAction={() => setIsDialogOpen(true)} />
            )}
        </div>
      </div>
      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the document "{docToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(docToDelete) removeDocument(docToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
