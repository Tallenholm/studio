
'use client';

import { useState, useMemo } from 'react';
import type { InspectionReport, FleetAsset } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Filter, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useUser } from '@/firebase';

interface ReportsListClientPageProps {
  initialReports: InspectionReport[];
  initialAssets: FleetAsset[];
}

export default function ReportsListClientPage({ initialReports, initialAssets }: ReportsListClientPageProps) {
  const [reports] = useState<InspectionReport[]>(initialReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const [assets] = useState<FleetAsset[]>(initialAssets);
  const [assetFilter, setAssetFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useUser();

  const assetVinMap = useMemo(() => {
    return new Map(assets.map(asset => [asset.vin, asset.name]));
  }, [assets]);
  
  const getAssetName = (report: InspectionReport) => {
    const vin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
    return vin ? assetVinMap.get(vin) || vin : 'N/A';
  }

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const assetVin = report.truckVin || report.trailerVin || report.heavyEquipmentVin;
      const assetMatch = assetFilter === 'all' || assetVin === assetFilter;
      const statusMatch = statusFilter === 'all' || report.overallStatus === statusFilter;
      return assetMatch && statusMatch;
    });
  }, [reports, assetFilter, statusFilter]);

  const isAdmin = user?.role === 'owner' || user?.role === 'manager';

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Inspection Reports" description="View all submitted pre-trip and post-trip inspection reports." icon={FileText}/>
      <div className="mt-8 animate-fade-in-up space-y-4">
        {isAdmin && (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={assetFilter} onValueChange={setAssetFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by asset..." /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Assets</SelectItem>{assets.map(a => <SelectItem key={a.id} value={a.vin}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                        <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="pass">Pass</SelectItem><SelectItem value="fail">Fail</SelectItem></SelectContent>
                    </Select>
                </CardContent>
            </Card>
        )}
        
        {filteredReports.length > 0 ? (
            <div className="border rounded-md bg-card">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Asset</TableHead><TableHead>Type</TableHead><TableHead>Submitted By</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell>{format(parseISO(report.date), 'PP p')}</TableCell>
                      <TableCell className="font-medium">{getAssetName(report)}</TableCell>
                      <TableCell className="capitalize">{report.type.replace('-', ' ')}</TableCell>
                      <TableCell>{report.employeeName}</TableCell>
                      <TableCell><Badge variant={report.overallStatus === 'pass' ? 'default' : 'destructive'} className={report.overallStatus === 'pass' ? 'bg-primary' : ''}>{report.overallStatus}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/reports/${report.id}`} passHref><Button variant="outline" size="icon"><Eye/></Button></Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
        ) : (
             <EmptyState icon={FileText} title="No Reports Found" message={reports.length > 0 ? "No reports match the current filters." : "No inspection reports have been submitted yet."} />
        )}
      </div>
    </div>
  );
}
