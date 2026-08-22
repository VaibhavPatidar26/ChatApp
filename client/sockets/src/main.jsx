import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom"
import AppProvider from './Context/AppContext.jsx'
import { ToastContainer } from 'react-toastify'
createRoot(document.getElementById('root')).render(


    <BrowserRouter>
    <AppProvider>
        <App />
        <ToastContainer position="top-right" autoClose={2500} newestOnTop />
    </AppProvider>
      
    </BrowserRouter>
    


      
)
