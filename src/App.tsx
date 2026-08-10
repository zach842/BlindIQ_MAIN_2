import { FormEvent, useEffect, useMemo, useState } from "react";
import { states } from "./data";
import { beginCheckout, getDefaultState, getSubscription, isDemoMode, restoreRememberedUser, saveDefaultState, signIn, signOut, signUp } from "./services";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION, termsSections } from "./legal";
import { getDevicePosition, getWeather } from "./location";
import type { BirdRule, DevicePosition, HarvestEntry, HuntRecord, WeatherData } from "./types";

type View = "welcome" | "login" | "signup" | "dashboard" | "hunt" | "summary" | "history" | "account" | "terms";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallUi = {
  guideOpen: boolean;
  canPrompt: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  install: () => Promise<void>;
};

const sortedStates = [...states].sort((first, second) => first.name.localeCompare(second.name, "en"));

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

function weatherSymbol(description: string) {
  const value = description.toLowerCase();
  if (value.includes("thunder")) return "ϟ";
  if (value.includes("snow") || value.includes("sleet")) return "✣";
  if (value.includes("rain") || value.includes("shower")) return "≋";
  if (value.includes("fog") || value.includes("mist")) return "═";
  if (value.includes("cloud") || value.includes("overcast")) return "☁";
  return "☀";
}

function formatHour(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric" });
}

