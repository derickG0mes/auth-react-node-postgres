import "@/App.css"
import { useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { MailCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

const schemaValidation = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email())
    .refine((value) => {
      const [username, domain] = value.split("@")

      return (
        domain === "gmail.com" &&
        username.length >= 6 &&
        username.length <= 30 &&
        /^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(username)
      )
    }, "Informe um e-mail válido.")
})

function EsqueciSenha() {
  const navigate = useNavigate()
  const [enviado, setEnviado] = useState(false)
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schemaValidation)
  })

  const solicitarLink = async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const resultado = await response.json().catch(() => ({}))
        toast.error(
          response.status === 429
            ? "Muitas tentativas. Tente novamente mais tarde."
            : resultado.erro || "Não foi possível enviar o link."
        )
        return
      }

      // A mensagem é a mesma exista ou não a conta, para não revelar e-mails cadastrados.
      setEnviado(true)
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.")
    }
  }

  function mostrarErro() {
    toast.error("Informe um e-mail válido.")
  }

  if (enviado) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="flex flex-col items-center gap-3 text-center">
            <MailCheck className="size-12 text-green-500" aria-hidden="true" />
            <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
            <CardDescription className="text-md">
              Se o e-mail informado estiver cadastrado, enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>Voltar ao login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex flex-row gap-2 items-center justify-center text-2xl">Esqueceu a senha?</CardTitle>
          <CardDescription className="text-md">
            Informe seu e-mail e enviaremos um link para você criar uma nova senha.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form noValidate onSubmit={handleSubmit(solicitarLink, mostrarErro)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">
                  <span className="text-lg">Email</span>
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  required
                  {...register("email")}
                />
              </Field>
            </FieldGroup>

            <div className="flex flex-col gap-2.5 mt-7">
              <Button type="submit">Enviar link</Button>
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

export default EsqueciSenha
