import { RecruiterJobDetailPage } from "@/components/stage3-pages";

export default function RecruiterJobDetailRoute({ params }: { params: { id: string } }) {
  return <RecruiterJobDetailPage id={params.id} />;
}
