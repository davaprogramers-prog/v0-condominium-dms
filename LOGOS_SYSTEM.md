# Sistema de Logos de InteliCon

## Resumen

Se ha implementado un sistema completo de gestión de logos que permite:

1. **Super Admin**: Crear logos globales que sirven para todos los condominios
2. **Admin**: Crear logos específicos para su condominio
3. **Almacenamiento**: Logos almacenados en Vercel Blob con referencias en Supabase

## Tablas de Base de Datos

### logos
```sql
- id: UUID (PK)
- name: TEXT
- description: TEXT
- blob_url: TEXT (URL en Vercel Blob)
- logo_type: TEXT ('app', 'expense_category', 'custom')
- scope: TEXT ('global' o 'condo')
- condo_id: UUID (null si es global)
- created_by: UUID (referencia a profiles)
- is_default: BOOLEAN
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

## Permisos (RLS)

### Super Admin
- Ver todos los logos globales
- Crear logos globales
- Actualizar/eliminar logos globales

### Admin
- Ver logos globales + logos de su condominio
- Crear logos para su condominio
- Actualizar/eliminar logos de su condominio

## API Endpoints

### GET /api/logos/default
Obtiene el logo por defecto de la app (global)
```json
{
  "id": "uuid",
  "name": "InteliCon",
  "blob_url": "/logo.png",
  "logo_type": "app",
  "scope": "global",
  "is_default": true
}
```

### POST /api/logos/upload
Sube un nuevo logo
```
Body: FormData
- file: File
- name: string
- description: string (opcional)
- logoType: 'app' | 'expense_category' | 'custom'
- scope: 'global' | 'condo'
- condoId: string (requerido si scope = 'condo')
- is_default: 'true' | 'false'
```

## Server Actions

### uploadLogo(formData, logoType, scope, condoId?)
Sube un logo a Vercel Blob y guarda la referencia en Supabase

### getLogos(logoType, condoId?)
Obtiene logos por tipo, solo los que el usuario tiene permiso de ver

### setDefaultLogo(logoId)
Marca un logo como por defecto (solo uno por tipo y scope)

### deleteLogo(logoId)
Elimina un logo (solo si tienes permisos)

## Tipos de Logos

1. **app**: Logo principal de InteliCon (solo global)
2. **expense_category**: Logos para categorías de gastos (global o por condo)
3. **custom**: Logos personalizados para el condominio

## Estructura de Almacenamiento en Blob

```
logos/
├── global/
│   ├── app/
│   │   └── {timestamp}-{filename}
│   ├── expense_category/
│   │   └── {timestamp}-{filename}
│   └── custom/
│       └── {timestamp}-{filename}
└── condo/
    ├── app/
    │   └── {timestamp}-{filename}
    ├── expense_category/
    │   └── {timestamp}-{filename}
    └── custom/
        └── {timestamp}-{filename}
```

## Pasos para Setup

1. **Ejecutar SQL en Supabase**
   ```
   scripts/003_logos_table.sql
   ```

2. **Tu logo actual**
   - Archivo: `/public/logo.png`
   - Ya está subido y será usado como fallback
   - Para guardarlo como logo por defecto en BD, ejecuta:
   ```
   node scripts/upload-default-logo.js
   ```

3. **Usar en componentes**
   ```tsx
   import { SiteLogo } from '@/components/site-logo'
   
   <SiteLogo /> // Obtiene automáticamente el logo desde BD
   ```

## Características

- ✅ Almacenamiento en Vercel Blob
- ✅ RLS en Supabase para seguridad
- ✅ Permisos por rol (super_admin vs admin)
- ✅ Logos globales y por condominio
- ✅ Logo por defecto para app
- ✅ Validación de archivos
- ✅ Fallback a logo estático
- ✅ Múltiples tipos de logos
