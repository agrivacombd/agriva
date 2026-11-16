export type RecentAdminOrder={id:string;created_at:string;status:string;total_amount:number};
export function sortedLatest<T extends {id:string;created_at:string}>(rows:T[]):T[]{
  return [...rows].sort((a,b)=>(Date.parse(b.created_at)-Date.parse(a.created_at))||b.id.localeCompare(a.id));
}
export function unreadOrders<T extends {created_at:string}>(rows:T[],cursor:string):T[]{
  const since=Date.parse(cursor);if(!Number.isFinite(since))return [];
  return rows.filter(row=>Date.parse(row.created_at)>since);
}
