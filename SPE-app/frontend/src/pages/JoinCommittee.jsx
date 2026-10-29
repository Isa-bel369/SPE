import { useState } from 'react'
import { COMMITTEES } from '../data/seed'
import { updateStore } from '../lib/storage'

export default function JoinCommittee() {
  const [sent, setSent] = useState(false)

  function onSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    updateStore((store) => {
      store.applications = [
        {
          id: `app-${Date.now()}`,
          name: form.get('name'),
          email: form.get('email'),
          committee: form.get('committee'),
          note: form.get('note'),
          date: new Date().toISOString().slice(0, 10),
        },
        ...store.applications,
      ]
      return store
    })
    setSent(true)
    event.target.reset()
  }

  return (
    <section className="section">
      <h2>Join a committee</h2>
      <p>Committees keep the chapter running. Choose a function that matches how you want to serve.</p>
      <div className="grid cards">
        {COMMITTEES.map((committee) => (
          <article className="card" key={committee.id}>
            <h3>{committee.name}</h3>
            <p>{committee.blurb}</p>
          </article>
        ))}
      </div>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: 24 }}>
        <input name="name" placeholder="Full name" required />
        <input name="email" type="email" placeholder="Email" required />
        <select name="committee" required defaultValue="">
          <option value="" disabled>
            Select a committee
          </option>
          {COMMITTEES.map((committee) => (
            <option key={committee.id} value={committee.id}>
              {committee.name}
            </option>
          ))}
        </select>
        <textarea name="note" rows="4" placeholder="Why this committee?" required />
        <button className="btn" type="submit">
          Submit interest
        </button>
      </form>
      {sent && <p className="alert">Application stored locally for executives to review in Admin.</p>}
    </section>
  )
}
