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

export function createTrip(destination: string, startDate: number): Trip {
  const data = loadData()
  // 结束之前的 active trip
  const trips = data.trips.map(t => ({ ...t, isActive: false }))
  const newTrip: Trip = {
    id: generateId(),
    destination,
    startDate,
    isActive: true,
    createdAt: Date.now()
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
