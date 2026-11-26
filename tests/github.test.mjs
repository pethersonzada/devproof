import test from "node:test";
import assert from "node:assert/strict";
import {importProfile,scanRepo} from "../src/lib/github.ts";
const sha="a".repeat(40);
const meta={name:"devproof",owner:{login:"example"},description:null,language:"TypeScript",updated_at:"2026-01-01",fork:false,archived:false,private:false,visibility:"public",default_branch:"main",stargazers_count:0};
function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers});}
test("importação pagina e exclui dados privados",async t=>{
 const paths=[];t.mock.method(globalThis,"fetch",async url=>{paths.push(url);if(url.endsWith("/users/example"))return json({login:"example",name:null,bio:null,avatar_url:"",public_repos:2});
 if(url.endsWith("page=1"))return json([meta,{...meta,name:"secret",private:true}],200,{link:'<https://api.github.com/users/example/repos?page=2>; rel="next"'});
 return json([{...meta,name:"other"}]);});
 const r=await importProfile("example");assert.deepEqual(r.repos.map(x=>x.name),["devproof","other"]);assert.equal(paths.length,3);assert.equal(r.truncated,false);
});
test("análise impede leitura de repositório privado",async t=>{
 let count=0;t.mock.method(globalThis,"fetch",async()=>{count++;return json({...meta,private:true});});
 await assert.rejects(scanRepo("example","devproof"),e=>e.status===404);assert.equal(count,1);
});
test("análise vincula evidência ao commit e limita leitura",async t=>{
 t.mock.method(globalThis,"fetch",async url=>{
 if(url.endsWith("/repos/example/devproof"))return json(meta);
 if(url.endsWith("/commits/main"))return json({sha,commit:{tree:{sha}}});
 if(url.includes("/git/trees/"))return json({tree:[{path:"package.json",type:"blob",sha,size:50}],truncated:false});
 if(url.includes("/git/blobs/"))return json({encoding:"base64",size:50,content:Buffer.from('{"dependencies":{"next":"16"}}').toString("base64")});
 throw Error("Unexpected URL");});
 const scan=await scanRepo("example","devproof");assert.equal(scan.commit,sha);assert.ok(scan.evidence.some(e=>e.skill==="Next.js"&&e.url.endsWith(sha+"/package.json")));
});
test("rate limit explícito",async t=>{t.mock.method(globalThis,"fetch",async()=>json({},403));await assert.rejects(importProfile("example"),e=>e.status===429);});
