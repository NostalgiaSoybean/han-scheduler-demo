// Unfinished overdue services must be confirmed complete before promising the same resources again.
import {absoluteMinute,toTime} from './schedule.mjs';
export function effectiveBookings(bookings,today,clock){
  return bookings.map(b=>b.status==='in_progress'&&absoluteMinute(b.date,b.end)<=absoluteMinute(today,clock)?{...b,end:toTime(absoluteMinute(today,'23:59')-absoluteMinute(b.date,'00:00'))}:b);
}
