import { importProfile, apiFailure } from "../../../lib/github";
import { profileQuery } from "../../../lib/query-gate";
import { username } from "../../../lib/engine";
import { ApiError } from "../../../lib/github";
export const runtime="nodejs";
export async function GET(request:Request){
  try {const login=username(new URL(request.url).searchParams.get("username")||"");if(!login)throw new ApiError(400,"Informe um usuário válido do GitHub.");return Response.json(await profileQuery(login.toLowerCase(),()=>importProfile(login)),{headers:{"Cache-Control":"no-store"}});}
  catch(e){return apiFailure(e);}
}
