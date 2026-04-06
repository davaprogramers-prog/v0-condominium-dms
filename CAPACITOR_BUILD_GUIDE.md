# Compilar InteliCON para Android e iOS con Capacitor

## Requisitos previos

### Para Android:
- Node.js y npm
- Java Development Kit (JDK 17+)
- Android Studio o Android SDK
- Configurar variable de entorno `ANDROID_HOME`

### Para iOS (Mac requerido):
- Xcode 15+
- CocoaPods: `sudo gem install cocoapods`
- Node.js y npm

---

## Pasos para compilar

### 1. Instalar dependencias
```bash
npm install
```

### 2. Build de Next.js (genera los archivos estáticos)
```bash
npm run build
```

### 3. Compilar para Android

#### Primera vez (setup):
```bash
npm run cap:build:android
```

Esto abrirá Android Studio. En Android Studio:
- Conecta un dispositivo Android o abre un emulador
- Click en "Run" → "Run 'app'" o presiona Shift+F10
- La app se instalará y ejecutará en el dispositivo

#### Compilaciones posteriores (después de cambios en web):
```bash
npm run cap:sync
```
Luego vuelve a ejecutar desde Android Studio.

---

### 4. Compilar para iOS (solo en Mac)

#### Primera vez (setup):
```bash
npm run cap:build:ios
```

Esto abrirá Xcode. En Xcode:
- Selecciona un simulador o dispositivo conectado
- Click en el botón "Play" o presiona Cmd+R
- La app se compilará y ejecutará

#### Compilaciones posteriores:
```bash
npm run cap:sync
```
Luego vuelve a ejecutar desde Xcode.

---

## Desarrollo con Hot Reload

Para desarrollo rápido con cambios en vivo:

### Terminal 1 - Next.js dev server
```bash
npm run dev
```

### Terminal 2 - Sincronizar cambios
```bash
npm run cap:sync
```

Luego refresca la app en el simulador/dispositivo.

---

## Distribución

### Play Store (Android):
1. Generar signed APK en Android Studio
2. Upload a Google Play Console

### App Store (iOS):
1. Generar signed IPA en Xcode
2. Upload a App Store Connect

---

## Troubleshooting

### Android: "ANDROID_HOME no está configurado"
```bash
export ANDROID_HOME=/Users/username/Library/Android/sdk  # Mac/Linux
# o en Windows:
setx ANDROID_HOME "C:\Users\username\AppData\Local\Android\sdk"
```

### iOS: "CocoaPods error"
```bash
cd ios/App
pod install --repo-update
cd ../..
```

### "Version conflict"
```bash
npm run cap:sync --force
```

---

## Más información

- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Guía de Capacitor para iOS](https://capacitorjs.com/docs/ios)
- [Guía de Capacitor para Android](https://capacitorjs.com/docs/android)
