import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RegistrationPayment() {
  const [details, setDetails] = useState({})
  useEffect(() => { supabase.from('site_content').select('key,body').in('key', ['registration_fee_amount','registration_momo_number','registration_momo_name']).then(({ data }) => setDetails(Object.fromEntries((data || []).map((row) => [row.key,row.body])))) }, [])
  const configured = details.registration_fee_amount && details.registration_momo_number && details.registration_momo_name
  return <section className="section"><h1>Pay the registration fee</h1><p>Send the fee by Mobile Money using these details:</p><dl><dt>Amount</dt><dd>GHS {details.registration_fee_amount || 'Not configured'}</dd><dt>Mobile Money number</dt><dd>{details.registration_momo_number || 'Not configured'}</dd><dt>Recipient name</dt><dd>{details.registration_momo_name || 'Not configured'}</dd></dl><p>Keep a screenshot of the successful transaction. You will upload it with your application.</p>{configured ? <Link className="btn" to="/register/form">I have sent the payment</Link> : <p className="alert">Registration payment details are not available yet. Please contact the chapter.</p>}</section>
}
