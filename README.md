# 🎭 Impostor Game

Un juego multijugador en tiempo real inspirado en Among Us, desarrollado con React, Node.js y Socket.IO.

## 🎮 Características

- **Multijugador en tiempo real** con Socket.IO
- **Interfaz moderna** con Material-UI y animaciones
- **Roles dinámicos**: Impostor vs Ciudadanos
- **Sistema de votación** por mayoría
- **Salas personalizadas** con códigos únicos
- **Responsive design** para móviles y desktop

## 🚀 Tecnologías

### Frontend
- **React 19** + **Vite**
- **Material-UI (MUI)** para componentes
- **Socket.IO Client** para comunicación en tiempo real
- **Zustand** para manejo de estado

### Backend
- **Node.js** + **Express**
- **Socket.IO** para WebSockets
- **CORS** para comunicación cross-origin

## 📱 Cómo jugar

1. **Ingresa tu nombre** y únete a una sala
2. **Espera** a que se unan mínimo 3 jugadores
3. **Inicia la ronda** - se asignará un impostor aleatoriamente
4. **Los ciudadanos** ven una palabra secreta, **el impostor** no
5. **Voten** para eliminar a quien crean que es el impostor
6. **Gana el impostor** si queda solo o en minoría
7. **Ganan los ciudadanos** si eliminan al impostor

## 🛠️ Instalación y desarrollo

### Requisitos
- Node.js 18+
- npm

### Configuración local

```bash
# Clonar repositorio
git clone https://github.com/nicotoconas007/impostor-game.git
cd impostor-game

# Instalar dependencias del servidor
cd server
npm install

# Instalar dependencias del cliente
cd ../client
npm install
```

### Ejecutar en desarrollo

```bash
# Terminal 1 - Servidor (puerto 3001)
cd server
npm run dev

# Terminal 2 - Cliente (puerto 5173)
cd client
npm run dev
```

### Acceso desde red local

Para jugar desde otros dispositivos en la misma red:

1. **Encuentra tu IP local** (ej: 192.168.1.100)
2. **Actualiza** `client/src/socket.js` con tu IP
3. **Accede desde otros dispositivos**: `http://tu-ip:5173`

## 🌐 Deploy en producción

### Backend (Railway/Render)
El backend está configurado para deploy automático en servicios como Railway o Render.

### Frontend (Netlify/Vercel)
```bash
cd client
npm run build
# Subir carpeta dist/ a Netlify
```

## 🎯 Estructura del proyecto

```
impostor-game/
├── client/          # Frontend React
│   ├── src/
│   │   ├── App.jsx  # Componente principal
│   │   ├── socket.js # Configuración Socket.IO
│   │   └── store/   # Estado global
│   └── package.json
├── server/          # Backend Node.js
│   ├── index.js     # Servidor Express + Socket.IO
│   └── package.json
└── README.md
```

## 🎨 Características de UI

- **Gradientes animados** y efectos glassmorphism
- **Transiciones suaves** entre estados
- **Feedback visual claro** para cada rol
- **Diseño responsive** optimizado para móviles
- **Tema oscuro/claro** dinámico

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 🔗 Links

- **Repositorio**: [https://github.com/nicotoconas007/impostor-game](https://github.com/nicotoconas007/impostor-game)
- **Demo**: [Próximamente]

---

Desarrollado con ❤️ por Nicolas Toconas
