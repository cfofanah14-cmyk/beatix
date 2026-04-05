import TicketScreen from '@/components/screens/TicketScreen'

interface PageProps {
  params: { id: string }
}

export default function TicketPage({ params }: PageProps) {
  return <TicketScreen ticketId={params.id} />
}
