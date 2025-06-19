import type { ChecklistSectionData } from './types';
import {
  Droplet,
  Thermometer,
  Settings2,
  Wind,
  Lightbulb,
  Disc3,
  CircleParking,
  View,
  Volume2,
  ShieldAlert,
  ArrowUpFromLine,
  Pipette,
  Link,
  Link2,
  LayoutGrid,
  ChevronsUpDown,
  Anchor,
  Tractor,
  Shovel,
  Gamepad2,
  ShieldCheck,
  Wrench,
  TruckIcon,
  Box,
  Construction,
} from 'lucide-react';

export const CHECKLIST_DATA: ChecklistSectionData[] = [
  {
    id: 'truck',
    name: 'Truck (2021 Chevy 6500)',
    Icon: TruckIcon,
    items: [
      { id: 'truck-oil', name: 'Engine Oil Level', instructions: 'Check dipstick. Level should be between min and max marks.', Icon: Droplet },
      { id: 'truck-coolant', name: 'Coolant Level', instructions: 'Check reservoir. Level should be between min and max marks when engine is cold.', Icon: Thermometer },
      { id: 'truck-brake-fluid', name: 'Brake Fluid Level', instructions: 'Check reservoir. Level should be between min and max marks.', Icon: Droplet }, // Consider a more specific icon or use AlertTriangle if critically low
      { id: 'truck-power-steering', name: 'Power Steering Fluid', instructions: 'Check reservoir. Level should be between min and max marks.', Icon: Settings2 },
      { id: 'truck-washer-fluid', name: 'Windshield Washer Fluid', instructions: 'Check reservoir. Fill if low.', Icon: Wind },
      { id: 'truck-lights', name: 'Lights (All)', instructions: 'Test headlights (low/high), taillights, turn signals, brake lights, hazard lights, clearance lights.', Icon: Lightbulb },
      { id: 'truck-tires', name: 'Tires (Pressure, Tread, Damage)', instructions: 'Check for proper inflation, adequate tread depth, and any visible damage (cuts, bulges).', Icon: Disc3 },
      { id: 'truck-brakes', name: 'Brakes (Parking, Service)', instructions: 'Test parking brake for holding. Listen for unusual noises and check pedal feel for service brakes.', Icon: CircleParking },
      { id: 'truck-mirrors', name: 'Mirrors (Adjustment, Cleanliness)', instructions: 'Ensure mirrors are clean, adjusted correctly, and not damaged.', Icon: View },
      { id: 'truck-horn', name: 'Horn', instructions: 'Test horn for proper operation.', Icon: Volume2 },
      { id: 'truck-wipers', name: 'Wipers & Washers', instructions: 'Test wipers for proper operation and blade condition. Test washers.', Icon: Wind },
      { id: 'truck-safety-equip', name: 'Safety Equipment', instructions: 'Check for fire extinguisher (charged, accessible), reflective triangles, first aid kit.', Icon: ShieldAlert },
      { id: 'truck-dump-bed', name: 'Dump Bed Operation', instructions: 'If safe, test dump bed mechanism. Check hydraulic lines for leaks.', Icon: ArrowUpFromLine },
      { id: 'truck-leaks', name: 'Leaks (General)', instructions: 'Look under vehicle for any signs of oil, coolant, fuel, or other fluid leaks.', Icon: Pipette },
      { id: 'truck-hitch', name: 'Fifth Wheel/Hitch', instructions: 'Check for security, wear, and proper lubrication (if applicable).', Icon: Link },
    ],
  },
  {
    id: 'trailer',
    name: 'Trailer (Tilt Deck)',
    Icon: Box, // Using Box as a generic trailer icon
    items: [
      { id: 'trailer-lights', name: 'Lights (All)', instructions: 'Test taillights, turn signals, brake lights, clearance lights.', Icon: Lightbulb },
      { id: 'trailer-tires', name: 'Tires (Pressure, Tread, Damage)', instructions: 'Check for proper inflation, adequate tread depth, and any visible damage.', Icon: Disc3 },
      { id: 'trailer-brakes', name: 'Brakes (if applicable)', instructions: 'Test trailer brakes if equipped (e.g., electric or air).', Icon: CircleParking },
      { id: 'trailer-hitch-conn', name: 'Hitch Connection', instructions: 'Ensure secure connection to truck, locking mechanism engaged.', Icon: Link2 },
      { id: 'trailer-safety-chains', name: 'Safety Chains', instructions: 'Ensure chains are properly attached and not damaged.', Icon: Link },
      { id: 'trailer-deck-cond', name: 'Deck Condition', instructions: 'Check for damage, loose boards, or debris.', Icon: LayoutGrid },
      { id: 'trailer-tilt-mech', name: 'Tilt Mechanism', instructions: 'Inspect hydraulic lines, pivot points, and operation if safe to do so.', Icon: ChevronsUpDown },
      { id: 'trailer-load-secure', name: 'Load Securement Points', instructions: 'Check D-rings, rub rails, and other tie-down points for integrity.', Icon: Anchor },
    ],
  },
  {
    id: 'skidSteer',
    name: 'Skid Steer',
    Icon: Construction, // Using construction as skid steer icon
    items: [
      { id: 'skid-fluids', name: 'Fluid Levels (Engine, Hydraulic)', instructions: 'Check engine oil, hydraulic oil, and coolant levels.', Icon: Droplets },
      { id: 'skid-lights', name: 'Lights (if applicable)', instructions: 'Test any work lights or warning lights.', Icon: Lightbulb },
      { id: 'skid-tires-tracks', name: 'Tires/Tracks', instructions: 'Check tires for wear and damage, or tracks for tension and condition.', Icon: Disc3 }, // Tractor might be better for tracks
      { id: 'skid-bucket-attach', name: 'Bucket/Attachments', instructions: 'Inspect for damage, wear, and secure attachment.', Icon: Shovel },
      { id: 'skid-controls', name: 'Controls (Levers, Pedals)', instructions: 'Check for smooth operation and responsiveness.', Icon: Gamepad2 },
      { id: 'skid-safety-feat', name: 'Safety Features (ROPS, Seatbelt)', instructions: 'Ensure ROPS is intact and seatbelt is functional.', Icon: ShieldCheck },
      { id: 'skid-leaks', name: 'Leaks (General)', instructions: 'Inspect for hydraulic, oil, or fuel leaks.', Icon: Pipette },
      { id: 'skid-grease', name: 'Grease Points', instructions: 'Check and grease all required points as per manual.', Icon: Wrench },
    ],
  },
];
