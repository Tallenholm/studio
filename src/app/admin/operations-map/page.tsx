'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { getJobs, getFleetAssets } from '@/lib/firestoreService';
import type { Job, FleetAsset } from '@/lib/types';
import { getJobStatus } from '@/lib/job-utils';
import { Loader2, Map, AlertTriangle, Briefcase, Truck, Shovel, Box } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { loadSystemSettings } from '@/lib/settingsService';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '70vh',
};

// A default center for the map, will be replaced by user's setting
const defaultCenter = {
  lat: 41.12,
  lon: -87.86,
};

export default function OperationsMapPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Job | FleetAsset | null>(null);
  const [center, setCenter] = useState({ lat: defaultCenter.lat, lng: defaultCenter.lon });

  useEffect(() => {
    const settings = loadSystemSettings();
    setCenter({ lat: settings.locationLat, lng: settings.locationLon });

    const fetchData = async () => {
      setIsLoading(true);
      const [allJobs, allAssets] = await Promise.all([getJobs(), getFleetAssets()]);
      const activeJobs = allJobs.filter(job => getJobStatus(job) === 'active');
      setJobs(activeJobs);
      setAssets(allAssets);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!isLoaded || !window.google) return null;
    const geocoder = new window.google.maps.Geocoder();
    try {
      const results = await geocoder.geocode({ address });
      if (results.results[0]) {
        const { lat, lng } = results.results[0].geometry.location;
        return { lat: lat(), lng: lng() };
      }
    } catch (error) {
      console.error(`Geocoding error for address "${address}":`, error);
    }
    return null;
  };
  
  // Custom hook to handle geocoding jobs
  const useGeocodedJobs = (jobsToGeocode: Job[]) => {
    const [geocodedJobs, setGeocodedJobs] = useState<(Job & { position: { lat: number, lng: number } })[]>([]);
  
    useEffect(() => {
      if (!isLoaded) return;
  
      const processJobs = async () => {
        const newGeocodedJobs: (Job & { position: { lat: number, lng: number } })[] = [];
        for (const job of jobsToGeocode) {
          const position = await geocodeAddress(job.address);
          if (position) {
            newGeocodedJobs.push({ ...job, position });
          }
        }
        setGeocodedJobs(newGeocodedJobs);
      };
  
      processJobs();
    }, [jobsToGeocode, isLoaded]);
  
    return geocodedJobs;
  };
  
  const geocodedJobs = useGeocodedJobs(jobs);

  const getAssetIcon = (type: FleetAsset['type']) => {
    switch (type) {
      case 'truck': return '/icons/truck-pin.png';
      case 'trailer': return '/icons/trailer-pin.png';
      case 'heavyEquipment': return '/icons/equipment-pin.png';
      default: return '';
    }
  };

  const getAssetIconComponent = (type: FleetAsset['type']) => {
      switch(type) {
          case 'truck': return <Truck className="h-4 w-4 mr-2" />;
          case 'trailer': return <Box className="h-4 w-4 mr-2" />;
          case 'heavyEquipment': return <Shovel className="h-4 w-4 mr-2" />;
      }
  }

  if (loadError) {
    return <Card className="m-8"><CardHeader><CardTitle>Error loading maps</CardTitle><CardDescription>Could not connect to Google Maps service.</CardDescription></CardHeader></Card>;
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Operations Map...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
       <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Map className="h-8 w-8 text-primary" />
                Live Operations Map
            </CardTitle>
            <CardDescription>
                A real-time overview of active job sites and fleet asset locations.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                <div className="flex flex-col items-center justify-center gap-2 text-sm text-destructive p-4 bg-destructive/10 border border-destructive/50 rounded-md h-96">
                    <AlertTriangle className="h-10 w-10" />
                    <p className="font-bold text-lg text-center">Google Maps API Key Missing</p>
                    <p className="text-center">Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment file to enable the map.</p>
                </div>
            ) : (
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={10}
                    center={center}
                >
                    {geocodedJobs.map(job => (
                        <Marker 
                            key={job.id} 
                            position={job.position}
                            icon={{ url: '/icons/job-pin.png' }}
                            onClick={() => setSelected(job)}
                        />
                    ))}

                    {/* Simulate asset locations at company HQ for now */}
                    {assets.map((asset, index) => (
                         <Marker 
                            key={asset.id}
                            position={{ lat: center.lat + (index * 0.0001), lng: center.lng + (index * 0.0001) }}
                            icon={{ url: getAssetIcon(asset.type) }}
                            onClick={() => setSelected(asset)}
                        />
                    ))}

                    {selected && (
                        <InfoWindow
                            position={'address' in selected ? (geocodedJobs.find(j => j.id === selected.id)?.position || center) : center}
                            onCloseClick={() => setSelected(null)}
                        >
                            <div className="p-1 max-w-xs">
                                {'address' in selected ? (
                                    <>
                                        <h4 className="font-bold text-md flex items-center"><Briefcase className="h-4 w-4 mr-2" />{selected.name}</h4>
                                        <p className="text-sm text-muted-foreground">{selected.clientName}</p>
                                        <p className="text-xs mt-1">{selected.address}</p>
                                        <Link href={`/admin/jobs/${selected.id}`} passHref>
                                          <Button size="sm" className="mt-2 w-full">View Job</Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="font-bold text-md flex items-center">{getAssetIconComponent(selected.type)}{selected.name}</h4>
                                        <p className="text-sm text-muted-foreground capitalize">{selected.type.replace(/([A-Z])/g, ' $1')}</p>
                                         <Link href={`/admin/manage-fleet`} passHref>
                                          <Button size="sm" className="mt-2 w-full">View Fleet</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
