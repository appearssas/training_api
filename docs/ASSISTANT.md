# Asistente de ayuda (chat) – Formar 360

El asistente es un chat integrado que responde preguntas sobre cómo usar Formar 360: dónde está cada funcionalidad, pasos para tareas y enlaces a las pantallas.

---

## 1. Configuración: proveedores y variables de entorno

El backend soporta **varios proveedores**. Si hay varias claves, se usa el **orden configurado** (rotación con fallback; ver sección 4).

### 1.1 Perplexity (recomendado para PoC)

- Con **Perplexity Pro** (~20 USD/mes) tienes **~5 USD de crédito mensual** para la API.
- **API key:** [perplexity.ai/settings](https://perplexity.ai/settings) → pestaña **"</> API"** → **Generate API Key** (formato `pplx-...`).
- **Variable:** `PERPLEXITY_API_KEY=pplx-...`
- **Modelo por defecto:** `sonar`. Opcional: `PERPLEXITY_MODEL=sonar-pro`

### 1.2 OpenAI

- Pago por uso (tokens).
- **Variable:** `OPENAI_API_KEY=sk-...`
- **Modelo por defecto:** `gpt-4o-mini`. Opcional: `OPENAI_MODEL=gpt-3.5-turbo`

### 1.3 Google Gemini (tier gratuito)

- Límites por minuto/día (RPM/RPD). Ideal como primer recurso o fallback.
- **API key:** [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Variable:** `GEMINI_API_KEY=...`
- **Modelo por defecto:** `gemini-1.5-flash`. Opcional: `GEMINI_MODEL=...`

### 1.4 Variables de entorno (resumen)

En `.env` añade **al menos una** de estas claves:

```env
# Opción A – Perplexity (PoC)
PERPLEXITY_API_KEY=pplx-tu-clave

# Opción B – OpenAI
OPENAI_API_KEY=sk-tu-clave

# Opción C – Gemini (gratuito)
GEMINI_API_KEY=tu-clave
```

Si no hay ninguna clave, el endpoint responde 503 y el frontend indica que el asistente no está configurado.

### 1.5 Límites globales (evitar facturación en PoC)

Para usuarios **sin empresa** o empresas **sin cuota asignada** se aplican estos límites:

- **`ASSISTANT_MONTHLY_TOKEN_LIMIT`**: tope de tokens en el mes. `0` = sin límite. Ejemplo: `50000`.
- **`ASSISTANT_DAILY_REQUEST_LIMIT`**: tope de peticiones por día. `0` = sin límite. Ejemplo: `30`.

El uso global se guarda en `storage/assistant-usage.json` (o en `STORAGE_PATH`). Los contadores se reinician cada mes (tokens) y cada día (peticiones).

---

## 2. Uso del asistente

### Backend

- **Módulo:** `AssistantModule` (`src/infrastructure/assistant/`).
- **Endpoint:** `POST /assistant/chat` (requiere JWT).
- **Cuerpo:** `{ "message": "¿Cómo creo una capacitación?" }`.
- **Respuesta:** `{ "reply": "..." }` (texto con enlaces en Markdown `[texto](/ruta)`).

### Frontend (training)

- Botón flotante (icono de asistente) que abre un panel lateral con el chat.
- El servicio llama a `POST /assistant/chat`.
- El chat está en `MainLayout`, disponible en todas las pantallas tras iniciar sesión.

### Conocimiento del asistente

El contenido que el asistente “sabe” de Formar 360 está en:

**`src/infrastructure/assistant/platform-knowledge.ts`**

Ahí se describen rutas, pasos y roles. Para cambiar o ampliar respuestas, edita ese archivo y reinicia el backend.

---

## 3. Tokens por cliente institucional (empresa)

Cada **empresa** (cliente institucional) puede tener una **cuota mensual de tokens** configurable. El usuario ve cuántos tokens le quedan y el mensaje: *"Para adquirir más, contacte al administrador del sistema."*

### Modelo de datos

- **Cuota por empresa:** tabla `assistant_empresa_quota` (empresa_id, token_quota_monthly). Si no hay fila, se usa el límite global (env). Si `token_quota_monthly = 0`, el asistente no está disponible para esa empresa.
- **Uso por empresa y mes:** tabla `assistant_empresa_usage` (empresa_id, month YYYY-MM, tokens_used). Se reinicia implícitamente cada mes.

### Reglas

- Usuario **con** empresa y cuota asignada: se aplica la cuota de su empresa y se descuenta del uso de esa empresa.
- Usuario **sin** empresa o empresa **sin** cuota asignada: se aplica el límite global (ASSISTANT_MONTHLY_TOKEN_LIMIT / ASSISTANT_DAILY_REQUEST_LIMIT).

### API

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/assistant/quota` | Autenticado | Devuelve `tokensAvailable`, `tokensUsed`, `quotaMonthly`, `message` (incluye texto para contactar al admin). |
| GET | `/assistant/quota/empresas` | ADMIN | Listado de empresas con cuota y uso del mes actual. |
| PUT | `/assistant/quota/empresas/:empresaId` | ADMIN | Body `{ "tokenQuotaMonthly": number }`. Asigna o actualiza la cuota. |

### Frontend

- En el widget del asistente se muestra el mensaje devuelto por `GET /assistant/quota` (tokens disponibles y “contacte al administrador”).
- Admin: página **Cuotas del asistente** (`/admin/assistant-quota`) para listar empresas y editar la cuota mensual.

---

## 4. Múltiples modelos y rotación automática

Para no agotar un solo proveedor, el backend puede **intentar varios en orden** y usar el primero que responda.

### Orden de proveedores

- **Variable:** `ASSISTANT_PROVIDER_ORDER=perplexity,openai,gemini` (opcional). Por defecto: ese orden.
- Por cada petición se intenta el primer proveedor con clave configurada; si falla (429, error de API, etc.), se prueba el siguiente.

### Proveedores y tier gratuito

| Proveedor | Tier gratuito | Notas |
|-----------|----------------|--------|
| **Google Gemini** | Sí | Límites RPM/RPD. Ideal como primer recurso o fallback. |
| **Perplexity** | Crédito limitado | Útil para PoC; tope mensual. |
| **OpenAI** | No | Pago por uso. |
| **Anthropic Claude** | No (API de pago) | Opcional; no implementado por defecto. |

### Configuración de rotación

```env
# Orden: intentar Gemini primero, luego Perplexity, luego OpenAI
ASSISTANT_PROVIDER_ORDER=gemini,perplexity,openai

GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
OPENAI_API_KEY=...
```

El consumo se registra en la misma unidad (tokens) para la cuota del cliente, independientemente del proveedor que haya respondido.

---

## 5. Pagos (plan futuro)

Objetivo: permitir que el cliente configure un medio de pago para **comprar más tokens**, compatible con cualquier modelo (los tokens son la unidad de consumo).

### Enfoque recomendado

- **Tokens como unidad de cuenta:** venta de “packs de tokens” o cuota adicional; el pago no está atado a un modelo concreto.
- **Proveedor de pago genérico:** Stripe, Mercado Pago, etc. Frontend: botón “Comprar más tokens” que abre Checkout; backend: webhook que actualiza la cuota de la empresa.

### Opciones

| Opción | Descripción |
|--------|-------------|
| **Stripe** | Checkout Session o Payment Element. Clave pública en frontend; backend crea sesión y procesa webhooks. |
| **Mercado Pago** | Preferencial para Latinoamérica. Flujo similar. |
| **Solo contacto admin** | Sin integración: el cliente pide más tokens y el admin actualiza la cuota manualmente (ya cubierto con el mensaje “contacte al administrador”). |

Implementación mínima en una fase posterior: `PAYMENT_PROVIDER=none|stripe|mercadopago`, endpoints de checkout y webhook, y pantalla “Comprar más tokens” en el frontend.
