import { CandidateProfilePage } from "@/components/stage3-pages";

export default function CandidateProfileRoute({ params }: { params: { id: string } }) {
  return <CandidateProfilePage id={params.id} />;
}
