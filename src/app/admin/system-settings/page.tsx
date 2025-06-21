
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Cog, Bell, Palette, DownloadCloud, Save } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Cog className="h-8 w-8 text-primary" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure global settings for the Fleet Check application. All options are illustrative and not yet functional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Palette className="h-5 w-5 text-accent" />Appearance</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode-toggle" className="text-base">Enable Dark Mode by Default</Label>
              <Switch id="dark-mode-toggle" disabled checked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-font-size" className="text-base">Default Font Size</Label>
              <Select disabled>
                <SelectTrigger id="default-font-size" className="w-[180px]">
                  <SelectValue placeholder="Medium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Bell className="h-5 w-5 text-accent" />Notification Preferences</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="email-notifications" disabled />
              <Label htmlFor="email-notifications" className="text-base">Receive Email Notifications for Critical Alerts</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-email" className="text-base">Notification Email Address</Label>
              <Input id="notification-email" type="email" placeholder="admin@example.com" disabled />
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2"><DownloadCloud className="h-5 w-5 text-accent" />Data Management</h3>
            <Button variant="outline" disabled className="w-full md:w-auto">
              Export All Inspection Data (JSON)
            </Button>
            <Button variant="outline" disabled className="w-full md:w-auto">
              Clear Local Application Data
            </Button>
             <p className="text-xs text-muted-foreground">Note: Data is stored in your browser's local storage. Clearing data is irreversible and for development purposes only.</p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button disabled className="text-lg py-3 px-6">
              <Save className="mr-2 h-5 w-5" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
