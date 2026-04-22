import type { Trip, Expense, AppData } from './types'

const STORAGE_KEY = 'travel-ledger-data'

const defaultData: AppData = {
  trips: [],
  expenses: []
}

function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : defaultData
  } catch {
    return defaultData
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Trips
export function getTrips(): Trip[] {
  return loadData().trips
}

export function getActiveTrip(): Trip | undefined {
  return getTrips().find(t => t.isActive)
}

export function createTrip(destination: string, startDate: number, companions: string[] = []): Trip {
  const data = loadData()
  // 结束之前的 active trip
  const trips = data.trips.map(t => ({ ...t, isActive: false }))
  const newTrip: Trip = {
    id: generateId(),
    destination,
    startDate,
    isActive: true,
    createdAt: Date.now(),
    companions
  }
  const newData = { ...data, trips: [...trips, newTrip] }
  saveData(newData)
  return newTrip
}

export function endTrip(tripId: string): void {
  const data = loadData()
  const trips = data.trips.map(t =>
    t.id === tripId ? { ...t, isActive: false, endDate: Date.now() } : t
  )
  saveData({ ...data, trips })
}

export function getHistoryTrips(): Trip[] {
  return getTrips().filter(t => !t.isActive).sort((a, b) => b.startDate - a.startDate)
}

// Expenses
export function getExpenses(tripId?: string): Expense[] {
  const data = loadData()
  if (tripId) {
    return data.expenses.filter(e => e.tripId === tripId)
  }
  return data.expenses
}

export function getActiveTripExpenses(): Expense[] {
  const activeTrip = getActiveTrip()
  if (!activeTrip) return []
  return getExpenses(activeTrip.id).sort((a, b) => b.spentAt - a.spentAt)
}

export function getTripExpenses(tripId: string): Expense[] {
  return getExpenses(tripId).sort((a, b) => b.spentAt - a.spentAt)
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const data = loadData()
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: Date.now()
  }
  const newData = { ...data, expenses: [...data.expenses, newExpense] }
  saveData(newData)
  return newExpense
}

export function deleteExpense(expenseId: string): void {
  const data = loadData()
  const expenses = data.expenses.filter(e => e.id !== expenseId)
  saveData({ ...data, expenses })
}

export function deleteTrip(tripId: string): void {
  const data = loadData()
  const trips = data.trips.filter(t => t.id !== tripId)
  const expenses = data.expenses.filter(e => e.tripId !== tripId)
  saveData({ ...data, trips, expenses })
}

// Stats
export function getTripStats(tripId: string) {
  const expenses = getTripExpenses(tripId)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)
  return { total, byCategory, count: expenses.length }
}

// 同行人分摊相关
export interface SettlementResult {
  total: number
  perPerson: number  // 每人应付（平均分摊）
  members: {
    name: string
    paid: number  // 已付
    owed: number  // 应付
    balance: number  // 差额（正=多付了，负=欠了）
  }[]
  settlements: {
    from: string
    to: string
    amount: number
  }[]  // 谁该给谁多少钱
}

export function calculateSettlement(tripId: string): SettlementResult {
  const trip = getTrips().find(t => t.id === tripId)
  if (!trip) return { total: 0, perPerson: 0, members: [], settlements: [] }

  const expenses = getTripExpenses(tripId)
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  // 所有成员：我 + 同行人
  const allMembers = ['我', ...trip.companions]
  const perPerson = allMembers.length > 0 ? total / allMembers.length : total

  // 计算每人已付金额
  const paidMap: Record<string, number> = {}
  allMembers.forEach(m => paidMap[m] = 0)
  expenses.forEach(e => {
    const payer = e.paidBy || '我'
    paidMap[payer] = (paidMap[payer] || 0) + e.amount
  })

  // 计算每人差额
  const members = allMembers.map(name => ({
    name,
    paid: paidMap[name] || 0,
    owed: perPerson,
    balance: (paidMap[name] || 0) - perPerson
  }))

  // 计算最优分摊（谁该给谁）
  const settlements: SettlementResult['settlements'] = []
  const debtors = members.filter(m => m.balance < 0).map(m => ({ name: m.name, amount: -m.balance }))
  const creditors = members.filter(m => m.balance > 0).map(m => ({ name: m.name, amount: m.balance }))

  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    if (amount > 0.01) {  // 忽略小于1分钱的情况
      settlements.push({ from: debtors[i].name, to: creditors[j].name, amount })
    }
    debtors[i].amount -= amount
    creditors[j].amount -= amount
    if (debtors[i].amount < 0.01) i++
    if (creditors[j].amount < 0.01) j++
  }

  return { total, perPerson, members, settlements }
}
