'use client'

import { useState, useTransition } from 'react'
import type { CatalogItem, Order, OrderItem } from '@/app/generated/prisma/client'
import { createOrder, updateOrder } from '../actions'

type ValidationErrors = Record<string, string>

type LineItem = {
  catalogId: string
  name: string
  quantity: number
  unitValue: number
}

type Props = {
  catalog: CatalogItem[]
  order?: Order & { items: OrderItem[] }
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Niski' },
  { value: 'medium', label: 'Średni' },
  { value: 'high', label: 'Wysoki' },
]

export default function OrderForm({ catalog, order }: Props) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [employeeName, setEmployeeName] = useState(order?.employeeName ?? '')
  const [department, setDepartment] = useState(order?.department ?? '')
  const [justification, setJustification] = useState(order?.justification ?? '')
  const [priority, setPriority] = useState(order?.priority ?? 'medium')

  const [lines, setLines] = useState<LineItem[]>(
    order?.items.map((item) => ({
      catalogId: '',
      name: item.name,
      quantity: item.quantity,
      unitValue: item.unitValue,
    })) ?? []
  )

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitValue, 0)
  const overBudget = total > 5000 && priority !== 'high'

  function addItem(item: CatalogItem) {
    setLines((prev) => {
      const existing = prev.findIndex((l) => l.name === item.name)
      if (existing >= 0) {
        return prev.map((l, i) =>
          i === existing ? { ...l, quantity: Math.min(20, l.quantity + 1) } : l
        )
      }
      return [...prev, { catalogId: item.id, name: item.name, quantity: 1, unitValue: item.unitValue }]
    })
  }

  function updateQty(index: number, qty: number) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: qty } : l)))
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('employeeName', employeeName)
    formData.set('department', department)
    formData.set('justification', justification)
    formData.set('priority', priority)
    lines.forEach((l) => {
      formData.append('itemName', l.name)
      formData.append('itemQuantity', String(l.quantity))
      formData.append('itemUnitValue', String(l.unitValue))
    })

    startTransition(async () => {
      const result = order ? await updateOrder(order.id, formData) : await createOrder(formData)
      if (!result.ok) setErrors(result.errors as ValidationErrors)
    })
  }

  const byCategory = catalog.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    ;(acc[item.category] ??= []).push(item)
    return acc
  }, {})

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._ && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errors._}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Dane zamawiającego</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Imię i nazwisko" error={errors.employeeName}>
            <input
              className={input(!!errors.employeeName)}
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Jan Kowalski"
            />
          </Field>

          <Field label="Dział" error={errors.department}>
            <input
              className={input(!!errors.department)}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="np. IT, HR, Finanse"
            />
          </Field>
        </div>

        <Field label="Uzasadnienie" error={errors.justification}>
          <textarea
            className={input(!!errors.justification) + ' resize-none'}
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Opisz potrzebę zakupu..."
          />
        </Field>

        <Field label="Priorytet" error={errors.priority}>
          <select
            className={input(!!errors.priority)}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Katalog sprzętu</h2>
        {errors.items && <p className="text-sm text-red-600">{errors.items}</p>}

        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  className="flex justify-between items-center px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-left transition-colors text-sm"
                >
                  <span className="text-gray-800">{item.name}</span>
                  <span className="text-gray-500 ml-2 shrink-0">{item.unitValue.toFixed(0)} PLN</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-800">Wybrane pozycje</h2>
          <div className="divide-y divide-gray-100">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm text-gray-800">{line.name}</span>
                <span className="text-xs text-gray-400">{line.unitValue.toFixed(0)} PLN/szt.</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(i, Math.max(1, line.quantity - 1))}
                    className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={line.quantity}
                    onChange={(e) => {
                      const v = Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                      updateQty(i, v)
                    }}
                    className="w-12 text-center border border-gray-200 rounded text-sm py-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(i, Math.min(20, line.quantity + 1))}
                    className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-sm leading-none"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right text-sm font-medium text-gray-900">
                  {(line.quantity * line.unitValue).toFixed(2)} PLN
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Łącznie</span>
            <span className={`text-lg font-semibold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
              {total.toFixed(2)} PLN
            </span>
          </div>
          {overBudget && (
            <p className="text-xs text-red-600">
              Przekroczono limit 5 000 PLN. Zmień priorytet na &quot;Wysoki&quot;.
            </p>
          )}
          {errors.total && <p className="text-sm text-red-600">{errors.total}</p>}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <a
          href="/orders"
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Anuluj
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Zapisywanie…' : order ? 'Zapisz zmiany' : 'Złóż zamówienie'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function input(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'
  }`
}
