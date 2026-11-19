import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router"
import Register from './pages/Register.jsx'
import Painel from './pages/Painel.jsx'
import AtualizarSenha from './pages/UpdatePassword.jsx'
import EsqueciSenha from './pages/ForgotPassword.jsx'
import RedefinirSenha from './pages/ResetPassword.jsx'
import App from './App.jsx'
import { Toaster } from 'sonner'

const router = createBrowserRouter([
  { path: "*", element: <p>Erro na página</p>},
  { path: "/register", element: <Register />},
  { path: "/painel/", element: <Painel />},
  { path: "/update-password", element: <AtualizarSenha />},
  { path: "/esqueci-senha", element: <EsqueciSenha />},
  { path: "/redefinir-senha", element: <RedefinirSenha />},
  { path: "/", element: <App />}
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
    <Toaster position="top-center" richColors />
  </StrictMode>,
)
