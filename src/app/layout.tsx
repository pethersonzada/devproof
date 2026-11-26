import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
const dmSans=DM_Sans({subsets:["latin"],variable:"--font-body",display:"swap"});
const manrope=Manrope({subsets:["latin"],variable:"--font-title",display:"swap"});
import "./globals.css";
export const metadata:Metadata={title:"DevProof | Seu código em evidências",description:"Transforme projetos públicos do GitHub em evidências técnicas, currículos revisáveis e preparação para entrevistas."};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR" className={dmSans.variable+" "+manrope.variable}><body>{children}</body></html>;
}
