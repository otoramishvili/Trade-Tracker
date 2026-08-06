import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Check, LineChart, ShieldCheck, Sparkles } from "lucide-react";

export default function LandingPage() {
  return <main className="landing">
    <nav className="landing-nav shell"><Link href="/" className="brand"><span>EL</span> EdgeLog</Link><div><Link href="/login" className="nav-link">Log in</Link><Link href="/register" className="button small">Start journaling</Link></div></nav>
    <section className="hero shell">
      <div className="eyebrow"><Sparkles size={14}/> Built for deliberate traders</div>
      <h1>Trade with a plan.<br/><em>Improve with evidence.</em></h1>
      <p>One focused place to log every decision, uncover your patterns, and turn trading data into a repeatable edge.</p>
      <div className="hero-actions"><Link href="/register" className="button">Create your journal <ArrowRight size={17}/></Link><Link href="/dashboard" className="button ghost">View demo</Link></div>
      <div className="hero-proof"><span><Check size={15}/> Free to start</span><span><Check size={15}/> No credit card</span><span><Check size={15}/> Your data, private</span></div>
      <div className="dashboard-preview">
        <div className="preview-top"><div><small>MONTHLY PERFORMANCE</small><strong>+$4,825.40</strong><span>↑ 12.8% from last month</span></div><div className="preview-pills"><i/><i/><i/></div></div>
        <div className="chart-bars">{[30,52,38,66,48,72,61,88,74,94,82,100].map((h,i)=><b key={i} style={{height:`${h}%`}}/>)}</div>
      </div>
    </section>
    <section className="features shell" id="features"><div className="section-heading"><small>EVERYTHING YOU NEED</small><h2>Clarity after every trade</h2><p>No noise. Just the tools that help you understand what works.</p></div><div className="feature-grid">
      <article><BarChart3/><h3>Performance analytics</h3><p>See win rate, profit factor, average RR and P/L trends at a glance.</p></article>
      <article><CalendarDays/><h3>Calendar review</h3><p>Spot green streaks, red days, and the habits behind your results.</p></article>
      <article><ShieldCheck/><h3>Focused account tracking</h3><p>Keep one trading account and its complete performance history organized.</p></article>
    </div></section>
    <section className="why shell"><div><small>A BETTER REVIEW LOOP</small><h2>Your edge is already in your trades.</h2><p>EdgeLog turns scattered executions into a clear feedback loop. Capture context while it is fresh, review without bias, and carry the lesson into the next session.</p><ul><li><Check/>Document decisions, not just outcomes</li><li><Check/>Find patterns across sessions and symbols</li><li><Check/>Build consistency through honest review</li></ul></div><div className="quote-card"><LineChart/><blockquote>“What gets measured gets improved.”</blockquote><p>Make every trade part of the process.</p></div></section>
    <section className="cta shell"><small>YOUR NEXT TRADE STARTS HERE</small><h2>Build the discipline your strategy deserves.</h2><Link href="/register" className="button">Create your free account <ArrowRight size={17}/></Link></section>
    <footer className="shell"><Link href="/" className="brand"><span>EL</span> EdgeLog</Link><p>© 2026 EdgeLog. Built for better decisions.</p></footer>
  </main>
}
