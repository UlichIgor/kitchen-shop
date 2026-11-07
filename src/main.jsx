import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import "./styles/main.scss";

// HashRouter: сайт працює на GitHub Pages та інших статичних хостингах.
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Не знайдено кореневий елемент #root у index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </HashRouter>
  </React.StrictMode>
);