function WeatherPanel({ weather, position, loading, error, expanded, onToggle, onLocate }: { weather: WeatherData | null; position: DevicePosition | null; loading: boolean; error: string; expanded: boolean; onToggle: () => void; onLocate: () => void }) {
  const dayPeriods = weather?.daily.filter((period) => period.isDaytime).slice(0, 7) ?? [];
  const temperature = weather?.current.temperature === null || weather?.current.temperature === undefined ? "—" : `${weather.current.temperature}°`;
  const wind = weather ? `${weather.current.windDirection} ${weather.current.windSpeedMph === null ? weather.hourly[0]?.windSpeed || "—" : `${weather.current.windSpeedMph} mph`}` : "";
  return (
    <section className={`weather-section ${expanded ? "weather-section--expanded" : "weather-section--collapsed"}`} aria-live="polite">
      <button className="weather-toggle" type="button" aria-expanded={expanded} aria-controls="field-weather-details" onClick={onToggle}>
        <span className="weather-toggle__symbol" aria-hidden="true">{weather ? weatherSymbol(weather.current.description) : "☀"}</span>
        <span className="weather-toggle__copy">
          <span className="weather-toggle__eyebrow">FIELD WEATHER</span>
          <strong>{weather ? `${temperature} · ${weather.locationLabel}` : "Local weather & forecast"}</strong>
          <small>{weather ? `${weather.current.description} · Wind ${wind}` : "Current conditions, hourly wind, alerts, and seven-day outlook"}</small>
        </span>
        {!!weather?.alerts.length && <span className="weather-toggle__alert">{weather.alerts.length} ALERT{weather.alerts.length === 1 ? "" : "S"}</span>}
        <span className="weather-toggle__action">{expanded ? "CLOSE" : "OPEN"}<i aria-hidden="true">⌄</i></span>
      </button>
      {expanded && <div id="field-weather-details" className="weather-details">
        <div className="weather-heading">
          <div><h2>{weather?.locationLabel || "Weather at your location"}</h2><p>{weather ? "Official National Weather Service conditions and forecast." : "Allow location access to load conditions where you are standing."}</p></div>
          <button className="button weather-locate" disabled={loading} onClick={onLocate}>{loading ? "Locating…" : weather ? "Refresh location" : "Use my location"}</button>
        </div>
        {error && <div className="weather-error" role="alert"><strong>Weather unavailable</strong><span>{error}</span></div>}
        {!weather && !error && <div className="weather-empty"><span>⌖</span><p><strong>Current conditions. Hourly wind. Seven-day outlook.</strong><small>Your precise location is used only to request this forecast and is not saved by BlindIQ.</small></p></div>}
        {weather && <>
          {!!weather.alerts.length && <div className="weather-alerts">{weather.alerts.map((alert) => <article key={alert.id}><span>!</span><div><strong>{alert.event}</strong><p>{alert.headline}</p></div></article>)}</div>}
          <div className="current-weather">
            <div className="weather-symbol">{weatherSymbol(weather.current.description)}</div>
            <div className="current-temp"><strong>{temperature}</strong><span>{weather.current.description}</span></div>
            <div className="weather-facts"><p><span>WIND</span><strong>{wind}</strong></p><p><span>HUMIDITY</span><strong>{weather.current.humidity === null ? "—" : `${weather.current.humidity}%`}</strong></p><p><span>GPS ACCURACY</span><strong>{position ? `±${Math.max(1, Math.round(position.accuracyMeters * 3.28084))} ft` : "—"}</strong></p></div>
          </div>
          {!!weather.hourly.length && <div className="forecast-block"><div className="forecast-title"><strong>Next 12 hours</strong><span>Swipe to view →</span></div><div className="hourly-strip">{weather.hourly.map((period) => <article key={period.startTime}><span>{formatHour(period.startTime)}</span><b>{weatherSymbol(period.shortForecast)}</b><strong>{period.temperature}°</strong><small>{period.windDirection} {period.windSpeed}</small><i>{period.precipitationChance ?? 0}% rain</i></article>)}</div></div>}
          {!!dayPeriods.length && <div className="forecast-block"><div className="forecast-title"><strong>Seven-day outlook</strong><span>NWS forecast</span></div><div className="daily-list">{dayPeriods.map((period) => <article key={period.startTime}><div><strong>{period.name}</strong><span>{period.shortForecast}</span></div><b>{weatherSymbol(period.shortForecast)}</b><p><strong>{period.temperature}°{period.temperatureUnit}</strong><span>{period.windDirection} {period.windSpeed}</span></p></article>)}</div></div>}
          <footer className="weather-source"><span>Updated {new Date(weather.retrievedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span><a href="https://www.weather.gov/" target="_blank" rel="noreferrer">National Weather Service ↗</a></footer>
        </>}
      </div>}
    </section>
  );
}

function LegalDocument({ onClose }: { onClose?: () => void }) {
  return (
    <article className="legal-document">
      <header className="legal-header">
        <div><p className="eyebrow">BLINDIQ LEGAL</p><h1>Terms of Use & User Agreement</h1><p>Effective {TERMS_EFFECTIVE_DATE} • Version {TERMS_VERSION}</p></div>
        {onClose && <button className="legal-close" onClick={onClose} aria-label="Close user agreement">×</button>}
      </header>
      <aside className="legal-warning"><strong>Important hunting-law notice</strong><p>BlindIQ is an informational hunting companion—not legal advice or permission to hunt. You remain solely responsible for verifying official regulations and every shot you take.</p></aside>
      {termsSections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <footer><p>This draft is designed for BlindIQ’s current product and should be reviewed by a qualified attorney before broad commercial launch.</p></footer>
    </article>
  );
}

function InstallGuide({ canPrompt, onInstall, onClose }: { canPrompt: boolean; onInstall: () => Promise<void>; onClose: () => void }) {
  return (
    <div className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
      <div className="install-guide__panel">
        <button className="install-guide__close" type="button" onClick={onClose} aria-label="Close installation instructions">×</button>
        <p className="eyebrow">ADD BLINDIQ TO YOUR PHONE</p>
        <h2 id="install-guide-title">One tap from the blind.</h2>
        <p className="install-guide__intro">Add BlindIQ to your home screen for fast access without searching for the website.</p>
        {canPrompt && <button className="button button--gold button--wide install-guide__native" type="button" onClick={() => void onInstall()}>Install BlindIQ now</button>}
        <div className="install-guide__devices">
          <section className="install-guide__device">
            <div className="install-guide__device-heading"><h3>iPhone</h3><small>Use Safari</small></div>
            <ol>
              <li>Open BlindIQ in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
              <li>Scroll and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the upper-right corner.</li>
            </ol>
          </section>
          <section className="install-guide__device">
            <div className="install-guide__device-heading"><h3>Android</h3><small>Use Chrome</small></div>
            <ol>
              <li>Open BlindIQ in <strong>Chrome</strong>.</li>
              <li>Tap the <strong>three-dot menu</strong> in the upper-right corner.</li>
              <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
              <li>Confirm by tapping <strong>Install</strong> or <strong>Add</strong>.</li>
            </ol>
          </section>
        </div>
        <p className="install-guide__note">The wording may vary slightly by phone and browser version.</p>
      </div>
    </div>
  );
}

function Shell({ view, setView, children, userName, isPremium, installUi }: { view: View; setView: (v: View) => void; children: React.ReactNode; userName: string; isPremium: boolean; installUi: InstallUi }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setView(isPremium ? "dashboard" : "account")}><Brand compact /></button>
        <div className="topbar-actions">
          <button className="home-install-button" type="button" onClick={installUi.openGuide} aria-label="Add BlindIQ to your home screen"><span>＋</span> HOME</button>
          <button className="avatar" onClick={() => setView("account")} aria-label="Account">{userName.slice(0, 1).toUpperCase()}</button>
        </div>
      </header>
      <main>{children}</main>
      {view !== "hunt" && view !== "summary" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {isPremium && <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Icon>⌂</Icon>Home</button>}
          {isPremium && <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><Icon>≡</Icon>My Hunts</button>}
          <button className={view === "account" ? "active" : ""} onClick={() => setView("account")}><Icon>○</Icon>Account</button>
        </nav>
      )}
      {installUi.guideOpen && <InstallGuide canPrompt={installUi.canPrompt} onInstall={installUi.install} onClose={installUi.closeGuide} />}
    </div>
  );
}

