import type { Repo, Evidence, Scan, Group } from "./model.ts";

export function username(value:string) {
  const clean=value.trim().replace(/^@/,"").replace(/^https:\/\/github\.com\//i,"").replace(/\/$/,"");
  return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(clean)&&!clean.includes("--")?clean:null;
}
export function repoName(value:string){return /^[a-zA-Z0-9_.-]{1,100}$/.test(value)&&value!=="."&&value!==".." ? value : null;}
export function suggestGroup(name:string){
  return name.replace(/[-_.](?:frontend|backend|webapp|mobile|api|app|agente|agent|server|client|web)$/i,"")||name;
}
const packages:Record<string,string>={"next":"Next.js","react":"React","react-native":"React Native","expo":"Expo","typescript":"TypeScript","vue":"Vue","nuxt":"Nuxt","@angular/core":"Angular","express":"Express","fastify":"Fastify","@nestjs/core":"NestJS","tailwindcss":"Tailwind CSS","firebase":"Firebase","@react-native-firebase/app":"Firebase","@prisma/client":"Prisma","pg":"PostgreSQL","mongoose":"MongoDB","vitest":"Vitest","jest":"Jest","@playwright/test":"Playwright","cypress":"Cypress","@testing-library/react":"Testing Library","mapbox-gl":"Mapbox","@rnmapbox/maps":"Mapbox","zod":"Zod"};
const python:Record<string,string>={fastapi:"FastAPI",django:"Django",flask:"Flask",sqlalchemy:"SQLAlchemy",pandas:"pandas",numpy:"NumPy",scikit_learn:"scikit-learn",pytest:"pytest",streamlit:"Streamlit",psycopg:"PostgreSQL",psycopg2:"PostgreSQL",langchain:"LangChain"};
export type TreeItem={path:string;type:string;sha:string;size?:number};
export function manifestPaths(items:TreeItem[]){
  return items.filter(x=>x.type==="blob"&&typeof x.size==="number"&&x.size<=65536&&/(^|\/)(package\.json|pom\.xml|requirements(?:-dev)?\.txt|pyproject\.toml|build\.gradle(?:\.kts)?)$/i.test(x.path)&&!/(^|\/)(node_modules|vendor|dist|build|\.next|fixtures|examples)\//.test(x.path)).sort((a,b)=>a.path.split("/").length-b.path.split("/").length||a.path.localeCompare(b.path)).slice(0,6);
}
export function evidenceUrl(repo:Repo,sha:string,path?:string){
  const base=repo.url+(path?"/blob/":"/tree/")+encodeURIComponent(sha);
  return path?base+"/"+path.split("/").map(encodeURIComponent).join("/"):base;
}
export function inspect(repo:Repo,sha:string,items:TreeItem[],manifests:Record<string,string>):Evidence[]{
  const found=new Map<string,Evidence>();
  function add(skill:string,kind:Evidence["kind"],detail:string,path?:string){
    const key=skill+"|"+kind;
    if(!found.has(key))found.set(key,{skill,kind,detail,url:evidenceUrl(repo,sha,path)});
  }
  if(repo.language)add(repo.language,"language","Linguagem principal indicada pelo GitHub.");
  for(const [path,content] of Object.entries(manifests)){
    if(path.endsWith("package.json")){
      try{
        const data=JSON.parse(content);
        const deps={...data.dependencies,...data.devDependencies,...data.peerDependencies};
        for(const [pkg,skill] of Object.entries(packages))if(Object.hasOwn(deps,pkg))add(skill,"dependency",pkg+" declarado em "+path,path);
      }catch{/* manifesto inválido não é evidência */}
    }else if(/(requirements(?:-dev)?\.txt|pyproject\.toml)$/.test(path)){
      for(const [pkg,skill] of Object.entries(python)){
        const pattern=pkg.replaceAll("_","[-_]");
        if(new RegExp("(?:^|[\\n\\s\\\"'])"+pattern+"(?=[\\s\\[=<>!~;\\\"',]|$)","i").test(content))add(skill,"dependency",pkg+" declarado em "+path,path);
      }
    }else if(/pom\.xml|build\.gradle/.test(path)){
      for(const [pattern,skill] of [[/spring-boot/,"Spring Boot"],[/org\.postgresql|<artifactId>postgresql<\/artifactId>/,"PostgreSQL"],[/junit/,"JUnit"],[/org\.testcontainers/,"Testcontainers"],[/firebase-admin/,"Firebase"],[/spring-security/,"Spring Security"],[/ortools-java/,"OR-Tools"]] as const){
        if(pattern.test(content))add(skill,"dependency","Referência de dependência em "+path,path);
      }
    }
  }
  const rules:[RegExp,string,string][]=[
    [/(^|\/)(Dockerfile(?:\.[^/]+)?|compose\.ya?ml|docker-compose\.ya?ml)$/i,"Docker","Arquivo de configuração de contêiner"],
    [/^\.github\/workflows\/[^/]+\.ya?ml$/i,"GitHub Actions","Workflow presente"],
    [/(^|\/)([^/]+\.(test|spec)\.[cm]?[jt]sx?|test_[^/]+\.py|[^/]+Test\.java)$/i,"Testes automatizados","Arquivo de teste presente"],
    [/(^|\/)tsconfig(?:\.[^/]+)?\.json$/i,"TypeScript","Arquivo de configuração presente"],
    [/(^|\/)pom\.xml$/i,"Maven","Manifesto Maven presente"],
    [/(^|\/)(build\.gradle(?:\.kts)?)$/i,"Gradle","Manifesto Gradle presente"],
    [/(^|\/)README(?:\.[^/]+)?$/i,"Documentação","README presente"]
  ];
  for(const [pattern,skill,detail] of rules){const file=items.find(x=>x.type==="blob"&&pattern.test(x.path));if(file)add(skill,"file",detail+": "+file.path,file.path);}
  return [...found.values()].sort((a,b)=>a.skill.localeCompare(b.skill,"pt-BR"));
}
export function own<T>(record:Record<string,T>,key:string):T|undefined{return Object.hasOwn(record,key)?record[key]:undefined;}
export function groups(repos:Repo[],scans:Record<string,Scan>,names:Record<string,string>):Group[]{
  const map=new Map<string,Group>();
  for(const repo of repos){
    const name=(own(names,repo.name)||repo.name).trim()||repo.name,key=name.toLocaleLowerCase();
    const group=map.get(key)||{name,repos:[],skills:[],evidence:[],description:"",signals:[]};
    group.repos.push(repo);
    const evidence=own(scans,repo.name)?.evidence||[];
    group.evidence.push(...evidence);
    group.signals=[...(group.signals||[]),...(own(scans,repo.name)?.signals||[])];
    group.skills=[...new Set([...group.skills,...(repo.language?[repo.language]:[]),...evidence.filter(x=>x.skill!=="Documentação").map(x=>x.skill)])].sort();
    if(repo.description&&!group.description.includes(repo.description))group.description+=(group.description?" ":"")+repo.description;
    map.set(key,group);
  }
  return [...map.values()];
}
const aliases:Record<string,string[]>={"Java":["java"],"JavaScript":["javascript"],"TypeScript":["typescript"],"React":["react"],"React Native":["react native"],"Next.js":["next.js","nextjs"],"Spring Boot":["spring boot","springboot"],"Python":["python"],"FastAPI":["fastapi"],"SQL":["sql"],"PostgreSQL":["postgresql","postgres"],"Docker":["docker"],"Kubernetes":["kubernetes","k8s"],"GitHub Actions":["github actions","ci/cd"],"Firebase":["firebase"],"AWS":["aws"],"Azure":["azure"],"Linux":["linux"],"Testes automatizados":["testes automatizados","automated testing"],"MongoDB":["mongodb"],"Vue":["vue"],"Angular":["angular"],"Git":["git"],"Node.js":["node.js","nodejs"],"HTML":["html","html5"],"CSS":["css","css3"],"Expo":["expo"],"Tailwind CSS":["tailwind css","tailwindcss","tailwind"],"Playwright":["playwright"],"pytest":["pytest"],"pandas":["pandas"],"NumPy":["numpy"],"Power BI":["power bi","powerbi"],"Excel":["excel"],"SQLite":["sqlite"],"MySQL":["mysql"],"Redis":["redis"],"Django":["django"],"Flask":["flask"],"Express":["express","express.js"],"Prisma":["prisma"],"JUnit":["junit"],"Maven":["maven"],"Gradle":["gradle"],"Streamlit":["streamlit"],"Oracle Cloud":["oracle cloud","oci"],"C#":["c#"],"C++":["c++"],".NET":[".net","dotnet"],"Go":["golang"],"Rust":["rust"],"PHP":["php"],"Laravel":["laravel"],"Kotlin":["kotlin"],"Swift":["swift"]};
export function matchJob(text:string,skills:string[]){
  const available=new Set(skills.map(x=>x.toLowerCase()));
  const normalized=text.toLowerCase().replace(/react[ -]native/g,"reactnative");
  const requirements=Object.entries(aliases).filter(([,terms])=>terms.some(term=>{
    const escaped=term.replace("react native","reactnative").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    return new RegExp("(^|[^a-z0-9])"+escaped+"(?=$|[^a-z0-9])","i").test(normalized);
  })).map(([name])=>name);
  return {matched:requirements.filter(x=>available.has(x.toLowerCase())),missing:requirements.filter(x=>!available.has(x.toLowerCase()))};
}
export function interviewQuestions(group:Group){
  const questions=["Qual problema o projeto "+group.name+" resolve e qual foi sua contribuição individual?"];
  if(group.repos.length>1)questions.push("Como os repositórios se comunicam e quais decisões de arquitetura você tomou?");
  if(group.skills.includes("Testes automatizados"))questions.push("Escolha um teste do projeto. Que comportamento ele verifica e que falha ele detectaria?");
  if(group.skills.includes("Docker"))questions.push("Como os serviços são executados em contêineres e quais dependências precisam estar disponíveis?");
  if(group.skills.includes("GitHub Actions"))questions.push("O que o workflow automatiza? Como você verifica uma falha no pipeline?");
  if(group.skills.length)questions.push("Por que você escolheu "+group.skills.slice(0,3).join(", ")+"? Quais limitações encontrou?");
  questions.push("Que parte ainda precisa ser validada ou melhorada?");
  return questions;
}
