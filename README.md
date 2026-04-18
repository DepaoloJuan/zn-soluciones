# NZ Soluciones — Web App

Sitio web profesional para **NZ Soluciones**, empresa de construcción en seco y mantenimiento integral. Desarrollado con React + Vite + Tailwind CSS y deployado en Firebase Hosting.

## 🌐 URLs

| App | URL |
|-----|-----|
| Landing page | https://nz-soluciones-landing.web.app |
| Calculadoras | https://nz-soluciones-calc.web.app |

---

## 🏗️ Estructura del proyecto

```
nz-soluciones/
├── firebase.json           # Config multi-site Firebase Hosting
├── .firebaserc             # Targets de deploy
│
├── landing/                # Landing page principal
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── CalcCTA.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── WhatsAppFloat.jsx
│   │   │   └── WhatsAppIcon.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
└── calculadoras/           # App de calculadoras (subdominio)
    ├── public/
    │   └── logo.png
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Calculator.jsx
    │   ├── data/
    │   │   └── materials.js
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── CielorrasoPage.jsx
    │   │   ├── TabiquePage.jsx
    │   │   └── PresupuestoPage.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## 🛠️ Stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4**
- **React Router DOM** (calculadoras)
- **Firebase Hosting** (multi-site)
- **localStorage** para persistencia de precios y último presupuesto

---

## 🚀 Desarrollo local

```bash
# Landing (http://localhost:5173)
cd landing
npm install
npm run dev

# Calculadoras (http://localhost:5174)
cd calculadoras
npm install
npm run dev
```

---

## 📦 Deploy

```bash
# Build de ambas apps
cd landing && npm run build && cd ..
cd calculadoras && npm run build && cd ..

# Deploy a Firebase
firebase deploy --only hosting
```

---

## ✅ Funcionalidades actuales

- Landing page con servicios, popup de WhatsApp y botón flotante
- Calculadora de **cielorraso** con ratios reales por m²
- Precios editables con persistencia en localStorage
- Selector de % de desperdicio
- Página de **presupuesto** exportable a PDF con logo y datos de la empresa
- Envío de resumen por WhatsApp
- Diseño responsive (mobile-first)

## 🔜 Próximamente

- Calculadora de **tabique** (placa simple)
- Historial de presupuestos
- Más tipos de estructuras (doble placa, cielorraso PVC, etc.)

---

## 👨‍💻 Desarrollado por

**Juan Manuel Depaolo**
[github.com/DepaoloJuan](https://github.com/DepaoloJuan)
