import { FormEvent, useMemo, useState } from "react";
import { states } from "./data";
import { beginCheckout, getSubscription, isDemoMode, signIn, signOut, signUp } from "./services";
import type { BirdRule, HarvestEntry, HuntRecord } from "./types";

type View = "welcome" | "login" | "signup" | "dashboard" | "hunt" | "summary" | "history" | "account";

const demoHistory: HuntRecord[] = [
  {
    id: "sample-1",
    date: "January 10, 2026",
    state: "Maryland",
    zone: "Eastern Duck Zone",
    entries: [
      { id: "mallard-drake", label: "Mallard — Drake", group: "Ducks", limit: 4, count: 2 },
      { id: "black-duck", label: "American Black Duck", group: "Ducks", limit: 2, count: 1 },
      { id: "canada-goose", label: "Canada Goose", group: "Geese", limit: 2, count: 2 },
    ],
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="BlindIQ">
      <img src="/blindiq-logo.png" alt={compact ? "" : "BlindIQ — Hunt With Confidence"} />
      {compact && <strong>BLIND<span>IQ</span></strong>}
    </div>
  );
}

function Icon({ children }: { children: string }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Shell({ view, setView, children, userName, isPremium }: { view: View; setView: (v: View) => void; children: React.ReactNode; userName: string; isPremium: boolean }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setView(isPremium ? "dashboard" : "account")}><Brand compact /></button>
        <button className="avatar" onClick={() => setView("account")} aria-label="Account">{userName.slice(0, 1).toUpperCase()}</button>
      </header>
      <main>{children}</main>
      {view !== "hunt" && view !== "summary" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {isPremium && <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Icon>⌂</Icon>Home</button>}
          {isPremium && <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><Icon>≡</Icon>My Hunts</button>}
          <button className={view === "account" ? "active" : ""} onClick={() => setView("account")}><Icon>○</Icon>Account</button>
        </nav>
      )}
    </div>
  );
}

