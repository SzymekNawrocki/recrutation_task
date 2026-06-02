import { getCatalog } from '@/lib/queries'
import OrderForm from '../_components/OrderForm'

export default async function NewOrderPage() {
  const catalog = await getCatalog()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Nowe zamówienie</h1>
      <OrderForm catalog={catalog} />
    </div>
  )
}
