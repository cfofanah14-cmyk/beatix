import CheckoutScreen from '@/components/screens/CheckoutScreen'

interface PageProps {
  params: { id: string }
}

export default function CheckoutPage({ params }: PageProps) {
  return <CheckoutScreen eventId={params.id} />
}
