import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { buildSessionEntries, changeSightings } from "./sessionEntries";
import { huntingLocations } from "./huntingLocations";
import { huntCategories, huntCategoryById } from "./gameCatalog";
import { states } from "./data";
import { countBirds, duckBagLimit, effectiveBirdLimit, localDateKey, remainingBirds } from "./harvestLimits";
import { beginActiveHunt, beginCheckout, finishActiveHunt, getDefaultState, getSubscription, isDemoMode, listHunts, openCustomerPortal, restoreRememberedUser, saveDefaultState, saveHuntRecord, signIn, signOut, signUp, syncPendingHunts, touchActiveHunt } from "./services";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION, termsSections } from "./legal";
import { birdGuideEntries, birdPhotoFor } from "./birdGuide";
import { createHuntShareFile, downloadHuntShareFile, shareHuntFile } from "./shareHunt";
import { getDashboardSeasonStatus } from "./seasonStatus";
import { prepareHuntPhoto } from "./huntPhotos";
import MigrationPage from "./MigrationPage";
import NotificationsPage from "./NotificationsPage";
import { detachCurrentPushDevice, ensureNotificationPreferences, syncCurrentPushDevice, unreadNotificationCount } from "./notifications";
import type { BirdRule, HarvestEntry, HuntRecord, HuntCategoryId } from "./types";

type View = "welcome" | "login" | "signup" | "dashboard" | "migration" | "notifications" | "hunt" | "bird-guide" | "summary" | "history" | "account" | "terms" | "feedback";

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
const INSTALL_NUDGE_SESSION_KEY = "blindiq-install-nudge-shown-v1";
const SESSION_RESTORE_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), milliseconds)),
  ]);
}

function isInstalledApp() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="BlindIQ">
      <img src="/blindiq-logo-hunt-log-share-closed-border.png" alt={compact ? "" : "BlindIQ — Hunt. Log. Share"} />
      {compact && <strong>BLIND<span>IQ</span></strong>}
    </div>
  );
}

