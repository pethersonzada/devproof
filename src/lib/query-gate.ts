import {ApiError} from "./github.ts";
type CacheEntry={value:unknown;expires:number};
export function createQueryGate({maxEntries=48,maxActive=4,ttl=30_000,maxStarts=36,windowMs=60_000}={}){
 const cache=new Map<string,CacheEntry>(),pending=new Map<string,Promise<unknown>>();
 let starts:number[]=[];
 return async function query<T>(key:string,load:()=>Promise<T>):Promise<T>{
  const now=Date.now();
  for(const [k,v] of cache)if(v.expires<=now)cache.delete(k);
  const hit=cache.get(key);if(hit)return hit.value as T;
  const current=pending.get(key);if(current)return current as Promise<T>;
  starts=starts.filter(t=>now-t<windowMs);
  if(pending.size>=maxActive||starts.length>=maxStarts)throw new ApiError(429,"Limite temporário do DevProof. Aguarde e tente novamente.");
  starts.push(now);
  const promise=Promise.resolve().then(load).then(value=>{cache.set(key,{value,expires:Date.now()+ttl});while(cache.size>maxEntries){const first=cache.keys().next().value;if(first===undefined)break;cache.delete(first);}return value;}).finally(()=>pending.delete(key));
  pending.set(key,promise);
  return promise;
 };
}
export const profileQuery=createQueryGate({maxEntries:32,maxActive:2,maxStarts:18});
export const scanQuery=createQueryGate({maxEntries:48,maxActive:3,maxStarts:24});
