import test from "node:test";
import assert from "node:assert/strict";
import {username,repoName,suggestGroup,manifestPaths,inspect,groups,matchJob,interviewQuestions} from "../src/lib/engine.ts";
const repo={name:"bevans-webapp",owner:"example",url:"https://github.com/example/bevans-webapp",description:"Gestão de transporte",language:"TypeScript",updatedAt:"",fork:false,archived:false,branch:"main",stars:0};
const sha="a".repeat(40);
test("normaliza usuário e rejeita caminhos",()=>{assert.equal(username("@pethersonzada"),"pethersonzada");assert.equal(username("https://github.com/octocat/"),"octocat");assert.equal(username("../private"),null);assert.equal(repoName("../x"),null);assert.equal(repoName(".."),null);});
test("evidências usam dependências exatas e commit",()=>{
 const items=[{path:"package.json",type:"blob",sha,size:100},{path:".github/workflows/ci.yml",type:"blob",sha},{path:"src/app.test.ts",type:"blob",sha}];
 const result=inspect(repo,sha,items,{"package.json":JSON.stringify({dependencies:{next:"16",react:"19","not-firebase":"1"}})});
 assert.ok(result.some(e=>e.skill==="Next.js"&&e.kind==="dependency"&&e.url.endsWith(sha+"/package.json")));
 assert.ok(result.some(e=>e.skill==="GitHub Actions"));assert.ok(result.some(e=>e.skill==="Testes automatizados"));assert.ok(!result.some(e=>e.skill==="Firebase"));
});
test("leitura de manifestos é limitada",()=>{const files=Array.from({length:10},(_,i)=>({path:i+"/package.json",type:"blob",sha,size:100}));assert.equal(manifestPaths([...files,{path:"package.json",type:"blob",sha,size:999999}]).length,6);assert.ok(!manifestPaths([{path:"node_modules/x/package.json",type:"blob",sha,size:10}]).length);});
test("agrupamento exige confirmação",()=>{const other={...repo,name:"bevans-backend",language:"Java"};assert.equal(suggestGroup(repo.name),"bevans");assert.equal(groups([repo,other],{},{}).length,2);const result=groups([repo,other],{},{"bevans-webapp":"BeVans","bevans-backend":"BeVans"});assert.equal(result.length,1);assert.deepEqual(result[0].skills,["Java","TypeScript"]);assert.ok(interviewQuestions(result[0]).length>=3);});
test("vaga não confunde Java com JavaScript",()=>{assert.deepEqual(matchJob("JavaScript, Spring Boot e Docker",["JavaScript","Docker"]),{matched:["JavaScript","Docker"],missing:["Spring Boot"]});});
