import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { getMigrationData } from "./services";
import { flywayForState, formatMigrationTime, migrationStatus, previewMigrationData, type FlywayName, type MigrationData } from "./migration";

function TrendMark({ trend }: { trend: "rising" | "steady" | "falling" }) {
  return <span className={`migration-trend migration-trend--${trend}`} aria-label={`${trend} trend`}>{trend === "rising" ? "↗" : trend === "falling" ? "↘" : "→"}</span>;
}

export default function MigrationPage({ stateCode, isOnline }: { stateCode: string; isOnline: boolean }) {
  const [flyway, setFlyway] = useState<FlywayName>(() => flywayForState(stateCode) ?? "Atlantic");
  const [data, setData] = useState<MigrationData>(() => previewMigrationData());
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMigrationData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getMigrationData());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Migration conditions could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMigrationData();
  }, [loadMigrationData]);

  useEffect(() => {
    const stateFlyway = flywayForState(stateCode);
    if (stateFlyway) setFlyway(stateFlyway);
  }, [stateCode]);

  const regions = useMemo(
    () => data.regions.filter((region) => region.flyway === flyway).sort((a, b) => a.displayOrder - b.displayOrder),
    [data.regions, flyway],
  );
  const snapshotsByRegion = useMemo(
    () => new Map(data.snapshots.map((snapshot) => [snapshot.regionId, snapshot])),
    [data.snapshots],
  );
  const selectedRegion = regions.find((region) => region.id === selectedRegionId)
    ?? regions.find((region) => snapshotsByRegion.has(region.id))
    ?? regions[0];
  const selectedSnapshot = selectedRegion ? snapshotsByRegion.get(selectedRegion.id) : undefined;
  const flywayScores = regions.flatMap((region) => {
    const score = snapshotsByRegion.get(region.id)?.forecastIndex;
    return typeof score === "number" ? [score] : [];
  });
  const flywayAverage = flywayScores.length
    ? Math.round(flywayScores.reduce((total, score) => total + score, 0) / flywayScores.length)
    : 0;

  useEffect(() => {
    if (!regions.some((region) => region.id === selectedRegionId)) {
      setSelectedRegionId(regions.find((region) => snapshotsByRegion.has(region.id))?.id ?? regions[0]?.id ?? "");
    }
  }, [regions, selectedRegionId, snapshotsByRegion]);

  return (
    <div className="page migration-page">
      <header className="migration-heading">
        <div><p className="eyebrow">BLINDIQ MIGRATION PULSE • EARLY ACCESS</p><h1>Follow the flyways.</h1><p>Daily movement potential for the Atlantic and Mississippi Flyways—built for planning, not promising birds.</p></div>
        <div className="migration-heading__score"><span>FLYWAY PULSE</span><strong>{flywayAverage}</strong><small>{migrationStatus(flywayAverage)}</small></div>
      </header>

      <div className="flyway-tabs" role="tablist" aria-label="Choose a flyway">
        {(["Atlantic", "Mississippi"] as const).map((name) => (
          <button className={flyway === name ? "active" : ""} type="button" role="tab" aria-selected={flyway === name} key={name} onClick={() => setFlyway(name)}>{name}<small>Flyway</small></button>
        ))}
      </div>

      <aside className={`migration-mode migration-mode--${data.mode}`} role="status">
        <span>{data.mode === "live" ? "●" : data.mode === "cached" ? "◷" : "◇"}</span>
        <p><strong>{data.mode === "live" ? "AUTOMATIC UPDATE ACTIVE" : data.mode === "cached" ? "OFFLINE — LAST UPDATE SHOWN" : "PREVIEW MODEL"}</strong><small>{data.mode === "preview" ? "Deploy the included Supabase migration and scheduled updater to replace this seasonal preview with live weather-driven conditions." : `Updated ${formatMigrationTime(data.retrievedAt)}. BlindIQ refreshes the live feed every six hours.`}</small></p>
        <button type="button" disabled={loading || !isOnline} onClick={() => void loadMigrationData()}>{loading ? "Checking…" : "Refresh"}</button>
      </aside>
      {error && <div className="history-error" role="alert"><strong>Refresh unavailable.</strong><span>{error}</span></div>}

      <section className="migration-map-card">
        <div className="migration-map-card__heading"><div><p className="eyebrow">REGIONAL MOVEMENT MAP</p><h2>{flyway} Flyway</h2></div><span>{selectedSnapshot?.direction === "northbound" ? "NORTHBOUND ↑" : selectedSnapshot?.direction === "southbound" ? "SOUTHBOUND ↓" : "STAGING ↔"}</span></div>
        <div className={`migration-corridor migration-corridor--${selectedSnapshot?.direction ?? "staging"}`}>
          <div className="migration-corridor__line" aria-hidden="true"><i /><i /><i /></div>
          {regions.map((region) => {
            const snapshot = snapshotsByRegion.get(region.id);
            const score = snapshot?.forecastIndex ?? 0;
            return (
              <button className={selectedRegion?.id === region.id ? "migration-node active" : "migration-node"} type="button" key={region.id} onClick={() => setSelectedRegionId(region.id)}>
                <span className="migration-node__position">{region.shortName}</span>
                <span className="migration-node__pulse" style={{ "--migration-score": `${score}%` } as CSSProperties}><b>{score}</b></span>
                <span className="migration-node__copy"><strong>{region.name}</strong><small>{region.states.join(" • ")}</small></span>
              </button>
            );
          })}
        </div>
        <small className="migration-map-note">Regional indicators are planning summaries, not exact bird locations, legal flyway boundaries, or public-land boundaries. Official flyway lines may divide states.</small>
      </section>

      {selectedRegion && selectedSnapshot && (
        <section className="migration-detail">
          <div className="migration-detail__title"><div><p className="eyebrow">NEXT 48 HOURS</p><h2>{selectedRegion.name}</h2><p>{selectedRegion.description}</p></div><div className="migration-detail__status"><TrendMark trend={selectedSnapshot.trend} /><strong>{selectedSnapshot.status}</strong><small>{selectedSnapshot.confidence}% confidence</small></div></div>
          <div className="migration-metrics">
            <article><span>CURRENT CONDITIONS</span><strong>{selectedSnapshot.observedIndex}</strong><small>Weather signal right now</small></article>
            <article><span>FORECAST PULSE</span><strong>{selectedSnapshot.forecastIndex}</strong><small>Next 48-hour potential</small></article>
            <article><span>VALID THROUGH</span><strong>{new Date(selectedSnapshot.validThrough).toLocaleDateString("en-US", { weekday: "short" })}</strong><small>{formatMigrationTime(selectedSnapshot.validThrough)}</small></article>
          </div>
          <p className="migration-summary">{selectedSnapshot.summary}</p>
          <div className="migration-drivers"><p className="eyebrow">WHAT IS DRIVING THE SCORE</p>{selectedSnapshot.drivers.map((driver) => <span key={driver}>✓ {driver}</span>)}</div>
          <div className="migration-states"><p className="eyebrow">STATES IN THIS PLANNING REGION</p>{selectedRegion.states.map((state) => <span key={state}>{state}</span>)}</div>
        </section>
      )}

      <section className="migration-sources">
        <div><p className="eyebrow">SOURCE TRANSPARENCY</p><h2>What powers Migration Pulse</h2><p>The automatic starter model uses current National Weather Service forecasts with a transparent seasonal baseline. Licensed observation and radar feeds can be added later without changing this interface.</p></div>
        <div className="migration-source-list">
          <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer"><span>LIVE WEATHER</span><strong>National Weather Service</strong><small>Wind, temperature, precipitation, and forecast timing ↗</small></a>
          <a href="https://www.fws.gov/library/collections/waterfowl-population-status-reports" target="_blank" rel="noreferrer"><span>REFERENCE CONTEXT</span><strong>U.S. Fish & Wildlife Service</strong><small>Annual population and habitat reports—not a live score input ↗</small></a>
          <article><span>FUTURE LICENSED FEEDS</span><strong>Observation + radar partners</strong><small>Not ingested until commercial permission and attribution are approved.</small></article>
        </div>
      </section>

      <aside className="disclaimer migration-disclaimer"><span className="icon">!</span><p><strong>Migration Pulse is a planning estimate—not a guarantee.</strong> Weather, habitat, hunting pressure, survey coverage, and local conditions can change bird movement. Do not use this tool as legal guidance or proof that birds are present.</p></aside>
    </div>
  );
}
