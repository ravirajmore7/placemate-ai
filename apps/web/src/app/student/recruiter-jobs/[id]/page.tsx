import { StudentRecruiterJobDetailPage } from "@/components/stage3-pages";

export default function StudentRecruiterJobDetailRoute({ params }: { params: { id: string } }) {
  return <StudentRecruiterJobDetailPage id={params.id} />;
}
