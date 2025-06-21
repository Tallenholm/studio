
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Users } from 'lucide-react';

export default function ManageFleetPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Manage Fleet Assets
          </CardTitle>
          <CardDescription>
            View and manage your fleet of vehicles and equipment. Future updates will allow for adding, editing, and tracking maintenance history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button disabled>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Asset
            </Button>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN/Serial</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Inspection</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Fleet asset management is planned for future development.
                    <br />
                    This area will allow for detailed tracking of each vehicle and piece of equipment.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
           <p className="text-sm text-muted-foreground text-center">
            Future functionality will integrate inspection data to provide a live status for each asset.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
