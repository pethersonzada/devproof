import { importProfile, apiFailure } from "../../../lib/github";
export const runtime="nodejs";
export async function GET(request:Request){
  try {return Response.json(await importProfile(new URL(request.url).searchParams.get("username")||""),{headers:{"Cache-Control":"no-store"}});}
  catch(e){return apiFailure(e);}
}
