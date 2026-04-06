# Guía de Setup - Sistema de Visitas y Conserjes

## 1. Ejecutar SQL en Supabase

Para habilitar todas las nuevas funcionalidades de visitas, solicitudes de materiales y conserjes, debes ejecutar el siguiente SQL en Supabase:

**Pasos:**
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia todo el contenido del archivo `/scripts/002_visits_and_concierge_fixed.sql`
3. Pégalo en el editor
4. Haz clic en **"Run"**

Esto creará:
- Tabla `visits` - Para registrar visitas de propietarios
- Tabla `supply_requests` - Para solicitudes de materiales del conserje
- Tabla `concierge_worklogs` - Para registro de actividades del conserje
- Actualizará los roles para agregar `conserje`
- Configurará las políticas de RLS

## 2. Crear un Conserje desde el Admin

**Para el Super Admin o Admin del Condominio:**

1. Inicia sesión en `/dashboard`
2. Dirígete a **Administración → Conserjes**
3. Haz clic en el botón **"Agregar Conserje"**
4. Completa el formulario con:
   - **Nombre**
   - **Apellido**
   - **Correo Electrónico** (será su login)
   - **Contraseña** (mínimo 8 caracteres)
5. Haz clic en **"Crear Conserje"**

**Nota:** El conserje recibirá un correo con instrucciones de acceso (feature próxima).

## 3. Flujos de Trabajo

### Flujo de Propietario (Visitas)
1. El propietario va a **Mi Casa → Mis Visitas**
2. Haz clic en **"Agregar Visita"**
3. Completa:
   - Nombre del visitante
   - Tipo de visita (cumpleaños, piscina, visita, etc)
   - Fecha y hora
   - Email y teléfono (opcional)
4. La visita aparecerá en el dashboard del conserje

### Flujo de Conserje (Dashboard)
1. Accede a `/concierge/dashboard`
2. Ver resumen de visitas programadas para hoy
3. Acceder a **Visitas** para ver todas las visitas agrupadas por fecha
4. Crear **Solicitudes de Materiales** para:
   - Productos de limpieza
   - Materiales para la garita
   - Suministros
   - Mantenimiento
5. El admin verá las solicitudes pendientes

### Flujo de Admin (Gestión)
1. Ir a **Administración → Visitas**
   - Ver todas las visitas del condominio
   - Filtrar por estado, fecha, casa
2. Ir a **Administración → Solicitudes de Materiales**
   - Ver solicitudes pendientes del conserje
   - Aprobar o rechazar solicitudes
   - Al comprar: vincular a un gasto existente
   - Marcar como "Comprado" para cerrar la solicitud

## 4. Estructura de Datos

### Tabla visits
```
- id: UUID
- condo_id: UUID (condominio)
- house_id: UUID (casa del propietario)
- created_by: UUID (propietario)
- visitor_name: TEXT
- visit_title: TEXT (tipo de visita)
- visit_date: DATE
- visit_time: TIME
- visitor_email: TEXT
- visitor_phone: TEXT
- status: 'scheduled' | 'completed' | 'cancelled'
```

### Tabla supply_requests
```
- id: UUID
- condo_id: UUID
- created_by: UUID (conserje)
- request_title: TEXT
- request_description: TEXT
- request_category: 'cleaning' | 'materials' | 'supplies' | 'maintenance' | 'other'
- quantity: INT
- unit_price: DECIMAL
- estimated_cost: DECIMAL
- priority: 'low' | 'normal' | 'high' | 'urgent'
- status: 'pending' | 'approved' | 'purchased' | 'completed' | 'rejected'
- approved_by: UUID (admin que aprobó)
- linked_expense_id: UUID (gasto del que se compró)
```

## 5. URLs de Acceso

### Admin/Super Admin
- `/dashboard/conserjes` - Gestionar conserjes
- `/dashboard/visitas-admin` - Ver todas las visitas
- `/dashboard/solicitudes-materiales` - Gestionar solicitudes

### Conserje
- `/concierge/dashboard` - Dashboard principal
- `/concierge/visitas` - Listado de visitas
- `/concierge/solicitudes-materiales` - Crear y ver solicitudes

### Propietario
- `/dashboard/visitas` - Registrar y ver mis visitas

## 6. Próximas Características

- [ ] Notificaciones por email a conserjes cuando se crean visitas
- [ ] Envío de credenciales por email al crear conserje
- [ ] Fotos en solicitudes de materiales
- [ ] Firma digital en entregas
- [ ] App móvil Android/iOS (En desarrollo con Capacitor)

## 7. Soporte

Si encuentras problemas:
1. Verifica que el SQL se ejecutó correctamente en Supabase
2. Comprueba que tu rol es `admin` o `super_admin`
3. Asegúrate de estar en el condominio correcto
4. Revisa que el conserje tenga el rol `conserje` en la tabla profiles
