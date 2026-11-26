import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"DevProof | Seu código em evidências",description:"Transforme projetos públicos do GitHub em evidências técnicas, currículos revisáveis e preparação para entrevistas."};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body>{children}</body></html>;
}
