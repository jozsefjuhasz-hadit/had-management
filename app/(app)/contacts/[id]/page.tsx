import ContactDetailPage from "@/components/contacts/ContactDetailPage"

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return <ContactDetailPage contactId={id} />
}
