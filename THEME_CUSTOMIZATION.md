# Sistema de Personalización de Colores por Condominio

## Descripción
Los administradores de cada condominio pueden personalizar los colores de la interfaz para su condominio, permitiendo que cada uno tenga su propia identidad visual.

## Características

### 1. Toggle de Activación
- Campo checkbox "Habilitar personalización de colores"
- Permite al admin activar/desactivar la personalización por condominio
- Si está desactivado, se usan los colores por defecto

### 2. Colores Personalizables
Se pueden personalizar 3 áreas de la interfaz:

1. **Color de Barra Lateral** (`sidebar_bg_color`)
   - Color de fondo de la barra de navegación lateral
   - Por defecto: `#1e293b` (gris oscuro)

2. **Color del Área Principal** (`main_bg_color`)
   - Color de fondo del área de contenido principal
   - Por defecto: `#f1f5f9` (gris muy claro)

3. **Color de Cards** (`card_bg_color`)
   - Color de fondo de las tarjetas/componentes
   - Por defecto: `#ffffff` (blanco)

### 3. Colores de Texto Automáticos
El sistema calcula automáticamente los colores de texto según el brillo del fondo:

- **Fórmula de luminancia**: `(0.299 × R + 0.587 × G + 0.114 × B) / 255`
- **Si luminancia > 0.5** (fondo claro): texto gris oscuro `#0f172a`
- **Si luminancia ≤ 0.5** (fondo oscuro): texto blanco `#ffffff`

Esta asegura legibilidad óptima en cualquier combinación de colores.

## Ubicación de la Interfaz
`/dashboard/configuracion` → Sección "Personalización de Colores"

Solo visible para usuarios con rol `admin` o `super_admin`

## Base de Datos

### Tabla: `condominium_themes`
```sql
CREATE TABLE public.condominium_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condo_id UUID NOT NULL UNIQUE REFERENCES public.condominiums(id) ON DELETE CASCADE,
  enable_custom_theme BOOLEAN DEFAULT false,
  sidebar_bg_color VARCHAR(7) DEFAULT '#1e293b',
  main_bg_color VARCHAR(7) DEFAULT '#f1f5f9',
  card_bg_color VARCHAR(7) DEFAULT '#ffffff',
  sidebar_text_color VARCHAR(7) DEFAULT '#ffffff',
  main_text_color VARCHAR(7) DEFAULT '#0f172a',
  card_text_color VARCHAR(7) DEFAULT '#0f172a',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Políticas RLS
- **SELECT**: Todos los usuarios del condominio pueden leer su tema
- **UPDATE**: Solo admins del condominio pueden actualizar
- **INSERT**: Solo admins del condominio pueden crear temas

## Componentes del Sistema

### 1. `ThemeCustomizer` (`/components/theme-customizer.tsx`)
Componente visual con:
- Color pickers para cada sección
- Vista previa en tiempo real
- Validación de colores hex
- Botón para guardar cambios

### 2. `ThemeCustomizerWrapper` (`/app/dashboard/configuracion/theme-customizer-wrapper.tsx`)
Cliente que conecta la UI con las acciones de servidor

### 3. `ThemeManagerClient` (`/components/theme-manager-client.tsx`)
Aplica los colores personalizados al layout mediante CSS variables

### 4. `updateCondoTheme()` (`/app/actions/theme-actions.ts`)
Server action que persiste los cambios en la BD

## Cómo Funciona

1. Admin abre `/dashboard/configuracion`
2. Scroll hasta "Personalización de Colores"
3. Activa el toggle "Habilitar personalización"
4. Elige los 3 colores usando los color pickers o escribiendo códigos hex
5. La vista previa muestra los colores con texto calculado automáticamente
6. Haz clic en "Guardar Colores"
7. Los cambios se persisten en BD y se aplican inmediatamente al dashboard

## Validación

- Colores deben ser códigos hexadecimales válidos (ej: `#1e293b`)
- El sistema valida automáticamente
- Los colores de texto se calculan sin intervención del usuario

## Desarrollo Futuro

Posibles mejoras:
- Presets de temas predefinidos (corporativo, minimalista, vibrante, etc.)
- Personalización de más colores (botones, acentos, etc.)
- Vista previa en vivo mientras se editan
- Exportar/importar configuraciones de tema
