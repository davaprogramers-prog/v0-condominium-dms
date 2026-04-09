/* ESTÁNDAR DE DIÁLOGOS Y COMPONENTES DEL DASHBOARD */

/* ===== DIALOG CONTENT ===== */
DialogContent: bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700
- Siempre usar este estándar para todos los diálogos
- Usar máximo 90vh de altura con overflow-y-auto si hay mucho contenido
- Usar el componente StandardDialogContent de components/ui/dialog-content-standard.tsx

/* ===== DIALOG HEADER ===== */
DialogHeader: sin cambios necesarios (genera el botón cerrar automáticamente)
DialogTitle: text-slate-900 dark:text-white
DialogDescription: text-slate-600 dark:text-slate-400

/* ===== ALERT DIALOG ===== */
AlertDialogContent: bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700
AlertDialogTitle: text-slate-900 dark:text-white
AlertDialogDescription: text-slate-600 dark:text-slate-400

/* ===== LABELS ===== */
Label: text-slate-900 dark:text-slate-200

/* ===== INPUTS ===== */
Input: border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white
Textarea: border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white

/* ===== BOTONES ===== */
Button Guardar/Crear: bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white
Button Editar: bg-white hover:bg-slate-100 text-slate-900 border border-slate-300
Button Eliminar: bg-destructive hover:bg-destructive/90 text-white
Button Rechazar: bg-red-600 hover:bg-red-700 text-white
Button Aprobar: bg-green-600 hover:bg-green-700 text-white
Button Enviar: bg-blue-600 hover:bg-blue-700 text-white
Button Cancelar: inherit de AlertDialogCancel

/* ===== SELECT ===== */
SelectTrigger: border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white
SelectContent: dark:bg-slate-800 dark:text-white

/* ===== CARDS/CONTENEDORES ===== */
Card: bg-slate-700 dark:bg-slate-800 border-2 border-slate-600
Resumen montos: bg-slate-100 dark:bg-slate-800

/* ===== ESTADO/ERROR ===== */
Error message: bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm
Success/Info: bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400

/* ===== UPLOAD AREAS ===== */
Dashed border: border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-900
Upload icon: h-6 w-6 text-slate-400
Upload text: text-sm text-slate-600 dark:text-slate-400

/* ===== IMÁGENES EN DIÁLOGOS ===== */
Image: max-h-40 max-w-full rounded border-2 border-slate-300 dark:border-slate-600

/* REGLA DE ORO: Todos los DialogContent deben tener:
1. Fondo blanco con borde claro
2. Texto oscuro (slate-900) en títulos
3. El botón cerrar (X) SIEMPRE visible en la esquina superior derecha
4. Si hay scrollable, aplicar max-h-[90vh] overflow-y-auto
5. Botones con colores específicos según acción
6. Labels oscuros y legibles
7. Inputs con bordes claros y fondo oscuro en dark mode
*/
