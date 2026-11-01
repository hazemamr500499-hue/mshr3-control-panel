// Pure functions shared by dashboard, cloud adapter and tests.
export const validRate = (rate) => Number.isFinite(Number(rate)) && typeof rate!=='boolean' && rate!=='' && rate!==null && Number(rate)>=0 && Number(rate)<=100000;
export const validMinutes = (minutes) => Number.isInteger(minutes) && minutes>=1 && minutes<=1440;
export function chargedMinutes(mode,startIso,endIso,bookedMinutes){
  if(mode==='fixed'){
    if(!validMinutes(bookedMinutes))throw Error('مدة غير صحيحة');
    return bookedMinutes;
  }
  if(mode!=='open')throw Error('نوع جلسة غير صحيح');
  const duration=Date.parse(endIso)-Date.parse(startIso);
  if(!Number.isFinite(duration))throw Error('تاريخ الجلسة غير صحيح');
  return Math.max(1,Math.ceil(Math.max(0,duration)/60000));
}
export function charge(minutes,rate){
  if(!Number.isInteger(minutes)||minutes<1 || !validRate(rate))throw Error('بيانات الفاتورة غير صحيحة');
  return Math.round(minutes*Number(rate)/60*100)/100;
}
