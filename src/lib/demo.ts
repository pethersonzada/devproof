import type {ImportResult,Resume,Scan} from "./model.ts";
const owner="devproof-demo";
const repo=(name:string,language:string,description:string)=>({name,owner,url:"https://github.com/"+owner+"/"+name,description,language,updatedAt:"",fork:false,archived:false,branch:"main",stars:0});
export const demoProfile:ImportResult={profile:{login:owner,name:"Alex Exemplo",bio:"Perfil fictício para testar o editor.",avatar:"",url:"https://github.com/"+owner,publicRepos:2},repos:[repo("agenda-api","Java","API de uma agenda fictícia."),repo("agenda-webapp","TypeScript","Interface web de uma agenda fictícia.")],truncated:false};
export const demoResume:Resume={name:"Alex Exemplo",headline:"Desenvolvimento Full Stack",email:"",location:"",summary:"Exemplo fictício de currículo. Substitua as informações pelos seus próprios dados.",education:"",experience:"",website:""};
