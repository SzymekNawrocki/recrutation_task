export type OrderInput = {
  employeeName: string
  department: string
  justification: string
  priority: string
  items: { name: string; quantity: number; unitValue: number }[]
}

export type ValidationErrors = Partial<{
  employeeName: string
  department: string
  justification: string
  priority: string
  items: string
  total: string
}>

export type ValidationMessages = {
  employeeNameRequired: string
  departmentRequired: string
  justificationRequired: string
  invalidPriority: string
  itemsRequired: string
  invalidQuantity: string
  overBudgetDetail: string
}

const VALID_PRIORITIES = ['low', 'medium', 'high'] as const
const MAX_TOTAL_PLN = 5000

export function validateOrder(
  input: OrderInput,
  msgs: ValidationMessages
): { ok: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {}

  if (!input.employeeName?.trim()) errors.employeeName = msgs.employeeNameRequired
  if (!input.department?.trim()) errors.department = msgs.departmentRequired
  if (!input.justification?.trim()) errors.justification = msgs.justificationRequired

  if (!VALID_PRIORITIES.includes(input.priority as (typeof VALID_PRIORITIES)[number])) {
    errors.priority = msgs.invalidPriority
  }

  if (!input.items || input.items.length === 0) {
    errors.items = msgs.itemsRequired
  } else {
    const invalid = input.items.find(
      (item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
    )
    if (invalid) {
      errors.items = msgs.invalidQuantity
    }
  }

  if (!errors.items && input.items?.length > 0) {
    const total = input.items.reduce((sum, item) => sum + item.quantity * item.unitValue, 0)
    if (total > MAX_TOTAL_PLN && input.priority !== 'high') {
      errors.total = msgs.overBudgetDetail
        .replace('{total}', total.toFixed(2))
        .replace('{max}', String(MAX_TOTAL_PLN))
    }
  }

  return { ok: Object.keys(errors).length === 0, errors }
}