function AuthScreen({ mode, onSubmit, onSwitch, onBack }: { mode: "login" | "signup"; onSubmit: (username: string, email: string, password: string, mode: "login" | "signup") => Promise<string | void>; onSwitch: () => void; onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(isDemoMode && mode === "login" ? "hunter" : "");
  const [password, setPassword] = useState(isDemoMode && mode === "login" ? "confidence" : "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const message = await onSubmit(username, email, password, mode);
      if (message) setSuccess(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page">
      <button className="back-link" onClick={onBack}>← Back</button>
      <div className="auth-card">
        <Brand />
        <div className="auth-copy">
          <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN BLINDIQ"}</p>
          <h1>{mode === "login" ? "Headed to the blind?" : "Create your account"}</h1>
          <p>{mode === "login" ? "Sign in to pick up where you left off." : isDemoMode ? "Create a temporary demo account." : "Choose your BlindIQ username and secure your account with email and password."}</p>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && <label>Display username<input required autoComplete="nickname" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Example: ChesapeakeHunter" /></label>}
          <label>{isDemoMode && mode === "login" ? "Username" : "Email address"}<input required type={isDemoMode && mode === "login" ? "text" : "email"} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input required autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <div className="auth-success" role="status">{success}</div>}
          <button className="button button--gold button--wide" disabled={loading} type="submit">{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <p className="auth-switch">{mode === "login" ? "New to BlindIQ?" : "Already have an account?"} <button onClick={onSwitch}>{mode === "login" ? "Create account" : "Log in"}</button></p>
        {isDemoMode && <div className="demo-note">{mode === "login" ? <>Demo login: <strong>hunter</strong> / <strong>confidence</strong></> : "Demo mode — your new account opens immediately but is not saved yet."}</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("welcome");
  const [userName, setUserName] = useState("Hunter");
  const [stateCode, setStateCode] = useState("MD");
  const [zone, setZone] = useState(states[0].zones[0]);
  const [harvest, setHarvest] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HuntRecord[]>(demoHistory);
  const [toast, setToast] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountUserId, setAccountUserId] = useState("");
  const [isPremium, setIsPremium] = useState(isDemoMode);
  const [subscriptionStatus, setSubscriptionStatus] = useState(isDemoMode ? "active" : "inactive");
  const selected = states.find((state) => state.code === stateCode) ?? states[0];
  const duckCount = selected.birds.filter((bird) => bird.group === "Ducks").reduce((sum, bird) => sum + (harvest[bird.id] ?? 0), 0);
  const gooseCount = selected.birds.filter((bird) => bird.group === "Geese").reduce((sum, bird) => sum + (harvest[bird.id] ?? 0), 0);

  const mallardCount = (harvest["mallard-drake"] ?? 0) + (harvest["mallard-hen"] ?? 0);
  const remaining = (bird: BirdRule) => {
    if (bird.group === "Ducks" && duckCount >= 6) return 0;
    if (bird.parent === "mallard") return Math.max(0, Math.min(bird.limit - (harvest[bird.id] ?? 0), 4 - mallardCount, 6 - duckCount));
    return Math.max(0, Math.min(bird.limit - (harvest[bird.id] ?? 0), bird.group === "Ducks" ? 6 - duckCount : bird.limit));
  };
  const availableBirds = useMemo(() => selected.birds.filter((bird) => remaining(bird) > 0), [selected, harvest]);

  function selectState(code: string) {
    const next = states.find((state) => state.code === code)!;
    setStateCode(code);
    setZone(next.zones[0]);
    setHarvest({});
  }

  async function authenticate(username: string, email: string, password: string, mode: "login" | "signup") {
    if (mode === "login") {
      const user = await signIn(email, password);
      setUserName(user.name);
      setAccountEmail(user.email);
      setAccountUserId(user.id);
      const membership = await getSubscription();
      setIsPremium(membership.isPremium);
      setSubscriptionStatus(membership.status);
      if (membership.isPremium) {
        setView("dashboard");
      } else {
        const checkoutResult = beginCheckout(user.id, user.email);
        if (checkoutResult === "demo") {
          setToast("Stripe checkout is not configured.");
          setView("account");
        }
      }
      return;
    }

    const user = await signUp(username, email, password);
    setUserName(user.name);
    setAccountEmail(user.email);
    setAccountUserId(user.id);
    if (user.confirmationRequired) {
      return "Account created. Check your email and select the confirmation link before logging in.";
    }
    const checkoutResult = beginCheckout(user.id, user.email);
    if (checkoutResult === "demo") {
      setToast("Stripe checkout is not configured.");
      setView("account");
    }
  }

  function addBird(bird: BirdRule) {
    if (remaining(bird) <= 0) return;
    setHarvest((current) => ({ ...current, [bird.id]: (current[bird.id] ?? 0) + 1 }));
    setToast(`${bird.label} added`);
    window.setTimeout(() => setToast(""), 1500);
  }

  function removeBird(id: string) {
    setHarvest((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) - 1) }));
  }

  const entries: HarvestEntry[] = selected.birds.filter((bird) => harvest[bird.id]).map((bird) => ({ ...bird, count: harvest[bird.id] }));

  function saveHunt() {
    if (entries.length) {
      setHistory((current) => [{ id: crypto.randomUUID(), date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), state: selected.name, zone, entries }, ...current]);
    }
    setHarvest({});
    setView("history");
  }

  if (view === "welcome") {
    return (
      <div className="welcome">
        <div className="welcome-photo" />
        <div className="welcome-overlay" />
        <div className="welcome-content">
          <Brand />
          <div className="welcome-copy">
            <p className="eyebrow">YOUR WATERFOWL HUNTING COMPANION</p>
            <h1>Clear rules.<br />Confident hunts.</h1>
            <p>Understand the season, track your harvest, and know what’s legal next—all in one place.</p>
          </div>
          <div className="welcome-actions">
            <button className="button button--gold button--wide" onClick={() => setView("signup")}>Get started</button>
            <button className="button button--ghost button--wide" onClick={() => setView("login")}>I already have an account</button>
          </div>
          <small>Demo regulation data is for product testing only.</small>
        </div>
      </div>
    );
  }

  if (view === "login" || view === "signup") {
    return <AuthScreen mode={view} onSubmit={authenticate} onSwitch={() => setView(view === "login" ? "signup" : "login")} onBack={() => setView("welcome")} />;
  }

  return (
    <Shell view={view} setView={setView} userName={userName} isPremium={isPremium}>
      {view === "dashboard" && (
        <div className="page dashboard">
          <div className="greeting"><p>Good morning, {userName}</p><h1>Where are you hunting?</h1></div>
          <section className="state-picker">
            <label htmlFor="state">HUNTING STATE</label>
            <select id="state" value={stateCode} onChange={(e) => selectState(e.target.value)}>
              {states.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </select>
          </section>

          <section className="status-banner status-banner--closed">
            <div className="status-icon">×</div>
            <div><span>WATERFOWL SEASON</span><strong>CLOSED TODAY</strong><p>You’re in {selected.name}. Here are the currently loaded dates.</p></div>
          </section>

          <button className="button button--gold button--start" onClick={() => { if (isPremium) setView("hunt"); else { setToast("An active BlindIQ membership is required to start a hunt."); setView("account"); } }}><span>{isPremium ? "START HUNT" : "UNLOCK START HUNT"}</span><small>{isPremium ? "Open hunt mode →" : "$14.99/year →"}</small></button>

          <section className="section">
            <div className="section-heading"><div><p className="eyebrow">SEASON OVERVIEW</p><h2>{selected.name} waterfowl</h2></div><span className="verified">Demo data</span></div>
            <p className="muted">{selected.overview}</p>
            <div className="season-list">
              {selected.seasons.map((season) => (
                <article className="season-row" key={`${season.name}-${season.zone}`}>
                  <div><strong>{season.name}</strong><span>{season.zone}</span></div>
                  <p>{season.dates}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="info-grid">
            <article className="info-card"><Icon>⌖</Icon><span>Zones</span><strong>{selected.zones.length} loaded</strong><p>{selected.zones.join(" • ")}</p></article>
            <article className="info-card"><Icon>◷</Icon><span>Shooting hours</span><strong>Check daily</strong><p>{selected.shootingHours}</p></article>
            <article className="info-card"><Icon>▤</Icon><span>Daily duck bag</span><strong>6 ducks</strong><p>Species and sex restrictions apply.</p></article>
            <article className="info-card"><Icon>↗</Icon><span>Official source</span><strong>Verify before hunting</strong><a href={selected.officialUrl} target="_blank" rel="noreferrer">Open agency regulations</a></article>
          </section>

          <section className="species-section section">
            <div className="section-heading"><div><p className="eyebrow">LOADED BAG RULES</p><h2>Ducks & geese</h2></div></div>
            <div className="chip-list">{selected.birds.map((bird) => <span key={bird.id}>{bird.label} <b>{bird.limit}</b></span>)}</div>
          </section>

          <aside className="disclaimer"><Icon>!</Icon><p><strong>Hunting companion—not legal advice.</strong> BlindIQ simplifies regulations and tracks harvests. Hunters remain responsible for following all federal, state, and local laws. Always verify current rules with the official wildlife agency before hunting.</p></aside>
        </div>
      )}

      {view === "hunt" && (
        <div className="hunt-page">
          {toast && <div className="toast">✓ {toast}</div>}
          <header className="hunt-header">
            <button onClick={() => setView("dashboard")}>←</button>
            <div><span>ACTIVE DEMO HUNT</span><strong>{selected.name}</strong></div>
            <button className="end-button" onClick={() => setView("summary")}>Finish</button>
          </header>
          <div className="hunt-content">
            <section className="hunt-location">
              <label>HUNTING ZONE</label>
              <select value={zone} onChange={(e) => setZone(e.target.value)}>{selected.zones.map((item) => <option key={item}>{item}</option>)}</select>
              <p><span className="pulse" /> Demo session active</p>
            </section>
            <section className="bag-meter">
              <div><span>DUCK BAG</span><strong>{duckCount}<small>/6</small></strong></div>
              <div className="meter"><i style={{ width: `${Math.min(100, duckCount / 6 * 100)}%` }} /></div>
              <p>{duckCount >= 6 ? "Daily duck bag filled. Stop harvesting ducks." : `${6 - duckCount} duck${6 - duckCount === 1 ? "" : "s"} remain in the aggregate bag.`}</p>
            </section>
            <section className="harvest-panel">
              <div className="section-heading"><div><p className="eyebrow">LOG A BIRD</p><h2>What did you harvest?</h2></div><span>{duckCount + gooseCount} logged</span></div>
              <div className="bird-list">
                {selected.birds.map((bird) => (
                  <article className={remaining(bird) === 0 ? "bird-row bird-row--full" : "bird-row"} key={bird.id}>
                    <div className="bird-avatar">{bird.group === "Geese" ? "G" : bird.group === "Other" ? "C" : "D"}</div>
                    <div className="bird-name"><strong>{bird.label}</strong><span>{bird.group} • {remaining(bird)} remaining</span></div>
                    {(harvest[bird.id] ?? 0) > 0 && <button className="minus" onClick={() => removeBird(bird.id)} aria-label={`Remove ${bird.label}`}>−</button>}
                    <b className="count">{harvest[bird.id] ?? 0}</b>
                    <button className="plus" disabled={remaining(bird) === 0} onClick={() => addBird(bird)} aria-label={`Add ${bird.label}`}>+</button>
                  </article>
                ))}
              </div>
            </section>
            <section className="legal-next">
              <p className="eyebrow">LIVE GUIDANCE</p>
              <h2>You may still harvest</h2>
              <div className="legal-grid">
                {availableBirds.slice(0, 8).map((bird) => <div key={bird.id}><span>✓</span><p><strong>{bird.label}</strong><small>{remaining(bird)} remaining</small></p></div>)}
                {availableBirds.length === 0 && <p className="bag-full">Daily limits reached for all loaded species.</p>}
              </div>
              <small className="guidance-note">Based on loaded demo rules and this hunt log. Always verify official regulations.</small>
            </section>
          </div>
          <button className="finish-bar" onClick={() => setView("summary")}>Review & finish hunt <span>→</span></button>
        </div>
      )}

      {view === "summary" && (
        <div className="page summary-page">
          <button className="back-link" onClick={() => setView("hunt")}>← Back to hunt</button>
          <div className="summary-hero"><span>HUNT COMPLETE</span><h1>Good hunt.</h1><p>{selected.name} • {zone}</p></div>
          <section className="summary-total"><span>TOTAL HARVEST</span><strong>{duckCount + gooseCount}</strong><p>{duckCount} ducks • {gooseCount} geese</p></section>
          <section className="section"><h2>Today’s harvest</h2>{entries.length ? entries.map((entry) => <div className="summary-row" key={entry.id}><span>{entry.label}</span><strong>× {entry.count}</strong></div>) : <p className="empty">No birds logged. You can still save a zero-harvest hunt.</p>}</section>
          <button className="button button--gold button--wide" onClick={saveHunt}>Save to My Hunts</button>
          <button className="text-button" onClick={() => { setHarvest({}); setView("dashboard"); }}>Discard hunt</button>
        </div>
      )}

      {view === "history" && (
        <div className="page">
          <div className="page-title"><p className="eyebrow">YOUR SEASON</p><h1>My hunts</h1><p>A simple field record of every hunt you save.</p></div>
          {!isPremium && <section className="locked-card"><span>MEMBERSHIP REQUIRED</span><h2>Unlock your hunt history</h2><p>Activate your BlindIQ membership to save and revisit every hunt.</p><button className="button button--gold" onClick={() => setView("account")}>View membership</button></section>}
          {isPremium && <>
          <div className="stats-strip"><div><strong>{history.length}</strong><span>Hunts</span></div><div><strong>{history.reduce((sum, hunt) => sum + hunt.entries.reduce((s, e) => s + e.count, 0), 0)}</strong><span>Birds</span></div><div><strong>{new Set(history.map((hunt) => hunt.state)).size}</strong><span>States</span></div></div>
          <div className="history-list">
            {history.map((hunt) => <article key={hunt.id}><div className="date-tile"><strong>{hunt.date.split(" ")[1]?.replace(",", "")}</strong><span>{hunt.date.split(" ")[0]?.slice(0, 3)}</span></div><div><strong>{hunt.state}</strong><span>{hunt.zone}</span><p>{hunt.entries.map((entry) => `${entry.count} ${entry.label}`).join(" • ")}</p></div><b>{hunt.entries.reduce((sum, entry) => sum + entry.count, 0)}</b></article>)}
          </div>
          </>}
        </div>
      )}

      {view === "account" && (
        <div className="page account-page">
          <div className="page-title"><p className="eyebrow">{isPremium ? "MEMBERSHIP" : "ONE LAST STEP"}</p><h1>{isPremium ? "Your BlindIQ account" : "Activate your membership"}</h1>{!isPremium && <p>Complete secure checkout to unlock the hunt dashboard.</p>}</div>
          <section className="profile-card"><div className="profile-avatar">{userName.slice(0, 1)}</div><div><strong>{userName}</strong><span>{accountEmail || `@${userName.toLowerCase()}`}</span></div><span className="demo-pill">{isDemoMode ? "DEMO" : isPremium ? "ACTIVE" : "INACTIVE"}</span></section>
          <section className="premium-card">
            <p className="eyebrow">BLINDIQ ANNUAL MEMBERSHIP</p>
            <h2>Every hunt. One clear answer.</h2>
            <div className="price"><strong>$14.99</strong><span>/ year</span></div>
            <ul><li>✓ State regulation dashboards</li><li>✓ Live harvest and bag-limit guidance</li><li>✓ Unlimited saved hunt history</li><li>✓ New member tools as they launch</li></ul>
            {isPremium ? <div className="membership-active"><span>✓</span><div><strong>Membership active</strong><small>Verified through your BlindIQ membership record.</small></div></div> : <button className="button button--gold button--wide" onClick={() => { const result = beginCheckout(accountUserId, accountEmail); if (result === "demo") setToast("Demo checkout — add Stripe settings to accept payment"); }}>Start annual membership</button>}
            <small>Secure checkout is powered by Stripe. Renewal and discount terms are shown before confirmation.</small>
          </section>
          {toast && <div className="inline-toast">{toast}</div>}
          <section className="settings-list"><button onClick={async () => { const membership = await getSubscription(); setIsPremium(membership.isPremium); setSubscriptionStatus(membership.status); setToast(`Membership status refreshed: ${membership.status}`); }}>Refresh membership <span>›</span></button><button>Membership status <span>{subscriptionStatus}</span></button><button>Privacy & terms <span>›</span></button><button>Contact support <span>›</span></button><button onClick={async () => { await signOut(); setUserName("Hunter"); setAccountEmail(""); setAccountUserId(""); setIsPremium(false); setView("welcome"); }}>Log out <span>›</span></button></section>
          <div className="integration-note"><strong>{isDemoMode ? "Demo connection" : "Account connection active"}</strong><p>{isDemoMode ? "Add Supabase environment settings to activate persistent accounts." : "Supabase is connected for persistent authentication. Stripe checkout will activate after its public payment link is added."}</p></div>
        </div>
      )}
    </Shell>
  );
}
