// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import AppWithLoader from './AppWithLoader';

import { ToastProvider } from './components/toast/ToastProvider';
import { Provider } from 'react-redux';
import store from './store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
          <ToastProvider>
            <AppWithLoader />
          </ToastProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
