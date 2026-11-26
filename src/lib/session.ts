import type {ImportResult,Resume,Scan} from "./model.ts";
import {initialCv,type CvOptions} from "./cv.ts";
export const storageKey="devproof:workspace:v1";
export type Snapshot={version:1;savedAt:string;result:ImportResult;selected:string[];scans:Record<string,Scan>;names:Record<string,string>;resume:Resume;notes:Record<string,string>;options:CvOptions;job:string;demo:boolean};
const object=(v:unknown):v is Record<string,unknown>=>typeof v==="object"&&v!==null&&!Array.isArray(v);
const string=(v:unknown,max=10000):v is string=>typeof v==="string"&&v.length<=max;
const bool=(v:unknown):v is boolean=>typeof v==="boolean";
const list=(v:unknown,max=1000):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(x=>string(x,400));
function dict(v:unknown,test:(x:unknown)=>boolean,max=1000){return object(v)&&Object.keys(v).length<=max&&Object.values(v).every(test);}
function github(v:unknown){if(!string(v,2000))return false;try{const u=new URL(v);return u.protocol==="https:"&&u.hostname==="github.com"&&!u.username&&!u.password;}catch{return false;}}
function repo(v:unknown){return object(v)&&string(v.name,100)&&/^[a-zA-Z0-9_.-]+$/.test(v.name)&&string(v.owner,40)&&/^[a-zA-Z0-9-]+$/.test(v.owner)&&github(v.url)&&string(v.description)&&string(v.language,100)&&string(v.updatedAt,100)&&bool(v.fork)&&bool(v.archived)&&string(v.branch,300)&&typeof v.stars==="number"&&Number.isFinite(v.stars);}
function entry(v:unknown){return object(v)&&["id","title","organization","period","detail"].every(k=>string(v[k],4000));}
function options(v:unknown){if(!object(v)||!object(v.design))return false;const d=v.design;
 const defaults=initialCv(),dd=defaults.design;
 if(!["classic","modern","compact"].includes(String(v.template))||!bool(v.showLinks)||!list(v.order)||!list(v.hiddenSkills)||!dict(v.projects,x=>object(x)&&Object.keys(x).every(k=>["title","role","bullets","excluded"].includes(k))&&Object.entries(x).every(([k,y])=>k==="excluded"?bool(y):string(y,4000))))return false;
 if(!["extraSkills","phone","linkedin","certifications","languages"].every(k=>string(v[k],4000)))return false;
 if(!Array.isArray(v.work)||v.work.length>100||!v.work.every(entry)||!Array.isArray(v.study)||v.study.length>100||!v.study.every(entry))return false;
 const enumFields:Record<string,string[]>={font:["sans","serif","mono"],align:["left","center"],layout:["single","columns"],paper:["A4","Letter"],rule:["line","none","solid"],bullet:["disc","square","dash"],photoSource:["github","upload"],photoShape:["circle","rounded","square"],photoSide:["left","right"]};
 if(!Object.entries(enumFields).every(([k,values])=>typeof d[k]==="string"&&values.includes(d[k] as string)))return false;
 const ranges:Record<string,[number,number]>={size:[8,13],headingSize:[16,32],lineHeight:[1.15,1.8],spacing:[.5,1.8],margin:[8,24],photoSize:[15,36],photoX:[0,100],photoY:[0,100]};
 if(!Object.entries(ranges).every(([k,[lo,hi]])=>typeof d[k]==="number"&&Number.isFinite(d[k])&&(d[k] as number)>=lo&&(d[k] as number)<=hi))return false;
 if(!string(d.accent,7)||!/^#[0-9a-f]{6}$/i.test(d.accent)||!["photo","showGithub","showProjectStack"].every(k=>bool(d[k])))return false;
 if(!string(d.photoData,1500000)||d.photoData&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d.photoData))return false;
 return list(d.order,30)&&list(d.hidden,30)&&dict(d.titles,x=>string(x,80),30)&&Array.isArray(d.custom)&&d.custom.length<=12&&d.custom.every(x=>object(x)&&string(x.id,100)&&/^custom-[a-zA-Z0-9-]+$/.test(x.id)&&string(x.title,80)&&string(x.content,4000))&&Object.keys(dd).every(k=>Object.hasOwn(d,k));
}
export function parseSnapshot(raw:string):Snapshot{
 if(raw.length>4_000_000)throw Error("Arquivo grande demais.");
 let v:unknown;try{v=JSON.parse(raw);}catch{throw Error("Arquivo JSON inválido.");}
 if(!object(v)||v.version!==1||!string(v.savedAt,100)||!bool(v.demo)||!object(v.result)||!object(v.result.profile)||!object(v.resume))throw Error("Formato de projeto incompatível.");
 const p=v.result.profile;
 if(!["login","name","bio","avatar"].every(k=>string(p[k]))||!github(p.url)||typeof p.publicRepos!=="number"||!Number.isFinite(p.publicRepos)||!bool(v.result.truncated)||!Array.isArray(v.result.repos)||v.result.repos.length>1000||!v.result.repos.every(repo))throw Error("Perfil ou repositórios inválidos.");
 if(!["name","headline","email","location","summary","education","experience","website"].every(k=>string((v.resume as Record<string,unknown>)[k],4000))||!list(v.selected)||!dict(v.names,x=>string(x,100))||!dict(v.notes,x=>string(x,2000))||!string(v.job,15000)||!options(v.options))throw Error("Dados do editor inválidos.");
 if(!dict(v.scans,x=>object(x)&&repo(x.repo)&&string(x.commit,40)&&/^[a-f0-9]{40}$/i.test(x.commit)&&list(x.warnings,100)&&Array.isArray(x.evidence)&&x.evidence.length<=200&&x.evidence.every(e=>object(e)&&string(e.skill,100)&&["dependency","file","language"].includes(String(e.kind))&&string(e.detail,1000)&&github(e.url))))throw Error("Evidências inválidas.");
 return v as unknown as Snapshot;
}
