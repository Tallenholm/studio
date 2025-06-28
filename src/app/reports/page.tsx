
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { loadInspectionReports, loadFleetAssets } from '@/lib/localStorageService';
import type { InspectionReport, FleetAsset, VehicleType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Brain, CalendarDays, ListChecks, AlertTriangle, CheckCircle2, Loader2, User, Filter, Truck, Box, Shovel } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsListPage() {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { role, user } = useAuth();

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  useEffect(() => {
    setIsMounted(true);
    let loadedReports = loadInspectionReports().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (role === 'employee' && user) {
      loadedReports = loadedReports.filter(report => report.employeeId === user.id);
    }
    
    setReports(loadedReports);
    setFleetAssets(loadFleetAssets());
  }, [isMounted, role, user]);
  
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
        const statusMatch = statusFilter === 'all' || report.overallStatus === statusFilter;
        const typeMatch = typeFilter === 'all' || report.type === typeFilter;
        const vehicleMatch = vehicleFilter === 'all' || 
            (report.truckVin === vehicleFilter) ||
            (report.trailerVin === vehicleFilter) ||
            (report.heavyEquipmentVin === vehicleFilter);
        return statusMatch && typeMatch && vehicleMatch;
    });
  }, [reports, statusFilter, typeFilter, vehicleFilter]);


  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-headline font-bold flex items-center gap-2">
          <ListChecks className="h-10 w-10 text-primary" />
          {role === 'employee' ? 'My Inspection Reports' : 'Inspection Reports'}
        </h1>
        <Link href="/pre-trip" passHref>
           <Button>New Inspection</Button>
        </Link>
      </div>

       <Card className="mb-8 bg-muted/30">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Filter className="h-5 w-5"/>Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="pre-trip">Pre-Trip</SelectItem>
                        <SelectItem value="post-trip">Post-Trip</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Vehicles</SelectItem>
                        {fleetAssets.map(asset => (
                            <SelectItem key={asset.vin} value={asset.vin}>{asset.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

      {filteredReports.length === 0 ? (
        <Card className="text-center py-12 bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-2xl font-headline">No Reports Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              {role === 'employee' ? "You have no reports matching the current filters." : "No inspection reports match the current filters."}
            </CardDescription>
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/pre-trip" passHref>
              <Button size="lg">Start New Inspection</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                 <CardTitle className="text-xl font-headline capitalize flex items-center gap-2">
                    {report.overallStatus === 'pass' ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <AlertTriangle className="h-6 w-6 text-destructive" />}
                    {report.type.replace('-', ' ')}
                  </CardTitle>
                  <Badge variant={report.overallStatus === 'pass' ? 'default' : 'destructive'} className={cn(report.overallStatus === 'pass' && 'bg-primary', "text-primary-foreground")}>
                    {report.overallStatus?.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 text-sm pt-1">
                    <CalendarDays className="h-4 w-4"/> {format(new Date(report.date), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Truck:</strong> {report.truckVin ? fleetAssets.find(a => a.vin === report.truckVin)?.name || report.truckVin : 'N/A'}</p>
                  <p><strong>Trailer:</strong> {report.trailerVin ? fleetAssets.find(a => a.vin === report.trailerVin)?.name || report.trailerVin : 'N/A'}</p>
                  <p><strong>Equipment:</strong> {report.heavyEquipmentVin ? fleetAssets.find(a => a.vin === report.heavyEquipmentVin)?.name || report.heavyEquipmentVin : 'N/A'}</p>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2 border-t">
                    <User className="h-4 w-4" />
                    <span>By: <strong>{report.employeeName || 'Unknown'}</strong></span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Link href={`/reports/${report.id}`} className='flex-1'>
                  <Button variant="outline" className="w-full" aria-label={`View report ${report.id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </Button>
                </Link>
                {report.type === 'pre-trip' && (
                   <Link href={`/reports/${report.id}?analyze=true`} className='flex-1'>
                    <Button className="w-full" aria-label={`Analyze report ${report.id} with AI`}>
                      <Brain className="mr-2 h-4 w-4" /> AI Analysis
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
