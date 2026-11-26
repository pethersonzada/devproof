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
 await expect(page.locator(".hero")).toHaveCount(0);
 await page.getByRole("button",{name:"Ativar tema escuro"}).click();
 await expect(page.locator(".app-root")).toHaveAttribute("data-theme","dark");
 await page.getByRole("button",{name:"Ativar tema claro"}).click();
 await page.getByRole("button",{name:"Só selecionados"}).click();
 await expect(page.locator(".repo")).toHaveCount(2);
 await page.getByRole("button",{name:"Só selecionados"}).click();
 await page.getByRole("button",{name:"Aplicar sugestões de grupo"}).click();
 await expect(page.getByLabel("Grupo de bevans-webapp")).toHaveValue("bevans");
 await page.getByRole("button",{name:"Analisar selecionados"}).click();
 await expect(page.getByRole("heading",{name:"O que os projetos demonstram"})).toBeVisible();
 await expect(page.getByRole("heading",{name:"bevans",exact:true})).toBeVisible();
 await expect(page.locator(".proof-card")).toHaveCount(1);
 await expect(page.getByRole("link",{name:"Fonte"})).toHaveCount(2);
 await page.getByRole("button",{name:"Vaga e entrevista"}).click();
 await page.getByLabel("Descrição da vaga").fill("desenvolvedor");
 await expect(page.getByRole("heading",{name:"Precisamos de requisitos técnicos"})).toBeVisible();
 await expect(page.locator(".match-grid")).toHaveCount(0);
 await page.getByRole("button",{name:"Backend Java",exact:true}).click();
 await expect(page.getByLabel("Descrição da vaga")).toHaveValue(/Spring Boot/);
 await expect(page.getByText("Lista ilustrativa de Backend Java, não uma vaga real.")).toBeVisible();
 await page.getByLabel("Descrição da vaga").fill("Java, Next.js, Spring Boot e Docker");
 await expect(page.locator(".match-grid article").first()).toContainText("Spring Boot");
 await page.locator(".job-skill summary").filter({hasText:"Spring Boot"}).click();
 await expect(page.locator(".job-source a").filter({hasText:"Dependência em manifesto"})).toBeVisible();
 await expect(page.locator(".job-ranked")).toContainText("bevans");
 await expect(page.locator(".match-grid article").last()).toContainText("Docker");
 await page.getByRole("navigation",{name:"Etapas do DevProof"}).getByRole("button",{name:"Currículo",exact:true}).click();
 await page.getByLabel("Nome",{exact:true}).fill("Nome revisado");
 await page.getByRole("navigation",{name:"Seções do currículo"}).getByRole("button",{name:"Projetos",exact:true}).click();
 await page.getByRole("textbox",{name:"Descrição de bevans",exact:true}).fill("Descrição revisada pelo candidato.");
 await expect(page.locator("#print-resume")).toContainText("Descrição revisada pelo candidato.");
 await page.getByRole("button",{name:"Sugerir evidências técnicas"}).click();
 await expect(page.locator("#print-resume")).toContainText("Dependências declaradas");
 await page.getByRole("button",{name:"Preparar rascunho"}).click();
 await expect(page.locator("#print-resume")).toContainText("Perfil com projetos de software disponíveis no GitHub");
 await expect(page.locator("#print-resume")).toContainText("Descrição revisada pelo candidato.");
 await page.getByRole("navigation",{name:"Seções do currículo"}).getByRole("button",{name:"Modelo",exact:true}).click();
 await page.getByRole("button",{name:/Contemporâneo/}).click();
 await expect(page.locator("#print-resume")).toHaveClass(/template-modern/);
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
 await page.setViewportSize({width:1280,height:900});
 const download=page.waitForEvent("download");await page.getByRole("button",{name:"Baixar texto"}).click();expect((await download).suggestedFilename()).toBe("devproof-curriculo.txt");
 await page.emulateMedia({media:"print"});await expect(page.locator("#print-resume")).toBeVisible();await expect(page.locator(".editor")).toBeHidden();
 const pdf=await page.pdf({format:"A4"});expect(pdf.subarray(0,5).toString()).toBe("%PDF-");expect(pdf.length).toBeGreaterThan(1000);
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
 await expect(page.locator("#import-error[role=alert]")).toContainText("Limite da API");
});

test("Preferência de tema persiste e nova sessão protege as edições",async({page})=>{
 await page.route("**/api/profile?*",route=>route.fulfill({json:profile}));
 await page.goto("/");
 await page.getByRole("button",{name:"Ativar tema escuro"}).click();
 await page.reload();
 await expect(page.locator(".app-root")).toHaveAttribute("data-theme","dark");
 await page.getByRole("button",{name:"Ativar tema claro"}).click();
 await page.getByLabel("Perfil público do GitHub").fill("example");
 await page.getByRole("button",{name:"Importar projetos"}).click();
 await expect(page.locator(".workbench")).toBeVisible();
 await page.getByLabel("Filtrar repositórios").fill("inexistente");
 await expect(page.getByRole("heading",{name:"Nenhum repositório encontrado"})).toBeVisible();
 await page.getByRole("button",{name:"Limpar filtros"}).click();
 await expect(page.locator(".repo")).toHaveCount(2);
 page.once("dialog",dialog=>dialog.dismiss());
 await page.getByRole("button",{name:"Nova sessão"}).click();
 await expect(page.locator(".workbench")).toBeVisible();
 page.once("dialog",dialog=>dialog.accept());
 await page.getByRole("button",{name:"Nova sessão"}).click();
 await expect(page.getByLabel("Perfil público do GitHub")).toBeVisible();
 await expect(page.locator(".workbench")).toHaveCount(0);
});

test("Editor permite organizar projetos, competências e formação",async({page})=>{
 await page.route("**/api/profile?*",route=>route.fulfill({json:profile}));await page.goto("/");await page.getByLabel("Perfil público do GitHub").fill("example");await page.getByRole("button",{name:"Importar projetos"}).click();await page.getByRole("navigation",{name:"Etapas do DevProof"}).getByRole("button",{name:"Currículo",exact:true}).click();
 const nav=page.getByRole("navigation",{name:"Seções do currículo"});await nav.getByRole("button",{name:"Projetos",exact:true}).click();await page.getByRole("button",{name:"Subir bevans-backend"}).click();await expect(page.locator("#print-resume .resume-project").first()).toContainText("Bevans Backend");await page.getByRole("checkbox",{name:"Bevans Webapp"}).uncheck();await expect(page.locator("#print-resume .resume-project")).toHaveCount(1);
 await nav.getByRole("button",{name:"Competências"}).click();await page.getByLabel("Outras competências (separadas por vírgulas)").fill("SQL, Git");await expect(page.locator("#print-resume")).toContainText("SQL");await page.getByRole("checkbox",{name:"SQL",exact:true}).uncheck();await expect(page.locator("#print-resume")).not.toContainText("SQL");
 await nav.getByRole("button",{name:"Trajetória"}).click();await page.getByRole("button",{name:"+ Adicionar formação"}).click();await page.getByLabel("Curso",{exact:true}).fill("ADS");await page.getByLabel("Instituição",{exact:true}).fill("Faculdade de teste");await expect(page.locator("#print-resume")).toContainText("ADS | Faculdade de teste");
});
