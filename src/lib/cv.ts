import type {Group,Resume} from "./model.ts";
export type Entry={id:string;title:string;organization:string;period:string;detail:string};
export type ProjectEdit={title?:string;role?:string;bullets?:string;excluded?:boolean};
export const sectionDefaults=[["summary","Resumo profissional"],["skills","Competências técnicas"],["experience","Experiência profissional"],["projects","Projetos selecionados"],["education","Formação acadêmica"],["certifications","Certificações e cursos"],["languages","Idiomas"]] as const;
export type CustomSection={id:string;title:string;content:string};
export type CvDesign={accent:string;font:"sans"|"serif"|"mono";size:number;headingSize:number;lineHeight:number;spacing:number;margin:number;align:"left"|"center";layout:"single"|"columns";paper:"A4"|"Letter";rule:"line"|"none"|"solid";bullet:"disc"|"square"|"dash";photo:boolean;photoSource:"github"|"upload";photoData:string;photoShape:"circle"|"rounded"|"square";photoSize:number;photoSide:"left"|"right";photoX:number;photoY:number;showGithub:boolean;showProjectStack:boolean;order:string[];hidden:string[];titles:Record<string,string>;custom:CustomSection[]};
export function defaultDesign():CvDesign{return {accent:"#244c72",font:"sans",size:10,headingSize:21,lineHeight:1.43,spacing:1,margin:14,align:"left",layout:"single",paper:"A4",rule:"line",bullet:"disc",photo:true,photoSource:"github",photoData:"",photoShape:"circle",photoSize:23,photoSide:"right",photoX:50,photoY:50,showGithub:true,showProjectStack:true,order:sectionDefaults.map(([key])=>key),hidden:[],titles:{},custom:[]};}
export function sectionList(design:CvDesign){const items=[...sectionDefaults.map(([id,title])=>({id,title})),...design.custom.map(({id,title})=>({id,title}))];const positions=new Map(design.order.map((id,i)=>[id,i]));return items.sort((a,b)=>(positions.get(a.id)??9999)-(positions.get(b.id)??9999)).map(item=>({...item,title:Object.hasOwn(design.titles,item.id)?design.titles[item.id]:item.title}));}
export function githubAvatar(value:string){try{const url=new URL(value);return url.protocol==="https:"&&url.hostname==="avatars.githubusercontent.com"&&!url.username&&!url.password?url.href:"";}catch{return "";}}
export function avatarSource(design:CvDesign,avatar:string){if(!design.photo)return "";return design.photoSource==="upload"?(/^data:image\/(?:jpeg|png|webp);base64,/.test(design.photoData)?design.photoData:""):githubAvatar(avatar);}
export type CvOptions={template:"classic"|"modern"|"compact";projects:Record<string,ProjectEdit>;order:string[];hiddenSkills:string[];extraSkills:string;phone:string;linkedin:string;certifications:string;languages:string;work:Entry[];study:Entry[];showLinks:boolean;design:CvDesign};
export function initialCv():CvOptions{return {template:"classic",projects:{},order:[],hiddenSkills:[],extraSkills:"",phone:"",linkedin:"",certifications:"",languages:"",work:[],study:[],showLinks:true,design:defaultDesign()};}
export function projectEdit(options:CvOptions,name:string):ProjectEdit{return Object.hasOwn(options.projects,name)?options.projects[name]:{};}
export function displayName(name:string){return name.replace(/[-_]+/g," ").replace(/\b\p{L}/gu,c=>c.toUpperCase());}
export function lines(value:string){return value.split(/\r?\n/).map(s=>s.trim().replace(/^[-•]\s*/,"")).filter(Boolean);}
export function cvProjects(groups:Group[],options:CvOptions){
 const visible=groups.filter(g=>!projectEdit(options,g.name).excluded);
 const index=new Map(options.order.map((name,i)=>[name,i]));
 return [...visible].sort((a,b)=>(index.get(a.name)??99999)-(index.get(b.name)??99999));
}
export function cvSkills(groups:Group[],options:CvOptions){
 return [...new Set([...cvProjects(groups,options).flatMap(g=>g.skills).filter(s=>!["Testes automatizados","Documentação"].includes(s)),...options.extraSkills.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean)])].filter(s=>!options.hiddenSkills.includes(s)).sort((a,b)=>a.localeCompare(b,"pt-BR"));
}
export function suggestedBullets(group:Group):string[]{
 const e=group.evidence;
 const deps=[...new Set(e.filter(x=>x.kind==="dependency").map(x=>x.skill))];
 const bullets:string[]=[];
 if(group.repos.length>1)bullets.push("Projeto reúne "+group.repos.length+" repositórios selecionados: "+group.repos.map(r=>r.name).join(", ")+".");
 if(deps.length)bullets.push("Dependências declaradas nos manifestos: "+deps.slice(0,8).join(", ")+".");
 if(e.some(x=>x.skill==="Testes automatizados"))bullets.push("Arquivos de testes automatizados presentes no repositório.");
 if(e.some(x=>x.skill==="GitHub Actions"))bullets.push("Workflows de automação configurados no GitHub Actions.");
 if(e.some(x=>x.skill==="Docker"))bullets.push("Arquivos de configuração de contêiner identificados.");
 return bullets.slice(0,4);
}
export function suggestedDescription(group:Group):string{
 const source=group.repos.map(r=>r.description.trim()).filter(Boolean);
 const description=source[0]||group.description.trim();
 const clean=description.replace(/\s+/g," ").trim();
 const shortened=clean.length>270?clean.slice(0,267).replace(/\s+\S*$/,"")+"…":clean;
 const parts:string[]=[];
 if(shortened)parts.push(shortened);
 if(group.repos.length>1)parts.push("Componentes selecionados: "+group.repos.map(r=>r.name).join(", ")+".");
 return parts.join(" ");
}
export function suggestionSummary(groups:Group[],options:CvOptions){
 const projects=cvProjects(groups,options),skills=cvSkills(groups,options);
 if(!projects.length)return "";
 return "Perfil com projetos de software disponíveis no GitHub"+(skills.length?", com tecnologias identificadas como "+skills.slice(0,6).join(", "):"")+". "+(projects.length>1?"Portfólio reúne "+projects.length+" projetos selecionados para esta candidatura.":"Portfólio inclui o projeto "+displayName(projects[0].name)+".");
}
export function cvText(resume:Resume,groups:Group[],notes:Record<string,string>,options:CvOptions,profileUrl:string){
 const projects=cvProjects(groups,options),skills=cvSkills(groups,options),d=options.design;
 const entries=(items:Entry[])=>items.flatMap(x=>[[x.title,x.organization,x.period].filter(Boolean).join(" | "),...lines(x.detail).map(s=>"- "+s)]).filter(Boolean).join("\n");
 const content:Record<string,string>=Object.create(null);
 content.summary=resume.summary;content.skills=skills.join(", ");content.experience=[resume.experience,entries(options.work)].filter(Boolean).join("\n");
 content.projects=projects.map(g=>{const e=projectEdit(options,g.name),stack=g.skills.filter(s=>!options.hiddenSkills.includes(s));return [e.title||displayName(g.name),e.role,Object.hasOwn(notes,g.name)?notes[g.name]:g.description,...lines(e.bullets||"").map(s=>"- "+s),d.showProjectStack&&stack.length?"Tecnologias: "+stack.join(", "):"",options.showLinks?g.repos.map(r=>r.url).join("\n"):""].filter(Boolean).join("\n");}).join("\n\n");
 content.education=[resume.education,entries(options.study)].filter(Boolean).join("\n");content.certifications=options.certifications;content.languages=options.languages;
 for(const section of d.custom)content[section.id]=section.content;
 return [resume.name,resume.headline,[resume.email,options.phone,resume.location,resume.website,options.linkedin,d.showGithub?profileUrl:""].filter(Boolean).join(" | "),...sectionList(d).filter(s=>!d.hidden.includes(s.id)&&content[s.id]?.trim()).map(s=>s.title.toUpperCase()+"\n"+content[s.id])].filter(Boolean).join("\n\n");
}
