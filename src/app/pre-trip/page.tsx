import InspectionFormComponent from '@/components/inspection/InspectionFormComponent';

export default function PreTripPage() {
  return (
    <div className="container mx-auto py-8">
      <InspectionFormComponent inspectionType="pre-trip" />
    </div>
  );
}
