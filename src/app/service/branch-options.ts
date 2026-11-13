export const cityKey=(value:any):string=>String(value||'').trim().toLocaleLowerCase();
export function citiesForBranches(branches:any[]):string[]{
 const choices=new Map<string,string>();
 for(const branch of branches||[]){const city=String(branch?.city||'').trim();if(city&&!choices.has(cityKey(city)))choices.set(cityKey(city),city);}
 return [...choices.values()].sort((a,b)=>a.localeCompare(b));
}
export function branchesForCity(branches:any[],city:any):any[]{
 const key=cityKey(city);return key?(branches||[]).filter(branch=>cityKey(branch.city)===key):[];
}
export function cityForBranch(branches:any[],id:any):string{
 const branch=(branches||[]).find(b=>String(b._id)===String(id));
 return branch?citiesForBranches(branches).find(city=>cityKey(city)===cityKey(branch.city))||'':'';
}
