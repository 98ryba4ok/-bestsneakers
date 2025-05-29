import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import GenderGroup from './components/gender_group/GenderGroup'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    
<Header></Header>
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <GenderGroup />
  </div>
   <Footer></Footer>
  </StrictMode>,
)
