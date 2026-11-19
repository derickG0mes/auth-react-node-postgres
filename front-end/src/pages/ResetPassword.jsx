import "@/App.css"
import { z } from "zod"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

const schemaValidation = z.object({
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres.").max(300),
  confirmPassword: z.string()
}).refine((dados) => dados.newPassword === dados.confirmPassword, {
  message: "A confirmação não é igual à nova senha.",
  path: ["confirmPassword"]
})

function RedefinirSenha() {
  const navigate = useNavigate()
  // O token chega pelo link enviado por e-mail: /redefinir-senha?token=...
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schemaValidation)
  })

  const redefinirSenha = async ({ newPassword }) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      })
      const resultado = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(
          response.status === 429
            ? "Muitas tentativas. Tente novamente mais tarde."
            : resultado.erro || "Link inválido ou expirado. Solicite um novo."
        )
        return
      }

      toast.success(resultado.message || "Senha redefinida com sucesso! Faça login.")
      navigate("/", { replace: true })
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.")
    }
  }

  function mostrarErro(erros) {
    const primeiroErro = Object.values(erros)[0]
    toast.error(primeiroErro?.message || "Preencha todos os campos corretamente.")
  }

  // Sem token na URL não há o que redefinir: oferece pedir um novo link.
  if (!token) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="flex flex-col gap-1 text-center">
            <CardTitle className="text-2xl">Link inválido</CardTitle>
            <CardDescription className="text-md">
              Este link de redefinição está incompleto ou expirou. Solicite um novo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Button onClick={() => navigate("/esqueci-senha")}>Solicitar novo link</Button>
            <Button variant="outline" onClick={() => navigate("/")}>Voltar ao login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex flex-row gap-2 items-center justify-center text-2xl">Redefinir senha</CardTitle>
          <CardDescription className="text-md">Escolha uma nova senha para sua conta.</CardDescription>
        </CardHeader>

        <CardContent>
          <form noValidate onSubmit={handleSubmit(redefinirSenha, mostrarErro)}>
            <FieldGroup>
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
              <Button type="submit">Redefinir senha</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Voltar ao login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RedefinirSenha
