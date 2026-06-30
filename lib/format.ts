const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('tr-TR');
const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatTRY = (v: number | string) => tl.format(Number(v));
export const formatNum = (v: number | string) => num.format(Number(v));
export const formatDate = (v: string | Date) => dateFmt.format(new Date(v));
