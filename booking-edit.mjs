import {TURNOVER_MINUTES} from './config.mjs';
import {ACTIVE,bookingsOverlap,shiftLimit,toMinutes,toTime} from './schedule.mjs';
import {bookingProjectIds,summarizeServices} from './services.mjs';
const validTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');
export function editBooking(original,changes,{projects,techs,rooms,bookings,daysOff={}}){
  const booking={...original,...changes};
  const started=['in_progress','finished','cleaning','completed'].includes(booking.status);
  const start=changes.start??original.start;
  if(!validTime(start))return {error:'请填写有效的开始时间'};
  const services=summarizeServices(changes.projectIds??bookingProjectIds(booking),projects);
  if(!services.valid)return {error:'请至少选择一个有效服务项目'};
  const end=toMinutes(start)+services.minutes+TURNOVER_MINUTES;
  for(const id of booking.techIds){const t=techs.find(t=>t.id===id);if(!t||!services.skills.every(s=>t.skills.includes(s)))return {error:'技师不具备全部已选项目的技能'};if(toMinutes(start)<Math.max(600,toMinutes(t.shiftStart))||end>shiftLimit(t))return {error:'服务及换场时间超出技师班次'};if((!started||!original.techIds.includes(id))&&(t.available===false||daysOff[booking.date]?.includes(id)))return {error:'这位技师当天未上班'};}
  for(const id of booking.roomIds){const r=rooms.find(r=>r.id===id);if(!r||!r.available||!services.skills.every(s=>r.skills.includes(s)))return {error:'房间不可用或不支持全部已选项目'};}
  const conflict=bookings.find(other=>other.id!==booking.id&&ACTIVE.has(other.status)&&bookingsOverlap({...booking,start,end:toTime(end)},other)&&(other.techIds?.some(id=>booking.techIds.includes(id))||other.roomIds?.some(id=>booking.roomIds.includes(id))));
  if(conflict)return {error:`与 ${conflict.customer||'其他顾客'} ${conflict.start} 的预约冲突，请换时间、技师或房间`};
  booking.start=start;booking.end=toTime(end);booking.projectIds=services.ids;booking.projectId=services.ids[0];
  delete booking.plannedStart;delete booking.actualStart;delete booking.actualArrival;delete booking.arrived;
  return {booking};
}
