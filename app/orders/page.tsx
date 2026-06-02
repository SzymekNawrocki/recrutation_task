import Link from 'next/link'
import { getOrders } from '@/lib/queries'

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-700',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Oczekuje',
  APPROVED: 'Zatwierdzone',
  REJECTED: 'Odrzucone',
  CANCELLED: 'Anulowane',
}

export default async function OrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Zamówienia</h1>
        <Link
          href="/orders/new"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nowe zamówienie
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Brak zamówień</p>
          <p className="text-sm mt-1">
            <Link href="/orders/new" className="text-gray-600 underline">
              Złóż pierwsze zamówienie
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pracownik</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dział</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Priorytet</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Wartość</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const total = order.items.reduce(
                  (sum, item) => sum + item.quantity * item.unitValue,
                  0
                )
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {order.employeeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_BADGE[order.priority] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {PRIORITY_LABEL[order.priority] ?? order.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {total.toFixed(2)} PLN
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
