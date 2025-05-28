import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    
<Header></Header>
   
  </StrictMode>,
)
