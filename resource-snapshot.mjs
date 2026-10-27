import {ACTIVE,absoluteMinute,toMinutes,shiftLimit} from './schedule.mjs';
export function resourceSnapshot({date,start,techs,rooms,bookings,daysOff={}}){
 const now=absoluteMinute(date,start),base=absoluteMinute(date,'00:00');
 function available(resource,field,limit=Infinity){
  const list=bookings.filter(b=>ACTIVE.has(b.status)&&b[field]?.includes(resource.id));
  if(list.some(b=>absoluteMinute(b.date,b.start)<=now&&now<absoluteMinute(b.date,b.end)))return null;
  const next=list.map(b=>absoluteMinute(b.date,b.start)).filter(t=>t>now);
  return {...resource,until:Math.min(limit,...next.map(t=>t-base))};
 }
 return {techs:techs.filter(t=>t.available!==false&&!daysOff[date]?.includes(t.id)&&toMinutes(start)>=Math.max(600,toMinutes(t.shiftStart))&&toMinutes(start)<shiftLimit(t)).map(t=>available(t,'techIds',shiftLimit(t))).filter(Boolean),rooms:rooms.filter(r=>r.available!==false).map(r=>available(r,'roomIds')).filter(Boolean)};
}
