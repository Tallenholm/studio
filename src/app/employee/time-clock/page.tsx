
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, LogIn, LogOut, MapPin, AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { loadClockState, saveClockState } from '@/lib/localStorageService';
import type { ClockState } from '@/lib/types';
import { calculateDistance, isWithinGeofence, getGeofenceRadius } from '@/lib/geolocation';
import { format } from 'date-fns';

export default function TimeClockPage() {
  const { toast } = useToast();
  const [clockState, setClockState] = useState<ClockState>({ status: 'clockedOut', timestamp: null });
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinFence, setIsWithinFence] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setClockState(loadClockState());

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentPosition(coords);
        const dist = calculateDistance(coords);
        setDistance(dist);
        setIsWithinFence(isWithinGeofence(dist));
        if (locationError) setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please enable it in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('The request to get user location timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while getting location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [locationError]);

  const handleClockInOut = () => {
    if (!isWithinFence) {
      toast({
        variant: 'destructive',
        title: 'Out of Range',
        description: 'You must be at the designated location to clock in or out.',
      });
      return;
    }

    const newStatus = clockState.status === 'clockedIn' ? 'clockedOut' : 'clockedIn';
    const newClockState: ClockState = {
      status: newStatus,
      timestamp: new Date().toISOString(),
    };

    setClockState(newClockState);
    saveClockState(newClockState);

    toast({
      title: `Successfully Clocked ${newStatus === 'clockedIn' ? 'In' : 'Out'}`,
      description: `Time: ${format(new Date(), 'PPpp')}`,
    });
  };

  const getStatusCard = () => {
    if (locationError) {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      );
    }

    if (!currentPosition) {
      return (
        <div className="flex items-center justify-center text-muted-foreground mt-6">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Acquiring GPS signal...
        </div>
      );
    }
    
    return (
        <Card className={`mt-6 transition-colors duration-300 ${isWithinFence ? 'border-green-500' : 'border-destructive'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                {isWithinFence ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You are currently <span className="font-bold text-foreground">{distance?.toFixed(0) ?? '...'} meters</span> from the work site.</p>
            <p className="text-muted-foreground">You must be within <span className="font-bold text-foreground">{getGeofenceRadius()} meters</span> to clock in/out.</p>
             <p className={`mt-2 font-bold ${isWithinFence ? 'text-green-500' : 'text-destructive'}`}>
                {isWithinFence ? 'You are in range.' : 'You are out of range.'}
             </p>
          </CardContent>
        </Card>
    )
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Time Clock...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-headline">Time Clock</CardTitle>
          <CardDescription>
            {clockState.status === 'clockedOut'
              ? 'You are currently clocked out.'
              : `You clocked in at ${clockState.timestamp ? format(new Date(clockState.timestamp), 'p') : '...'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              className={`w-full text-lg py-8 ${clockState.status === 'clockedIn' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              onClick={handleClockInOut}
              disabled={!isWithinFence || !currentPosition}
            >
              {clockState.status === 'clockedIn' ? (
                <>
                  <LogOut className="mr-2 h-6 w-6" /> Clock Out
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-6 w-6" /> Clock In
                </>
              )}
            </Button>

            {getStatusCard()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
