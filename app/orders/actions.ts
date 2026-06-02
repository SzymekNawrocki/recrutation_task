'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { validateOrder, type OrderInput } from '@/lib/validation'
import { getDict, LANG_COOKIE, type Lang } from '@/lib/i18n'

type ActionResult = { ok: false; errors: Record<string, string> } | { ok: true }

async function getLang(): Promise<Lang> {
  const cookieStore = await cookies()
  return (cookieStore.get(LANG_COOKIE)?.value ?? 'pl') as Lang
}

function parseItems(formData: FormData): OrderInput['items'] {
  const names = formData.getAll('itemName') as string[]
  const quantities = formData.getAll('itemQuantity') as string[]
  const unitValues = formData.getAll('itemUnitValue') as string[]

  return names.map((name, i) => ({
    name,
    quantity: parseInt(quantities[i] ?? '0', 10),
    unitValue: parseFloat(unitValues[i] ?? '0'),
  }))
}

export async function createOrder(formData: FormData): Promise<ActionResult> {
  const t = getDict(await getLang())

  const input: OrderInput = {
    employeeName: (formData.get('employeeName') as string) ?? '',
    department: (formData.get('department') as string) ?? '',
    justification: (formData.get('justification') as string) ?? '',
    priority: (formData.get('priority') as string) ?? '',
    items: parseItems(formData),
  }

  const { ok, errors } = validateOrder(input, t.errors)
  if (!ok) return { ok: false, errors }

  const order = await prisma.order.create({
    data: {
      employeeName: input.employeeName,
      department: input.department,
      justification: input.justification,
      priority: input.priority,
      items: {
        create: input.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitValue: item.unitValue,
        })),
      },
    },
  })

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function updateOrder(id: string, formData: FormData): Promise<ActionResult> {
  const t = getDict(await getLang())

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) return { ok: false, errors: { _: t.errors.orderNotFound } }
  if (existing.status === 'APPROVED') {
    return { ok: false, errors: { _: t.errors.orderApprovedNoEdit } }
  }

  const input: OrderInput = {
    employeeName: (formData.get('employeeName') as string) ?? '',
    department: (formData.get('department') as string) ?? '',
    justification: (formData.get('justification') as string) ?? '',
    priority: (formData.get('priority') as string) ?? '',
    items: parseItems(formData),
  }

  const { ok, errors } = validateOrder(input, t.errors)
  if (!ok) return { ok: false, errors }

  await prisma.order.update({
    where: { id },
    data: {
      employeeName: input.employeeName,
      department: input.department,
      justification: input.justification,
      priority: input.priority,
      items: {
        deleteMany: {},
        create: input.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitValue: item.unitValue,
        })),
      },
    },
  })

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  redirect(`/orders/${id}`)
}

export async function cancelOrder(id: string): Promise<ActionResult> {
  const t = getDict(await getLang())

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) return { ok: false, errors: { _: t.errors.orderNotFound } }
  if (existing.status === 'APPROVED') {
    return { ok: false, errors: { _: t.errors.orderApprovedNoCancel } }
  }
  if (existing.status === 'CANCELLED') {
    return { ok: false, errors: { _: t.errors.orderAlreadyCancelled } }
  }

  await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } })

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  redirect(`/orders/${id}`)
}

export async function approveOrder(id: string): Promise<ActionResult> {
  const t = getDict(await getLang())

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) return { ok: false, errors: { _: t.errors.orderNotFound } }
  if (existing.status !== 'PENDING') {
    return { ok: false, errors: { _: t.errors.onlyPendingApprove } }
  }

  await prisma.order.update({ where: { id }, data: { status: 'APPROVED' } })

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  revalidatePath('/admin')
  redirect('/admin')
}

export async function rejectOrder(id: string): Promise<ActionResult> {
  const t = getDict(await getLang())

  const existing = await prisma.order.findUnique({ where: { id } })
  if (!existing) return { ok: false, errors: { _: t.errors.orderNotFound } }
  if (existing.status !== 'PENDING') {
    return { ok: false, errors: { _: t.errors.onlyPendingReject } }
  }

  await prisma.order.update({ where: { id }, data: { status: 'REJECTED' } })

  revalidatePath('/orders')
  revalidatePath(`/orders/${id}`)
  revalidatePath('/admin')
  redirect('/admin')
}
