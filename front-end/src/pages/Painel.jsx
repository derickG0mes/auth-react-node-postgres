import { Button } from "@/components/ui/button.jsx"
import { Check } from "lucide-react"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

function Painel() {
  const navigate = useNavigate();
  const [ dados, setDados ] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function verificarDados() {
      try {
        // O cookie httpOnly só é enviado se credentials estiver como "include".
        const resposta = await fetch(`${API_URL}/auth/me`, { credentials: "include" })

        // Sem token (401) ou com token inválido/expirado (403), volta para o login.
        if (resposta.status === 401 || resposta.status === 403) {
          if (!cancelado) navigate("/", { replace: true })
          return
        }

        if (!resposta.ok) {
          toast.error("Não foi possível carregar o painel.")
          return
        }

        const { usuario } = await resposta.json()

        // Busca o perfil completo usando o id que veio do token.
        const perfil = await fetch(`${API_URL}/api/usuarios/${usuario.id}`, { credentials: "include" })

        if (!perfil.ok) {
          toast.error("Não foi possível carregar seus dados.")
          return
        }

        if (!cancelado) setDados(await perfil.json())
      } catch {
        toast.error("Não foi possível conectar ao servidor. Tente novamente.")
      }
    }
    verificarDados()

    // Evita atualizar o estado se o componente for desmontado (ex.: StrictMode).
    return () => { cancelado = true }
  }, [navigate])

  const sairDaContaUsuario = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      const resultado = await response.json();

      if (!response.ok) {
        toast.error(resultado.erro || "Não foi possível sair da conta.")
        return
      }

      toast.success(resultado.message || "Você saiu da sua conta!")
      navigate("/");
    } catch {
      toast.error("Não foi possível sair da conta")
    }
  }

  // Enquanto os dados não chegam (ou durante o redirecionamento), não mostra o painel.
  if (!dados) {
    return (
      <section className="w-full min-h-screen flex justify-center items-center">
        <p className="text-muted-foreground">Carregando...</p>
      </section>
    )
  }

  return (
    <section className="w-full min-h-screen flex justify-center items-center">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Círculo verde com o ícone de confere */}
        <div className="flex size-24 items-center justify-center rounded-full bg-green-500 shadow-lg">
          <Check className="size-12 text-white" strokeWidth={3} aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold">Login realizado com sucesso!</h1>
        <p className="text-muted-foreground">Olá, {dados.nome} ({dados.email})</p>

        <div className="flex flex-col gap-2.5">
          <Button onClick={() => navigate("/update-password")}>Atualizar senha</Button>
          <Button variant="outline" onClick={sairDaContaUsuario}>Sair da conta</Button>
        </div>
      </div>
    </section>
  )
}

export default Painel
