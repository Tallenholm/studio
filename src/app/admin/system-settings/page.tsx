
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Cog, Bell, Palette, DownloadCloud, Save, DatabaseZap, Loader2 } from 'lucide-react';
import { loadSystemSettings, saveSystemSettings, type SystemSettings } from '@/lib/settingsService';
import { requestNotificationPermission } from '@/lib/firebase';

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  useEffect(() => {
    setSettings(loadSystemSettings());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);
  
  const handleSaveChanges = () => {
    if (!settings) return;
    setIsSaving(true);
    saveSystemSettings(settings);
    
    // Simulate network delay
    setTimeout(() => {
        setIsSaving(false);
        toast({
            title: "Settings Saved",
            description: "Your new system configuration has been saved.",
        });
    }, 500);
  }

  const handleSubscribe = async () => {
      setIsSubscribing(true);
      const token = await requestNotificationPermission();
      if (token) {
          toast({
              title: "Subscribed!",
              description: "You will now receive push notifications on this device.",
          });
          setNotificationStatus('granted');
      } else {
           toast({
              variant: 'destructive',
              title: "Subscription Failed",
              description: "Permission was denied or an error occurred. Check browser settings and ensure Firebase config is correct.",
          });
          setNotificationStatus(Notification.permission);
      }
      setIsSubscribing(false);
  };

  if (!settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Cog className="h-8 w-8 text-primary" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure global settings for the Logan's Excavating application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Palette className="h-5 w-5 text-accent" />Appearance</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode-toggle" className="text-base">Enable Dark Mode by Default</Label>
              <Switch id="dark-mode-toggle" checked={settings.enableDarkMode} onCheckedChange={(checked) => handleSettingChange('enableDarkMode', checked)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-font-size" className="text-base">Default Font Size</Label>
              <Select value={settings.defaultFontSize} onValueChange={(value) => handleSettingChange('defaultFontSize', value)}>
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
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Label htmlFor="push-notifications" className="text-base">Browser Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                        Receive real-time alerts for critical events.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Current Status: <span className="font-semibold capitalize">{notificationStatus}</span>
                    </p>
                </div>
                <Button onClick={handleSubscribe} disabled={notificationStatus === 'granted' || isSubscribing}>
                    {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {notificationStatus === 'granted' ? 'Subscribed' : 'Subscribe'}
                </Button>
            </div>
            <Separator />
            <div className="flex items-center space-x-2">
              <Checkbox id="email-notifications" checked={settings.enableEmailNotifications} onCheckedChange={(checked) => handleSettingChange('enableEmailNotifications', checked as boolean)} />
              <Label htmlFor="email-notifications" className="text-base">Receive Email Notifications for Critical Alerts</Label>
            </div>
            {settings.enableEmailNotifications && (
              <div className="space-y-2 pl-6 animate-in fade-in duration-300">
                <Label htmlFor="notification-email" className="text-base">Notification Email Address</Label>
                <Input id="notification-email" type="email" placeholder="admin@example.com" value={settings.notificationEmailAddress} onChange={(e) => handleSettingChange('notificationEmailAddress', e.target.value)} />
                <p className="text-xs text-muted-foreground">This address will receive system alerts. A backend email service is required for this to function.</p>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold flex items-center gap-2"><DatabaseZap className="h-5 w-5 text-accent" />Data & Retention</h3>
             <div className="space-y-2">
              <Label htmlFor="data-retention" className="text-base">Inspection Report Retention Period</Label>
              <Select disabled>
                <SelectTrigger id="data-retention" className="w-[180px]">
                  <SelectValue placeholder="1 Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground">This setting is illustrative and would require a backend to implement.</p>
            </div>
            <Button variant="outline" disabled className="w-full md:w-auto">
              <DownloadCloud className="mr-2 h-4 w-4" /> Export All Inspection Data (JSON)
            </Button>
            <Button variant="destructive" disabled className="w-full md:w-auto">
              Clear All Local Application Data
            </Button>
             <p className="text-xs text-muted-foreground">Note: Data is stored in your browser's local storage. Clearing data is irreversible and for development purposes only.</p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveChanges} className="text-lg py-3 px-6" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
