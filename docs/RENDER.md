# Despliegue en Render (512 MB RAM)

Para que la API Nest funcione en un plan con **512 MB RAM** y **0.5 CPU**, sigue esta configuración.

---

## ⚠️ Start Command (obligatorio)

**En Render → tu servicio → Settings → Start Command** debe ser:

```bash
yarn start:prod:low-memory
```

**No uses `yarn start`.** Si usas `yarn start`, Render ejecuta `nest start`, que compila TypeScript en tiempo de ejecución y provoca **JavaScript heap out of memory** (~252 MB de heap y crash). Con `yarn start:prod:low-memory` se ejecuta el código ya compilado (`node dist/src/main.js`) con límite de heap 384 MB.

**Alternativa (misma idea):** Start Command `yarn start:prod` y en Environment la variable `NODE_OPTIONS` = `--max-old-space-size=384`.

---

## Build Command

**Con migraciones y seed:**

```bash
yarn install --production=false && yarn typeorm:migration:run && yarn seed && yarn build
```

**Solo build:**

```bash
yarn install --production=false && yarn build
```

(`--production=false` instala devDependencies necesarias para migraciones, seed y compilación.)

---

## Causa del error "JavaScript heap out of memory"

- **No uses** `yarn start` en producción: ese comando ejecuta `nest start`, que compila TypeScript en tiempo de ejecución y consume mucha más memoria.
- Debes compilar en el **Build** y en el **Start** ejecutar solo el código ya compilado, con límite de heap.

## Variables de entorno útiles

| Variable         | Valor             | Descripción                                                           |
| ---------------- | ----------------- | --------------------------------------------------------------------- |
| `STAGE`          | `prod`            | Activa modo producción (menos logs, Swagger desactivado por defecto). |
| `ENABLE_SWAGGER` | `true` (opcional) | Si quieres `/docs` en producción (usa más memoria).                   |
| `PORT`           | Lo asigna Render  | No suele hacer falta definirlo.                                       |

## Resumen de cambios en el proyecto

1. **`start:prod:low-memory`** en `package.json`: ejecuta `node` con `--max-old-space-size=384` sobre el build (`dist/src/main.js`), dejando margen dentro de 512 MB.
2. **Swagger opcional en producción**: por defecto no se monta en `STAGE=prod` para ahorrar memoria; con `ENABLE_SWAGGER=true` lo activas.
3. **Menos logs en producción**: se reducen los `console.log` al arranque cuando `STAGE=prod`.

## Si sigues con OOM

- Mantén `ENABLE_SWAGGER` sin definir (o `false`) en producción.
- Revisa endpoints que devuelvan listas muy grandes (paginación obligatoria).
- Considera subir a un plan con 1 GB RAM en Render si el tráfico crece.
