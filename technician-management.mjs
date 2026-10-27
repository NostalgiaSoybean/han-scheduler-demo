import {absoluteMinute} from './schedule.mjs';
export function archiveTechnician(state,id,today,clock){
 if(state.queue[0]===id)return {error:'当前列表第一位技师不能删除'};
 const t=state.techs.find(t=>t.id===id);if(!t||t.deleted)return {error:'技师不存在'};
 const pending=state.bookings.find(b=>b.techIds?.includes(id)&&(b.status==='in_progress'||b.status==='reserved'&&absoluteMinute(b.date,b.end)>absoluteMinute(today,clock)));
 if(pending)return {error:'该技师还有未完成的预约，请先调整预约再删除'};
 t.previousAvailable=t.available;t.available=false;t.deleted=true;state.queue=state.queue.filter(x=>x!==id);return {ok:true};
}
export function restoreTechnician(state,id){const t=state.techs.find(t=>t.id===id&&t.deleted);if(!t)return;delete t.deleted;t.available=t.previousAvailable!==false;delete t.previousAvailable;state.queue.push(id)}
