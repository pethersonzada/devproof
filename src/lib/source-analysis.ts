import type {Repo,CodeSignal,ContributionSample} from "./model.ts";
import {evidenceUrl,type TreeItem} from "./engine.ts";
export function sourcePaths(items:TreeItem[]){
 const candidates=items.filter(x=>x.type==="blob"&&typeof x.size==="number"&&x.size>0&&x.size<=32768&&/\.(?:tsx?|jsx?|java|py|sql)$/i.test(x.path)&&!/(^|\/)(?:node_modules|vendor|dist|build|\.next|fixtures|examples|tests?|__tests__|generated|mocks?)(\/|$)/i.test(x.path)&&!/(?:\.min\.|\.test\.|\.spec\.|\.d\.ts$|secret|credential|password|token|\.env)/i.test(x.path));
 const priority=(p:string)=>/controller|\/api\/|routes?|router|endpoints?/i.test(p)?0:/auth|security/i.test(p)?1:/migration|schema|repository|service/i.test(p)?2:/page\.|screen|component/i.test(p)?3:4;
 return candidates.sort((a,b)=>priority(a.path)-priority(b.path)||a.path.split("/").length-b.path.split("/").length||a.path.localeCompare(b.path)).slice(0,3);
}
export function inspectSource(repo:Repo,sha:string,sources:Record<string,string>):CodeSignal[]{
 const found=new Map<string,CodeSignal>();
 const rules:[string,RegExp,string][]=[
 ["Rotas HTTP",/@(?:RestController|RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\b|\b(?:app|router)\.(?:get|post|put|delete|patch)\s*\(|export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\(/,"Declaração de rota ou controlador HTTP identificada"],
 ["Autenticação",/\b(?:SecurityFilterChain|JwtDecoder|OAuth2PasswordBearer|verifyIdToken|verifyToken|signInWithEmailAndPassword)\b/,"Referência a mecanismo de autenticação ou segurança identificada"],
 ["Persistência",/@(?:Entity|Repository)\b|\b(?:JpaRepository|SQLAlchemy|PrismaClient|create_engine)\b|\bCREATE\s+TABLE\b/i,"Declaração de persistência ou esquema de dados identificada"],
 ["Interface web ou mobile",/\b(?:useState|useEffect|useReducer|useSyncExternalStore)\s*\(|\b(?:View|ScrollView|FlatList)\b/,"Referência a estado de interface ou componentes de visualização identificada"],
 ["Consumo de API",/\b(?:fetch|axios\.(?:get|post|put|delete|patch)|requests\.(?:get|post|put|delete)|httpx\.(?:get|post))\s*\(/,"Chamada de cliente HTTP identificada"],
 ["Geolocalização",/\b(?:getCurrentPositionAsync|watchPositionAsync|getCurrentPosition|watchPosition|MapView|Geolocation)\b/,"Referência a localização ou visualização geográfica identificada"]
 ];
 for(const [path,content] of Object.entries(sources)){
  // Apenas sinais lexicais; não retornamos trechos, segredos, mensagens ou valores do código.
  for(const [label,pattern,detail] of rules)if(!found.has(label)&&pattern.test(content))found.set(label,{label,detail:detail+" em "+path+".",url:evidenceUrl(repo,sha,path)});
 }
 return [...found.values()];
}
export function sampleContributions(account:string,repo:Repo,raw:unknown,more:boolean):ContributionSample|null{
 if(!Array.isArray(raw))return null;
 const commits=raw.slice(0,30).filter(x=>x&&typeof x==="object"&&typeof x.sha==="string"&&/^[a-f0-9]{40}$/i.test(x.sha));
 const linked=commits.filter(x=>typeof x.author?.login==="string");
 const matched=linked.filter(x=>x.author.login.toLowerCase()===account.toLowerCase());
 return {account,sampled:commits.length,linked:linked.length,matched:matched.length,commits:matched.slice(0,5).map(x=>repo.url+"/commit/"+x.sha),more};
}
