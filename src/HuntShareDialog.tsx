import { useEffect, useRef, useState } from "react";
import { canShareHuntFile, createHuntShareFile, downloadHuntShareFile, huntShareCaption, shareHuntFile, type HuntShareInput } from "./shareHunt";

export default function HuntShareDialog({ input, onClose }: { input: HuntShareInput; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const captionField = useRef<HTMLTextAreaElement>(null);
  const sharingRef = useRef(false);
  const [includePhoto, setIncludePhoto] = useState(true);
  const [includeArea, setIncludeArea] = useState(false);
  const [caption, setCaption] = useState(() => huntShareCaption(input));
  const [retry, setRetry] = useState(0);
  const [prepared, setPrepared] = useState<{ file: File; url: string; photo: boolean; area: boolean } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);

  useEffect(() => {
    let cancelled = false, previewUrl = "";
    setPrepared(null); setError(""); setStatus("");
    void createHuntShareFile({ ...input, photo: includePhoto ? input.photo : null, zone: includeArea ? input.zone : input.huntCategoryLabel, blindName: includeArea ? input.blindName : null })
      .then(file => {
        if (cancelled) return;
        previewUrl = URL.createObjectURL(file);
        setPrepared({ file, url: previewUrl, photo: includePhoto, area: includeArea });
      })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Your hunt card could not be prepared. Please retry."); });
    return () => { cancelled = true; if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [input, includePhoto, includeArea, retry]);

  const ready = prepared && prepared.photo === includePhoto && prepared.area === includeArea ? prepared : null;
  const nativeAvailable = ready ? canShareHuntFile(ready.file) : false;
  async function share() {
    if (!ready || sharingRef.current) return;
    sharingRef.current = true; setSharing(true); setError(""); setStatus("");
    try {
      // No image fetching, encoding or clipboard work before the native share call.
      await shareHuntFile(ready.file);
      setStatus("Image handed to your device’s sharing service. Finish posting in the app you choose.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") setStatus("Sharing cancelled. Your hunt is still saved.");
      else if (cause instanceof DOMException && cause.name === "NotAllowedError") setError("Your browser blocked sharing. Tap Share to apps again, open BlindIQ in Safari or Chrome, or save the image to attach manually.");
      else setError("The image could not be shared. Try again, or save the image and attach it in your social app.");
    } finally { sharingRef.current = false; setSharing(false); }
  }
  async function copyCaption() {
    try { await navigator.clipboard.writeText(caption); setStatus("Caption copied. Paste it in your social app after choosing the image."); }
    catch { captionField.current?.focus(); captionField.current?.select(); setStatus("Select and copy the caption below, then paste it in your social app."); }
  }

  return <dialog className="hunt-share-dialog" ref={dialog} aria-labelledby="hunt-share-title" onCancel={event => { event.preventDefault(); if (!sharingRef.current) onClose(); }}>
    <div className="share-dialog-content">
    <header><div><p className="eyebrow">HUNT. LOG. SHARE.</p><h2 id="hunt-share-title">Share your hunt</h2></div><button type="button" className="share-close" aria-label="Close hunt sharing" disabled={sharing} onClick={onClose}>×</button></header>
    <p>Share the image to a compatible app installed on your device, using your sign-in there. You choose where it goes and finish the post in that app.</p>
    <div className="share-preview">{ready ? <img src={ready.url} alt="Preview of your BlindIQ hunt card" /> : <p role="status">{error ? "Preview unavailable" : "Preparing your hunt card…"}</p>}</div>
    <div className="share-options">{input.photo && <label><input type="checkbox" checked={includePhoto} disabled={sharing} onChange={event => setIncludePhoto(event.target.checked)} />Include hunt photo</label>}{(input.zone || input.blindName) && <label><input type="checkbox" checked={includeArea} disabled={sharing} onChange={event => setIncludeArea(event.target.checked)} />Include area / blind name</label>}</div>
    <label className="share-caption-label" htmlFor="share-caption">Caption<textarea ref={captionField} id="share-caption" rows={4} maxLength={1500} value={caption} disabled={sharing} onChange={event => setCaption(event.target.value)} /></label>
    <p className="share-caption-help">Copy the caption first if you want it. Social apps may accept the image without its caption. Available apps are controlled by your device; try “More” in its share sheet if needed.</p>
    {error && <p className="share-error" role="alert">{error}</p>}{status && <p className="share-status" role="status">{status}</p>}
    {!ready && error && <button className="button" type="button" onClick={() => setRetry(value => value + 1)}>Retry preview</button>}
    {ready && !nativeAvailable && <p className="share-fallback">Image sharing isn’t available in this browser. Save the image, then attach it from your social app.</p>}
    </div>
    <div className="share-dialog-actions"><button className="button" type="button" disabled={sharing} onClick={() => void copyCaption()}>Copy caption</button><button className="button button--gold" type="button" disabled={!ready || !nativeAvailable || sharing} onClick={() => void share()}>{sharing ? "Sharing…" : "Share to apps"}</button><button className="button" type="button" disabled={!ready || sharing} onClick={() => { if (ready) { downloadHuntShareFile(ready.file); setStatus("Image download requested. Attach it from your social app."); } }}>Save image</button></div>
  </dialog>;
}
