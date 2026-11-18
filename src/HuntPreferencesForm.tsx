import { useState, type FormEvent } from "react";
import { huntingLocations } from "./huntingLocations";
import { huntCategories } from "./gameCatalog";
import type { HuntCategoryId } from "./types";
import type { HuntPreferences } from "./huntPreferences";

export default function HuntPreferencesForm({ preferences, firstTime = false, onSave }: {
  preferences: HuntPreferences;
  firstTime?: boolean;
  onSave: (stateCode: string, categoryId: HuntCategoryId) => Promise<void>;
}) {
  const [stateCode, setStateCode] = useState(preferences.stateCode);
  const [categoryId, setCategoryId] = useState(preferences.categoryId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !categoryId) return;
    setSaving(true); setMessage(""); setError("");
    try {
      await onSave(stateCode, categoryId as HuntCategoryId);
      setMessage("Hunting defaults saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your preferences could not be saved. Please try again.");
    } finally { setSaving(false); }
  }

  return <form className="hunt-preferences-form" onSubmit={event => void submit(event)}>
    <p className="eyebrow">{firstTime ? "WELCOME TO BLINDIQ" : "HUNTING PREFERENCES"}</p>
    <h2>{firstTime ? "Make it your hunt." : "Your hunting defaults"}</h2>
    <p>Choose your usual state and hunting category. You can change them for any hunt, or update your defaults in Account.</p>
    <label htmlFor="default-state">Default state<select id="default-state" required disabled={saving} value={stateCode} onChange={event => setStateCode(event.target.value)}>{huntingLocations.map(state => <option key={state.code} value={state.code}>{state.name}</option>)}</select></label>
    <label htmlFor="default-category">Default hunting category<select id="default-category" required disabled={saving} value={categoryId} onChange={event => setCategoryId(event.target.value as HuntCategoryId)}><option value="" disabled>Choose a category</option>{huntCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
    {error && <p role="alert" className="preference-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    <button className="button button--gold button--wide" type="submit" disabled={saving || !categoryId}>{saving ? "Saving…" : firstTime ? "Save & continue" : "Save hunting defaults"}</button>
  </form>;
}
