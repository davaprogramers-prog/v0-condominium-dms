# CondoAdmin - Sistema de Administración de Condominios

## Credenciales del Administrador Inicial

**Email:** admin@condoapp.com  
**Password:** Admin123!@#

⚠️ **IMPORTANTE:** Cambia esta contraseña en tu primer inicio de sesión.

---

## Sistema de Roles y Accesos

### 1. **ADMIN (Administrador)**
El administrador tiene acceso completo a todas las funcionalidades:

**Accesos:**
- ✅ Dashboard con KPIs
- ✅ Gestión de Casas (crear, editar, ver histórico de pagos)
- ✅ Gestión de Gastos (crear, editar, eliminar, categorizar)
- ✅ Reportes y Análisis (comparativas, tendencias, promedios)
- ✅ Gestión de Ingresos (validar pagos, ingresos variables)
- ✅ Exoneraciones (crear tipos, asignar a casas, temporales/permanentes)
- ✅ Proyectos de Mejora (crear, cargar cotizaciones, fotos, estado)
- ✅ Encuestas en Vivo (crear, ver resultados en tiempo real)
- ✅ Documentos (subir reglamentos, partes, sanciones)
- ✅ Infracciones (registrar, dar multas, marcar como pagadas)
- ✅ Arriendos (gestionar espacios de arriendo)
- ✅ Áreas Comunes (crear, definir mantenimiento)
- ✅ Cartolas Bancarias (subir PDFs de banco)
- ✅ **Gestión de Usuarios** (crear propietarios y arrendatarios)
- ✅ Configuración (moneda, multiplicador, datos del condominio)

### 2. **PROPIETARIO (Dueño de Casa)**
Acceso limitado a funcionalidades relacionadas con su propiedad:

**Accesos:**
- ✅ Ver Dashboard (su información)
- ✅ Subir Comprobantes de Pago (foto o PDF)
- ✅ Ver Mis Gastos Comunes
- ✅ Participar en Encuestas (votar en tiempo real)
- ✅ Ver Documentos (reglamentos, partes, etc.)
- ✅ Ver Proyectos de Mejora (información general)

### 3. **ARRENDATARIO (Inquilino)**
Acceso mínimo, solo visualización de información pública:

**Accesos:**
- ❌ No tiene acceso al dashboard
- ❌ No puede subir comprobantes
- ❌ No puede votar en encuestas

---

## Flujo de Configuración Inicial

### Paso 1: Login como Admin
1. Ingresa a `admin@condoapp.com` con la contraseña temporal
2. Ve a **Configuración** desde la barra lateral

### Paso 2: Crear tu Condominio
1. En la sección "Configuración", completa los datos:
   - Nombre del condominio
   - Dirección
   - Número total de casas
   - Moneda (CLP, USD, EUR, etc.)
   - Símbolo de moneda ($, US$, €)
   - Multiplicador (para UF, UTM, etc.)
   - Monto de gasto común
   - Día de vencimiento global

### Paso 3: Crear Casas
1. Ve a **Casas**
2. Crea cada casa con:
   - Número/identificador de la casa
   - Nombre del propietario
   - Email del propietario
   - Día de vencimiento (si es diferente al global)

### Paso 4: Crear Usuarios
1. Ve a **Configuración**
2. En "Gestión de Usuarios", haz clic en **Crear Usuario**
3. Completa los datos:
   - Nombre
   - Apellido
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Tipo: Propietario o Arrendatario
   - Si es propietario, asigna la casa

### Paso 5: Gestionar Gastos
1. Ve a **Tipos de Gastos** y crea los tipos que usarás (servicios, reparaciones, etc.)
2. Ve a **Gastos** y comienza a registrar gastos
3. Sube fotograf ías de comprobantes
4. En **Reportes**, podrás ver análisis y comparativas

---

## Características Principales

### 📊 Reportes Avanzados
- Comparativas de gastos por mes/trimestre/semestre/año
- Comparar mismos meses entre años diferentes
- Tendencias de gastos
- Promedios por categoría
- Gráficos interactivos

### 🏠 Gestión de Casas con Cards
- Tarjetas visuales por casa con estado de pagos
- **ROJO:** Pago vencido (fecha personalizable por casa)
- **VERDE:** Pago al día
- Histórico completo de pagos y sanciones
- Avatar/foto personalizable por casa

### 🎙️ Encuestas en Vivo
- Los propietarios votan en tiempo real
- Resultados actualizan automáticamente
- Barras de progreso con porcentajes
- Histórico de todas las encuestas

### 📄 Gestión de Documentos
- Subir reglamento interno
- Registrar tipos de sanciones
- Archivar partes cursados y pagados
- Control de infracciones

### 🔧 Proyectos de Mejora
- Tipo de mejora
- Cargar múltiples cotizaciones
- Fotos del espacio
- Seguimiento de estado (propuesto, aprobado, en progreso, completado)

### 💰 Control de Ingresos
- Gastos comunes (pagos de propietarios)
- Ingresos variables (arriendos, otros)
- Exoneraciones por casa (total/parcial, temporal/permanente)
- Arriendos de espacios comunes

---

## Flujo de Usuario - Propietario

1. **Login:** Ingresa con email y contraseña creada por el admin
2. **Dashboard:** Ve su estado de pagos
3. **Mis Pagos:**
   - Ve los montos adeudados
   - Sube comprobante de pago (foto o PDF)
   - El admin verifica y marca como pagado
4. **Encuestas:** Participa votando en tiempo real
5. **Documentos:** Descarga reglamento y documentos importantes

---

## Notas de Seguridad

⚠️ **Importante:**
- Cambia la contraseña del admin en el primer login
- Los passwords de nuevos usuarios deben tener mínimo 6 caracteres
- Solo el admin puede crear usuarios
- Las fotos y PDFs se suben a almacenamiento seguro de Supabase
- Todos los accesos están protegidos con RLS (Row Level Security)

---

## Soporte

Para reportar issues o mejoras, contacta al equipo de desarrollo.
