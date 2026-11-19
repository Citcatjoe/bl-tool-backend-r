import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css'; // tokens Sidekick, avant tout autre style
import App from './App';
//import './index.css'; // Importation de Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
