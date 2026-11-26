import {test,expect} from "@playwright/test";
const repo=(name,language)=>({name,owner:"example",url:"https://github.com/example/"+name,description:"Projeto de demonstração",language,updatedAt:"2026-01-01",fork:false,archived:false,branch:"main",stars:0});
const repos=[repo("bevans-webapp","TypeScript"),repo("bevans-backend","Java")];
const profile={profile:{login:"example",name:"Pessoa de teste",bio:"Desenvolvimento",avatar:"",url:"https://github.com/example",publicRepos:2},repos,truncated:false};
test("Fluxo completo: importar, agrupar, analisar, comparar e exportar",async({page})=>{
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.route("**/api/profile?*",route=>route.fulfill({json:profile}));
 await page.route("**/api/scan?*",route=>{
   const r=repos.find(r=>r.name===new URL(route.request().url()).searchParams.get("repo"));
   const skill=r.language==="Java"?"Spring Boot":"Next.js";
   return route.fulfill({json:{repo:r,commit:"a".repeat(40),warnings:["Evidência de teste."],evidence:[{skill,kind:"dependency",detail:"Dependência em manifesto",url:r.url+"/blob/"+"a".repeat(40)+"/manifest"}]}});
 });
 await page.goto("/");
 await page.getByLabel("Perfil público do GitHub").fill("example");
 await page.getByRole("button",{name:"Importar projetos"}).click();
 await expect(page.getByRole("heading",{name:"Pessoa de teste"})).toBeVisible();
 await page.getByRole("button",{name:"Aplicar sugestões de grupo"}).click();
 await expect(page.getByLabel("Grupo de bevans-webapp")).toHaveValue("bevans");
 await page.getByRole("button",{name:"Analisar selecionados"}).click();
 await expect(page.getByRole("heading",{name:"O que os projetos demonstram"})).toBeVisible();
 await expect(page.getByRole("heading",{name:"bevans",exact:true})).toBeVisible();
 await expect(page.locator(".proof-card")).toHaveCount(1);
 await expect(page.getByRole("link",{name:"Fonte"})).toHaveCount(2);
 await page.getByRole("button",{name:"Vaga e entrevista"}).click();
 await page.getByLabel("Descrição da vaga").fill("Java, Next.js, Spring Boot e Docker");
 await expect(page.locator(".match-grid article").first()).toContainText("Spring Boot");
 await expect(page.locator(".match-grid article").last()).toContainText("Docker");
 await page.getByRole("button",{name:"Currículo",exact:false}).click();
 await page.getByLabel("Nome",{exact:true}).fill("Nome revisado");
 await page.getByLabel("bevans",{exact:true}).fill("Descrição revisada pelo candidato.");
 await expect(page.locator("#print-resume")).toContainText("Descrição revisada pelo candidato.");
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Baixar texto"}).click();expect((await download).suggestedFilename()).toBe("devproof-curriculo.txt");
 await page.emulateMedia({media:"print"});await expect(page.locator("#print-resume")).toBeVisible();await expect(page.locator(".editor")).toBeHidden();
 expect(errors).toEqual([]);
});
test("Layout sem overflow em diferentes tamanhos e erro da API visível",async({page})=>{
 await page.route("**/api/profile?*",route=>route.fulfill({status:429,json:{error:"Limite da API do GitHub."}}));
 await page.goto("/");
 for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 }
 await page.getByLabel("Perfil público do GitHub").fill("example");
 await page.getByRole("button",{name:"Importar projetos"}).click();
 await expect(page.getByRole("alert")).toContainText("Limite da API");
});
