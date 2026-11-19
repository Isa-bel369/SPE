import { useRef, useState } from 'react'

export function useConfirmDialog() {
  const [options, setOptions] = useState(null)
  const resolveRef = useRef(null)

  function confirm({ title = 'Are you sure?', message, confirmLabel = 'Continue', danger = false }) {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setOptions({ title, message, confirmLabel, danger })
    })
  }

  function close(result) {
    resolveRef.current?.(result)
    resolveRef.current = null
    setOptions(null)
  }

  const dialog = options && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(false) }}>
    <section className="card admin-modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <h2 id="confirm-title">{options.title}</h2>
      <p id="confirm-message">{options.message}</p>
      <div className="confirm-actions">
        <button className={`btn ${options.danger ? 'danger' : ''}`} autoFocus onClick={() => close(true)}>{options.confirmLabel}</button>
        <button className="btn secondary" onClick={() => close(false)}>Cancel</button>
      </div>
    </section>
  </div>

  return { confirm, dialog }
}
