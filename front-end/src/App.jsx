import "@/App.css"
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field"
import { Button } from "./components/ui/button"
import { Input } from "@/components/ui/input"
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
    }, "Informe um e-mail válido."),

  password: z.string().min(8).max(300)
})

function App() {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schemaValidation)
  })

  const logarUsuario = async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      })
      const resultado = await response.json()

      if(response.status === 200) {
        navigate("/painel")
      }

      if (!response.ok) {
        toast.error(
          response.status === 401
            ? "Email ou senha inválida"
            : resultado.erro || "Não foi possível fazer login."
        )
        return
      }

      toast.success(resultado.message || "Login realizado com sucesso!")
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.")
    }
  }

  function mostrarErro() {
    toast.error("Email ou senha inválida")
  }

  function handleCriarConta() {
    navigate("/register");
  }

  function handleEsqueciSenha() {
    navigate("/esqueci-senha");
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        {/* Cabeçalho do Card */}
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="flex flex-row gap-2 items-center justify-center text-2xl">Login</CardTitle>
          <CardDescription className="text-md">Insira seu e-mail abaixo para acessar sua conta.</CardDescription>
        </CardHeader>

        {/* Conteúdo */}
        <CardContent>
          <form noValidate onSubmit={handleSubmit(logarUsuario, mostrarErro)}>
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

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">
                      <span className="text-lg">Senha</span>
                    </FieldLabel>
                    {/* type="button" evita que o link envie o formulário de login */}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0"
                      onClick={handleEsqueciSenha}
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    {...register("password")}
                  />
                </Field>

            </FieldGroup>

            {/* Botões */}
            <div className="flex flex-col gap-2.5 mt-7">
              <Button type='submit'>Entrar</Button>
              <Button type="button" variant="outline" onClick={handleCriarConta}>Criar conta</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
