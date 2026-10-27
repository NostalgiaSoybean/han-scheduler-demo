export const toMinutes = value => { const [h,m]=value.split(':').map(Number); return h*60+m; };
export const toTime = value => `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
export const overlaps = (a,b,c,d) => a<d && c<b;
export const ACTIVE = new Set(['reserved','arrived','waiting','in_progress','finished','cleaning']);
export const absoluteMinute=(date,time)=>Date.parse(date+'T00:00:00Z')/60000+toMinutes(time);
export const shiftLimit=t=>t.shiftEnd?(toMinutes(t.shiftEnd)<=toMinutes(t.shiftStart)?toMinutes(t.shiftEnd)+1440:toMinutes(t.shiftEnd)):Infinity;
export const displayTime=value=>{const m=toMinutes(value);return `${m>=1440?(m>=2880?Math.floor(m/1440)+'天后 ':'次日 '):''}${toTime(m%1440)}`};
export const bookingsOverlap=(a,b)=>overlaps(absoluteMinute(a.date,a.start),absoluteMinute(a.date,a.end),absoluteMinute(b.date,b.start),absoluteMinute(b.date,b.end));

export function nextQueue(queue,techs){
  const ids=techs.filter(t=>!t.deleted).map(t=>t.id);
  return [...queue.filter(id=>ids.includes(id)),...ids.filter(id=>!queue.includes(id))];
}
export function commitAssignment(queue,techId,kind){
  if(kind!=='rotation' || !queue.includes(techId)) return [...queue];
  return [...queue.filter(id=>id!==techId),techId];
}
function isFree(bookings,date,field,id,start,end){
  return !bookings.some(b=>(b[field]===id || b[field+'s']?.includes(id)) && ACTIVE.has(b.status) && overlaps(absoluteMinute(date,toTime(start)),absoluteMinute(date,toTime(end)),absoluteMinute(b.date,b.start),absoluteMinute(b.date,b.end)));
}
export function findSlots({date,from,duration,skill,techs,rooms,bookings,queue=[],designatedTechId='',step=10,count=3,roomId=''}){
  const skills=Array.isArray(skill)?skill:[skill];
  const result=[];
  const first=Math.ceil(toMinutes(from)/step)*step;
  const ordered=nextQueue(queue,techs);
  const sorted=[...techs].sort((a,b)=>ordered.indexOf(a.id)-ordered.indexOf(b.id));
  for(let start=first;start<1440 && result.length<count;start+=step){
    const eligibleTechs=sorted.filter(t=>t.available!==false && (!designatedTechId || t.id===designatedTechId) && skills.every(s=>t.skills.includes(s)) && start>=Math.max(600,toMinutes(t.shiftStart)) && start+duration<=shiftLimit(t) && isFree(bookings,date,'techId',t.id,start,start+duration));
    const eligibleRooms=rooms.filter(r=>r.available!==false && (!roomId || r.id===roomId) && skills.every(s=>r.skills.includes(s)) && isFree(bookings,date,'roomId',r.id,start,start+duration));
    if(eligibleTechs.length && eligibleRooms.length){
      result.push({start:toTime(start),end:toTime(start+duration),techId:eligibleTechs[0].id,roomId:eligibleRooms[0].id});
    }
  }
  return result;
}
export function capacityAt({date,start,duration,skill,techs,rooms,bookings}){
  const from=toMinutes(start),end=from+duration;
  const skills=Array.isArray(skill)?skill:[skill];
  const technicians=techs.filter(t=>t.available!==false && skills.every(s=>t.skills.includes(s)) && from>=Math.max(600,toMinutes(t.shiftStart)) && end<=shiftLimit(t) && isFree(bookings,date,'techId',t.id,from,end));
  const freeRooms=rooms.filter(r=>r.available!==false && skills.every(s=>r.skills.includes(s)) && isFree(bookings,date,'roomId',r.id,from,end));
  return Math.min(technicians.length,freeRooms.length);
}
