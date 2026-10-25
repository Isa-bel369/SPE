import { Link } from 'react-router-dom'

export default function Membership() {
  return (
    <section className="section">
      <h2>Membership</h2>
      <p>
        SPE UMaT membership is open to UMaT students in petroleum, natural gas, and allied programmes, as well
        as students who want to build energy-industry skills. Join SPE International where required, then
        complete chapter dues so your attendance code can be activated.
      </p>
      <div className="grid cards">
        <article className="card">
          <h3>1. Create your profile</h3>
          <p>Use member login after an executive adds you, or contact Communications with your student ID.</p>
        </article>
        <article className="card">
          <h3>2. Pay chapter dues</h3>
          <p>
            Annual dues are processed through Paystack.
            <br />
            <Link to="/dues">Go to transactions</Link>
          </p>
        </article>
        <article className="card">
          <h3>3. Collect your code</h3>
          <p>Your dashboard shows a unique numerical code and QR used at every chapter activity.</p>
        </article>
      </div>
    </section>
  )
}
