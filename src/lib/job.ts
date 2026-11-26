import type {Group} from "./model.ts";
import {matchJob} from "./engine.ts";
export const roles=[
 {id:"backend",name:"Backend Java",text:"Java, Spring Boot, SQL, PostgreSQL, Docker, testes automatizados."},
 {id:"frontend",name:"Frontend web",text:"JavaScript, TypeScript, React, Next.js, HTML, CSS, testes automatizados."},
 {id:"fullstack",name:"Full stack",text:"JavaScript, TypeScript, React, Next.js, Java, Spring Boot, SQL, PostgreSQL, Docker."},
 {id:"mobile",name:"Mobile",text:"React Native, Expo, TypeScript, Firebase, testes automatizados."},
 {id:"python",name:"Backend Python",text:"Python, FastAPI, SQL, PostgreSQL, Docker, pytest."},
 {id:"data",name:"Dados e BI",text:"Python, SQL, pandas, NumPy, Power BI, Excel."}
] as const;
export function assessJob(text:string,projects:Group[]){
 const skills=[...new Set(projects.flatMap(p=>p.skills))];
 const match=matchJob(text,skills);
 const matches=match.matched.map(skill=>({skill,projects:projects.filter(p=>p.skills.some(s=>s.toLowerCase()===skill.toLowerCase())).map(p=>({name:p.name,evidence:p.evidence.filter(e=>e.skill.toLowerCase()===skill.toLowerCase()),repos:p.repos.filter(r=>r.language.toLowerCase()===skill.toLowerCase()).map(r=>({name:r.name,url:r.url}))}))}));
 const ranked=projects.map(p=>({name:p.name,skills:match.matched.filter(s=>p.skills.some(x=>x.toLowerCase()===s.toLowerCase()))})).filter(p=>p.skills.length).sort((a,b)=>b.skills.length-a.skills.length);
 return {...match,matches,ranked,total:match.matched.length+match.missing.length};
}
