import { AdminOrganizationPage } from "@/components/stage3-pages";

export default function AdminOrganizationRoute({ params }: { params: { id: string } }) {
  return <AdminOrganizationPage id={params.id} />;
}
