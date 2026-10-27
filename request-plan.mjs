import {TURNOVER_MINUTES} from './config.mjs';
import {ACTIVE,bookingsOverlap,findSlots,shiftLimit,toMinutes,toTime,displayTime} from './schedule.mjs';
import {summarizeServices} from './services.mjs';
export function technicianReason(t,request){
  const {date,start,projectIds,projects,daysOff={},bookings=[]}=request;
  if(!date)return '先选择预约日期';
  if(t.available===false||daysOff[date]?.includes(t.id))return '当天未接单';
  const s=summarizeServices(projectIds,projects);
  if(s.valid&&!s.skills.every(skill=>t.skills.includes(skill)))return '技能不覆盖全部所选项目';
  if(!start)return '';
  if(toMinutes(start)<Math.max(600,toMinutes(t.shiftStart)))return `${t.shiftStart} 才上班`;
  const end=toMinutes(start)+(s.valid?s.minutes+TURNOVER_MINUTES:0);
  if(end>shiftLimit(t))return `预计 ${displayTime(toTime(end))} 结束，超过 ${t.shiftEnd} 下班时间`;
  if(s.valid){const clash=bookings.find(b=>ACTIVE.has(b.status)&&b.techIds?.includes(t.id)&&bookingsOverlap({date,start,end:toTime(end)},b));if(clash)return `${clash.start}–${displayTime(clash.end)} 已占用`;}
  return '';
}
export function planRequest(request){
  const {date,start,projectIds,projects,techs,rooms,bookings,queue,kind,techId='',daysOff={},today,clock}=request;
  const fail=reason=>({slot:null,reason});
  if(!date)return fail('请选择预约日期');
  if(date<today)return fail('所选日期已经过去，请选择今天或之后的日期');
  if(!start)return fail('请选择开始时间');
  if(date===today&&start<clock)return fail('所选时间已过，请调整开始时间');
  if(toMinutes(start)<600)return fail('上班时间从 10:00 以后开始，请调整时间');
  const services=summarizeServices(projectIds,projects);if(!services.valid)return fail('请至少选择一个服务项目');
  if(!kind)return fail('请选择轮钟或点钟');
  if(kind==='designated'&&!techId)return fail('请选择一位可接单的指定技师');
  const considered=kind==='designated'?techs.filter(t=>t.id===techId):techs;
  if(!considered.length)return fail('还没有可安排的技师，请先添加技师');
  const effective=considered.map(t=>({...t,available:t.available!==false&&!daysOff[date]?.includes(t.id)}));
  if(!effective.some(t=>t.available))return fail(kind==='designated'?'指定技师当天未接单，请换技师或勾选接单':'当天没有勾选接单的技师，请先设置接单状态');
  const args={date,from:start,duration:services.minutes+TURNOVER_MINUTES,skill:services.skills,techs:effective,rooms,bookings,queue,designatedTechId:kind==='designated'?techId:'',count:1,step:1};
  const next=findSlots(args)[0];if(next?.start===start)return {slot:next,reason:''};
  const reasons=considered.map(t=>technicianReason(t,request)).filter(Boolean);
  let reason=reasons.length?[...new Set(reasons)].join('；'):'没有同时空闲且支持全部项目的房间';
  if(!rooms.some(r=>r.available!==false&&services.skills.every(s=>r.skills.includes(s))))reason='没有可用房间支持全部所选项目';
  return {slot:null,reason,alternative:next||null};
}
