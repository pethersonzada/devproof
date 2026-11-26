import { scanRepo, apiFailure } from "../../../lib/github";
import { scanQuery } from "../../../lib/query-gate";
import { username,repoName } from "../../../lib/engine";
import { ApiError } from "../../../lib/github";
export const runtime="nodejs";
export async function GET(request:Request){
  const q=new URL(request.url).searchParams;
  try{const owner=username(q.get("owner")||""),name=repoName(q.get("repo")||"");if(!owner||!name)throw new ApiError(400,"Repositório inválido.");return Response.json(await scanQuery((owner+"/"+name).toLowerCase(),()=>scanRepo(owner,name)),{headers:{"Cache-Control":"no-store"}});}
  catch(e){return apiFailure(e);}
}
