// Claves que la app guarda en el navegador y que no deben pasar de una sesión a otra.
const CLAVES_LOCALES = ["super_admin_condo_id", "super_admin_condo_name"]

export function limpiarDatosLocalesDemo() {
  try {
    for (const clave of CLAVES_LOCALES) {
      window.localStorage.removeItem(clave)
      window.sessionStorage.removeItem(clave)
    }
    for (const almacen of [window.localStorage, window.sessionStorage]) {
      Object.keys(almacen)
        .filter((k) => k.startsWith("demo_"))
        .forEach((k) => almacen.removeItem(k))
    }
  } catch {
    // Almacenamiento bloqueado por el navegador: nada que limpiar.
  }
}
