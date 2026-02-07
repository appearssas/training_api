# Completar capacitaciones de usuario (admin)

Funcionalidad que permite a un administrador marcar todas las capacitaciones de un usuario como completadas y habilitarlo para certificar, sin que el usuario tenga que realizar las lecciones ni las evaluaciones.

## Endpoint

- **Método:** `POST`
- **Ruta:** `/users/:id/complete-trainings`
- **Rol requerido:** `ADMIN`
- **Autenticación:** Bearer JWT

La documentación detallada (parámetros, respuestas, ejemplos) está disponible en **Swagger** una vez levantado el servidor (p. ej. `/api` o la ruta configurada en el proyecto).

## Comportamiento

1. Se obtiene el usuario por `id` y su persona (estudiante).
2. Se listan todas las inscripciones del estudiante.
3. Por cada inscripción:
   - Se carga la capacitación con secciones, lecciones y evaluaciones (preguntas y opciones).
   - Se marcan **todas las lecciones** como completadas (progreso 100 %) vía `ProgresoLeccion`.
   - Por cada **evaluación** del curso:
     - Se crea un intento (`startAttempt`).
     - Por cada pregunta se envía la respuesta correcta según el tipo (única, múltiple, texto abierto).
     - Se finaliza el intento (`finishAttempt`); si aplica, se genera el certificado.
   - Se actualiza la inscripción: estado `completado`, `aprobado`, `progresoPorcentaje` 100, `fechaFinalizacion`, `calificacionFinal` 100.

Si una inscripción falla (p. ej. sin intentos disponibles), se registra el error y se continúa con el resto. La respuesta incluye `inscripcionesProcesadas` y un array opcional `errors`.

## Componentes

- **Caso de uso:** `CompleteUserTrainingsUseCase` (`src/application/usuarios/use-cases/complete-user-trainings.use-case.ts`)
- **Controlador:** `UsuariosController.completeTrainings` (`src/infrastructure/usuarios/usuarios.controller.ts`)
- **Repositorio de progreso:** `IProgresoLeccionRepository` / `ProgresoLeccionRepositoryAdapter` para marcar lecciones completadas
- **Módulos:** `UsuariosModule` importa `IntentosModule`, `InscripcionesModule`, `CapacitacionesModule`, `ProgresoModule`

## Respuesta (Swagger)

El DTO de respuesta está definido en `CompleteUserTrainingsResponseDto` y en el decorador `@ApiResponse` del controlador, con ejemplos de éxito y de respuesta con errores parciales.

---

## Aprobación masiva (varios usuarios) y BullMQ

El endpoint **`POST /users/complete-trainings-bulk`** acepta un body `{ userIds: number[] }` y procesa cada usuario con el mismo flujo anterior. El trabajo se ejecuta en un **worker de BullMQ** para no bloquear la API y permitir escalar el procesamiento.

### Requisitos (opcional)

- **Redis** solo si quieres procesar el lote en un worker en segundo plano. Si no configuras Redis, el bulk se ejecuta **en síncrono** (misma respuesta, sin cola).
- Para usar BullMQ, en `.env` define:
  - `REDIS_ENABLED=true`
  - `REDIS_HOST` (por defecto `localhost`)
  - `REDIS_PORT` (por defecto `6379`)
  - `REDIS_PASSWORD` (opcional)

### Flujo

1. El controlador encola un job en la cola `complete-trainings` con los `userIds`.
2. El **worker** (`CompleteTrainingsProcessor`) procesa el job llamando a `CompleteUserTrainingsBulkUseCase`.
3. La petición HTTP espera hasta que el job termine (máx. 5 min) y devuelve el mismo DTO de respuesta masiva (`results`, `totalProcessed`, `totalSuccess`, `totalErrors`).

### Componentes

- **Cola:** `complete-trainings` (BullMQ)
- **Processor:** `CompleteTrainingsProcessor` (`src/infrastructure/usuarios/complete-trainings.processor.ts`)
- **Caso de uso:** `CompleteUserTrainingsBulkUseCase` (reutiliza `CompleteUserTrainingsUseCase` por usuario)
- **Configuración:** `BullModule.forRootAsync` en `AppModule` (Redis); `BullModule.registerQueue` en `UsuariosModule`
