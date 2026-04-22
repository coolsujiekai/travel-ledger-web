export type ExpenseCategory = 'transport' | 'food' | 'lodge' | 'ticket' | 'other'

export const categoryLabels: Record<ExpenseCategory, string> = {
  transport: '交通',
  food: '餐饮',
  lodge: '住宿',
  ticket: '门票',
  other: '其他'
}

export const categoryIcons: Record<ExpenseCategory, string> = {
  transport: '✈️',
  food: '🍜',
  lodge: '🏨',
  ticket: '🎫',
  other: '📦'
}

export interface Trip {
  id: string
  destination: string
  startDate: number
  endDate?: number
  isActive: boolean
  createdAt: number
}

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  customTag?: string
  note?: string
  spentAt: number
  createdAt: number
  tripId: string
}

export interface AppData {
  trips: Trip[]
  expenses: Expense[]
}
