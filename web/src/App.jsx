
import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
})

const today = new Date().toISOString().slice(0, 10)

const emptyTransaction = {
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: today,
  paymentMethod: 'Efectivo',
}

const emptyCategory = {
  name: '',
  type: 'expense',
  color: '#83A58E',
}

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const responseText = await response.text()
    let data = {}

    if (responseText) {
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { message: responseText }
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error')
    }

    return data
  } catch (error) {
    throw new Error(
      error.message || 'No fue posible conectar con el servidor'
    )
  }
}

function App() {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filter, setFilter] = useState('all')

  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [transactionForm, setTransactionForm] = useState(emptyTransaction)

  const [editingCategory, setEditingCategory] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  async function loadData() {
    try {
      const [categoryData, transactionData] = await Promise.all([
        request('/api/categories'),
        request('/api/transactions'),
      ])

      setCategories(categoryData)
      setTransactions(transactionData)
      setError('')

      return true
    } catch (err) {
      setError(err.message || 'No fue posible cargar los datos')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentMonthTransactions = useMemo(() => {
    const now = new Date()

    return transactions.filter((transaction) => {
      const date = new Date(transaction.date)

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      )
    })
  }, [transactions])

  const totals = useMemo(() => {
    const income = currentMonthTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    const expense = currentMonthTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0)

    return {
      income,
      expense,
      balance: income - expense,
    }
  }, [currentMonthTransactions])

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((item) => item.type === filter)
  }, [transactions, filter])

  const availableCategories = categories.filter(
    (category) => category.type === transactionForm.type
  )

  function showMessage(message) {
    setSuccess(message)
    setError('')
  }

  function changeTransactionType(type) {
    setTransactionForm((current) => ({
      ...current,
      type,
      category: '',
    }))
  }

  async function handleCreateCategory(event) {
    event.preventDefault()
    setSuccess('')
    setError('')

    try {
      await request('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryForm),
      })

      setCategoryForm(emptyCategory)

      const updated = await loadData()

      if (updated) {
        showMessage('Categoría creada correctamente')
      }
    } catch (err) {
      setError(err.message)
      setSuccess('')
    }
  }

  function startEditCategory(category) {
    setEditingCategory({
      _id: category._id,
      name: category.name,
      type: category.type,
      color: category.color || '#83A58E',
    })

    setError('')
    setSuccess('')
  }

  async function handleUpdateCategory(event) {
    event.preventDefault()
    setSuccess('')
    setError('')

    try {
      await request(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingCategory.name,
          type: editingCategory.type,
          color: editingCategory.color,
        }),
      })

      setEditingCategory(null)

      const updated = await loadData()

      if (updated) {
        showMessage('Categoría actualizada correctamente')
      }
    } catch (err) {
      setError(err.message)
      setSuccess('')
    }
  }

  function handleDeleteCategory(category) {
    setPendingDelete({
      type: 'category',
      id: category._id,
      name: category.name,
    })
  }

  async function handleSaveTransaction(event) {
    event.preventDefault()
    setSuccess('')
    setError('')

    const payload = {
      ...transactionForm,
      amount: Number(transactionForm.amount),
    }

    try {
      if (editingTransaction) {
        await request(`/api/transactions/${editingTransaction}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await request('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      const wasEditing = Boolean(editingTransaction)

      cancelEditTransaction()

      const updated = await loadData()

      if (updated) {
        showMessage(
          wasEditing
            ? 'Movimiento actualizado correctamente'
            : 'Movimiento registrado correctamente'
        )
      }
    } catch (err) {
      setError(err.message)
      setSuccess('')
    }
  }

  function startEditTransaction(item) {
    setEditingTransaction(item._id)

    setTransactionForm({
      type: item.type,
      amount: String(item.amount),
      category: item.category?._id || item.category || '',
      description: item.description || '',
      date: new Date(item.date).toISOString().slice(0, 10),
      paymentMethod: item.paymentMethod || 'No especificado',
    })

    setActiveTab('transactions')
    setError('')
    setSuccess('')
  }

  function cancelEditTransaction() {
    setEditingTransaction(null)
    setTransactionForm(emptyTransaction)
  }

  function handleDeleteTransaction(id) {
    setPendingDelete({
      type: 'transaction',
      id,
    })
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    const { type, id } = pendingDelete

    setError('')
    setSuccess('')

    try {
      if (type === 'category') {
        await request(`/api/categories/${id}`, {
          method: 'DELETE',
        })
      } else {
        await request(`/api/transactions/${id}`, {
          method: 'DELETE',
        })

        if (editingTransaction === id) {
          cancelEditTransaction()
        }
      }

      setPendingDelete(null)

      const updated = await loadData()

      if (updated) {
        showMessage(
          type === 'category'
            ? 'Categoría eliminada correctamente'
            : 'Movimiento eliminado correctamente'
        )
      }
    } catch (err) {
      setPendingDelete(null)
      setError(err.message || 'No fue posible eliminar el registro')
      setSuccess('')
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const monthName = new Intl.DateTimeFormat('es-DO', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">W</div>
          <div>
            <h1>WalletApp</h1>
          </div>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav className="navigation">
          <button
            className={activeTab === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-symbol">▦</span>
            Resumen
          </button>

          <button
            className={activeTab === 'transactions' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('transactions')}
          >
            <span className="nav-symbol">↔</span>
            Movimientos
          </button>

          <button
            className={activeTab === 'categories' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab('categories')}
          >
            <span className="nav-symbol">▤</span>
            Categorías
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection">
            <span className="connection-dot" />
            <div>
              <strong>API conectada</strong>
              <small>WalletApp funcionando</small>
            </div>
          </div>
          <span className="sidebar-version">Versión 1.0</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">WALLETAPP</p>
            <h2>
              {activeTab === 'dashboard' && 'Resumen financiero'}
              {activeTab === 'transactions' && 'Movimientos'}
              {activeTab === 'categories' && 'Mis categorías'}
            </h2>
          </div>

          <div className="topbar-date">
            <span className="date-icon">▦</span>
            <span>{monthName}</span>
          </div>
        </header>

        {error && (
          <div
            className="alert alert-danger wallet-alert d-flex align-items-center justify-content-between"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              className="btn-close ms-3"
              aria-label="Cerrar mensaje"
              onClick={() => setError('')}
            />
          </div>
        )}

        {success && (
          <div
            className="alert alert-success wallet-alert d-flex align-items-center justify-content-between"
            role="status"
          >
            <span>{success}</span>
            <button
              type="button"
              className="btn-close ms-3"
              aria-label="Cerrar mensaje"
              onClick={() => setSuccess('')}
            />
          </div>
        )}

        {loading ? (
          <div className="loading-state">Cargando tu información...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                <section className="welcome-section">
                  <div>
                    <p className="welcome-kicker">TU DINERO, BAJO CONTROL</p>
                    <h3>Organiza tus finanzas con claridad.</h3>
                    <p>
                      Consulta tus ingresos, controla tus gastos y conoce tu balance.
                    </p>
                  </div>
                  <div className="welcome-decoration">RD$</div>
                </section>

                <section className="summary-grid">
                  <article className="summary-card balance-card">
                    <div className="summary-top">
                      <span>Balance del mes</span>
                      <span className="summary-icon">＝</span>
                    </div>
                    <strong>{money.format(totals.balance)}</strong>
                    <small>Ingresos menos gastos</small>
                  </article>

                  <article className="summary-card">
                    <div className="summary-top">
                      <span>Ingresos</span>
                      <span className="summary-icon income-icon">↗</span>
                    </div>
                    <strong>{money.format(totals.income)}</strong>
                    <small>Dinero recibido este mes</small>
                  </article>

                  <article className="summary-card">
                    <div className="summary-top">
                      <span>Gastos</span>
                      <span className="summary-icon expense-icon">↘</span>
                    </div>
                    <strong>{money.format(totals.expense)}</strong>
                    <small>Dinero gastado este mes</small>
                  </article>
                </section>

                <section className="dashboard-grid">
                  <article className="panel recent-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Movimientos recientes</h3>
                        <p>Últimas operaciones registradas</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setActiveTab('transactions')}
                      >
                        Ver todos →
                      </button>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="empty-state">
                        <span className="empty-symbol">↔</span>
                        <strong>Aún no tienes movimientos</strong>
                        <p>Cuando registres un ingreso o gasto aparecerá aquí.</p>
                      </div>
                    ) : (
                      <div className="transaction-list">
                        {transactions.slice(0, 5).map((item) => (
                          <TransactionRow
                            key={item._id}
                            item={item}
                            formatDate={formatDate}
                            onDelete={handleDeleteTransaction}
                            onEdit={startEditTransaction}
                          />
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="panel category-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Tus categorías</h3>
                        <p>Organización de tus movimientos</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setActiveTab('categories')}
                      >
                        Administrar →
                      </button>
                    </div>

                    {categories.length === 0 ? (
                      <div className="empty-state">
                        <strong>No hay categorías todavía</strong>
                        <p>Crea categorías para organizar tu dinero.</p>
                      </div>
                    ) : (
                      <div className="category-list">
                        {categories.slice(0, 6).map((category) => (
                          <div className="category-row" key={category._id}>
                            <span
                              className="category-color"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                            <small>
                              {category.type === 'income' ? 'Ingreso' : 'Gasto'}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </section>
              </>
            )}

            {activeTab === 'transactions' && (
              <section className="content-grid">
                <article className="panel form-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>
                        {editingTransaction ? 'Editar movimiento' : 'Registrar movimiento'}
                      </h3>
                      <p>
                        {editingTransaction
                          ? 'Actualiza los datos del movimiento'
                          : 'Agrega un ingreso o un gasto'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveTransaction} className="form">
                    <label>Tipo de movimiento</label>
                    <div className="type-switch">
                      <button
                        type="button"
                        className={transactionForm.type === 'expense' ? 'type-option selected expense-selected' : 'type-option'}
                        onClick={() => changeTransactionType('expense')}
                      >
                        Gasto
                      </button>
                      <button
                        type="button"
                        className={transactionForm.type === 'income' ? 'type-option selected income-selected' : 'type-option'}
                        onClick={() => changeTransactionType('income')}
                      >
                        Ingreso
                      </button>
                    </div>

                    <label htmlFor="amount">Monto (RD$)</label>
                    <input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Ej. 1500"
                      value={transactionForm.amount}
                      onChange={(event) =>
                        setTransactionForm({ ...transactionForm, amount: event.target.value })
                      }
                      required
                    />

                    <label htmlFor="transaction-category">Categoría</label>
                    <select
                      id="transaction-category"
                      value={transactionForm.category}
                      onChange={(event) =>
                        setTransactionForm({ ...transactionForm, category: event.target.value })
                      }
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {availableCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    {availableCategories.length === 0 && (
                      <p className="field-hint">
                        Primero debes crear una categoría para este tipo de movimiento.
                      </p>
                    )}

                    <label htmlFor="description">Nombre o descripción</label>
                    <input
                      id="description"
                      type="text"
                      maxLength="150"
                      placeholder="Ej. Compra del supermercado"
                      value={transactionForm.description}
                      onChange={(event) =>
                        setTransactionForm({ ...transactionForm, description: event.target.value })
                      }
                      required
                    />

                    <label htmlFor="date">Fecha</label>
                    <input
                      id="date"
                      type="date"
                      value={transactionForm.date}
                      onChange={(event) =>
                        setTransactionForm({ ...transactionForm, date: event.target.value })
                      }
                      required
                    />

                    <label htmlFor="payment">Método de pago</label>
                    <select
                      id="payment"
                      value={transactionForm.paymentMethod}
                      onChange={(event) =>
                        setTransactionForm({ ...transactionForm, paymentMethod: event.target.value })
                      }
                    >
                      <option>Efectivo</option>
                      <option>Tarjeta de débito</option>
                      <option>Tarjeta de crédito</option>
                      <option>Transferencia</option>
                      <option>Otro</option>
                      <option>No especificado</option>
                    </select>

                    <button
                      className="primary-button"
                      type="submit"
                      disabled={availableCategories.length === 0}
                    >
                      {editingTransaction ? 'Guardar cambios' : 'Guardar movimiento'}
                    </button>

                    {editingTransaction && (
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={cancelEditTransaction}
                      >
                        Cancelar edición
                      </button>
                    )}
                  </form>
                </article>

                <article className="panel history-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Historial de movimientos</h3>
                      <p>{transactions.length} movimientos registrados</p>
                    </div>
                  </div>

                  <div className="filter-bar">
                    <button
                      className={filter === 'all' ? 'filter-button active-filter' : 'filter-button'}
                      onClick={() => setFilter('all')}
                    >
                      Todos
                    </button>
                    <button
                      className={filter === 'income' ? 'filter-button active-filter' : 'filter-button'}
                      onClick={() => setFilter('income')}
                    >
                      Ingresos
                    </button>
                    <button
                      className={filter === 'expense' ? 'filter-button active-filter' : 'filter-button'}
                      onClick={() => setFilter('expense')}
                    >
                      Gastos
                    </button>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                      <strong>No hay movimientos para mostrar</strong>
                      <p>Registra un movimiento para comenzar tu historial.</p>
                    </div>
                  ) : (
                    <div className="transaction-list">
                      {filteredTransactions.map((item) => (
                        <TransactionRow
                          key={item._id}
                          item={item}
                          formatDate={formatDate}
                          onDelete={handleDeleteTransaction}
                          onEdit={startEditTransaction}
                        />
                      ))}
                    </div>
                  )}
                </article>
              </section>
            )}

            {activeTab === 'categories' && (
              <section className="content-grid categories-grid">
                <article className="panel form-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Nueva categoría</h3>
                      <p>Crea una categoría personalizada</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateCategory} className="form">
                    <label htmlFor="category-name">Nombre</label>
                    <input
                      id="category-name"
                      type="text"
                      placeholder="Ej. Transporte"
                      maxLength="60"
                      value={categoryForm.name}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, name: event.target.value })
                      }
                      required
                    />

                    <label htmlFor="category-type">Tipo</label>
                    <select
                      id="category-type"
                      value={categoryForm.type}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, type: event.target.value })
                      }
                    >
                      <option value="expense">Gasto</option>
                      <option value="income">Ingreso</option>
                    </select>

                    <label htmlFor="category-color">Color identificador</label>
                    <input
                      id="category-color"
                      className="color-input"
                      type="color"
                      value={categoryForm.color}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, color: event.target.value })
                      }
                    />

                    <button className="primary-button" type="submit">
                      Crear categoría
                    </button>
                  </form>
                </article>

                <article className="panel category-management">
                  <div className="panel-heading">
                    <div>
                      <h3>Categorías registradas</h3>
                      <p>{categories.length} categorías disponibles</p>
                    </div>
                  </div>

                  {categories.length === 0 ? (
                    <div className="empty-state">
                      <strong>Aún no hay categorías</strong>
                      <p>Crea tu primera categoría para comenzar.</p>
                    </div>
                  ) : (
                    <div className="category-list large-category-list">
                      {categories.map((category) => (
                        <div className="category-row category-management-row" key={category._id}>
                          <span
                            className="category-color"
                            style={{ backgroundColor: category.color }}
                          />

                          {editingCategory?._id === category._id ? (
                            <form
                              className="category-edit-form"
                              onSubmit={handleUpdateCategory}
                            >
                              <input
                                aria-label="Nombre de categoría"
                                value={editingCategory.name}
                                maxLength="60"
                                onChange={(event) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    name: event.target.value,
                                  })
                                }
                                required
                              />

                              <select
                                aria-label="Tipo de categoría"
                                value={editingCategory.type}
                                onChange={(event) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    type: event.target.value,
                                  })
                                }
                              >
                                <option value="expense">Gasto</option>
                                <option value="income">Ingreso</option>
                              </select>

                              <input
                                aria-label="Color de categoría"
                                type="color"
                                value={editingCategory.color}
                                onChange={(event) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    color: event.target.value,
                                  })
                                }
                              />

                              <button className="small-action" type="submit">
                                Guardar
                              </button>

                              <button
                                className="small-action"
                                type="button"
                                onClick={() => setEditingCategory(null)}
                              >
                                Cancelar
                              </button>
                            </form>
                          ) : (
                            <>
                              <div className="category-details">
                                <strong>{category.name}</strong>
                                <small>
                                  {category.type === 'income' ? 'Ingreso' : 'Gasto'}
                                </small>
                              </div>

                              <div className="row-actions">
                                <button
                                  className="small-action"
                                  type="button"
                                  onClick={() => startEditCategory(category)}
                                >
                                  Editar
                                </button>

                                <button
                                  className="delete-button"
                                  type="button"
                                  onClick={() => handleDeleteCategory(category)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              </section>
            )}
          </>
        )}
      </section>

      {pendingDelete && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setPendingDelete(null)}
        >
          <section
            className="wallet-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="wallet-modal-close"
              aria-label="Cerrar"
              onClick={() => setPendingDelete(null)}
            >
              ×
            </button>

            <div className="wallet-delete-icon" aria-hidden="true">
              <span>⌫</span>
            </div>

            <h3 id="delete-modal-title">¿Eliminar este registro?</h3>

            <p className="wallet-delete-description">
              {pendingDelete.type === 'category'
                ? `Estás a punto de eliminar la categoría "${pendingDelete.name}".`
                : 'Estás a punto de eliminar este movimiento.'}
            </p>

            <p className="wallet-delete-warning">
              Esta acción no se podrá deshacer.
            </p>

            <div className="wallet-delete-actions">
              <button
                type="button"
                className="wallet-cancel-button"
                onClick={() => setPendingDelete(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="wallet-confirm-button"
                onClick={confirmDelete}
              >
                Sí, eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function TransactionRow({ item, formatDate, onDelete, onEdit }) {
  const isIncome = item.type === 'income'

  return (
    <div className="transaction-row">
      <div className={isIncome ? 'transaction-symbol income-symbol' : 'transaction-symbol expense-symbol'}>
        {isIncome ? '↗' : '↘'}
      </div>

      <div className="transaction-description">
        <strong>{item.description}</strong>
        <small>
          {item.category?.name || 'Sin categoría'} · {formatDate(item.date)}
        </small>
      </div>

      <div className="transaction-amount">
        <strong className={isIncome ? 'income-text' : 'expense-text'}>
          {isIncome ? '+' : '-'}{money.format(Number(item.amount))}
        </strong>

        <div className="row-actions">
          <button
            className="small-action"
            type="button"
            onClick={() => onEdit(item)}
            title="Editar movimiento"
          >
            Editar
          </button>

          <button
            className="delete-button"
            type="button"
            onClick={() => onDelete(item._id)}
            title="Eliminar movimiento"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
