import Link from "next/link";

export default function Home() {
  return <main className="marketing">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><i />Built for deliberate traders</div>
        <h1>Your trades.<br /><em>Finally organized.</em></h1>
        <p>Record every trade in a structured journal, review your decisions, and build a clearer picture of your performance.</p>
        <div className="actions"><Link className="button" href="/register">Start your journal <span>→</span></Link><Link className="text-link" href="/#how">See how it works</Link></div>
        <div className="trust-row"><span>Structured records</span><span>Private workspace</span><span>No trading advice</span></div>
      </div>
      <div className="hero-product">
        <div className="product-window">
          <div className="window-top"><i /><i /><i /><span>Trade journal · New entry</span></div>
          <div className="mock-prompt"><small>TRADE SUMMARY</small><p>Record the market, direction, session, result, timing, setup, and lessons from each trade.</p><span className="mock-action">Ready to save</span></div>
          <div className="mock-result"><div><small>SYMBOL</small><b>EURUSD</b></div><div><small>POSITION</small><b className="up">↗ LONG</b></div><div><small>SESSION</small><b>LONDON</b></div><div><small>RESULT</small><b className="up">+2.0R</b></div></div>
        </div>
        <div className="float-card"><span>Your record</span><b>Every decision in context</b></div>
      </div>
    </section>
    <section className="section process" id="how">
      <div className="section-title"><div><p className="eyebrow"><i />The workflow</p><h2>From execution to insight<br />in three clean steps.</h2></div><p>A focused process for capturing what happened and learning from every trading session.</p></div>
      <div className="steps">{[["01", "Record", "Add the trade details, result, timing, setup, and context while they are fresh."], ["02", "Review", "Keep each entry consistent so patterns are easier to recognize over time."], ["03", "Improve", "Use your history, calendar, and performance overview to guide your review process."]].map(([number, title, description]) => <article className="step-card" key={number}><span>{number}</span><div className="step-icon">{number === "01" ? "⌁" : number === "02" ? "◎" : "✓"}</div><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>
    <section className="section closing"><p className="eyebrow"><i />Clarity compounds</p><h2>A useful trading history starts with one honest entry.</h2><Link className="button" href="/register">Create your journal <span>→</span></Link></section>
    <footer className="disclaimer">Journal Trade is a record-keeping tool. It does not provide financial advice, investment recommendations, signals, or trade execution.</footer>
  </main>;
}
