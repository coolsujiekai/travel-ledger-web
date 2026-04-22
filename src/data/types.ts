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
  companions: string[]  // 同行人列表，如 ["小明", "小红"]
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
  paidBy: string  // 付款人，默认"我"
}

export interface AppData {
  trips: Trip[]
  expenses: Expense[]
}
