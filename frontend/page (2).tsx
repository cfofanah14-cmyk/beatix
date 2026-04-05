import EventDetailScreen from '@/components/screens/EventDetailScreen'

interface PageProps {
  params: { id: string }
}

export default function EventDetailPage({ params }: PageProps) {
  return <EventDetailScreen eventId={params.id} />
}
