import 'bootstrap/dist/css/bootstrap.min.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/600.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/600.css'
import './styles/tokens.css'
import './styles/theme.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import './styles/shared.css'
import AppRoutes from './routes/AppRoutes'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider><AppRoutes /></ToastProvider>
    </AuthProvider>
  </BrowserRouter>,
)
