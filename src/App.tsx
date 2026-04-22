import { useState, useEffect } from 'react'
import { Plus, Clock, MapPin, ArrowLeft, ArrowRight, Trash2, X, Calculator, Users } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card'
import { Input } from './components/ui/Input'
import type { Trip, Expense, ExpenseCategory } from './data/types'
import { categoryLabels, categoryIcons } from './data/types'
import {
  getActiveTrip,
  getActiveTripExpenses,
  getHistoryTrips,
  getTripExpenses,
  getTripStats,
  getTrips,
  createTrip,
  endTrip,
  addExpense,
  deleteExpense,
  deleteTrip,
  calculateSettlement
} from './data/store'

type Page = 'home' | 'create-trip' | 'add-expense' | 'trip-detail' | 'history' | 'settlement'

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatCurrency(amount: number): string {
  return '¥' + amount.toFixed(2)
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [activeTrip, setActiveTrip] = useState<Trip | undefined>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [historyTrips, setHistoryTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | undefined>()

  const refresh = () => {
    setActiveTrip(getActiveTrip())
    setExpenses(getActiveTripExpenses())
    setHistoryTrips(getHistoryTrips())
  }

  useEffect(() => {
    refresh()
  }, [])

  const goHome = () => {
    setPage('home')
    refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-black text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        {page !== 'home' && (
          <button onClick={goHome} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold flex-1">Travel Ledger</h1>
        {page !== 'home' && (
          <button onClick={goHome} className="p-1 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="flex-1 pb-20">
        {page === 'home' && (
          !activeTrip ? (
            <EmptyState onCreateTrip={() => setPage('create-trip')} />
          ) : (
            <ActiveTripView
              trip={activeTrip}
              expenses={expenses}
              onAddExpense={() => setPage('add-expense')}
              onEndTrip={() => { if (confirm('确定要结束这段旅程吗？')) { endTrip(activeTrip.id); refresh() } }}
              onViewDetail={() => { setSelectedTrip(activeTrip); setPage('trip-detail') }}
            />
          )
        )}
        {page === 'create-trip' && (
          <CreateTripView onCreated={() => { refresh(); goHome() }} />
        )}
        {page === 'add-expense' && (
          <AddExpenseView
            onSaved={() => { refresh(); goHome() }}
            tripId={selectedTrip && !selectedTrip.isActive ? selectedTrip.id : undefined}
          />
        )}
        {page === 'trip-detail' && selectedTrip && (
          <TripDetailView
            trip={selectedTrip}
            onDeleted={() => { refresh(); goHome() }}
            onEndTrip={() => { if (confirm('确定要结束这段旅程吗？')) { endTrip(selectedTrip.id); refresh(); goHome() } }}
            onSettlement={() => setPage('settlement')}
            onAddExpense={() => setPage('add-expense')}
          />
        )}
        {page === 'history' && (
          <HistoryView
            trips={historyTrips}
            onSelect={(trip) => { setSelectedTrip(trip); setPage('trip-detail') }}
            onDeleted={() => refresh()}
          />
        )}
        {page === 'settlement' && selectedTrip && (
          <SettlementView
            trip={selectedTrip}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
        <button
          onClick={goHome}
          className={`flex-1 py-3 text-center text-sm font-medium flex flex-col items-center gap-1 ${page === 'home' ? 'text-black' : 'text-gray-500'}`}
        >
          <span className="text-lg">✈️</span>
          <span>当前旅程</span>
        </button>
        <button
          onClick={() => setPage('history')}
          className={`flex-1 py-3 text-center text-sm font-medium flex flex-col items-center gap-1 ${page === 'history' ? 'text-black' : 'text-gray-500'}`}
        >
          <span className="text-lg">📋</span>
          <span>历史</span>
        </button>
      </nav>
    </div>
  )
}

function EmptyState({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="p-4">
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">🌍</div>
          <h2 className="text-xl font-bold mb-2">开始你的第一次旅行</h2>
          <p className="text-gray-500 text-sm mb-6">记录每一笔花费，掌握旅行开支</p>
          <Button onClick={onCreateTrip} size="lg" className="gap-2">
            <Plus className="w-5 h-5" /> 开始新旅程
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ActiveTripView({
  trip,
  expenses,
  onAddExpense,
  onEndTrip,
  onViewDetail
}: {
  trip: Trip
  expenses: Expense[]
  onAddExpense: () => void
  onEndTrip: () => void
  onViewDetail: () => void
}) {
  const stats = getTripStats(trip.id)

  return (
    <div className="p-4 space-y-4">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <MapPin className="w-4 h-4" />
              <span>进行中</span>
            </div>
            <span className="text-3xl">✈️</span>
          </div>
          <CardTitle className="text-white text-2xl mt-2">{trip.destination}</CardTitle>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatDate(trip.startDate)} 开始</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(stats.total)}</div>
          <p className="text-gray-400 text-sm">共 {stats.count} 笔支出</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-2">
        {(['transport', 'food', 'lodge', 'ticket', 'other'] as ExpenseCategory[]).map(cat => (
          <div key={cat} className="bg-white rounded-lg p-2 text-center border border-gray-100">
            <div className="text-lg">{categoryIcons[cat]}</div>
            <div className="text-xs text-gray-500">{categoryLabels[cat]}</div>
            <div className="text-sm font-medium mt-1">{formatCurrency(stats.byCategory[cat] || 0)}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">最近记录</CardTitle>
          <button onClick={onViewDetail} className="text-sm text-gray-500 flex items-center gap-1">
            查看全部 <ArrowRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">还没有记录</p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map(expense => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{categoryIcons[expense.category]}</span>
                    <div>
                      <div className="text-sm font-medium">{categoryLabels[expense.category]}</div>
                      {expense.note && <div className="text-xs text-gray-400">{expense.note}</div>}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(expense.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={onAddExpense} size="lg" className="flex-1 gap-2">
          <Plus className="w-5 h-5" /> 记一笔
        </Button>
        <Button onClick={onEndTrip} variant="outline" size="lg">
          结束旅程
        </Button>
      </div>
    </div>
  )
}

function CreateTripView({ onCreated }: { onCreated: () => void }) {
  const [destination, setDestination] = useState('')
  const [companions, setCompanions] = useState('')

  const handleSubmit = () => {
    if (!destination.trim()) return
    // 解析同行人：逗号或顿号分隔
    const companionsList = companions
      .split(/[,，]/)
      .map(c => c.trim())
      .filter(c => c.length > 0)
    createTrip(destination.trim(), Date.now(), companionsList)
    onCreated()
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🗺️</div>
            <h2 className="text-xl font-bold">新的旅程</h2>
            <p className="text-gray-500 text-sm">要去哪里？</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">目的地</label>
              <Input
                placeholder="例如：东京、巴黎、三亚"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
                className="text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                同行人 <span className="text-gray-400 font-normal">(可选)</span>
              </label>
              <Input
                placeholder="例如：小明、小红"
                value={companions}
                onChange={e => setCompanions(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-gray-400 mt-1">多人用逗号分隔</p>
            </div>
            <Button onClick={handleSubmit} size="lg" className="w-full" disabled={!destination.trim()}>
              开始旅程 ✈️
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AddExpenseView({ onSaved, tripId }: { onSaved: () => void; tripId?: string }) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [note, setNote] = useState('')
  const [calcValue, setCalcValue] = useState('')
  const [showCalc, setShowCalc] = useState(false)
  const [paidBy, setPaidBy] = useState('我')
  // 如果指定了tripId就用它，否则用activeTrip
  const trip = tripId ? getTrips().find(t => t.id === tripId) : getActiveTrip()

  // 同行人列表
  const members = ['我', ...(trip?.companions || [])]

  const handleCalc = (op: string) => {
    if (op === 'C') {
      setCalcValue('')
    } else if (op === '=') {
      try {
        // 安全计算
        const result = Function('"use strict"; return (' + calcValue.replace(/[^0-9.+-]/g, '') + ')')()
        setCalcValue(String(result))
        setAmount(String(result))
      } catch {
        setCalcValue('')
      }
    } else {
      setCalcValue(calcValue + op)
    }
  }

  const handleSubmit = () => {
    const finalAmount = amount || calcValue
    if (!finalAmount || !trip) return
    const numAmount = parseFloat(finalAmount)
    if (isNaN(numAmount) || numAmount <= 0) return

    addExpense({
      amount: numAmount,
      category,
      note: note.trim() || undefined,
      spentAt: Date.now(),
      tripId: trip.id,
      paidBy
    })
    onSaved()
  }

  const finalAmount = amount || calcValue

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">💰</div>
            <h2 className="text-lg font-bold">记一笔</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">金额</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">¥</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="text-2xl font-bold"
                />
                <button
                  onClick={() => setShowCalc(!showCalc)}
                  className={`p-2 rounded-lg ${showCalc ? 'bg-black text-white' : 'bg-gray-100'}`}
                >
                  <Calculator className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showCalc && (
              <div className="border rounded-lg p-2 bg-gray-50">
                <div className="text-right font-mono text-lg mb-2 h-8 bg-white rounded px-2 flex items-center justify-end">
                  {calcValue || '0'}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '×', 'C', '0', '.', '='].map(op => (
                    <button
                      key={op}
                      onClick={() => {
                        if (op === '×') handleCalc('*')
                        else handleCalc(op)
                      }}
                      className={`h-10 rounded-lg font-medium ${op === '=' ? 'bg-black text-white' : op === 'C' ? 'bg-red-100 text-red-600' : 'bg-white border'}`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
              <div className="grid grid-cols-5 gap-2">
                {(['transport', 'food', 'lodge', 'ticket', 'other'] as ExpenseCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${category === cat ? 'border-black bg-gray-100' : 'border-gray-200'}`}
                  >
                    <div className="text-xl">{categoryIcons[cat]}</div>
                    <div className="text-xs mt-1">{categoryLabels[cat]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> 付款人
                </span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {members.map(member => (
                  <button
                    key={member}
                    onClick={() => setPaidBy(member)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${paidBy === member ? 'border-black bg-gray-100 font-medium' : 'border-gray-200'}`}
                  >
                    {member}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
              <Input
                placeholder="例如：酒店早餐、地铁票"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <Button onClick={handleSubmit} size="lg" className="w-full" disabled={!finalAmount}>
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TripDetailView({
  trip,
  onDeleted,
  onEndTrip,
  onSettlement,
  onAddExpense
}: {
  trip: Trip
  onDeleted: () => void
  onEndTrip: () => void
  onSettlement: () => void
  onAddExpense: () => void
}) {
  const expenses = getTripExpenses(trip.id)
  const stats = getTripStats(trip.id)
  const isActive = trip.isActive

  const handleDelete = (expenseId: string) => {
    if (confirm('删除这条记录？')) {
      deleteExpense(expenseId)
      onDeleted()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{trip.destination}</span>
                {isActive && <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-xs">进行中</span>}
                {!isActive && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">已结束</span>}
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatDate(trip.startDate)} - {trip.endDate ? formatDate(trip.endDate!) : '至今'}
              </div>
              <div className="text-3xl font-bold mt-2">{formatCurrency(stats.total)}</div>
              <div className="text-sm text-gray-400">共 {stats.count} 笔</div>
            </div>
            <div className="text-4xl">✈️</div>
          </div>
          {trip.companions.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>同行：{trip.companions.join('、')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">分类统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(['transport', 'food', 'lodge', 'ticket', 'other'] as ExpenseCategory[]).map(cat => {
              const amount = stats.byCategory[cat] || 0
              const percent = stats.total > 0 ? (amount / stats.total) * 100 : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-lg w-6">{categoryIcons[cat]}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{categoryLabels[cat]}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full transition-all" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">所有记录 ({stats.count})</CardTitle>
          <button onClick={onAddExpense} className="text-sm text-blue-600 flex items-center gap-1">
            <Plus className="w-4 h-4" /> 添加
          </button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">暂无记录</p>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{categoryIcons[expense.category]}</span>
                    <div>
                      <div className="text-sm font-medium">{categoryLabels[expense.category]}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        {formatDate(expense.spentAt)}
                        {expense.paidBy !== '我' && (
                          <span className="text-blue-600">· {expense.paidBy}付</span>
                        )}
                      </div>
                      {expense.note && <div className="text-xs text-gray-400">{expense.note}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">{formatCurrency(expense.amount)}</div>
                    <button onClick={() => handleDelete(expense.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isActive && trip.companions.length > 0 && (
        <Button onClick={onSettlement} size="lg" className="w-full gap-2">
          <Users className="w-5 h-5" /> 查看分摊结算
        </Button>
      )}

      {isActive && (
        <Button onClick={onEndTrip} variant="outline" size="lg" className="w-full">
          结束旅程
        </Button>
      )}
    </div>
  )
}

function HistoryView({ trips, onSelect, onDeleted }: { trips: Trip[]; onSelect: (trip: Trip) => void; onDeleted: () => void }) {
  const handleDelete = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation()
    if (confirm(`删除"${trip.destination}"及所有记录？`)) {
      deleteTrip(trip.id)
      onDeleted()
    }
  }

  return (
    <div className="p-4 pb-8">
      <h2 className="text-lg font-bold mb-4">历史旅程 ({trips.length})</h2>
      {trips.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">还没有已结束的旅程</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const stats = getTripStats(trip.id)
            return (
              <Card
                key={trip.id}
                className="cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                onClick={() => onSelect(trip)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trip.destination}</span>
                        <span className="text-xs text-gray-400">✈️</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(trip.startDate)} - {trip.endDate ? formatDate(trip.endDate!) : '?'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(stats.total)}</div>
                        <div className="text-xs text-gray-400">{stats.count} 笔</div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, trip)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SettlementView({ trip }: { trip: Trip }) {
  const settlement = calculateSettlement(trip.id)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-5xl mb-2">🤝</div>
          <h2 className="text-xl font-bold">分摊结算</h2>
          <p className="text-gray-500 text-sm mt-1">{trip.destination}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">总支出</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(settlement.total)}</div>
          <div className="text-sm text-gray-400">
            {settlement.members.length}人，平均每人 {formatCurrency(settlement.perPerson)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">每人应付 / 已付</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settlement.members.map(member => (
              <div key={member.name} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{member.name}</span>
                  {member.balance > 0.01 && (
                    <span className="ml-2 text-green-600 text-sm">多付 {formatCurrency(member.balance)}</span>
                  )}
                  {member.balance < -0.01 && (
                    <span className="ml-2 text-red-600 text-sm">欠 {formatCurrency(-member.balance)}</span>
                  )}
                  {Math.abs(member.balance) <= 0.01 && (
                    <span className="ml-2 text-gray-400 text-sm">已结清</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">已付 {formatCurrency(member.paid)}</div>
                  <div className="text-sm">应付 {formatCurrency(member.owed)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {settlement.settlements.length > 0 && (
        <Card className="border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-base text-blue-600">💸 结算建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlement.settlements.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.from}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{s.to}</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">{formatCurrency(s.amount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {settlement.settlements.length === 0 && settlement.members.length > 1 && (
        <Card>
          <CardContent className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>大家已付金额相等，无需转账</p>
          </CardContent>
        </Card>
      )}

      {settlement.members.length <= 1 && (
        <Card>
          <CardContent className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">ℹ️</div>
            <p>没有同行人，无需分摊</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
