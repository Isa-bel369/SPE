import { useMemo, useState } from 'react'
import { getSession } from '../lib/auth'
import { startPaystackPayment } from '../lib/paystack'
import { loadStore, updateStore } from '../lib/storage'

const ITEMS = [
  { id: 'dues', label: 'Annual membership dues', amountGhs: 50 },
  { id: 'workshop', label: 'Workshop / training fee', amountGhs: 20 },
  { id: 'field', label: 'Field trip contribution', amountGhs: 30 },
]

export default function Dues() {
  const session = getSession()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const payments = useMemo(() => {
    const store = loadStore()
    return session ? store.payments.filter((row) => row.memberId === session.memberId) : store.payments
  }, [session, message])

  async function pay(item) {
    setBusy(true)
    setMessage('')
    try {
      await startPaystackPayment({
        email: session?.email || 'guest@speumat.edu.gh',
        amountGhs: item.amountGhs,
        label: item.label,
        onSuccess: ({ reference, mock, message: demoNote }) => {
          updateStore((store) => {
            store.payments = [
              {
                id: `pay-${Date.now()}`,
                memberId: session?.memberId || 'guest',
                item: item.label,
                amountGhs: item.amountGhs,
                status: 'success',
                date: new Date().toISOString().slice(0, 10),
                reference,
                mock: Boolean(mock),
              },
              ...store.payments,
            ]
            return store
          })
          setMessage(demoNote || `Payment successful. Reference ${reference}`)
        },
      })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <h2>Transactions and dues</h2>
      <p>
        Chapter dues and activity fees are collected through Paystack. If no public key is configured, the site
        records a clearly labelled demo payment so executives can still test the flow.
      </p>
      {!session && <p className="muted">You can pay as a guest; signed-in members keep a payment history.</p>}
      <div className="grid cards">
        {ITEMS.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.label}</h3>
            <p>GHS {item.amountGhs}.00</p>
            <button className="btn" disabled={busy} onClick={() => pay(item)}>
              Pay with Paystack
            </button>
          </article>
        ))}
      </div>
      {message && <p className="alert">{message}</p>}
      <h3>Recent payments</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Amount</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((row) => (
            <tr key={row.id}>
              <td>{row.date}</td>
              <td>{row.item}</td>
              <td>GHS {row.amountGhs}</td>
              <td>
                {row.reference}
                {row.mock ? ' (demo)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
