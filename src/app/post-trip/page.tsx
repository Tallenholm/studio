import InspectionFormComponent from '@/components/inspection/InspectionFormComponent';

export default function PostTripPage() {
  return (
    <div className="container mx-auto py-8">
      <InspectionFormComponent inspectionType="post-trip" />
    </div>
  );
}
