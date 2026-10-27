export const bookingProjectIds=b=>b.projectIds?.length?b.projectIds:(b.projectId?[b.projectId]:[]);
export function summarizeServices(ids,projects){
  const unique=[...new Set(ids||[])];const selected=unique.map(id=>projects.find(p=>p.id===id)).filter(Boolean);
  return {ids:unique,selected,valid:unique.length>0&&selected.length===unique.length,minutes:selected.reduce((sum,p)=>sum+p.minutes,0),skills:[...new Set(selected.map(p=>p.skill))]};
}
