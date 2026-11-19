import { useState } from 'react';
import { huntingLocations } from './huntingLocations';
import { reportingDirectory, reportingReviewedAt } from './reportingDirectory';
export default function ReportingResources({stateCode,selectable=false}:{stateCode:string;selectable?:boolean}) {
 const [state,setState]=useState(stateCode);const code=selectable?state:stateCode;const source=reportingDirectory[code];const location=huntingLocations.find(s=>s.code===code);
 return <aside className="reporting-resources">{selectable&&<label>Reporting state<select aria-label="Reporting state" value={state} onChange={e=>setState(e.target.value)}>{huntingLocations.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label>}<strong>{location?.name}: official resources</strong>{source&&<a href={source[0]} target="_blank" rel="noreferrer">{source[1]} ↗</a>}{location&&<a href={location.agencyUrl} target="_blank" rel="noreferrer">State wildlife agency ↗</a>}<small>Source reviewed {reportingReviewedAt}. Follow the agency’s species-specific reporting, tagging and in-person check instructions. A link or a number saved here does not submit or verify a report.</small></aside>;
}
