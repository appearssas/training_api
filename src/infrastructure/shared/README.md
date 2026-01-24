# PDF Generator Service - Arquitectura Refactorizada

Este módulo ha sido refactorizado para seguir las mejores prácticas de arquitectura de software, separando responsabilidades y mejorando la mantenibilidad del código.

## Estructura del Proyecto

```
src/infrastructure/shared/
├── services/
│   └── pdf-generator.service.ts     # Servicio principal (refactorizado)
├── types/
│   └── pdf-config.interface.ts      # Interfaces y tipos TypeScript
├── constants/
│   └── pdf.constants.ts             # Constantes y configuraciones
├── utils/
│   ├── svg.utils.ts                 # Utilidades para SVG
│   ├── image.utils.ts               # Utilidades para imágenes
│   ├── certificate.utils.ts         # Utilidades específicas del certificado
│   └── pdf-renderer.utils.ts        # Funciones de renderizado del PDF
└── README.md                        # Esta documentación
```

## Descripción de Archivos

### 1. **Types (`types/pdf-config.interface.ts`)**
Contiene todas las interfaces y tipos TypeScript:
- `PdfConfig`: Configuración principal del PDF
- `CertificateConfig`: Configuración específica por tipo de certificado
- `ElementConfig`: Configuración de elementos individuales
- `InstructorDetails`, `RepresentativeDetails`: Datos de firmas
- `CertificateTypeFlags`: Flags para tipos de certificado

### 2. **Constants (`constants/pdf.constants.ts`)**
Define todas las constantes y configuraciones:
- `PUBLIC_ASSETS_PATH`: Rutas de assets
- `PDF_CONFIG`: Configuración de jsPDF
- `DEFAULT_VALUES`: Valores por defecto (colores, tamaños, posiciones)
- `STABLE_TEXT_STYLE`: Estilos SVG estables

### 3. **SVG Utils (`utils/svg.utils.ts`)**
Funciones relacionadas con SVG:
- `svgToImage()`: Convierte SVG a imagen con alta resolución
- `loadFontBase64()`: Carga fuentes como base64
- `injectMontserratFonts()`: Inyecta fuentes Montserrat

### 4. **Image Utils (`utils/image.utils.ts`)**
Funciones para manejo de imágenes:
- `loadImageAsDataUrl()`: Carga imagen como Data URL
- `generateQRCodeImage()`: Genera código QR

### 5. **Certificate Utils (`utils/certificate.utils.ts`)**
Utilidades específicas del certificado:
- `getCertificateBackground()`: Determina el fondo según el tipo
- `getInstructorDetails()`: Obtiene datos del instructor
- `getRepresentativeDetails()`: Obtiene datos del representante
- `getAllianceCompany()`: Obtiene compañía aliada
- `getDuration()`: Obtiene duración del curso
- `determineCertificateTypes()`: Determina tipos y flags
- `formatCertificateDates()`: Formatea fechas

### 6. **PDF Renderer Utils (`utils/pdf-renderer.utils.ts`)**
Funciones de renderizado del PDF:
- `renderDuracionYFechas()`: Renderiza duración y fechas
- `renderCourseText()`: Renderiza nombre del curso
- `renderStudentName()`: Renderiza nombre del estudiante
- `renderDocumentId()`: Renderiza documento de identidad
- `renderSignatures()`: Renderiza firmas (instructor y representante)
- `renderQRCode()`: Renderiza código QR
- `renderFooter()`: Renderiza pie de página con formato mixto

### 7. **PDF Generator Service (`services/pdf-generator.service.ts`)**
Servicio principal refactorizado:
- Método principal: `generateCertificate()`
- Métodos privados para organización del flujo
- Eliminación de código duplicado
- Separación clara de responsabilidades

## Beneficios de la Refactorización

### ✅ **Separación de Responsabilidades**
- Cada archivo tiene una responsabilidad específica
- Código más fácil de mantener y testear

### ✅ **Reutilización de Código**
- Funciones utilitarias pueden ser reutilizadas
- Constantes centralizadas

### ✅ **Mejor Organización**
- Estructura clara y lógica
- Fácil localización de funcionalidades

### ✅ **Mantenibilidad**
- Cambios aislados por funcionalidad
- Menos riesgo de efectos secundarios

### ✅ **Testabilidad**
- Funciones más pequeñas y enfocadas
- Fácil creación de tests unitarios

### ✅ **Legibilidad**
- Código más limpio y comprensible
- Documentación clara de responsabilidades

## Migración

### Antes (1503 líneas en un solo archivo)
```typescript
export class PdfGeneratorService {
  // Todo el código mezclado en un solo archivo
  // Difícil de mantener y testear
}
```

### Después (Arquitectura modular)
```typescript
// Servicio principal limpio
export class PdfGeneratorService {
  async generateCertificate() {
    // Flujo claro y organizado
    // Utiliza funciones utilitarias
  }
}

// Utilidades separadas por responsabilidad
// Constantes centralizadas
// Types bien definidos
```

## Uso

El servicio se usa exactamente igual que antes:

```typescript
const buffer = await pdfGeneratorService.generateCertificate(
  certificado,
  config
);
```

La refactorización es completamente transparente para los consumidores del servicio.

---

**Nota**: Esta refactorización mantiene 100% de compatibilidad hacia atrás mientras mejora significativamente la arquitectura del código.