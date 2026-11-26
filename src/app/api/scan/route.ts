import { scanRepo, apiFailure } from "../../../lib/github";
export const runtime="nodejs";
export async function GET(request:Request){
  const q=new URL(request.url).searchParams;
  try{return Response.json(await scanRepo(q.get("owner")||"",q.get("repo")||""),{headers:{"Cache-Control":"no-store"}});}
  catch(e){return apiFailure(e);}
}
