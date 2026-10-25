export default function About() {
  return (
    <>
      <div className="hero-block">
        <h1>WE ARE SPE UMAT</h1>
        <div className="dual-logos">
          <div>
            <img src="/spe-logo.svg" alt="SPE" />
            <div className="logo-caption">Society of Petroleum Engineers</div>
            <div className="logo-caption">UMaT STUDENT CHAPTER</div>
          </div>
          <img src="/umat-crest.svg" alt="UMaT" />
        </div>
        <img
          className="hero-photo"
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80"
          alt="SPE UMaT chapter members"
        />
      </div>

      <section className="section">
        <h2>Mission</h2>
        <p>
          To collect, disseminate, and exchange technical knowledge concerning the exploration, development,
          and production of oil and gas resources, and related technologies, for the public benefit; and to
          provide opportunities for professionals to enhance their technical and professional competence.
        </p>
      </section>

      <section className="section">
        <h2>Vision</h2>
        <p>
          To be a society of professional excellence, providing its members the highest quality lifelong
          learning, and continuous personal and professional growth.
        </p>
      </section>

      <section className="section">
        <h2>The SPE UMaT Chapter</h2>
        <p>
          SPE UMaT is the student chapter of SPE at the University of Mines and Technology, Tarkwa. The chapter
          hosts technical talks, software workshops, field exposure, outreach, and a merit programme that
          recognises consistent contribution. Executives in Communications, Organization, and Technical
          functions maintain the website, events, and member records.
        </p>
      </section>

      <section className="section">
        <h2>Benefits of membership</h2>
        <ul>
          <li>Access to SPE technical resources, webinars, and student programmes.</li>
          <li>Priority notice and discounted or structured fees for chapter events.</li>
          <li>A unique member code and QR card used for attendance and merit tracking.</li>
          <li>Leadership pathways through committee service.</li>
          <li>A public-facing portfolio of participation on the member dashboard.</li>
        </ul>
      </section>
    </>
  )
}
