import { Nunito_Sans, Poppins } from "next/font/google"

const titulo = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-login-titulo" })
const texto = Nunito_Sans({ subsets: ["latin"], variable: "--font-login-texto" })

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${titulo.variable} ${texto.variable} font-[family-name:var(--font-login-texto)]`}>
      {children}
    </div>
  )
}
