import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Import code generator for admin use (available in console as window.NVisionCodeGen)
import '@/utils/codeGenerator'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 