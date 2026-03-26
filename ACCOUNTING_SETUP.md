# Sistema Contable del Condominio

## 📊 Descripción General

Sistema de contabilidad para el condominio basado en partida doble:
- **HABER (Ingresos)**: Dinero que entra del condominio (cuotas, variables)
- **DEBE (Egresos)**: Dinero que sale del condominio (gastos, reparaciones)
- **BALANCE**: Saldo anterior + Ingresos - Gastos

## 🛠️ Pasos de Configuración

### 1. Ejecutar Migración SQL

Ejecuta el script en tu Supabase SQL Editor:

```bash
# Archivo: scripts/020_accounting.sql
```

Este script crea:
- `condo_expenses`: Tabla de gastos del condominio (DEBE)
- `condo_income`: Tabla de ingresos del condominio (HABER)
- `condo_monthly_balance`: Tabla de balance mensual (resumen)
- Índices y políticas RLS para seguridad

### 2. Verificar Permisos

Solo ADMINS pueden:
- ✅ Crear gastos en Gastos → Agregar Gasto
- ✅ Crear ingresos (próximo módulo)
- ✅ Ver balance del mes

Los PROPIETARIOS ven:
- Su cartola (movimientos de su casa)
- Su balance individual
- Documentos y reportes

### 3. Uso del Sistema

#### Registrar un Gasto
1. Ve a Dashboard → Gastos
2. Haz clic en "Agregar Gasto"
3. Completa el formulario:
   - Título: Ej "Limpieza áreas comunes febrero"
   - Monto: Ej 30000
   - Categoría: Reparación, Mantenimiento, etc.
   - Fecha: 2025-02-21
   - **IMPORTANTE**: Carga la imagen de la boleta/factura
4. Haz clic en "Registrar Gasto"

El gasto se asigna automáticamente al período (mes/año) según la fecha.

#### Balance Mensual
- **Período actual**: Se muestra en la parte superior
- **Ingresos (HABER)**: Total de cuotas y variables del mes
- **Gastos (DEBE)**: Total de egresos del mes
- **Balance del Mes**: Ingresos - Gastos = Balance neto del mes
- **Saldo**: Se arrastra al siguiente mes

#### Ejemplo de Cálculo
```
Diciembre 2025:
  Saldo anterior (Nov):       $100,000
  + Ingresos cuotas:         +$500,000
  + Ingresos variables:      +$50,000
  - Gastos:                  -$30,000
  ═══════════════════════════════
  = Saldo Enero 2026:         $620,000
```

## 📋 Estructura de Datos

### condo_expenses (Gastos/DEBE)
```sql
- id (UUID)
- condo_id (UUID) - Referencia al condominio
- title (TEXT) - Nombre del gasto
- description (TEXT) - Detalles adicionales
- amount (DECIMAL) - Monto
- category (TEXT) - Reparación, Mantenimiento, Servicios, Suministros, Otro
- receipt_url (TEXT) - URL de la imagen de boleta/factura
- expense_date (DATE) - Fecha del gasto
- period_year (INT) - Año del período
- period_month (INT) - Mes del período
- created_by (UUID) - Admin que creó el registro
- created_at (TIMESTAMP)
```

### condo_income (Ingresos/HABER)
```sql
- id (UUID)
- condo_id (UUID) - Referencia al condominio
- house_id (UUID NULLABLE) - Casa que paga (si aplica)
- amount (DECIMAL) - Monto
- income_type (TEXT) - 'cuota' o 'variable'
- description (TEXT) - Concepto del ingreso
- income_date (DATE) - Fecha del ingreso
- period_year (INT) - Año del período
- period_month (INT) - Mes del período
- created_by (UUID) - Admin que creó el registro
- created_at (TIMESTAMP)
```

### condo_monthly_balance (Balance Mensual)
```sql
- id (UUID)
- condo_id (UUID)
- period_year (INT)
- period_month (INT)
- opening_balance (DECIMAL) - Saldo del mes anterior
- total_income (DECIMAL) - Total ingresos del mes
- total_expenses (DECIMAL) - Total gastos del mes
- closing_balance (DECIMAL) - opening + income - expenses
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔍 Consultas Útiles

### Ver todos los gastos de un mes
```sql
SELECT * FROM condo_expenses
WHERE condo_id = 'xxx-xxx-xxx'
AND period_year = 2025
AND period_month = 2
ORDER BY expense_date DESC;
```

### Ver balance de un mes
```sql
SELECT * FROM condo_monthly_balance
WHERE condo_id = 'xxx-xxx-xxx'
AND period_year = 2025
AND period_month = 2;
```

### Total de gastos por categoría
```sql
SELECT category, SUM(amount) as total
FROM condo_expenses
WHERE condo_id = 'xxx-xxx-xxx'
AND period_year = 2025
AND period_month = 2
GROUP BY category;
```

## 🚀 Próximas Funcionalidades

- [ ] Módulo de Ingresos (registrar cuotas y variables)
- [ ] Reporte de balance por período
- [ ] Exportar a PDF
- [ ] Gráficos de gastos por categoría
- [ ] Comparativa mes a mes
- [ ] Historial de cambios
- [ ] Notificaciones a propietarios

## ⚠️ Consideraciones Importantes

1. **Imagen obligatoria**: Siempre carga la boleta/factura para auditoría
2. **Período automático**: El sistema asigna automáticamente el mes/año según la fecha
3. **Admins solo**: Solo admins pueden crear gastos e ingresos
4. **Rastreo**: Todos los registros guardan quién los creó
5. **Seguridad**: RLS garantiza que solo admins vean los datos contables

---

¿Preguntas? Contacta al administrador del condominio.
