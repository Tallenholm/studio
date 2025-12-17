
'use client';

import React from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  isApiKeyAvailable: boolean;
}

const libraries: ('places')[] = ['places'];

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  isApiKeyAvailable,
}: AddressAutocompleteProps) {

  if (!isApiKeyAvailable) {
    return (
        <div className="space-y-2">
             <Input 
                type="text" 
                placeholder={placeholder} 
                value={value} 
                onChange={e => onChange(e.target.value)}
            />
            <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Google Maps API Key Missing</AlertTitle>
                <AlertDescription>
                   Address autocomplete is disabled. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment file.
                </AlertDescription>
            </Alert>
        </div>
    );
  }
  
  return <AutocompleteWithScript value={value} onChange={onChange} placeholder={placeholder} />;
}


function AutocompleteWithScript({ value, onChange, placeholder }: Omit<AddressAutocompleteProps, 'isApiKeyAvailable'>) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const [autocomplete, setAutocomplete] =
        React.useState<google.maps.places.Autocomplete | null>(null);

    const onLoad = React.useCallback(
        (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
        },
        []
    );

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
        const place = autocomplete.getPlace();
        onChange(place.formatted_address || '');
        }
    };

    if (loadError) {
        console.error("Google Maps script load error:", loadError);
        return <Input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />;
    }

    if (!isLoaded) {
        return <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading Address Input...</div>;
    }

    return (
        <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
        options={{
            types: ['address'],
            componentRestrictions: { country: 'us' },
        }}
        >
        <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
        </Autocomplete>
    );
}
