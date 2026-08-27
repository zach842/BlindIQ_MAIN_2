import { useEffect, useMemo, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  ensureNotificationPreferences,
  getPushCapability,
  listNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences,
  sendTestNotification,
  type NotificationInboxItem,
  type NotificationPreferences,
} from "./notifications";
import type { StateData } from "./types";

type Props = {
  defaultState: string;
  states: StateData[];
  onInstall: () => void;
  onNavigate: (url: string) => void;
  onUnreadChange: (count: number) => void;
};

function inboxIcon(eventType: string) {
  if (eventType.startsWith("season_")) return "◐";
  if (eventType === "migration_threshold") return "⇅";
  if (eventType === "regulation_update") return "§";
  if (eventType === "hunt_reminder" || eventType === "hunt_milestone") return "✓";
  if (eventType === "membership_trial") return "$";
  return "•";
}

function formatAlertDate(value: string) {
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function NotificationsPage({ defaultState, states, onInstall, onNavigate, onUnreadChange }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [inbox, setInbox] = useState<NotificationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [stateToAdd, setStateToAdd] = useState(defaultState);
  const capability = getPushCapability();
  const sortedStates = useMemo(() => [...states].sort((a, b) => a.name.localeCompare(b.name)), [states]);
  const unread = inbox.filter((item) => !item.readAt).length;

  async function reloadInbox() {
    const items = await listNotificationInbox();
    setInbox(items);
    onUnreadChange(items.filter((item) => !item.readAt).length);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([ensureNotificationPreferences(defaultState), listNotificationInbox()])
      .then(([nextPreferences, items]) => {
        if (cancelled) return;
        setPreferences(nextPreferences);
        setInbox(items);
        onUnreadChange(items.filter((item) => !item.readAt).length);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Alerts could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [defaultState, onUnreadChange]);

  async function run(action: () => Promise<void>, success: string) {
    if (working) return;
    setWorking(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That alert setting could not be updated.");
    } finally {
      setWorking(false);
    }
  }

  function update(key: keyof NotificationPreferences, value: boolean | number | string[]) {
    setPreferences((current) => current ? { ...current, [key]: value } : current);
  }

  function addState() {
    if (!preferences || preferences.followedStates.includes(stateToAdd)) return;
    update("followedStates", [...preferences.followedStates, stateToAdd]);
  }

  function removeState(code: string) {
    if (!preferences || preferences.followedStates.length <= 1) {
      setMessage("Keep at least one state selected for season and regulation alerts.");
      return;
    }
    update("followedStates", preferences.followedStates.filter((state) => state !== code));
  }

  async function openItem(item: NotificationInboxItem) {
    if (!item.readAt) {
      await markNotificationRead(item.id);
      setInbox((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
      onUnreadChange(Math.max(0, unread - 1));
    }
    onNavigate(item.url);
  }

  if (loading || !preferences) {
    return <div className="page notifications-page"><div className="notifications-loading"><span /><p>Loading BlindIQ alerts…</p></div></div>;
  }

  return (
    <div className="page notifications-page">
      <header className="notifications-heading">
        <p className="eyebrow">BLINDIQ FIELD ALERTS</p>
        <h1>Stay ahead of the hunt.</h1>
        <p>Choose the useful updates you want. BlindIQ alerts are a planning aid—always verify official regulations before hunting.</p>
      </header>

      <section className={`push-status-card ${preferences.enabled ? "push-status-card--enabled" : ""}`}>
        <div className="push-status-card__icon">{preferences.enabled ? "✓" : "!"}</div>
        <div>
          <p className="eyebrow">DEVICE ALERTS</p>
          <h2>{preferences.enabled ? "Alerts are on." : capability.iosNeedsHomeScreen ? "Add BlindIQ first." : "Turn on field alerts."}</h2>
          <p>{preferences.enabled ? "This account is ready for push alerts on enabled devices." : capability.iosNeedsHomeScreen ? "Apple allows website push alerts after BlindIQ is added to your iPhone or iPad Home Screen." : "Get season, regulation, migration, hunt, and membership updates even when BlindIQ is closed."}</p>
        </div>
        {capability.iosNeedsHomeScreen ? (
          <button className="button button--gold" type="button" onClick={onInstall}>Add to Home Screen</button>
        ) : preferences.enabled ? (
          <div className="push-status-card__actions"><button className="button button--gold" disabled={working} type="button" onClick={() => void run(async () => { await sendTestNotification(); await reloadInbox(); }, "Test alert sent. Check this device.")}>Send test</button><button type="button" disabled={working} onClick={() => void run(async () => setPreferences(await disablePushNotifications(preferences)), "Push alerts are off.")}>Turn off</button></div>
        ) : (
          <button className="button button--gold" disabled={working || !capability.supported || !capability.configured} type="button" onClick={() => void run(async () => setPreferences(await enablePushNotifications(preferences)), "BlindIQ alerts are on for this device.")}>Allow notifications</button>
        )}
        {!capability.supported && <small>This browser does not support Web Push. Your in-app notification center still works.</small>}
        {!capability.configured && <small>The Web Push public key must be added to this deployment before device alerts can be enabled.</small>}
      </section>

      {message && <div className="inline-toast" role="status">{message}</div>}

      <section className="notification-settings-card">
        <div className="notification-section-title"><div><p className="eyebrow">WHAT BLINDIQ SENDS</p><h2>Alert preferences</h2></div><button className="button button--gold" disabled={working} type="button" onClick={() => void run(async () => setPreferences(await saveNotificationPreferences(preferences)), "Alert preferences saved.")}>Save</button></div>
        <div className="notification-toggle-list">
          <label><span><strong>Season openings & closings</strong><small>Tomorrow, opening day, final loaded day, and segment closing.</small></span><input type="checkbox" checked={preferences.seasonAlerts} onChange={(event) => update("seasonAlerts", event.target.checked)} /></label>
          <label><span><strong>Regulation updates</strong><small>New packages, corrected dates, and material rule changes.</small></span><input type="checkbox" checked={preferences.regulationAlerts} onChange={(event) => update("regulationAlerts", event.target.checked)} /></label>
          <label><span><strong>Migration Pulse</strong><small>Alerts when a followed flyway crosses your selected movement threshold.</small></span><input type="checkbox" checked={preferences.migrationAlerts} onChange={(event) => update("migrationAlerts", event.target.checked)} /></label>
          <label><span><strong>Unfinished hunt reminder</strong><small>A reminder after an online field log remains active for four hours.</small></span><input type="checkbox" checked={preferences.huntReminders} onChange={(event) => update("huntReminders", event.target.checked)} /></label>
          <label><span><strong>Trial & membership</strong><small>Including the day before your seven-day trial ends.</small></span><input type="checkbox" checked={preferences.membershipAlerts} onChange={(event) => update("membershipAlerts", event.target.checked)} /></label>
          <label><span><strong>Saved-hunt milestones</strong><small>Personal confirmations for standout hunts in your field log.</small></span><input type="checkbox" checked={preferences.huntMilestones} onChange={(event) => update("huntMilestones", event.target.checked)} /></label>
        </div>
      </section>

      <section className="notification-settings-card">
        <div className="notification-section-title"><div><p className="eyebrow">YOUR COVERAGE</p><h2>States & flyways</h2></div></div>
        <div className="followed-state-picker"><select value={stateToAdd} onChange={(event) => setStateToAdd(event.target.value)}>{sortedStates.map((state) => <option value={state.code} key={state.code}>{state.name}</option>)}</select><button type="button" onClick={addState}>Add state</button></div>
        <div className="followed-state-chips">{preferences.followedStates.map((code) => <button type="button" key={code} onClick={() => removeState(code)}>{states.find((state) => state.code === code)?.name || code}<span>×</span></button>)}</div>
        <div className="flyway-choice">
          {(["Atlantic", "Mississippi", "Central", "Pacific"] as const).map((flyway) => <label key={flyway}><input type="checkbox" checked={preferences.followedFlyways.includes(flyway)} onChange={(event) => update("followedFlyways", event.target.checked ? [...preferences.followedFlyways, flyway] : preferences.followedFlyways.filter((item) => item !== flyway))} /><span>{flyway} Flyway</span></label>)}
        </div>
        <label className="threshold-choice">MIGRATION ALERT THRESHOLD<select value={preferences.migrationThreshold} onChange={(event) => update("migrationThreshold", Number(event.target.value))}><option value={45}>45/100 — Moving</option><option value={65}>65/100 — Strong push</option><option value={80}>80/100 — Peak movement</option></select></label>
      </section>

      <section className="notification-inbox-card">
        <div className="notification-section-title"><div><p className="eyebrow">NOTIFICATION CENTER</p><h2>Recent updates</h2></div>{unread > 0 && <button type="button" onClick={() => void run(async () => { await markAllNotificationsRead(); setInbox((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() }))); onUnreadChange(0); }, "All updates marked read.")}>Mark all read</button>}</div>
        {!inbox.length && <div className="notification-empty"><strong>No updates yet.</strong><p>Season, regulation, migration, hunt, and account notices will appear here.</p></div>}
        <div className="notification-inbox-list">{inbox.map((item) => <button className={!item.readAt ? "notification-inbox-row notification-inbox-row--unread" : "notification-inbox-row"} type="button" key={item.id} onClick={() => void openItem(item)}><span className="notification-inbox-row__icon">{inboxIcon(item.eventType)}</span><span><strong>{item.title}</strong><small>{item.body}</small><em>{formatAlertDate(item.createdAt)}</em></span><b>›</b></button>)}</div>
      </section>
    </div>
  );
}
