import EditPlanForm from './EditPlanForm';

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditPlanForm id={id} />;
}
