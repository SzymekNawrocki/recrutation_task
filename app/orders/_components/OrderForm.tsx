'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Mouse, Keyboard, Monitor, Headphones, Plug, Camera,
  Laptop, Square, Usb, Cable, Zap, Package,
} from 'lucide-react'
import type { CatalogItem, Order, OrderItem } from '@/app/generated/prisma/client'
import { createOrder, updateOrder } from '../actions'
import { useT } from '@/app/_components/LanguageProvider'

type ValidationErrors = Record<string, string>

type LineItem = {
  name: string
  quantity: number
  unitValue: number
}

type Props = {
  catalog: CatalogItem[]
  order?: Order & { items: OrderItem[] }
}

const ITEM_ICON: Record<string, React.ElementType> = {
  'Mysz optyczna Logitech MX Master 3': Mouse,
  'Klawiatura mechaniczna Keychron K2': Keyboard,
  'Monitor 24" Full HD Dell': Monitor,
  'Monitor 27" 4K LG': Monitor,
  'Słuchawki z mikrofonem Sony WH-1000XM5': Headphones,
  'Stacja dokująca USB-C Anker 13-in-1': Plug,
  'Kamera internetowa Logitech C920 HD': Camera,
  'Podstawka pod laptopa Nexstand K2': Laptop,
  'Podkładka pod mysz XL': Square,
  'Hub USB 4-portowy': Usb,
  'Kabel HDMI 2m': Cable,
  'Zasilacz UPS 650VA': Zap,
}

const PRIORITY_OPTIONS = [
  { value: 'low', key: 'low' as const },
  { value: 'medium', key: 'medium' as const },
  { value: 'high', key: 'high' as const },
]

export default function OrderForm({ catalog, order }: Props) {
  const t = useT()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [employeeName, setEmployeeName] = useState(order?.employeeName ?? '')
  const [department, setDepartment] = useState(order?.department ?? '')
  const [justification, setJustification] = useState(order?.justification ?? '')
  const [priority, setPriority] = useState(order?.priority ?? 'medium')

  const [lines, setLines] = useState<LineItem[]>(
    order?.items.map((item) => ({
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
      return [...prev, { name: item.name, quantity: 1, unitValue: item.unitValue }]
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
        <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-sm font-medium">
          {errors._}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">{t.form.sectionInfo}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.form.employeeName} error={errors.employeeName}>
            <input
              className={input(!!errors.employeeName)}
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder={t.form.employeePlaceholder}
            />
          </Field>

          <Field label={t.form.department} error={errors.department}>
            <input
              className={input(!!errors.department)}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder={t.form.departmentPlaceholder}
            />
          </Field>
        </div>

        <Field label={t.form.justification} error={errors.justification}>
          <textarea
            className={input(!!errors.justification) + ' resize-none'}
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={t.form.justificationPlaceholder}
          />
        </Field>

        <Field label={t.form.priority} error={errors.priority}>
          <select
            className={input(!!errors.priority)}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t.priority[o.key]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900">{t.form.sectionCatalog}</h2>
        {errors.items && <p className="text-sm text-red-700 font-medium">{errors.items}</p>}

        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const Icon = ITEM_ICON[item.name] ?? Package
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-left transition-colors text-sm group"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-md bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="flex-1 text-slate-800 font-medium">{item.name}</span>
                    <span className="text-slate-600 ml-2 shrink-0 font-semibold">{item.unitValue.toFixed(0)} PLN</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-sm">
          <h2 className="font-semibold text-slate-900">{t.form.sectionItems}</h2>
          <div className="divide-y divide-slate-100">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 text-sm text-slate-800 font-medium">{line.name}</span>
                <span className="text-xs text-slate-500">{line.unitValue.toFixed(0)} {t.form.perUnit}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(i, Math.max(1, line.quantity - 1))}
                    className="w-7 h-7 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm leading-none font-semibold"
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
                    className="w-12 text-center border border-slate-300 rounded text-sm py-1 text-slate-900 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(i, Math.min(20, line.quantity + 1))}
                    className="w-7 h-7 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm leading-none font-semibold"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right text-sm font-bold text-slate-900">
                  {(line.quantity * line.unitValue).toFixed(2)} PLN
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-slate-400 hover:text-red-600 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">{t.form.subtotal}</span>
            <span className={`text-xl font-bold ${overBudget ? 'text-red-700' : 'text-slate-900'}`}>
              {total.toFixed(2)} PLN
            </span>
          </div>
          {overBudget && <p className="text-xs text-red-700 font-medium">{t.form.overBudget}</p>}
          {errors.total && <p className="text-sm text-red-700 font-medium">{errors.total}</p>}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Link
          href="/orders"
          className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {t.form.cancel}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {isPending ? t.form.saving : order ? t.form.save : t.form.submit}
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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
    </div>
  )
}

function input(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-colors ${
    hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
  }`
}
