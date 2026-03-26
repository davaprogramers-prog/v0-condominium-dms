# Sistema de Pagos con Aprobación y Notificaciones

## Descripción General
Sistema completo para que propietarios registren pagos y admins aprueben/rechacen con comprobantes visuales.

## Flujo Implementado

### 1. Propietario Registra Pago
- Accede a "Mi Casa > Pagos Pendientes"
- Hace clic en "Registrar Pago"
- Completa formulario:
  - Casa (automático)
  - Monto
  - Fecha del pago
  - Método (transferencia, depósito, etc)
  - **Comprobante (foto OBLIGATORIA)**
  - Descripción opcional
- Click en "Registrar": 
  - Crea ingreso con status = **"pending"**
  - Crea notificación para admin
  - Redirige a resumen de pagos

### 2. Admin Recibe Notificación
- **Campana (Bell icon)** en header muestra contador de notificaciones sin leer
- Click en campana abre dropdown con:
  - Lista de notificaciones pendientes (pagos por aprobar, encuestas votadas)
  - Cada pago muestra:
    - Casa y monto
    - Botón ✓ verde (Aprobar)
    - Botón ✗ rojo (Rechazar)
  - El admin puede hacer clic directo desde la notificación

### 3. Admin Aprueba/Rechaza
- Click en botón de acción en notificación O en tabla de ingresos
- Abre modal con:
  - Detalles: Casa, Monto, Fecha, Concepto
  - **Imagen de comprobante** (visible)
  - Botón "Aprobar" (verde)
  - Botón "Rechazar" (rojo)
  - Campo opcional: razón de rechazo

### 4. Estados de Pago
```
pending    → Naranja: Esperando aprobación
approved   → Verde: Aprobado, suma al balance
rejected   → Rojo: Rechazado, propietario puede reintentarlo
```

## Tablas Actualizadas

### condo_income
```sql
status TEXT                 -- 'pending', 'approved', 'rejected'
receipt_url TEXT            -- URL de comprobante
rejection_reason TEXT       -- Motivo de rechazo (opcional)
approved_by UUID            -- Usuario que aprobó
approved_at TIMESTAMP       -- Fecha de aprobación
```

### notifications (nueva)
```sql
id UUID
condo_id UUID
user_id UUID
type TEXT                   -- 'payment_pending', 'survey_vote', 'other'
reference_id UUID           -- ID del ingreso/encuesta
reference_type TEXT         -- 'income', 'survey'
title TEXT
message TEXT
is_read BOOLEAN
created_at TIMESTAMP
```

## Actions Implementadas

### registerPaymentProof()
- Propietario registra comprobante
- Crea income con status=pending
- Crea notificación para admin

### approvePayment()
- Admin aprueba pago
- Cambia status a approved
- Marca notificación como leída

### rejectPayment()
- Admin rechaza pago
- Cambia status a rejected + razón
- Marca notificación como leída

### getNotifications()
- Obtiene notificaciones sin leer para admin

### getUnreadNotificationsCount()
- Cuenta de notificaciones sin leer

### markNotificationAsRead()
- Marca notificación como leída

## Componentes Nuevos

### NotificationBell (`components/notification-bell.tsx`)
- Icono campana con contador
- Dropdown con lista de notificaciones
- Botones de acción rápida (aprobar/rechazar)
- Link a página de ingresos

## Próximos Pasos

1. ✅ Ejecutar migración SQL: `scripts/021_add_payment_status.sql`
2. ✅ Crear página "Mi Casa > Pagos Pendientes" para propietarios
3. ✅ Crear dialogs de registro y aprobación
4. ✅ Integrar NotificationBell en header (solo para admins)
5. ⏳ Agregar columna estado en tabla de ingresos (pending/approved/rejected)
6. ⏳ Mostrar comprobante en modal de aprobación
7. ⏳ Soporte para notificaciones de encuestas (próximo)

## Testing

1. Propietario casa 5 registra pago de $75.000
2. Admin ve notificación en campana
3. Admin hace clic en ✓ o ✗
4. Pago se aprueba/rechaza
5. Propietario ve estado actualizado en su tabla de pagos
