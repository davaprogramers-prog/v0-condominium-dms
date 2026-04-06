# InteliCON - Setup para Capacitor (Android/iOS)

## ✅ Ya configurado en el proyecto:

- ✅ Dependencias de Capacitor en package.json
- ✅ Archivo capacitor.config.json con configuración base
- ✅ Next.js configurado para exportar estático (output: 'export')
- ✅ Hook de inicialización de Capacitor
- ✅ Provider para integrar Capacitor en la app

## 🚀 Próximos pasos:

### 1. Instalar Capacitor globalmente (opcional pero recomendado)
```bash
npm install -g @capacitor/cli
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Build inicial
```bash
npm run build
```

### 4. Agregar plataformas (Android y/o iOS)

#### Para Android:
```bash
npx cap add android
```

#### Para iOS (solo en Mac):
```bash
npx cap add ios
```

### 5. Abrir el proyecto para compilar

#### Android (primero instala Android Studio):
```bash
npm run cap:build:android
```

#### iOS (primero instala Xcode):
```bash
npm run cap:build:ios
```

---

## 📱 Estructura generada

Después de ejecutar `npx cap add android/ios`, se crearán:

```
proyecto/
├── android/          ← Proyecto Android nativo
├── ios/              ← Proyecto Xcode (iOS)
├── out/              ← Build estático de Next.js
└── capacitor.config.json
```

---

## 🔄 Workflow de desarrollo

```bash
# Terminal 1: Desarrollo web
npm run dev

# Terminal 2: Sincronizar cambios
npm run cap:sync

# Luego recarga en el dispositivo/simulador
```

---

## 📦 Build para producción

```bash
npm run build
npm run cap:sync

# Luego en Android Studio o Xcode:
# - Android: Generate Signed Bundle/APK
# - iOS: Archive y Upload a App Store
```

---

## 🔗 Recursos

- [CAPACITOR_BUILD_GUIDE.md](./CAPACITOR_BUILD_GUIDE.md) - Guía completa de compilación
- [Capacitor Docs](https://capacitorjs.com)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

---

## ✨ Características incluidas

- ✅ Status bar personalizada (oscura con fondo gris)
- ✅ Splash screen
- ✅ Manejo de botón atrás de Android
- ✅ Storage nativo (Capacitor Storage)
- ✅ Teclado
- ✅ App events

---

## ⚠️ Importante

- **Android**: Requiere JDK 17+ y Android SDK
- **iOS**: Solo en macOS, requiere Xcode 15+
- **Next.js**: Configurado con `output: 'export'` para exportación estática

¿Necesitas ayuda con algún paso específico?