function Icon({ children }: { children: string }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function BrandPromise({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-promise ${compact ? "brand-promise--compact" : ""}`} aria-label="Start the hunt, log your harvest, save and share">
      <div><span>01</span><strong>Start the hunt</strong></div>
      <div><span>02</span><strong>Log your harvest</strong></div>
      <div><span>03</span><strong>Save &amp; share</strong></div>
    </div>
  );
}

function BirdReferencePhoto({ bird }: { bird: BirdRule }) {
  const photo = birdPhotoFor(bird);
  return (
    <div className={`bird-avatar ${photo.representative ? "bird-avatar--representative" : ""}`} title={photo.representative ? "Representative group photo—open the field guide to identify the exact species." : photo.alt}>
      <img src={photo.src} alt="" loading="lazy" />
    </div>
  );
}

function LegalDocument({ onClose }: { onClose?: () => void }) {
  return (
    <article className="legal-document">
      <header className="legal-header">
        <div><p className="eyebrow">BLINDIQ LEGAL</p><h1>Terms of Use & User Agreement</h1><p>Effective {TERMS_EFFECTIVE_DATE} • Version {TERMS_VERSION}</p></div>
        {onClose && <button className="legal-close" onClick={onClose} aria-label="Close user agreement">×</button>}
      </header>
      <aside className="legal-warning"><strong>Important hunting-law notice</strong><p>BlindIQ is a digital field guide and field log—not legal advice or permission to hunt. You remain solely responsible for verifying official regulations and every shot you take.</p></aside>
      {termsSections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      <footer><p>This draft is designed for BlindIQ’s current product and should be reviewed by a qualified attorney before broad commercial launch.</p></footer>
    </article>
  );
}

function FeedbackForm({ stateName, accountEmail, onBack }: { stateName: string; accountEmail: string; onBack: () => void }) {
  const [category, setCategory] = useState("Regulation error");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [steps, setSteps] = useState("");

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailSubject = `[BlindIQ ${category}] ${subject.trim() || "Community submission"}`;
    const body = [
      `Category: ${category}`,
      `State selected in BlindIQ: ${stateName}`,
      `Member email: ${accountEmail || "Not provided"}`,
      "",
      "What I noticed / my idea:",
      details.trim(),
      "",
      "Steps to reproduce or additional context:",
      steps.trim() || "Not provided",
      "",
      "Submitted from BlindIQ v1.62.1",
    ].join("\n");
    window.location.href = `mailto:office@blindiq.app?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="page feedback-page">
      <button className="back-link feedback-back" type="button" onClick={onBack}>← Back</button>
      <header className="feedback-heading">
        <p className="eyebrow">BETTER THE COMMUNITY</p>
        <h1>Help improve BlindIQ.</h1>
        <p>Report an incorrect regulation, tell us about a bug, or share an idea that would make the next hunt better.</p>
      </header>
      <form className="feedback-form" onSubmit={prepareEmail}>
        <label htmlFor="feedback-category">WHAT ARE YOU SENDING?
          <select id="feedback-category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>Regulation error</option>
            <option>App bug</option>
            <option>Feature idea</option>
            <option>General feedback</option>
          </select>
        </label>
        <label htmlFor="feedback-subject">SHORT TITLE
          <input id="feedback-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Example: Maryland scaup limit" required />
        </label>
        <label htmlFor="feedback-details">TELL US WHAT YOU FOUND
          <textarea id="feedback-details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Include the regulation, screen, feature, or behavior you want us to review." rows={6} required />
        </label>
        <label htmlFor="feedback-steps">STEPS OR EXTRA CONTEXT <span>OPTIONAL</span>
          <textarea id="feedback-steps" value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="For a bug, tell us what you tapped and what happened. For a regulation, include the state and source link if available." rows={4} />
        </label>
        <aside className="feedback-destination"><span>@</span><p><strong>Sent to office@blindiq.app</strong><small>Your email app will open with this report prepared. Review it, attach screenshots if helpful, and tap Send.</small></p></aside>
        <button className="button button--gold button--wide" type="submit">Prepare email</button>
      </form>
    </div>
  );
}

function BirdGuide({ onBack }: { onBack: () => void }) {
  const [group, setGroup] = useState<"All" | "Ducks" | "Geese" | "Other">("All");
  const visibleEntries = group === "All" ? birdGuideEntries : birdGuideEntries.filter((entry) => entry.group === group);
  return (
    <div className="bird-guide-page">
      <header className="bird-guide-header">
        <button type="button" onClick={onBack}>←</button>
        <div><span>BLINDIQ FIELD GUIDE</span><strong>Not sure?</strong></div>
        <button className="bird-guide-done" type="button" onClick={onBack}>Back to hunt</button>
      </header>
      <div className="bird-guide-content">
        <section className="bird-guide-intro">
          <p className="eyebrow">DIGITAL FIELD GUIDE • FIELD IDENTIFICATION</p>
          <h1>Check the bird before you log it.</h1>
          <p>Compare the photo and identifying markers below. Plumage can change with sex, age, season, distance, and lighting.</p>
          <aside><strong>If you cannot positively identify a live bird, do not take the shot.</strong> This guide is a visual reference—not a legal determination. Verify species and current rules with official sources.</aside>
          <div className="bird-guide-filters" aria-label="Filter field guide">
            {(["All", "Ducks", "Geese", "Other"] as const).map((option) => <button className={group === option ? "active" : ""} type="button" key={option} onClick={() => setGroup(option)}>{option}</button>)}
          </div>
        </section>
        <div className="bird-guide-grid">
          {visibleEntries.map((entry) => (
            <article className="bird-guide-card" key={entry.id}>
              <img src={entry.image} alt={`${entry.name} reference`} loading="lazy" />
              <div className="bird-guide-card__body">
                <span>{entry.group === "Other" ? "OTHER WATERFOWL" : entry.group.toUpperCase()}</span>
                <h2>{entry.name}</h2>
                <ul>{entry.markers.map((marker) => <li key={marker}>{marker}</li>)}</ul>
                <a href={entry.sourceUrl} target="_blank" rel="noreferrer">Photo source: {entry.credit} ↗</a>
              </div>
            </article>
          ))}
        </div>
        <footer className="bird-guide-source">
          <p><strong>Need the complete official guide?</strong> Review the U.S. Fish & Wildlife Service’s <em>Ducks at a Distance</em> waterfowl identification guide.</p>
          <a href="https://www.fws.gov/media/ducks-distance-waterfowl-identification-guide" target="_blank" rel="noreferrer">Open the USFWS guide ↗</a>
        </footer>
      </div>
    </div>
  );
}

function InstallGuide({ canPrompt, onInstall, onClose }: { canPrompt: boolean; onInstall: () => Promise<void>; onClose: () => void }) {
  return (
    <div className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
      <div className="install-guide__panel">
        <button className="install-guide__close" type="button" onClick={onClose} aria-label="Close installation instructions">×</button>
        <p className="eyebrow">DO THIS BEFORE YOUR NEXT HUNT</p>
        <h2 id="install-guide-title">Add BlindIQ to your Home Screen.</h2>
        <p className="install-guide__intro">Open BlindIQ like a regular phone app and keep your loaded field guide and hunt logger available when service drops.</p>
        <div className="install-guide__benefits" aria-label="Home Screen and offline benefits">
          <div><strong>1 TAP</strong><span>Open from your Home Screen</span></div>
          <div><strong>OFFLINE</strong><span>View loaded rules and bird references</span></div>
          <div><strong>SYNC</strong><span>Log hunts offline and sync later</span></div>
        </div>
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
        <p className="install-guide__note">Load BlindIQ once while connected before relying on offline mode. Account creation, membership checkout, regulation updates, and the first login on a device still require internet. Menu wording may vary slightly by phone and browser.</p>
      </div>
    </div>
  );
}

function Shell({ view, setView, children, userName, isPremium, installUi, isOnline, unreadNotifications }: { view: View; setView: (v: View) => void; children: React.ReactNode; userName: string; isPremium: boolean; installUi: InstallUi; isOnline: boolean; unreadNotifications: number }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setView(isPremium ? "dashboard" : "account")}><Brand compact /></button>
        <div className="topbar-actions">
          <button className="home-install-button" type="button" onClick={installUi.openGuide} aria-label="Add BlindIQ to your home screen">
            <span aria-hidden="true">＋</span>
            <strong>ADD TO<br />HOME SCREEN</strong>
          </button>
          {isPremium && <button className={view === "notifications" ? "notification-bell notification-bell--active" : "notification-bell"} type="button" onClick={() => setView("notifications")} aria-label={unreadNotifications ? `${unreadNotifications} unread BlindIQ alerts` : "BlindIQ alerts"}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9.7 20a2.5 2.5 0 0 0 4.6 0" /></svg>{unreadNotifications > 0 && <b>{unreadNotifications > 99 ? "99+" : unreadNotifications}</b>}</button>}
          <button className="avatar" onClick={() => setView("account")} aria-label="Account">{userName.slice(0, 1).toUpperCase()}</button>
        </div>
      </header>
      {!isOnline && <aside className="offline-banner" role="status"><span aria-hidden="true">●</span><p><strong>OFFLINE MODE</strong> Loaded regulations and the field guide remain available. Hunts saved now will sync when your connection returns.</p></aside>}
      <main>{children}</main>
      {view !== "hunt" && view !== "bird-guide" && view !== "summary" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {isPremium && <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><Icon>⌂</Icon>Hunt</button>}
          {isPremium && <button className={view === "migration" ? "active" : ""} onClick={() => setView("migration")}><Icon>⇅</Icon>Migration</button>}
          {isPremium && <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><Icon>≡</Icon>Logbook</button>}
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
          <p className="eyebrow">BLINDIQ • YOUR HUNTING FIELD LOG</p>
          <h1>{mode === "login" ? "Return to your logbook" : "Start your waterfowl logbook"}</h1>
          <p>{mode === "login" ? "Start hunts, log your harvest, and revisit the memories you have saved." : isDemoMode ? "Create a temporary demo account and try the field-ready waterfowl hunt logger." : "Create your BlindIQ account to start hunts, record every harvest, and keep your complete waterfowl history in one place."}</p>
        </div>
        <BrandPromise compact />
        <aside className="trial-callout">
          <span>7 DAYS FREE</span>
          <p><strong>Try the complete BlindIQ waterfowl logbook.</strong><small>New members: seven days free, then $10.99/year. Cancel before the trial ends to avoid being charged.</small></p>
        </aside>
        {mode === "login" && <div className="auth-device-note"><span aria-hidden="true">●</span><p><strong>Any internet-connected device</strong><small>Sign in from your phone, tablet, or computer to access your account and hunt history.</small></p></div>}
        <form onSubmit={submit}>
          {mode === "signup" && <label>Display username<input required autoComplete="nickname" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Example: ChesapeakeHunter" /></label>}
          <label>{isDemoMode && mode === "login" ? "Username" : "Email address"}<input required type={isDemoMode && mode === "login" ? "text" : "email"} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input required autoComplete={mode === "login" ? "current-password" : "new-password"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <label className="remember-device"><input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} /><span><strong>Remember this device for 30 days</strong><small>Keeps this browser or installed Home Screen app signed in for up to 30 days. Use only on a private device; BlindIQ never stores your password.</small></span></label>
          {mode === "signup" && <label className="agreement-check"><input required type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I have read and agree to the <button type="button" onClick={() => setShowTerms(true)}>Terms of Use and User Agreement</button>, including the hunting-law disclaimer, release, and limitation of liability.</span></label>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          {success && <div className="auth-success" role="status">{success}</div>}
          <button className="button button--gold button--wide" disabled={loading} type="submit">{loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account & start free trial"}</button>
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
  const [feedbackReturn, setFeedbackReturn] = useState<View>("account");
  const [userName, setUserName] = useState("Hunter");
  const [stateCode, setStateCode] = useState("MD");
  const [defaultStateCode, setDefaultStateCode] = useState("MD");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [fieldStateCode, setFieldStateCode] = useState("MD");
  const [categoryId, setCategoryId] = useState<HuntCategoryId>("waterfowl");
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [sessionArea, setSessionArea] = useState("");
  const [zone, setZone] = useState(states[0].zones[0]);
  const [saw, setSaw] = useState<Record<string, number>>({});
  const [harvest, setHarvest] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HuntRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [savingHunt, setSavingHunt] = useState(false);
  const [huntSaved, setHuntSaved] = useState(false);
  const [sharingHunt, setSharingHunt] = useState(false);
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null);
  const [preparingShareFile, setPreparingShareFile] = useState(false);
  const [sharingHistoryId, setSharingHistoryId] = useState("");
  const [huntPhoto, setHuntPhoto] = useState<Blob | null>(null);
  const [huntPhotoPreview, setHuntPhotoPreview] = useState("");
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [blindName, setBlindName] = useState("");
  const [firearmUsed, setFirearmUsed] = useState("");
  const [huntNotes, setHuntNotes] = useState("");
  const [managingMembership, setManagingMembership] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [toast, setToast] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountUserId, setAccountUserId] = useState("");
  const [isPremium, setIsPremium] = useState(isDemoMode);
  const [subscriptionStatus, setSubscriptionStatus] = useState(isDemoMode ? "active" : "inactive");
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const selected = states.find((state) => state.code === stateCode) ?? states[0];
  const category = huntCategoryById(categoryId);
  const isWaterfowl = categoryId === "waterfowl";
  const location = isWaterfowl ? selected : huntingLocations.find((item) => item.code === fieldStateCode)!;
  const agencyUrl = huntingLocations.find((item) => item.code === location.code)!.agencyUrl;
  const sessionZone = isWaterfowl ? zone : sessionArea.trim() || "Area not specified";
  const sessionSpecies = isWaterfowl ? selected.birds : category.species;
  const visibleSpecies = sessionSpecies.filter((species) => species.label.toLowerCase().includes(speciesSearch.toLowerCase().trim()));
  const dashboardSeasonStatus = getDashboardSeasonStatus(selected);
  const regulationDate = localDateKey();
  const duckCount = countBirds(selected, harvest, "Ducks");
  const gooseCount = countBirds(selected, harvest, "Geese");
  const totalSaw = sessionSpecies.reduce((sum, species) => sum + (saw[species.id] ?? 0), 0);
  const totalCount = sessionSpecies.reduce((sum, species) => sum + (harvest[species.id] ?? 0), 0);
  const duckDailyLimit = duckBagLimit(selected, zone);
  const limitForBird = (bird: BirdRule) => effectiveBirdLimit(bird, zone, regulationDate);
  const remaining = (bird: BirdRule) => isWaterfowl ? remainingBirds(selected, bird, harvest, zone, regulationDate) : Infinity;
  const availableBirds = selected.birds.filter((bird) => remaining(bird) > 0);
  const filteredHistory = history.filter((hunt) => view !== "history" || historyFilter === "all" || (hunt.huntCategory ?? "waterfowl") === historyFilter);
  const liveHistory = filteredHistory.filter((hunt) => !hunt.isSimulation);
  const liveBirdCount = liveHistory.reduce((sum, hunt) => sum + hunt.entries.reduce((entrySum, entry) => entrySum + entry.count, 0), 0);
  const lastLiveHunt = liveHistory[0] ?? null;

  function selectState(code: string) {
    if (sessionOpen) return;
    setFieldStateCode(code);
    const next = states.find((state) => state.code === code)!;
    setStateCode(code);
    setZone(next.zones[0]);
    setHarvest({}); setSaw({});
    setIsSimulation(false);
    setHuntSaved(false);
    setPreparedShareFile(null);
    clearHuntPhoto();
    clearHuntDetails();
  }

  function startHunt(simulation: boolean) {
    if (!isPremium) {
      setToast("An active BlindIQ membership is required to start a hunt.");
      setView("account");
      return;
    }
    setSessionOpen(true);
    setHarvest({}); setSaw({});
    setSpeciesSearch("");
    setIsSimulation(simulation);
    setHuntSaved(false);
    setPreparedShareFile(null);
    clearHuntPhoto();
    clearHuntDetails();
    setView("hunt");
    if (!simulation && isWaterfowl) void beginActiveHunt({ stateCode: location.code, stateName: location.name, zone });
  }

  function clearHuntPhoto() {
    setHuntPhoto(null);
    setHuntPhotoPreview("");
    setPhotoError("");
    setPreparedShareFile(null);
  }

  function clearHuntDetails() {
    setBlindName("");
    setFirearmUsed("");
    setHuntNotes("");
  }

  async function chooseHuntPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setPhotoProcessing(true);
    setPhotoError("");
    try {
      const prepared = await prepareHuntPhoto(file);
      setHuntPhoto(prepared);
      setHuntPhotoPreview(URL.createObjectURL(prepared));
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : "That photo could not be prepared.");
    } finally {
      setPhotoProcessing(false);
    }
  }

  useEffect(() => () => {
    if (huntPhotoPreview.startsWith("blob:")) URL.revokeObjectURL(huntPhotoPreview);
  }, [huntPhotoPreview]);

  function openFeedback(returnTo: View) {
    setFeedbackReturn(returnTo);
    setView("feedback");
  }

  function navigateNotification(url: string) {
    const destination = new URL(url, window.location.origin);
    const requested = destination.searchParams.get("view");
    const requestedState = destination.searchParams.get("state");
    if (requestedState && states.some((state) => state.code === requestedState)) selectState(requestedState);
    if (requested === "dashboard" || requested === "migration" || requested === "history" || requested === "account" || requested === "notifications") {
      setView(requested);
    } else {
      setView("notifications");
    }
    window.history.replaceState({}, "", window.location.pathname);
  }

  async function loadNotificationAccount(savedState: string) {
    try {
      await ensureNotificationPreferences(savedState);
      await syncCurrentPushDevice();
      setUnreadNotifications(await unreadNotificationCount());
    } catch {
      // Notifications are an enhancement; the field guide remains usable if setup is incomplete.
    }
  }

  useEffect(() => {
    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function markInstalled() {
      setInstallPrompt(null);
      setInstallGuideOpen(false);
      sessionStorage.setItem(INSTALL_NUDGE_SESSION_KEY, "installed");
    }

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function refreshAlerts(event: MessageEvent) {
      if (event.data?.type === "BLINDIQ_NOTIFICATION_RECEIVED") {
        void unreadNotificationCount().then(setUnreadNotifications).catch(() => undefined);
      }
    }
    navigator.serviceWorker.addEventListener("message", refreshAlerts);
    return () => navigator.serviceWorker.removeEventListener("message", refreshAlerts);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function flushOfflineHunts() {
      if (!accountUserId || !isPremium || !navigator.onLine) return;
      try {
        const synced = await syncPendingHunts();
        if (!synced || cancelled) return;
        setHistory(await listHunts());
        if (!cancelled) setToast(`${synced} offline hunt${synced === 1 ? "" : "s"} synced.`);
      } catch {
        if (!cancelled) setToast("You are back online, but offline hunts could not sync yet. BlindIQ will try again later.");
      }
    }

    function handleOffline() {
      setIsOnline(false);
    }

    function handleOnline() {
      setIsOnline(true);
      void flushOfflineHunts();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    void flushOfflineHunts();
    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [accountUserId, isPremium]);

  useEffect(() => {
    if (!isPremium || !accountUserId) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError("");
    void listHunts()
      .then((records) => {
        if (!cancelled) setHistory(records);
      })
      .catch((cause) => {
        if (!cancelled) setHistoryError(cause instanceof Error ? cause.message : "Unable to load saved hunts.");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountUserId, isPremium]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const user = await withTimeout(
          restoreRememberedUser(),
          SESSION_RESTORE_TIMEOUT_MS,
          "The device check took too long. Please log in again.",
        );
        if (!user || cancelled) return;
        setUserName(user.name);
        setAccountEmail(user.email);
        setAccountUserId(user.id);
        const [membershipResult, savedStateResult] = await Promise.allSettled([
          withTimeout(getSubscription(), SESSION_RESTORE_TIMEOUT_MS, "Membership check timed out."),
          withTimeout(getDefaultState(), SESSION_RESTORE_TIMEOUT_MS, "Default-state check timed out."),
        ]);
        if (cancelled) return;
        const membership = membershipResult.status === "fulfilled"
          ? membershipResult.value
          : { status: "inactive", isPremium: false, currentPeriodEnd: null };
        const savedState = savedStateResult.status === "fulfilled" ? savedStateResult.value : "MD";
        const nextState = states.find((state) => state.code === savedState) ?? states[0];
        setDefaultStateCode(nextState.code);
        setStateCode(nextState.code);
        setZone(nextState.zones[0]);
        setHarvest({}); setSaw({});
        setIsPremium(membership.isPremium);
        setSubscriptionStatus(membership.status);
        setSubscriptionPeriodEnd(membership.currentPeriodEnd);
        if (membership.isPremium) {
          const requestedView = new URLSearchParams(window.location.search).get("view");
          setView(requestedView === "migration" || requestedView === "history" || requestedView === "account" || requestedView === "notifications" ? requestedView : "dashboard");
          void loadNotificationAccount(nextState.code);
        } else {
          setView("account");
        }
        if (membershipResult.status === "rejected" || savedStateResult.status === "rejected") {
          setToast("Your login was restored, but some account details could not be refreshed. Please try again when connected.");
        }
        if (membership.isPremium && !isInstalledApp() && sessionStorage.getItem(INSTALL_NUDGE_SESSION_KEY) !== "shown") {
          sessionStorage.setItem(INSTALL_NUDGE_SESSION_KEY, "shown");
          setInstallGuideOpen(true);
        }
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
      const user = await withTimeout(
        signIn(email, password, shouldRememberDevice),
        SESSION_RESTORE_TIMEOUT_MS,
        "Login took too long. Check your connection and try again.",
      );
      setUserName(user.name);
      setAccountEmail(user.email);
      setAccountUserId(user.id);
      const [membership, savedState] = await Promise.all([
        withTimeout(getSubscription(), SESSION_RESTORE_TIMEOUT_MS, "Membership check timed out."),
        withTimeout(getDefaultState(), SESSION_RESTORE_TIMEOUT_MS, "Default-state check timed out."),
      ]);
      const validState = states.some((state) => state.code === savedState) ? savedState : "MD";
      setDefaultStateCode(validState);
      selectState(validState);
      setIsPremium(membership.isPremium);
      setSubscriptionStatus(membership.status);
      setSubscriptionPeriodEnd(membership.currentPeriodEnd);
      if (membership.isPremium) {
        setView("dashboard");
        void loadNotificationAccount(validState);
        if (!isInstalledApp()) {
          sessionStorage.setItem(INSTALL_NUDGE_SESSION_KEY, "shown");
          setInstallGuideOpen(true);
        }
      } else {
        const checkoutResult = beginCheckout(user.id, user.email);
        if (checkoutResult === "demo") {
          setToast("Stripe checkout is not configured.");
          setView("account");
        }
      }
      return;
    }

    const user = await withTimeout(
      signUp(username, email, password, shouldRememberDevice),
      SESSION_RESTORE_TIMEOUT_MS,
      "Account creation took too long. Check your connection and try again.",
    );
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

  async function manageMembership() {
    if (managingMembership) return;
    setManagingMembership(true);
    setToast("");
    try {
      const result = await openCustomerPortal();
      if (result === "demo") setToast("Membership management becomes available when Supabase and Stripe are connected.");
      if (result === "offline") setToast("Connect to the internet to manage or cancel your membership.");
    } catch (cause) {
      setToast(cause instanceof Error ? cause.message : "Membership management could not be opened.");
    } finally {
      setManagingMembership(false);
    }
  }

  function addBird(bird: BirdRule) {
    if (remaining(bird) <= 0) return;
    setHarvest((current) => (!isWaterfowl || remainingBirds(selected, bird, current, zone, regulationDate) > 0)
      ? { ...current, [bird.id]: (current[bird.id] ?? 0) + 1 } : current);
    setToast(`${bird.label} added`);
    if (!isSimulation && isWaterfowl) void touchActiveHunt(zone);
    window.setTimeout(() => setToast(""), 1500);
  }

  function removeBird(id: string) {
    setHarvest((current) => ({ ...current, [id]: Math.max(0, (current[id] ?? 0) - 1) }));
    if (!isSimulation && isWaterfowl) void touchActiveHunt(zone);
  }

  const entries: HarvestEntry[] = buildSessionEntries(sessionSpecies, harvest, saw);

  const currentShareInput = {
    state: location.name,
    zone: sessionZone,
    entries,
    duckCount,
    gooseCount,
    totalCount,
    huntCategoryLabel: category.label,
    isSimulation,
    blindName: blindName.trim(),
    firearmUsed: firearmUsed.trim(),
    photo: huntPhoto,
  };
  const shareCardSignature = JSON.stringify({
    view,
    state: location.code,
    zone,
    entries: entries.map((entry) => [entry.id, entry.count, entry.saw]),
    duckCount,
    gooseCount,
    isSimulation,
    blindName,
    firearmUsed,
    photo: huntPhoto ? `${huntPhoto.size}:${huntPhoto.type}` : "",
  });

  useEffect(() => {
    if (view !== "summary") {
      setPreparedShareFile(null);
      setPreparingShareFile(false);
      return;
    }
    let cancelled = false;
    setPreparingShareFile(true);
    void createHuntShareFile(currentShareInput)
      .then((file) => {
        if (!cancelled) setPreparedShareFile(file);
      })
      .catch(() => {
        if (!cancelled) setPreparedShareFile(null);
      })
      .finally(() => {
        if (!cancelled) setPreparingShareFile(false);
      });
    return () => {
      cancelled = true;
    };
    // shareCardSignature intentionally captures the serializable share-card content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCardSignature]);

  async function saveHunt() {
    if (huntSaved) return;
    setSavingHunt(true);
    setToast("");
    try {
      const record = await saveHuntRecord({
        stateCode: location.code,
        state: location.name,
        zone: sessionZone,
        entries,
        isSimulation,
        huntCategory: categoryId,
        seasonYear: isWaterfowl ? selected.seasonYear : undefined,
        blindName: blindName.trim(),
        firearmUsed: firearmUsed.trim(),
        notes: huntNotes.trim(),
      }, isSimulation ? null : huntPhoto);
      setHistory((current) => [record, ...current.filter((hunt) => hunt.id !== record.id)]);
      setHuntSaved(true);
      if (!isSimulation && isWaterfowl) await finishActiveHunt("saved");
      setToast(record.id.startsWith("offline-") ? "Hunt saved offline. It will sync automatically when service returns." : isSimulation ? "Test hunt saved. You can share it or open your logbook." : "Hunt saved. You can share it or open your logbook.");
    } catch (cause) {
      setToast(cause instanceof Error ? `Hunt not saved: ${cause.message}` : "Hunt not saved. Please try again.");
    } finally {
      setSavingHunt(false);
    }
  }

  function finishSavedHunt() {
    setSessionOpen(false);
    setHarvest({}); setSaw({});
    setHuntSaved(false);
    setPreparedShareFile(null);
    clearHuntPhoto();
    clearHuntDetails();
    setToast("");
    setHistoryFilter("all");
    setView("history");
  }

  async function prepareShare(mode: "share" | "download") {
    setSharingHunt(true);
    setToast("");
    try {
      const file = preparedShareFile ?? await createHuntShareFile(currentShareInput);
      if (mode === "download") {
        downloadHuntShareFile(file);
        setToast("Backup image downloaded.");
        return;
      }
      const result = await shareHuntFile(file, currentShareInput);
      setToast(result === "shared" ? "Choose Facebook, Instagram, Messages, or another app." : "Sharing is not supported here, so the hunt card was downloaded.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setToast(cause instanceof Error ? cause.message : "The hunt card could not be prepared.");
    } finally {
      setSharingHunt(false);
    }
  }

  async function shareSavedHunt(hunt: HuntRecord) {
    if (sharingHistoryId) return;
    setSharingHistoryId(hunt.id);
    setToast("");
    try {
      const savedDuckCount = hunt.entries.filter((entry) => entry.group === "Ducks").reduce((sum, entry) => sum + entry.count, 0);
      const savedGooseCount = hunt.entries.filter((entry) => entry.group === "Geese").reduce((sum, entry) => sum + entry.count, 0);
      const shareInput = {
        state: hunt.state,
        zone: hunt.zone,
        entries: hunt.entries,
        duckCount: savedDuckCount,
        gooseCount: savedGooseCount,
        totalCount: hunt.entries.reduce((sum, entry) => sum + entry.count, 0),
        huntCategoryLabel: huntCategoryById(hunt.huntCategory ?? "waterfowl").label,
        isSimulation: hunt.isSimulation,
        date: hunt.date,
        blindName: hunt.blindName,
        firearmUsed: hunt.firearmUsed,
        photo: hunt.photoUrl,
      };
      const file = await createHuntShareFile(shareInput);
      const result = await shareHuntFile(file, shareInput);
      setToast(result === "shared" ? "Choose where to share your saved hunt." : "Sharing is not supported here, so the hunt card was downloaded.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setToast(cause instanceof Error ? cause.message : "That saved hunt could not be shared.");
    } finally {
      setSharingHistoryId("");
    }
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
            <p className="eyebrow">DIGITAL FIELD GUIDE + MULTI-SPECIES HUNT LOG</p>
            <h1>Hunt.<br />Log.<br />Share</h1>
            <div className="welcome-trial"><strong>7 DAYS FREE</strong><span>Then only $10.99/year</span></div>
            <p className="welcome-intro">Start a hunt, log your harvest, save photos and field notes, and share the memory—with verified waterfowl guidance and simple field logs for other game.</p>
            <BrandPromise />
            <div className="welcome-device-note"><span aria-hidden="true">●</span> Installable website app • Works offline after first load</div>
          </div>
          <div className="welcome-actions">
            <button className="button button--gold button--wide" onClick={() => setView("signup")}>Start my 7-day free trial</button>
            <button className="button button--ghost button--wide" onClick={() => setView("login")}>I already have an account</button>
          </div>
          <small>Always verify current rules with the official wildlife agency before hunting.</small>
        </div>
      </div>
    );
  }

  if (view === "login" || view === "signup") {
    return <AuthScreen mode={view} onSubmit={authenticate} onSwitch={() => setView(view === "login" ? "signup" : "login")} onBack={() => setView("welcome")} />;
  }

  if (view === "terms") {
    return <Shell view={view} setView={setView} userName={userName} isPremium={isPremium} installUi={installUi} isOnline={isOnline} unreadNotifications={unreadNotifications}><div className="page legal-page"><button className="back-link legal-back" onClick={() => setView("account")}>← Back to account</button><LegalDocument /></div></Shell>;
  }

  if (view === "feedback") {
    return <Shell view={view} setView={setView} userName={userName} isPremium={isPremium} installUi={installUi} isOnline={isOnline} unreadNotifications={unreadNotifications}><FeedbackForm stateName={location.name} accountEmail={accountEmail} onBack={() => setView(feedbackReturn)} /></Shell>;
  }

  return (
    <Shell view={view} setView={setView} userName={userName} isPremium={isPremium} installUi={installUi} isOnline={isOnline} unreadNotifications={unreadNotifications}>
      {view === "dashboard" && (
        <div className="page dashboard">
          <div className="greeting"><p className="eyebrow">BLINDIQ • YOUR HUNTING FIELD LOG</p><h1>Start your next hunt.</h1><small>Choose your hunt. Log in a tap. Save the memory.</small></div>
          <section className="session-picker" aria-label="Choose hunt type">
            <label htmlFor="hunt-type">WHAT ARE YOU HUNTING?</label>
            <select id="hunt-type" disabled={sessionOpen} value={categoryId} onChange={(event) => { setCategoryId(event.target.value as HuntCategoryId); setSpeciesSearch(""); setHarvest({}); setSaw({}); setSessionArea(""); }}>
              {huntCategories.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.label}</option>)}
            </select>
            <p>{isWaterfowl ? "Verified waterfowl bag guidance + field log" : "Field log • Seasons, tags and bag limits are not loaded"}</p>
          </section>
          <section className="state-picker">
            <label htmlFor="state">WHERE ARE YOU HUNTING?</label>
            <select id="state" disabled={sessionOpen} value={isWaterfowl ? stateCode : fieldStateCode} onChange={(e) => isWaterfowl ? selectState(e.target.value) : setFieldStateCode(e.target.value)}>
              {(isWaterfowl ? sortedStates : huntingLocations).map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
            </select>
          </section>

          <div className="hunt-actions">
            <button className="button button--gold button--start" disabled={isWaterfowl && selected.dataStatus === "archived"} onClick={() => sessionOpen ? setView(huntSaved ? "summary" : "hunt") : startHunt(false)}><span>{isWaterfowl && selected.dataStatus === "archived" ? "LIVE HUNT UNAVAILABLE" : sessionOpen ? "RESUME SESSION" : isPremium ? `START ${category.shortLabel.toUpperCase()} HUNT` : "UNLOCK START HUNT"}</span><small>{isWaterfowl && selected.dataStatus === "archived" ? "Archived rules cannot guide a live hunt" : isPremium ? "Open the field logger →" : "$10.99/year →"}</small></button>
            <div className="hunt-secondary-actions">
              <button className="button button--test" type="button" disabled={sessionOpen} onClick={() => startHunt(true)}><span>TEST THE LOGGER</span><small>Practice without changing live totals →</small></button>
              <aside className="group-hunt-preview" aria-label="Group Hunt Mode in development">
                <span>GROUP HUNT MODE</span>
                <small>IN DEVELOPMENT</small>
              </aside>
            </div>
          </div>

          <section className="logbook-snapshot">
            <div className="logbook-snapshot__heading"><div><p className="eyebrow">YOUR HUNT LOGBOOK</p><h2>Your season, saved.</h2></div><button type="button" onClick={() => setView("history")}>Open logbook →</button></div>
            <div className="logbook-snapshot__stats"><div><strong>{liveHistory.length}</strong><span>Hunts</span></div><div><strong>{liveBirdCount}</strong><span>Harvests</span></div><div><strong>{new Set(liveHistory.map((hunt) => hunt.state)).size}</strong><span>States</span></div></div>
            <p>{lastLiveHunt ? <>Last hunt: <strong>{lastLiveHunt.state}</strong> • {lastLiveHunt.date} • {lastLiveHunt.entries.reduce((sum, entry) => sum + entry.count, 0)} harvested</> : "Your first saved hunt will begin a permanent season-by-season field record."}</p>
          </section>

          {isWaterfowl && <section className={`status-banner status-banner--${dashboardSeasonStatus.kind}`} role="status">
            <div className="status-icon">{dashboardSeasonStatus.icon}</div>
            <div><span>QUICK SEASON CHECK • {location.name.toUpperCase()}</span><strong>{dashboardSeasonStatus.headline}</strong><p>{dashboardSeasonStatus.message}</p></div>
          </section>}

          {isWaterfowl && selected.dataNotice && (
            <aside className="data-notice" role="alert">
              <div>!</div>
              <p><strong>{selected.dataStatus === "archived" ? "Archived season data" : "Regulation data notice"}</strong>{selected.dataNotice}</p>
            </aside>
          )}

          <button className="migration-teaser" type="button" onClick={() => setView("migration")}>
            <span className="migration-teaser__mark">⇅</span>
            <span><small>NEW • EARLY ACCESS</small><strong>Migration Pulse</strong><b>All four U.S. flyways</b></span>
            <em>Open forecast →</em>
          </button>

          {isWaterfowl && <section className="section">
            <div className="section-heading"><div><p className="eyebrow">DIGITAL FIELD GUIDE • SEASON OVERVIEW</p><h2>{location.name} waterfowl</h2></div><span className="verified">{selected.seasonYear ?? "Demo data"}</span></div>
            <p className="muted">{selected.overview}</p>
            <div className="season-list">
              {selected.seasons.map((season) => (
                <article className="season-row" key={`${season.name}-${season.zone}`}>
                  <div><strong>{season.name}</strong><span>{season.zone}</span></div>
                  <p>{season.dates}</p>
                </article>
              ))}
            </div>
          </section>}

          {isWaterfowl && !!selected.specialRules?.length && (
            <section className="section special-rules">
              <div className="section-heading"><div><p className="eyebrow">IMPORTANT RESTRICTIONS</p><h2>Before you hunt</h2></div></div>
              <ul>{selected.specialRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            </section>
          )}

          {isWaterfowl && <section className="info-grid">
            <article className="info-card"><Icon>⌖</Icon><span>Zones</span><strong>{selected.zones.length} loaded</strong><p>{selected.zones.join(" • ")}</p></article>
            <article className="info-card"><Icon>◷</Icon><span>Shooting hours</span><strong>Check daily</strong><p>{selected.shootingHours}</p></article>
            <article className="info-card"><Icon>▤</Icon><span>Daily duck bag</span><strong>{duckDailyLimit} ducks</strong><p>{selected.duckDailyLimits ? "Changes with the selected flyway or zone." : "Species and sex restrictions apply."}</p></article>
            <article className="info-card"><Icon>↗</Icon><span>Reviewed sources</span><strong>Verify before hunting</strong>{(selected.sourceLinks ?? [{ label: "Agency regulations", url: selected.officialUrl }]).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">Open {source.label}</a>)}</article>
          </section>}

          {isWaterfowl && <section className="species-section section">
            <div className="section-heading"><div><p className="eyebrow">LOADED BAG RULES</p><h2>Ducks & geese</h2></div></div>
            <div className="chip-list">{selected.birds.map((bird) => <span key={bird.id}>{bird.label} <b>{limitForBird(bird)}</b></span>)}</div>
          </section>}
          {!isWaterfowl && <aside className="field-log-notice"><strong>{category.label} • field log</strong><p>{category.description} The catalog is a logging menu; species availability and legal seasons depend on your location.</p><a href={agencyUrl} target="_blank" rel="noreferrer">{location.name} wildlife agency ↗</a><a href="https://www.fws.gov/law/general-hunting-laws" target="_blank" rel="noreferrer">Federal refuge hunting reference ↗</a></aside>}

          <footer className="dashboard-end">
            <aside className="disclaimer"><Icon>!</Icon><p><strong>Digital field guide and field log—not legal advice.</strong> BlindIQ simplifies regulations and records harvests. Hunters remain responsible for following all federal, state, and local laws. Always verify current rules with the official wildlife agency before hunting.</p></aside>

            <section className="community-card community-card--dashboard"><div className="community-card__icon">+</div><div><p className="eyebrow">BETTER THE COMMUNITY</p><h2>See something we can improve?</h2><p>Send regulation corrections, app bugs, and ideas directly to the BlindIQ team.</p></div><button className="button button--gold" type="button" onClick={() => openFeedback("dashboard")}>Send feedback</button></section>
            <small className="version-stamp">BlindIQ v1.62.1</small>
          </footer>
        </div>
      )}

      {view === "hunt" && (
        <div className={`hunt-page ${isSimulation ? "hunt-page--simulation" : ""}`}>
          {toast && <div className="toast">✓ {toast}</div>}
          <header className="hunt-header">
            <button onClick={() => setView("dashboard")}>←</button>
            <div><span>{isSimulation ? `${category.shortLabel.toUpperCase()} • TEST HUNT` : `ACTIVE ${category.shortLabel.toUpperCase()} HUNT`}</span><strong>{location.name}</strong></div>
            <button className="end-button" onClick={() => setView("summary")}>Finish</button>
          </header>
          <div className="hunt-content">
            {isSimulation && <aside className="simulation-notice"><strong>Simulation mode</strong><p>Practice the logger. Waterfowl includes bag-limit guidance. This hunt will be saved as a test and excluded from your live harvest totals.</p></aside>}
            <section className="hunt-location">
              {isWaterfowl ? <><label>HUNTING ZONE</label>
              <select value={zone} onChange={(e) => { setZone(e.target.value); if (!isSimulation && isWaterfowl) void touchActiveHunt(e.target.value); }}>{selected.zones.map((item) => <option key={item}>{item}</option>)}</select></> : <label>AREA / UNIT / PROPERTY (OPTIONAL)<input value={sessionArea} onChange={(event) => setSessionArea(event.target.value)} maxLength={120} placeholder="Unit 12, north stand or private land" /></label>}
              <p><span className="pulse" /> Hunt session active</p>
            </section>
            {isWaterfowl && <section className="bag-meter">
              <div><span>LIVE DUCK BAG</span><strong>{duckCount}<small>/{duckDailyLimit}</small></strong></div>
              <div className="meter"><i style={{ width: `${Math.min(100, duckCount / duckDailyLimit * 100)}%` }} /></div>
              <p>{duckCount >= duckDailyLimit ? "Daily duck bag filled. Stop harvesting ducks." : `${duckDailyLimit - duckCount} duck${duckDailyLimit - duckCount === 1 ? "" : "s"} remain in the aggregate bag.`}</p>
            </section>}
            {isWaterfowl ? <p className="disclaimer">Bag guidance for {regulationDate}. Confirm species season, zone, permits and eligibility. Counts cover this hunt; include birds taken earlier today when checking your daily bag.</p> : <aside className="field-log-notice"><strong>Field log only</strong><p>Record your session and harvest. Seasons, tags, permits and bag limits are not loaded for {category.label.toLowerCase()}. Check the official agency rules for your exact hunt.</p><a href={agencyUrl} target="_blank" rel="noreferrer">State wildlife agency ↗</a></aside>}
            <section className="harvest-panel">
              <div className="section-heading harvest-heading"><div><p className="eyebrow">DIGITAL FIELD LOG • QUICK ADD</p><h2>What did you see?</h2></div><div className="harvest-heading__actions"><span>{totalSaw} saw • {totalCount} harvested</span>{isWaterfowl && <button type="button" onClick={() => setView("bird-guide")}>Not sure? <b>Open field guide</b></button>}</div></div>
              <label className="species-search">Find a species<input type="search" value={speciesSearch} onChange={(event) => setSpeciesSearch(event.target.value)} placeholder="Search species…" /></label>
              <p className="sighting-help">Log sightings and harvest separately. Saw counts never change bag limits.</p>
              <div className="bird-list bird-list--observations">
                {visibleSpecies.length === 0 && <p className="empty">No matching species. Try another name or clear the search.</p>}
                {visibleSpecies.map((bird) => (
                  <article className={remaining(bird) === 0 ? "bird-row bird-row--full" : "bird-row"} key={bird.id}>
                    {isWaterfowl ? <BirdReferencePhoto bird={bird} /> : <span className="game-icon" aria-hidden="true">{bird.icon}</span>}
                    <div className="bird-name"><strong>{bird.label}</strong><span>{isWaterfowl ? `${bird.group} • ${remaining(bird)} remaining` : bird.group}</span></div>
                    <div className="observation-counter observation-counter--saw">
                      <span>Saw</span>
                      <div><button type="button" className="minus" disabled={!saw[bird.id]} onClick={() => setSaw((current) => changeSightings(current, bird.id, -1))} aria-label={`Remove sighting of ${bird.label}`}>−</button><b>{saw[bird.id] ?? 0}</b><button type="button" className="plus" onClick={() => setSaw((current) => changeSightings(current, bird.id, 1))} aria-label={`Saw ${bird.label}`}>+</button></div>
                    </div>
                    <div className="observation-counter observation-counter--harvest">
                      <span>Harvested</span>
                      <div><button type="button" className="minus" disabled={!harvest[bird.id]} onClick={() => removeBird(bird.id)} aria-label={`Remove ${bird.label}`}>−</button><b className="count">{harvest[bird.id] ?? 0}</b><button type="button" className="plus" disabled={remaining(bird) === 0} onClick={() => addBird(bird)} aria-label={`Add ${bird.label}`}>+</button></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            {isWaterfowl && <section className="legal-next">
              <p className="eyebrow">FIELD GUIDE • LIVE GUIDANCE</p>
              <h2>Bag space remaining</h2>
              <div className="legal-grid">
                {availableBirds.slice(0, 8).map((bird) => <div key={bird.id}><span>✓</span><p><strong>{bird.label}</strong><small>{remaining(bird)} remaining</small></p></div>)}
                {availableBirds.length === 0 && <p className="bag-full">No bag space is shown under the loaded rules.</p>}
              </div>
              <small className="guidance-note">Loaded bag rules and this hunt only. Species seasons and special restrictions still apply.</small>
            </section>}
          </div>
          <button className="finish-bar" onClick={() => setView("summary")}>Review & finish hunt <span>→</span></button>
        </div>
      )}

      {view === "bird-guide" && <BirdGuide onBack={() => setView("hunt")} />}

      {view === "summary" && (
        <div className="page summary-page">
          {!huntSaved && <button className="back-link" onClick={() => setView("hunt")}>← Back to hunt</button>}
          <div className={`summary-hero ${isSimulation ? "summary-hero--simulation" : ""}`}><span>{isSimulation ? "TEST FIELD LOG COMPLETE" : huntSaved ? "FIELD LOG SAVED" : "HUNT COMPLETE"}</span><h1>{isSimulation ? "Test complete." : huntSaved ? "Hunt saved." : "Finish your field log."}</h1><p>{category.label} • {location.name} • {sessionZone}</p></div>
          <section className="summary-observations"><div><span>SAW</span><strong>{totalSaw}</strong></div><div><span>HARVESTED</span><strong>{totalCount}</strong></div></section>
          <section className="summary-total"><span>TOTAL HARVEST</span><strong>{totalCount}</strong><p>{isWaterfowl ? `${duckCount} ducks • ${gooseCount} geese • ${totalCount - duckCount - gooseCount} other` : category.label}</p></section>
          <section className="section"><h2>Today’s sightings & harvest</h2>{entries.length ? entries.map((entry) => <div className="summary-row" key={entry.id}><span>{entry.label}</span><strong>Saw {entry.saw ?? 0} • Harvested {entry.count}</strong></div>) : <p className="empty">No sightings or harvest logged. You can still save this session.</p>}</section>
          <section className="hunt-details-card">
            <div className="hunt-details-card__heading"><div><p className="eyebrow">FIELD LOG DETAILS • OPTIONAL</p><h2>Remember the hunt.</h2></div><span>▤</span></div>
            <div className="hunt-details-grid">
              <label htmlFor="hunt-blind-name">BLIND / STAND / LOCATION<input id="hunt-blind-name" type="text" maxLength={120} value={blindName} disabled={huntSaved} onChange={(event) => setBlindName(event.target.value)} placeholder="Blackwater blind 12 or Dad’s marsh" /></label>
              <label htmlFor="hunt-firearm-used">FIREARM / BOW USED<input id="hunt-firearm-used" type="text" maxLength={120} value={firearmUsed} disabled={huntSaved} onChange={(event) => setFirearmUsed(event.target.value)} placeholder="12-gauge Beretta A400" /></label>
              <label className="hunt-details-notes" htmlFor="hunt-notes">NOTES<textarea id="hunt-notes" maxLength={2000} rows={5} value={huntNotes} disabled={huntSaved} onChange={(event) => setHuntNotes(event.target.value)} placeholder="Weather, hunting partners, dog work, memorable moments, or anything you want to remember…" /></label>
            </div>
            <small>{huntNotes.length}/2,000 characters • Exact GPS coordinates are not recorded.</small>
          </section>
          {!isSimulation && (!huntSaved || huntPhotoPreview) && (
            <section className={`hunt-photo-card ${huntPhotoPreview ? "hunt-photo-card--selected" : ""}`}>
              {huntPhotoPreview ? <img src={huntPhotoPreview} alt="Selected harvest" /> : <div className="hunt-photo-card__camera" aria-hidden="true">◎</div>}
              <div className="hunt-photo-card__content">
                <p className="eyebrow">HUNT MEMORY • OPTIONAL</p>
                <h2>{huntPhotoPreview ? huntSaved ? "Harvest photo saved." : "Harvest photo ready." : "Add a harvest photo."}</h2>
                <p>{huntPhotoPreview ? "This private photo stays with your BlindIQ hunt record." : "Take a picture now or choose one from your photo library."}</p>
                {!huntSaved && <>
                  <div className="hunt-photo-card__actions"><label className="button button--gold" htmlFor="hunt-harvest-photo-camera">{photoProcessing ? "Preparing…" : huntPhotoPreview ? "Retake photo" : "Take photo"}</label><label className="button hunt-photo-library" htmlFor="hunt-harvest-photo-library">Choose photo</label>{huntPhotoPreview && <button type="button" onClick={clearHuntPhoto}>Remove</button>}</div>
                  <input id="hunt-harvest-photo-camera" className="visually-hidden" type="file" accept="image/*" capture="environment" disabled={photoProcessing} onChange={(event) => void chooseHuntPhoto(event)} />
                  <input id="hunt-harvest-photo-library" className="visually-hidden" type="file" accept="image/*" disabled={photoProcessing} onChange={(event) => void chooseHuntPhoto(event)} />
                </>}
                <small>Private to your account. BlindIQ does not add exact GPS coordinates to the photo record.</small>
              </div>
            </section>
          )}
          {photoError && <div className="history-error" role="alert"><strong>Photo not added.</strong><span>{photoError}</span></div>}
          {toast && <div className="inline-toast">{toast}</div>}
          {!huntSaved && <button className="button button--gold button--wide" disabled={savingHunt || photoProcessing} onClick={() => void saveHunt()}>{savingHunt ? huntPhoto ? "Uploading photo & saving…" : "Saving…" : isSimulation ? "Save Test Hunt to Logbook" : "Save Hunt to Logbook"}</button>}
          <section className={`share-hunt-card ${huntSaved ? "share-hunt-card--ready" : ""}`}>
            <div className="share-hunt-card__icon">↗</div>
            <div><p className="eyebrow">SAVE IT • SHARE IT</p><h2>{huntSaved ? "Your hunt card is ready." : "Save the hunt, then share it."}</h2><p>Open your phone’s sharing menu and send the finished card directly to Facebook, Instagram, Messages, and more. No camera-roll step required on supported phones.</p></div>
            <div className="share-targets" aria-label="Sharing options"><span>Facebook</span><span>Instagram</span><span>Messages</span></div>
            <div className="share-hunt-actions"><button className="button button--gold" disabled={sharingHunt || preparingShareFile || !huntSaved} type="button" onClick={() => void prepareShare("share")}>{!huntSaved ? "Save hunt first" : sharingHunt ? "Opening share menu…" : preparingShareFile ? "Preparing card…" : "Share to social media"}</button><button className="button share-download" disabled={sharingHunt || preparingShareFile || !huntSaved} type="button" onClick={() => void prepareShare("download")}>Download backup</button></div>
          </section>
          {huntSaved ? <button className="button button--wide share-history-button" type="button" onClick={finishSavedHunt}>Open Hunt Logbook</button> : <button className="text-button" onClick={() => { if (!isSimulation && isWaterfowl) void finishActiveHunt("discarded"); setSessionOpen(false); setHarvest({}); setSaw({}); setHuntSaved(false); clearHuntPhoto(); clearHuntDetails(); setView("dashboard"); }}>Discard hunt</button>}
        </div>
      )}

      {view === "history" && (
        <div className="page history-page">
          <div className="page-title"><p className="eyebrow">DIGITAL FIELD LOG • YOUR SEASON</p><h1>Hunt logbook</h1><p>Every hunt, harvest, photo, location, equipment choice, and field note—saved by season and ready to share from any internet-connected device.</p></div>
          {!isPremium && <section className="locked-card"><span>MEMBERSHIP REQUIRED</span><h2>Unlock your hunt history</h2><p>Activate your BlindIQ membership to save and revisit every hunt.</p><button className="button button--gold" onClick={() => setView("account")}>View membership</button></section>}
          {isPremium && <>
          <label className="history-filter">SHOW HUNTS<select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option value="all">All species</option>{huntCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <div className="stats-strip"><div><strong>{liveHistory.length}</strong><span>Live hunts</span></div><div><strong>{liveBirdCount}</strong><span>Harvests</span></div><div><strong>{new Set(liveHistory.map((hunt) => hunt.state)).size}</strong><span>States</span></div></div>
          {toast && <div className="inline-toast">{toast}</div>}
          {historyLoading && <p className="history-status">Loading your hunts…</p>}
          {historyError && <div className="history-error" role="alert"><strong>Saved hunts could not be loaded.</strong><span>{historyError}</span></div>}
          {!historyLoading && !historyError && filteredHistory.length === 0 && <section className="empty-history"><h2>No hunts saved yet.</h2><p>Start a live hunt or use Test Hunt to practice. Zero-harvest hunts can also be saved.</p></section>}
          <div className="history-list">
            {filteredHistory.map((hunt) => (
              <article className={hunt.isSimulation ? "history-row--simulation" : ""} key={hunt.id}>
                {hunt.photoUrl ? <a className="history-photo" href={hunt.photoUrl} target="_blank" rel="noreferrer" aria-label={`Open harvest photo from ${hunt.date}`}><img src={hunt.photoUrl} alt="Saved harvest" /></a> : <div className="date-tile"><strong>{hunt.date.split(" ")[1]?.replace(",", "")}</strong><span>{hunt.date.split(" ")[0]?.slice(0, 3)}</span></div>}
                <div><strong>{hunt.state}{hunt.isSimulation && <em>TEST</em>}{hunt.id.startsWith("offline-") && <em>OFFLINE</em>}{hunt.photoUrl && <em>PHOTO</em>}</strong><span>{huntCategoryById(hunt.huntCategory ?? "waterfowl").shortLabel} • {hunt.zone} • {hunt.date}</span><p>{hunt.entries.length ? hunt.entries.map((entry) => `${entry.label}: ${entry.saw === undefined ? "" : `Saw ${entry.saw} • `}Harvested ${entry.count}`).join(" • ") : "Zero-harvest hunt"}</p>{(hunt.blindName || hunt.firearmUsed || hunt.notes) && <div className="history-field-details">{hunt.blindName && <span><b>Blind</b>{hunt.blindName}</span>}{hunt.firearmUsed && <span><b>Firearm</b>{hunt.firearmUsed}</span>}{hunt.notes && <p><b>Notes</b>{hunt.notes}</p>}</div>}</div>
                <div className="history-actions"><b>{hunt.entries.reduce((sum, entry) => sum + entry.count, 0)}</b><button type="button" disabled={sharingHistoryId === hunt.id} onClick={() => void shareSavedHunt(hunt)}>{sharingHistoryId === hunt.id ? "Preparing…" : "↗ Share"}</button></div>
              </article>
            ))}
          </div>
          </>}
        </div>
      )}

      {view === "migration" && <MigrationPage stateCode={stateCode} isOnline={isOnline} />}

      {view === "notifications" && <NotificationsPage defaultState={defaultStateCode} states={states} onInstall={() => setInstallGuideOpen(true)} onNavigate={navigateNotification} onUnreadChange={setUnreadNotifications} />}

      {view === "account" && (
        <div className="page account-page">
          <div className="page-title"><p className="eyebrow">{isPremium ? "MEMBERSHIP" : "ONE LAST STEP"}</p><h1>{isPremium ? "Your BlindIQ account" : "Activate your membership"}</h1>{!isPremium && <p>Complete secure checkout to unlock the hunt dashboard.</p>}</div>
          <section className="profile-card"><div className="profile-avatar">{userName.slice(0, 1)}</div><div><strong>{userName}</strong><span>{accountEmail || `@${userName.toLowerCase()}`}</span></div><span className="demo-pill">{isDemoMode ? "DEMO" : subscriptionStatus === "trialing" ? "TRIAL" : isPremium ? "ACTIVE" : "INACTIVE"}</span></section>
          <section className="default-state-card">
            <div><p className="eyebrow">HUNTING PREFERENCE</p><h2>Default state</h2><p>BlindIQ will open your dashboard with this state selected.</p></div>
            <label htmlFor="default-state">DEFAULT HUNTING STATE<select id="default-state" value={defaultStateCode} onChange={async (e) => { const code = e.target.value; setDefaultStateCode(code); try { await saveDefaultState(code); selectState(code); setToast(`${states.find((state) => state.code === code)?.name} saved as your default state.`); } catch (cause) { setToast(cause instanceof Error ? cause.message : "Unable to save your default state."); } }}>{sortedStates.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
          </section>
          <section className="premium-card">
            <p className="eyebrow">BLINDIQ ANNUAL MEMBERSHIP</p>
            <h2>Start hunts. Log your harvest. Save and share.</h2>
            <div className="trial-price"><strong>7 DAYS FREE</strong><span>Full access from the first hunt.</span></div>
            <div className="price"><strong>$10.99</strong><span>/ year after trial</span></div>
            <ul><li>✓ Fast hunt startup and multi-species harvest logging</li><li>✓ Unlimited saved hunts, photos, and field notes</li><li>✓ Direct social sharing with branded hunt cards</li><li>✓ Regulations, live bag guidance, and all four Migration Pulse flyways</li></ul>
            {isPremium ? <><div className="membership-active"><span>✓</span><div><strong>{subscriptionStatus === "trialing" ? "Free trial active" : "Membership active"}</strong><small>{subscriptionStatus === "trialing" && subscriptionPeriodEnd ? `Trial period ends ${new Date(subscriptionPeriodEnd).toLocaleDateString()}.` : "Verified through your BlindIQ membership record."}</small></div></div><button className="button membership-manage-button button--wide" type="button" disabled={managingMembership} onClick={() => void manageMembership()}>{managingMembership ? "Opening secure billing…" : subscriptionStatus === "trialing" ? "Manage or cancel free trial" : "Manage or cancel membership"}</button><small className="membership-manage-note">Opens Stripe securely to cancel, update your payment method, or review billing.</small></> : <button className="button button--gold button--wide" onClick={() => { const result = beginCheckout(accountUserId, accountEmail); if (result === "demo") setToast("Demo checkout — add Stripe settings to accept payment"); if (result === "offline") setToast("Connect to the internet to start your free trial."); }}>Start 7-day free trial</button>}
            <small>New members receive seven days free, then $10.99/year unless cancelled before the trial ends. Secure checkout is powered by Stripe.</small>
          </section>
          {toast && <div className="inline-toast">{toast}</div>}
          <section className="community-card"><div className="community-card__icon">+</div><div><p className="eyebrow">BETTER THE COMMUNITY</p><h2>Help improve BlindIQ.</h2><p>Submit regulation errors, app bugs, and ideas directly to the BlindIQ team.</p></div><button className="button button--gold" type="button" onClick={() => openFeedback("account")}>Send feedback</button></section>
          <section className="settings-list"><button onClick={async () => { const membership = await getSubscription(); setIsPremium(membership.isPremium); setSubscriptionStatus(membership.status); setSubscriptionPeriodEnd(membership.currentPeriodEnd); setToast(`Membership status refreshed: ${membership.status}`); }}>Refresh membership <span>›</span></button><button>Membership status <span>{subscriptionStatus}</span></button><button type="button" onClick={() => setView("notifications")}>Field alerts <span>{unreadNotifications ? `${unreadNotifications} NEW` : "›"}</span></button><button type="button" onClick={() => setInstallGuideOpen(true)}>Add BlindIQ to Home Screen <span>›</span></button><button>Offline field mode <span>{isOnline ? "READY" : "ACTIVE"}</span></button><button onClick={() => setView("terms")}>Terms of Use & User Agreement <span>›</span></button><button onClick={() => { window.location.href = "mailto:office@blindiq.app?subject=BlindIQ%20Support"; }}>Contact support <span>›</span></button><button onClick={async () => { await detachCurrentPushDevice(); await signOut(); sessionStorage.removeItem(INSTALL_NUDGE_SESSION_KEY); setUserName("Hunter"); setAccountEmail(""); setAccountUserId(""); setSessionOpen(false); setCategoryId("waterfowl"); setHarvest({}); setSaw({}); setSessionArea(""); setSpeciesSearch(""); setHistoryFilter("all"); clearHuntPhoto(); clearHuntDetails(); setHuntSaved(false); setHistory([]); setUnreadNotifications(0); setIsPremium(false); setView("welcome"); }}>Log out <span>›</span></button></section>
          <div className="integration-note"><strong>{isDemoMode ? "Demo connection" : "Account connection active"}</strong><p>{isDemoMode ? "Add Supabase environment settings to activate persistent accounts." : "Supabase is connected for persistent authentication. Stripe checkout will activate after its public payment link is added."}</p></div>
          <small className="version-stamp">BlindIQ v1.62.1</small>
        </div>
      )}
    </Shell>
  );
}
