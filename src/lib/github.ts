import type { Profile, Repo, ImportResult, Scan } from "./model.ts";
import { username, repoName, inspect, manifestPaths, type TreeItem } from "./engine.ts";

export class ApiError extends Error {
  constructor(public status:number,message:string){super(message);}
}
type GitHubRepo={name:string;owner:{login:string};description:string|null;language:string|null;updated_at:string;fork:boolean;archived:boolean;private:boolean;visibility?:string;default_branch:string;stargazers_count:number};
type GitHubUser={login:string;name:string|null;bio:string|null;avatar_url:string;public_repos:number};
const api="https://api.github.com";
async function github<T>(path:string):Promise<{data:T;next:boolean}>{
  const headers:Record<string,string>={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"DevProof"};
  if(process.env.GITHUB_TOKEN)headers.Authorization="Bearer "+process.env.GITHUB_TOKEN;
  let response:Response;
  try{response=await fetch(api+path,{headers,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000)});}
  catch{throw new ApiError(502,"Não foi possível conectar ao GitHub. Tente novamente.");}
  if(response.status===429||response.status===403)throw new ApiError(429,"Limite ou restrição da API do GitHub. Aguarde antes de tentar novamente.");
  if(response.status===404)throw new ApiError(404,"Perfil ou repositório público não encontrado.");
  if(response.status===409)throw new ApiError(409,"Repositório vazio ou sem commit disponível.");
  if(!response.ok)throw new ApiError(502,"GitHub retornou uma resposta inesperada.");
  return {data:await response.json() as T,next:(response.headers.get("link")||"").includes('rel="next"')};
}
function publicRepo(r:GitHubRepo):boolean{return r.private===false&&(!r.visibility||r.visibility==="public");}
function mapRepo(r:GitHubRepo):Repo{
  return {name:r.name,owner:r.owner.login,url:"https://github.com/"+encodeURIComponent(r.owner.login)+"/"+encodeURIComponent(r.name),description:r.description||"",language:r.language||"",updatedAt:r.updated_at,fork:r.fork,archived:r.archived,branch:r.default_branch,stars:r.stargazers_count};
}
export async function importProfile(raw:string):Promise<ImportResult>{
  const login=username(raw);if(!login)throw new ApiError(400,"Informe um usuário válido do GitHub.");
  const {data:user}=await github<GitHubUser>("/users/"+encodeURIComponent(login));
  if(!username(user.login))throw new ApiError(502,"Perfil inesperado.");
  const profile:Profile={login:user.login,name:user.name||user.login,bio:user.bio||"",avatar:user.avatar_url,url:"https://github.com/"+encodeURIComponent(user.login),publicRepos:user.public_repos};
  const repos:Repo[]=[];let next=true,page=1;
  while(next&&page<=10){
    const result=await github<GitHubRepo[]>("/users/"+encodeURIComponent(user.login)+"/repos?type=owner&sort=updated&per_page=100&page="+page);
    for(const r of result.data)if(publicRepo(r)&&r.owner.login.toLowerCase()===user.login.toLowerCase())repos.push(mapRepo(r));
    next=result.next;page++;
  }
  return {profile,repos:[...new Map(repos.map(r=>[r.name,r])).values()],truncated:next};
}
export async function scanRepo(rawOwner:string,rawRepo:string):Promise<Scan>{
  const owner=username(rawOwner),name=repoName(rawRepo);
  if(!owner||!name)throw new ApiError(400,"Repositório inválido.");
  const root="/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(name);
  const {data:meta}=await github<GitHubRepo>(root);
  if(!publicRepo(meta))throw new ApiError(404,"DevProof analisa apenas repositórios públicos.");
  const repo=mapRepo(meta);
  const {data:commit}=await github<{sha:string;commit:{tree:{sha:string}}}>(root+"/commits/"+encodeURIComponent(repo.branch));
  if(!/^[a-f0-9]{40}$/i.test(commit.sha)||!/^[a-f0-9]{40}$/i.test(commit.commit.tree.sha))throw new ApiError(502,"Commit não reconhecido.");
  const {data:tree}=await github<{tree:TreeItem[];truncated:boolean}>(root+"/git/trees/"+commit.commit.tree.sha+"?recursive=1");
  const warnings:string[]=[];
  if(tree.truncated)warnings.push("O GitHub truncou a árvore; a análise não é exaustiva.");
  if(repo.fork)warnings.push("Este é um fork. As evidências não comprovam autoria individual.");
  const manifests:Record<string,string>=Object.create(null);
  const paths=manifestPaths(tree.tree);
  for(const item of paths){
    if(!/^[a-f0-9]{40}$/i.test(item.sha))continue;
    try{
      const {data:blob}=await github<{content:string;encoding:string;size:number}>(root+"/git/blobs/"+item.sha);
      if(blob.encoding==="base64"&&blob.size<=65536&&blob.content.length<=100000)manifests[item.path]=Buffer.from(blob.content,"base64").toString("utf8");
    }catch(e){
      if(e instanceof ApiError&&e.status===429){warnings.push("Limite da API atingido durante a leitura de manifestos. Evidências parciais.");break;}
      warnings.push("Não foi possível ler "+item.path+".");
    }
  }
  warnings.push("Análise por linguagem principal, árvore e até seis manifestos. Presença de código ou dependência não comprova autoria, domínio ou execução.");
  return {repo,commit:commit.sha,evidence:inspect(repo,commit.sha,tree.tree,manifests),warnings};
}
export function apiFailure(error:unknown){
  return Response.json({error:error instanceof ApiError?error.message:"Não foi possível concluir a consulta."},{status:error instanceof ApiError?error.status:500,headers:{"Cache-Control":"no-store"}});
}
