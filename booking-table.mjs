import {TURNOVER_MINUTES} from './config.mjs';
import {commitAssignment,displayTime} from './schedule.mjs';
import {editBooking} from './booking-edit.mjs';
import {bookingProjectIds,summarizeServices} from './services.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderBookingTable({state,items,projects,tech,save,render,openEditor,getBookings,deleteBooking}){
  const body=document.getElementById('bookings');
  body.innerHTML=items.length?items.map(b=>{const services=summarizeServices(bookingProjectIds(b),projects),finished=['finished','completed','cleaning'].includes(b.status),running=finished||b.status==='in_progress';
    return `<tr><td><input type="time" required aria-label="${esc(b.customer)}开始时间" data-booking-time="${b.id}" value="${esc(b.start)}"><small>至 ${esc(displayTime(b.end))} · 共 ${services.minutes+TURNOVER_MINUTES} 分钟</small></td><td>${esc(b.customer)}</td><td>${services.selected.map(p=>`<div>${esc(p.name)} <small class="service-minute">${p.minutes} 分</small></div>`).join('')}<small>${services.minutes} 分服务 + ${TURNOVER_MINUTES} 分换场</small></td><td>${esc(b.techIds.map(id=>tech(id)?.name||'已移除').join('、'))}<small>${esc(b.roomIds.map(id=>state.rooms.find(r=>r.id===id)?.name||id+' 房').join('、'))} · ${b.kind==='designated'?'点钟':'轮钟'}</small></td><td><input type="checkbox" aria-label="${esc(b.customer)}进行中" data-running="${b.id}" ${running?'checked':''} ${finished?'disabled':''}></td><td><input type="checkbox" aria-label="${esc(b.customer)}已验券" data-voucher="${b.id}" ${b.voucher==='verified'?'checked':''}></td><td><input type="checkbox" aria-label="${esc(b.customer)}已完成" data-finish="${b.id}" ${finished?'checked':''} ${running?'':'disabled'}></td><td><input class="note" data-note="${b.id}" value="${esc(b.note)}" placeholder="直接填写"></td><td><div class="record-actions"><button class="small" data-edit-record="${b.id}">编辑</button><button class="small danger" data-delete-record="${b.id}">删除</button></div></td></tr>`;
  }).join(''):'<tr><td colspan="9">今天还没有预约，点击「添加预约」。</td></tr>';
  const booking=id=>state.bookings.find(b=>b.id===id);
  body.querySelectorAll('[data-booking-time]').forEach(el=>el.onchange=()=>{const b=booking(el.dataset.bookingTime),result=editBooking(b,{start:el.value},{...state,projects,bookings:getBookings()});if(result.error)alert(result.error);else Object.assign(b,result.booking);render()});
  body.querySelectorAll('[data-running]').forEach(el=>el.onchange=()=>{const b=booking(el.dataset.running);if(el.checked){const result=editBooking(b,{status:'in_progress'},{...state,projects,bookings:getBookings()});if(result.error){alert(result.error);render();return}Object.assign(b,result.booking);if(!b.rotationCounted&&b.kind==='rotation'){for(const id of b.techIds)state.queue=commitAssignment(state.queue,id,'rotation');b.rotationCounted=true}}else b.status='reserved';render()});
  body.querySelectorAll('[data-voucher]').forEach(el=>el.onchange=()=>{booking(el.dataset.voucher).voucher=el.checked?'verified':'unverified';render()});
  body.querySelectorAll('[data-finish]').forEach(el=>el.onchange=()=>{booking(el.dataset.finish).status=el.checked?'finished':'in_progress';render()});
  body.querySelectorAll('[data-note]').forEach(el=>el.onchange=()=>{booking(el.dataset.note).note=el.value.trim();save()});
  body.querySelectorAll('[data-edit-record]').forEach(el=>el.onclick=()=>openEditor(booking(el.dataset.editRecord)));
  body.querySelectorAll('[data-delete-record]').forEach(el=>el.onclick=()=>deleteBooking(booking(el.dataset.deleteRecord)));
}
