import "@/App.css"
import { z } from 'zod'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

const schemaValidation = z.object({
  name: z.string().trim().min(3).max(100).regex(/^[\p{L}\p{M} ]+$/u),
  email: z.string().trim().toLowerCase().pipe(z.email())
    .refine((value) => {
      const [username, domain] = value.split("@")

      return (
        domain === "gmail.com" &&
        username.length >= 6 &&
        username.length <= 30 &&
        /^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(username)
      )
    }, "Informe um e-mail válido."),
  password: z.string().min(8).max(300),
  userName: z.string().trim().min(2).max(100).regex(/^(?:\p{L}\p{M}*|\p{N})+$/u),
})

function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({
      resolver: zodResolver(schemaValidation)
  })

  const criarConta = async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })
      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.message || "Erro ao criar conta.")
      }

      navigate("/");
      toast.success(resultado.message || "Conta criada com sucesso!")
    } catch (error) {
      toast.error(error.message)
    }
  }

  function mostrarErro() {
    toast.error("Preencha todos os campos corretamente.")
  }

  function jaTenhoConta() {
    navigate("/")
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        {/* Cabeçalho do Card */}
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex flex-row gap-2 items-center justify-center text-2xl">Criar conta</CardTitle>
          <CardDescription className="text-md">Preencha todos os campos abaixo para criar sua conta.</CardDescription>
        </CardHeader>

        {/* Conteúdo */}
        <CardContent>
          <form onSubmit={handleSubmit( criarConta, mostrarErro )}>
            <FieldGroup>
              
              <Field>
                <FieldLabel htmlFor="name">
                  <span className="text-lg">Nome completo</span>
                </FieldLabel>
                <Input 
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  autoComplete="name"
                  {...register("name")}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="userName">
                  <span className="text-lg">Nome de usuário</span>
                </FieldLabel>
                <Input 
                  id="userName"
                  type="text"
                  autoComplete="userName"
                  placeholder="exemploUsuario7"
                  {...register("userName")}
                  required
                />
              </Field>

              <Field>
                  <FieldLabel htmlFor="email">
                    <span className="text-lg">Email</span>
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    {...register("email")}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">
                    <span className="text-lg">Senha</span>
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    {...register("password")}
                    required
                  />
                </Field>

            </FieldGroup>

            {/* Botões */}
            <div className="flex flex-col gap-2.5 mt-7">
              <Button type='submit'>Finalizar cadastro</Button>
              <Button type="button" variant="outline" onClick={jaTenhoConta}>
                Já tenho uma conta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register