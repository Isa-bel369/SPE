export function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop)
      return
    }
    const existing = document.querySelector('script[data-paystack]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop))
      existing.addEventListener('error', () => reject(new Error('Paystack failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.dataset.paystack = 'true'
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Paystack failed to load'))
    document.body.appendChild(script)
  })
}

export async function startPaystackPayment({ email, amountGhs, label, onSuccess }) {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  const reference = `SPE-UMAT-${Date.now()}`
  const amountKobo = Math.round(Number(amountGhs) * 100)

  if (!publicKey) {
    onSuccess({
      reference,
      mock: true,
      message: 'Demo payment recorded. Add VITE_PAYSTACK_PUBLIC_KEY to charge via Paystack.',
    })
    return { mock: true, reference }
  }

  const PaystackPop = await loadPaystack()
  return new Promise((resolve, reject) => {
    const handler = PaystackPop.setup({
      key: publicKey,
      email,
      amount: amountKobo,
      currency: 'GHS',
      ref: reference,
      metadata: { custom_fields: [{ display_name: 'Item', variable_name: 'item', value: label }] },
      callback: (response) => {
        onSuccess({ reference: response.reference, mock: false })
        resolve(response)
      },
      onClose: () => reject(new Error('Payment closed')),
    })
    handler.openIframe()
  })
}
