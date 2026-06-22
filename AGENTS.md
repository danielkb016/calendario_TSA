<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Directrices de Desarrollo y Git (Producción)
- **Estado del Proyecto**: Esta aplicación está actualmente en producción y siendo utilizada activamente.
- **Política de Ramas de Git**: **NUNCA** hagas commits o push directamente a la rama `main` para nuevas funcionalidades o cambios. Toda modificación debe realizarse en la rama `developer`.
- **Flujo de Trabajo**:
  1. Trabajar sobre la rama `developer`.
  2. Verificar la integridad mediante `npm run build` localmente.
  3. Probar en el entorno de desarrollo/testeo antes de hacer merge a `main` para su posterior despliegue en producción.
