import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { DocumentoLegal } from '@/entities/documentos/documento-legal.entity';
import { Usuario } from '@/entities/usuarios/usuario.entity';

export class DocumentosLegalesSeeder extends BaseSeeder {
  async run(): Promise<void> {
    const documentosRepository = this.dataSource.getRepository(DocumentoLegal);
    const usuariosRepository = this.dataSource.getRepository(Usuario);

    // Buscar un usuario administrador para asignar como creador
    const adminUsuario = await usuariosRepository.findOne({
      where: { rolPrincipal: { codigo: 'ADMIN' } },
      relations: ['rolPrincipal'],
    });

    const documentosData = [
      {
        tipo: 'TERMINOS_CONDICIONES',
        titulo: 'Términos y Condiciones de Uso',
        contenido: `TÉRMINOS Y CONDICIONES DE USO

1. ACEPTACIÓN DE TÉRMINOS
Al acceder y utilizar esta plataforma de capacitación, usted acepta cumplir con estos términos y condiciones de uso.

2. USO DE LA PLATAFORMA
La plataforma está destinada exclusivamente para fines educativos y de capacitación. El usuario se compromete a:
- Utilizar la plataforma de manera responsable y ética
- No compartir credenciales de acceso
- No realizar actividades que puedan dañar o comprometer la seguridad del sistema
- Respetar los derechos de propiedad intelectual

3. CUENTAS DE USUARIO
- El usuario es responsable de mantener la confidencialidad de sus credenciales
- Debe notificar inmediatamente cualquier uso no autorizado de su cuenta
- La plataforma se reserva el derecho de suspender o cancelar cuentas que violen estos términos

4. PROPIEDAD INTELECTUAL
Todo el contenido de la plataforma, incluyendo materiales, textos, imágenes y software, está protegido por derechos de autor.

5. LIMITACIÓN DE RESPONSABILIDAD
La plataforma no se hace responsable por daños derivados del uso o imposibilidad de uso del servicio.

6. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos en cualquier momento. Los usuarios serán notificados de cambios significativos.

7. LEY APLICABLE
Estos términos se rigen por las leyes vigentes del país.

Fecha de última actualización: ${new Date().toLocaleDateString('es-CO')}`,
        version: '1.0',
        requiereFirmaDigital: false,
        activo: true,
        creadoPor: adminUsuario || null,
      },
      {
        tipo: 'POLITICA_PRIVACIDAD',
        titulo: 'Política de Privacidad',
        contenido: `POLÍTICA DE PRIVACIDAD

1. INFORMACIÓN QUE RECOPILAMOS
Recopilamos información que usted nos proporciona directamente, incluyendo:
- Datos de registro (nombre, documento de identidad, email)
- Información de uso de la plataforma
- Datos de progreso en capacitaciones

2. USO DE LA INFORMACIÓN
Utilizamos su información para:
- Proporcionar y mejorar nuestros servicios
- Gestionar su cuenta y acceso a la plataforma
- Enviar comunicaciones relacionadas con el servicio
- Cumplir con obligaciones legales

3. PROTECCIÓN DE DATOS
Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.

4. COMPARTIR INFORMACIÓN
No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
- Cuando sea requerido por ley
- Para proteger nuestros derechos legales
- Con su consentimiento explícito

5. SUS DERECHOS
Usted tiene derecho a:
- Acceder a sus datos personales
- Rectificar información incorrecta
- Solicitar la eliminación de sus datos
- Oponerse al procesamiento de sus datos

6. RETENCIÓN DE DATOS
Conservamos su información mientras su cuenta esté activa o según sea necesario para cumplir con nuestras obligaciones legales.

7. CAMBIOS A ESTA POLÍTICA
Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos.

Fecha de última actualización: ${new Date().toLocaleDateString('es-CO')}`,
        version: '1.0',
        requiereFirmaDigital: false,
        activo: true,
        creadoPor: adminUsuario || undefined,
      },
    ];

    for (const documentoData of documentosData) {
      const existingDocumento = await documentosRepository.findOne({
        where: { tipo: documentoData.tipo, activo: true },
      });

      if (!existingDocumento) {
        const documento = documentosRepository.create({
          ...documentoData,
          creadoPor: documentoData.creadoPor || undefined,
        });
        await documentosRepository.save(documento);
        console.log(
          `✓ Documento legal creado: ${documentoData.titulo} (${documentoData.tipo})`,
        );
      } else {
        console.log(
          `- Documento legal ya existe: ${documentoData.titulo} (${documentoData.tipo})`,
        );
      }
    }
  }
}
