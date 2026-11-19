import "@/App.css"
import { useEffect, useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

const schemaValidation = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual.").max(300),
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres.").max(300),
  confirmPassword: z.string()
})
  .refine((dados) => dados.newPassword === dados.confirmPassword, {
    message: "A confirmação não é igual à nova senha.",
    path: ["confirmPassword"]
  })
  .refine((dados) => dados.newPassword !== dados.currentPassword, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["newPassword"]
  })

function AtualizarSenha() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(schemaValidation)
  })

  // A página só é útil com sessão ativa: descobre o id do usuário pelo token ou volta ao login.
  useEffect(() => {
    let cancelado = false

    async function verificarSessao() {
      try {
        const resposta = await fetch(`${API_URL}/auth/me`, { credentials: "include" })

        if (resposta.status === 401 || resposta.status === 403) {
          if (!cancelado) navigate("/", { replace: true })
          return
        }

        if (!resposta.ok) {
          toast.error("Não foi possível carregar a página.")
          return
        }

        const { usuario } = await resposta.json()
        if (!cancelado) setUserId(usuario.id)
      } catch {
        toast.error("Não foi possível conectar ao servidor. Tente novamente.")
      }
    }

    verificarSessao()

    return () => { cancelado = true }
  }, [navigate])

  const atualizarSenha = async ({ currentPassword, newPassword }) => {
    try {
      // confirmPassword fica só no front-end: a API rejeita campos extras.
      const response = await fetch(`${API_URL}/api/atualizar/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const resultado = await response.json()

      if (!response.ok) {
        // Aqui o 401 significa "senha atual incorreta", e não sessão expirada.
        toast.error(resultado.erro || "Não foi possível atualizar a senha.")
        return
      }

      toast.success(resultado.message || "Senha atualizada com sucesso!")
      reset()
      navigate("/painel")
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.")
    }
  }

  function mostrarErro(erros) {
    const primeiroErro = Object.values(erros)[0]
    toast.error(primeiroErro?.message || "Preencha todos os campos corretamente.")
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex flex-row gap-2 items-center justify-center text-2xl">Atualizar senha</CardTitle>
          <CardDescription className="text-md">Informe sua senha atual e escolha uma nova senha.</CardDescription>
        </CardHeader>

        <CardContent>
          <form noValidate onSubmit={handleSubmit(atualizarSenha, mostrarErro)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="currentPassword">
                  <span className="text-lg">Senha atual</span>
                </FieldLabel>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                  {...register("currentPassword")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="newPassword">
                  <span className="text-lg">Nova senha</span>
                </FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  required
                  {...register("newPassword")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  <span className="text-lg">Confirmar nova senha</span>
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  required
                  {...register("confirmPassword")}
                />
              </Field>
            </FieldGroup>

            <div className="flex flex-col gap-2.5 mt-7">
              <Button type="submit" disabled={userId === null}>Atualizar senha</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/painel")}>
                Voltar ao painel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AtualizarSenha
