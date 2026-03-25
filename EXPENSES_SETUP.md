# Setup del Sistema de Gastos

## Descripción
El sistema de gastos permite a los propietarios registrar gastos de sus propiedades con la posibilidad de cargar imágenes de boletas/facturas.

## Pasos para Configurar

### 1. Ejecutar la Migración SQL
Necesitas ejecutar el script SQL en tu Supabase:

```bash
# El archivo está en: scripts/019_create_expenses_table.sql
```

Pasos:
1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com)
2. Ve a SQL Editor → New Query
3. Copia el contenido del archivo `scripts/019_create_expenses_table.sql`
4. Ejecuta el query
5. Verifica que la tabla `house_expenses` fue creada exitosamente

### 2. Verificar los Campos Necesarios

Asegúrate que estas columnas existan en la tabla `profiles`:
- `house_id` (UUID) - Referencia a la casa del propietario
- `email` (TEXT) - Email del usuario

Si no existen, ejecuta en Supabase SQL Editor:

```sql
-- Agregar columna house_id si no existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS house_id UUID REFERENCES houses(id) ON DELETE SET NULL;

-- Agregar columna email si no existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
```

### 3. Verificar las Políticas de RLS

Las políticas RLS deben estar configuradas para que:
- Los propietarios solo vean sus gastos
- Los admins vean todos los gastos
- Solo el creador pueda crear gastos

Esto ya está configurado en el script SQL, pero verifica en:
Supabase → Authentication → Policies

### 4. Testear la Funcionalidad

1. Inicia sesión como propietario
2. Ve a Dashboard → Mi Casa → Gastos
3. Haz clic en "Agregar Gasto"
4. Completa el formulario con:
   - Título: Ej "Reparación puerta"
   - Monto: Ej 50000
   - Categoría: Ej "Reparación"
   - Fecha del gasto
   - Imagen de boleta/factura (opcional)
5. Haz clic en "Registrar Gasto"

### 5. Características Actuales

✅ Crear gastos con título, monto, descripción
✅ Categorizar gastos (Reparación, Mantenimiento, Servicios, etc)
✅ Cargar imagen de boleta/factura
✅ Ver tabla con todos los gastos registrados
✅ Resumen de totales y cantidad de gastos
✅ Visualizar fecha, categoría y monto

### 6. Próximas Mejoras

- [ ] Editar y eliminar gastos
- [ ] Exportar gastos a PDF
- [ ] Gráficos de gastos por categoría
- [ ] Histórico mensual de gastos
- [ ] Notificaciones a admins de nuevos gastos

---

Si tienes problemas, revisa:
1. ¿La tabla `house_expenses` existe en Supabase?
2. ¿El usuario tiene un `house_id` asignado en `profiles`?
3. ¿Las políticas RLS están habilitadas correctamente?