function AuthScreen({ mode, onSubmit, onSwitch, onBack }: { mode: "login" | "signup"; onSubmit: (username: string, email: string, password: string, mode: "login" | "signup", rememberDevice: boolean) => Promise<string | void>; onSwitch: () => void; onBack: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(isDemoMode && mode === "login" ? "hunter" : "");
  const [password, setPassword] = useState(isDemoMode && mode === "login" ? "confidence" : "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const message = await onSubmit(username, email, password, mode, rememberDevice);
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
          <label className="remember-device"><input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} /><span><strong>Remember this device for 30 days</strong><small>Use only on a private phone or computer. BlindIQ never stores your password.</small></span></label>
          {mode === "signup" && <label className="agreement-check"><input required type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I have read and agree to the <button type="button" onClick={() => setShowTerms(true)}>Terms of Use and User Agreement</button>, including the hunting-law disclaimer, release, and limitation of liability.</span></label>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <div className="auth-success" role="status">{success}</div>}
          <button className="button button--gold button--wide" disabled={loading} type="submit">{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <p className="auth-switch">{mode === "login" ? "New to BlindIQ?" : "Already have an account?"} <button onClick={onSwitch}>{mode === "login" ? "Create account" : "Log in"}</button></p>
        {isDemoMode && <div className="demo-note">{mode === "login" ? <>Demo login: <strong>hunter</strong> / <strong>confidence</strong></> : "Demo mode — your new account opens immediately but is not saved yet."}</div>}
      </div>
      {showTerms && <div className="legal-modal" role="dialog" aria-modal="true" aria-label="BlindIQ User Agreement"><div className="legal-modal__panel"><LegalDocument onClose={() => setShowTerms(false)} /><button className="button button--gold button--wide" onClick={() => { setAccepted(true); setShowTerms(false); }}>I have read this agreement</button></div></div>}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>("welcome");
  const [userName, setUserName] = useState("Hunter");
  const [stateCode, setStateCode] = useState("MD");
  const [defaultStateCode, setDefaultStateCode] = useState("MD");
  const [zone, setZone] = useState(states[0].zones[0]);
  const [harvest, setHarvest] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HuntRecord[]>(demoHistory);
  const [toast, setToast] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountUserId, setAccountUserId] = useState("");
  const [isPremium, setIsPremium] = useState(isDemoMode);
  const [subscriptionStatus, setSubscriptionStatus] = useState(isDemoMode ? "active" : "inactive");
  const [devicePosition, setDevicePosition] = useState<DevicePosition | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const selected = states.find((state) => state.code === stateCode) ?? states[0];
  const duckCount = selected.birds.filter((bird) => bird.group === "Ducks").reduce((sum, bird) => sum + (harvest[bird.id] ?? 0), 0);
  const gooseCount = selected.birds.filter((bird) => bird.group === "Geese").reduce((sum, bird) => sum + (harvest[bird.id] ?? 0), 0);
  const duckDailyLimit = selected.duckDailyLimits?.[zone] ?? selected.duckDailyLimit ?? 6;

  const limitForBird = (bird: BirdRule) => bird.zoneLimits?.[zone] ?? bird.limit;
  const remaining = (bird: BirdRule) => {
    if (bird.group === "Ducks" && duckCount >= duckDailyLimit) return 0;
    const effectiveLimit = limitForBird(bird);
    if (bird.parent) {
      const parentCount = selected.birds.filter((item) => item.parent === bird.parent).reduce((sum, item) => sum + (harvest[item.id] ?? 0), 0);
      const parentLimit = bird.parentLimits?.[zone] ?? bird.parentLimit ?? effectiveLimit;
      return Math.max(0, Math.min(effectiveLimit - (harvest[bird.id] ?? 0), parentLimit - parentCount, duckDailyLimit - duckCount));
    }
    return Math.max(0, Math.min(effectiveLimit - (harvest[bird.id] ?? 0), bird.group === "Ducks" ? duckDailyLimit - duckCount : effectiveLimit));
  };
  const availableBirds = useMemo(() => selected.birds.filter((bird) => remaining(bird) > 0), [selected, harvest, zone]);

  function selectState(code: string) {
    const next = states.find((state) => state.code === code)!;
    setStateCode(code);
    setZone(next.zones[0]);
    setHarvest({});
  }

  useEffect(() => {
    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function markInstalled() {
      setInstallPrompt(null);
      setInstallGuideOpen(false);
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const user = await restoreRememberedUser();
        if (!user || cancelled) return;
        const [membership, savedState] = await Promise.all([getSubscription(), getDefaultState()]);
        if (cancelled) return;
        const nextState = states.find((state) => state.code === savedState) ?? states[0];
        setUserName(user.name);
        setAccountEmail(user.email);
        setAccountUserId(user.id);
        setDefaultStateCode(nextState.code);
        setStateCode(nextState.code);
        setZone(nextState.zones[0]);
        setHarvest({});
        setIsPremium(membership.isPremium);
        setSubscriptionStatus(membership.status);
        setView(membership.isPremium ? "dashboard" : "account");
      } catch {
        if (!cancelled) setToast("Your saved login could not be restored. Please log in again.");
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadLocalWeather() {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const position = await getDevicePosition();
      setDevicePosition(position);
      const result = await getWeather(position);
      setWeather(result);
    } catch (cause) {
      setWeatherError(cause instanceof Error ? cause.message : "BlindIQ could not load weather for this location.");
    } finally {
      setWeatherLoading(false);
    }
  }

  async function installBlindIq() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      setInstallGuideOpen(false);
    }
  }

  async function authenticate(username: string, email: string, password: string, mode: "login" | "signup", shouldRememberDevice: boolean) {
    if (mode === "login") {
      const user = await signIn(email, password, shouldRememberDevice);
      setUserName(user.name);
      setAccountEmail(user.email);
      setAccountUserId(user.id);
      const membership = await getSubscription();
      const savedState = await getDefaultState();
      const validState = states.some((state) => state.code === savedState) ? savedState : "MD";
      setDefaultStateCode(validState);
      selectState(validState);
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

    const user = await signUp(username, email, password, shouldRememberDevice);
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

  const installUi: InstallUi = {
    guideOpen: installGuideOpen,
    canPrompt: Boolean(installPrompt),
    openGuide: () => setInstallGuideOpen(true),
    closeGuide: () => setInstallGuideOpen(false),
    install: installBlindIq,
  };

  if (sessionLoading) {
    return <div className="session-loading"><Brand /><span className="session-loading__spinner" aria-hidden="true" /><p>Checking this device…</p></div>;
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

  if (view === "terms") {
    return <Shell view={view} setView={setView} userName={userName} isPremium={isPremium} installUi={installUi}><div className="page legal-page"><button className="back-link legal-back" onClick={() => setView("account")}>← Back to account</button><LegalDocument /></div></Shell>;
  }

  return (
    <Shell view={view} setView={setView} userName={userName} isPremium={isPremium} installUi={installUi}>
      {view === "dashboard" && (
        <div className="page dashboard">
          <div className="greeting"><p>Good morning, {userName}</p><h1>Where are you hunting?</h1></div>
          <section className="state-picker">
            <label htmlFor="state">HUNTING STATE</label>
            <select id="state" value={stateCode} onChange={(e) => selectState(e.target.value)}>
              {sortedStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </select>
          </section>

          <WeatherPanel weather={weather} position={devicePosition} loading={weatherLoading} error={weatherError} expanded={weatherExpanded} onToggle={() => setWeatherExpanded((current) => !current)} onLocate={loadLocalWeather} />

          {selected.dataNotice && (
            <aside className="data-notice" role="alert">
              <div>!</div>
              <p><strong>{selected.dataStatus === "archived" ? "Archived season data" : "Preseason data notice"}</strong>{selected.dataNotice}</p>
            </aside>
          )}

          <section className={`status-banner ${selected.dataStatus === "archived" ? "status-banner--reference" : "status-banner--closed"}`}>
            <div className="status-icon">×</div>
            <div><span>WATERFOWL SEASON</span><strong>{selected.dataStatus === "archived" ? "CURRENT DATA PENDING" : "CLOSED TODAY"}</strong><p>{selected.dataStatus === "archived" ? `${selected.seasonYear} is displayed for reference only.` : `You’re in ${selected.name}. Here are the currently loaded dates.`}</p></div>
          </section>

          <button className="button button--gold button--start" disabled={selected.dataStatus === "archived"} onClick={() => { if (isPremium) setView("hunt"); else { setToast("An active BlindIQ membership is required to start a hunt."); setView("account"); } }}><span>{selected.dataStatus === "archived" ? "2026–2027 UPDATE PENDING" : isPremium ? "START HUNT" : "UNLOCK START HUNT"}</span><small>{selected.dataStatus === "archived" ? "Archived rules cannot start a live hunt" : isPremium ? "Open hunt mode →" : "$14.99/year →"}</small></button>

          <section className="section">
            <div className="section-heading"><div><p className="eyebrow">SEASON OVERVIEW</p><h2>{selected.name} waterfowl</h2></div><span className="verified">{selected.seasonYear ?? "Demo data"}</span></div>
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

          {!!selected.specialRules?.length && (
            <section className="section special-rules">
              <div className="section-heading"><div><p className="eyebrow">IMPORTANT RESTRICTIONS</p><h2>Before you hunt</h2></div></div>
              <ul>{selected.specialRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            </section>
          )}

          <section className="info-grid">
            <article className="info-card"><Icon>⌖</Icon><span>Zones</span><strong>{selected.zones.length} loaded</strong><p>{selected.zones.join(" • ")}</p></article>
            <article className="info-card"><Icon>◷</Icon><span>Shooting hours</span><strong>Check daily</strong><p>{selected.shootingHours}</p></article>
            <article className="info-card"><Icon>▤</Icon><span>Daily duck bag</span><strong>{duckDailyLimit} ducks</strong><p>{selected.duckDailyLimits ? "Changes with the selected flyway or zone." : "Species and sex restrictions apply."}</p></article>
            <article className="info-card"><Icon>↗</Icon><span>Official source</span><strong>Verify before hunting</strong><a href={selected.officialUrl} target="_blank" rel="noreferrer">Open agency regulations</a></article>
          </section>

          <section className="species-section section">
            <div className="section-heading"><div><p className="eyebrow">LOADED BAG RULES</p><h2>Ducks & geese</h2></div></div>
            <div className="chip-list">{selected.birds.map((bird) => <span key={bird.id}>{bird.label} <b>{limitForBird(bird)}</b></span>)}</div>
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
              <div><span>DUCK BAG</span><strong>{duckCount}<small>/{duckDailyLimit}</small></strong></div>
              <div className="meter"><i style={{ width: `${Math.min(100, duckCount / duckDailyLimit * 100)}%` }} /></div>
              <p>{duckCount >= duckDailyLimit ? "Daily duck bag filled. Stop harvesting ducks." : `${duckDailyLimit - duckCount} duck${duckDailyLimit - duckCount === 1 ? "" : "s"} remain in the aggregate bag.`}</p>
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
          <section className="default-state-card">
            <div><p className="eyebrow">HUNTING PREFERENCE</p><h2>Default state</h2><p>BlindIQ will open your dashboard with this state selected.</p></div>
            <label htmlFor="default-state">DEFAULT HUNTING STATE<select id="default-state" value={defaultStateCode} onChange={async (e) => { const code = e.target.value; setDefaultStateCode(code); try { await saveDefaultState(code); selectState(code); setToast(`${states.find((state) => state.code === code)?.name} saved as your default state.`); } catch (cause) { setToast(cause instanceof Error ? cause.message : "Unable to save your default state."); } }}>{sortedStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
          </section>
          <section className="premium-card">
            <p className="eyebrow">BLINDIQ ANNUAL MEMBERSHIP</p>
            <h2>Every hunt. One clear answer.</h2>
            <div className="price"><strong>$14.99</strong><span>/ year</span></div>
            <ul><li>✓ State regulation dashboards</li><li>✓ Live harvest and bag-limit guidance</li><li>✓ Unlimited saved hunt history</li><li>✓ New member tools as they launch</li></ul>
            {isPremium ? <div className="membership-active"><span>✓</span><div><strong>Membership active</strong><small>Verified through your BlindIQ membership record.</small></div></div> : <button className="button button--gold button--wide" onClick={() => { const result = beginCheckout(accountUserId, accountEmail); if (result === "demo") setToast("Demo checkout — add Stripe settings to accept payment"); }}>Start annual membership</button>}
            <small>Secure checkout is powered by Stripe. Renewal and discount terms are shown before confirmation.</small>
          </section>
          {toast && <div className="inline-toast">{toast}</div>}
          <section className="settings-list"><button onClick={async () => { const membership = await getSubscription(); setIsPremium(membership.isPremium); setSubscriptionStatus(membership.status); setToast(`Membership status refreshed: ${membership.status}`); }}>Refresh membership <span>›</span></button><button>Membership status <span>{subscriptionStatus}</span></button><button onClick={() => setView("terms")}>Terms of Use & User Agreement <span>›</span></button><button>Contact support <span>›</span></button><button onClick={async () => { await signOut(); setUserName("Hunter"); setAccountEmail(""); setAccountUserId(""); setIsPremium(false); setView("welcome"); }}>Log out <span>›</span></button></section>
          <div className="integration-note"><strong>{isDemoMode ? "Demo connection" : "Account connection active"}</strong><p>{isDemoMode ? "Add Supabase environment settings to activate persistent accounts." : "Supabase is connected for persistent authentication. Stripe checkout will activate after its public payment link is added."}</p></div>
        </div>
      )}
    </Shell>
  );
}
