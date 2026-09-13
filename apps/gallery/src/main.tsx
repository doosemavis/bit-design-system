import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@bit/react/styles.css';
import '@bit/react/themes/power-up.css';
import './gallery.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('bit gallery: #root element is missing from index.html');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
