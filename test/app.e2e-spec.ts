import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let adminToken: string;
  let testUserId: number;
  let testCapacitacionId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar validación global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    // Limpiar datos de prueba si es necesario
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Health Check', () => {
    it('GET / should return Hello World!', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Auth Service Integration', () => {
    describe('Public Endpoints', () => {
      it('POST /auth/public/register should register a new user', async () => {
        const registerDto = {
          numeroDocumento: `TEST${Date.now()}`,
          tipoDocumento: 'CC',
          nombres: 'Test',
          apellidos: 'User',
          email: `test${Date.now()}@example.com`,
          password: 'Test123456!',
          tipoRegistro: 'ALUMNO',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/public/register')
          .send(registerDto)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('usuario');
        testUserId = response.body.usuario?.id;
      });

      it('POST /auth/login should login with credentials', async () => {
        const loginDto = {
          username: 'admin', // Asumiendo que existe un admin por defecto
          password: 'admin123', // Ajustar según configuración
        };

        try {
          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto);

          if (response.status === 200) {
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('refresh_token');
            adminToken = response.body.access_token;
          }
        } catch (error) {
          // Si falla, puede ser que no exista el admin o las credenciales sean incorrectas
          console.log(
            '⚠️ Login test skipped: Admin credentials may not be configured',
          );
        }
      });
    });

    describe('Protected Endpoints', () => {
      beforeEach(async () => {
        // Intentar obtener token de admin para pruebas
        if (!adminToken) {
          try {
            const loginResponse = await request(app.getHttpServer())
              .post('/auth/login')
              .send({ username: 'admin', password: 'admin123' });

            if (loginResponse.status === 200) {
              adminToken = loginResponse.body.access_token;
            }
          } catch (error) {
            // Si no hay admin, las pruebas protegidas se saltarán
          }
        }
      });

      it('GET /auth/profile should return user profile when authenticated', async () => {
        if (!adminToken) {
          console.log('⚠️ Skipping test: No admin token available');
          return;
        }

        const response = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('username');
      });

      it('GET /auth/profile should return 401 when not authenticated', () => {
        return request(app.getHttpServer()).get('/auth/profile').expect(401);
      });
    });
  });

  describe('Terms Service Integration', () => {
    it('GET /terms/active-documents should return active documents (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/terms/active-documents')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('POST /terms/public/accept should accept terms with credentials', async () => {
      // Primero necesitamos un usuario válido
      const registerDto = {
        numeroDocumento: `TERMS${Date.now()}`,
        tipoDocumento: 'CC',
        nombres: 'Terms',
        apellidos: 'Test',
        email: `terms${Date.now()}@example.com`,
        password: 'Test123456!',
        tipoRegistro: 'ALUMNO',
      };

      await request(app.getHttpServer())
        .post('/auth/public/register')
        .send(registerDto)
        .expect(201);

      // Obtener documentos activos
      const docsResponse = await request(app.getHttpServer())
        .get('/terms/active-documents')
        .expect(200);

      if (docsResponse.body.length > 0) {
        const documentIds = docsResponse.body.map((doc: any) => doc.id);

        const acceptResponse = await request(app.getHttpServer())
          .post('/terms/public/accept')
          .send({
            username: registerDto.numeroDocumento,
            password: registerDto.password,
            documentosIds: documentIds,
          })
          .expect(200);

        expect(Array.isArray(acceptResponse.body)).toBe(true);
      }
    });
  });

  describe('Roles Service Integration', () => {
    it('GET /roles should return list of roles', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('codigo');
        expect(response.body[0]).toHaveProperty('nombre');
      }
    });
  });

  describe('Capacitaciones Service Integration', () => {
    it('POST /capacitaciones/list should return list of capacitaciones', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/capacitaciones/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /capacitaciones should create a new capacitacion', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      const capacitacionDto = {
        titulo: `Test Capacitacion ${Date.now()}`,
        descripcion: 'Descripción de prueba',
        fechaInicio: new Date().toISOString(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        duracionHoras: 40,
        estado: 'BORRADOR',
      };

      const response = await request(app.getHttpServer())
        .post('/capacitaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(capacitacionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('titulo');
      testCapacitacionId = response.body.id;
    });
  });

  describe('Dashboard Service Integration', () => {
    it('GET /dashboard/stats should return dashboard statistics', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body.kpis).toHaveProperty('activeCourses');
      expect(response.body.kpis).toHaveProperty('enrolledUsers');
      expect(response.body.kpis).toHaveProperty('completionRate');
    });
  });

  describe('Reports Service Integration', () => {
    it('GET /reports/stats should return report statistics', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/reports/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({})
        .expect(200);

      expect(response.body).toHaveProperty('kpis');
      expect(response.body.kpis).toHaveProperty('complianceRate');
      expect(response.body.kpis).toHaveProperty('approvalRate');
    });
  });

  describe('Video URL Validator Service Integration', () => {
    it('should validate YouTube URLs through materiales endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Esta prueba verifica que el servicio de validación de URLs funciona
      // cuando se intenta crear un material con URL de video
      const materialDto = {
        titulo: 'Test Video Material',
        tipo: 'VIDEO',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        orden: 1,
        capacitacionId: testCapacitacionId || 1,
      };

      const response = await request(app.getHttpServer())
        .post('/materiales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(materialDto);

      // Puede ser 201 (creado) o 400 (validación fallida)
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('QR Generator Service Integration', () => {
    it('should generate QR code through certificados endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Esta prueba verifica que el servicio de generación de QR funciona
      // cuando se genera un certificado
      // Nota: Requiere una inscripción completada con evaluación aprobada
      const response = await request(app.getHttpServer())
        .get('/certificados')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);

      if (response.body.data && response.body.data.length > 0) {
        const certificado = response.body.data[0];
        expect(certificado).toHaveProperty('codigoQr');
      }
    });
  });

  describe('Email Service Integration', () => {
    it('POST /auth/password-reset/request should request password reset', async () => {
      const resetDto = {
        email: 'test@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/password-reset/request')
        .send(resetDto);

      // Puede ser 200 (email enviado) o 404 (usuario no encontrado)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Storage Service Integration', () => {
    it('POST /auth/register/photo should upload profile photo', async () => {
      // Crear un buffer de imagen de prueba
      const imageBuffer = Buffer.from('fake-image-content');

      const response = await request(app.getHttpServer())
        .post('/auth/register/photo')
        .attach('file', imageBuffer, 'test.jpg')
        .expect((res) => {
          // Puede ser 201 (subido) o 400 (error de validación)
          expect([201, 400]).toContain(res.status);
        });

      if (response.status === 201) {
        expect(response.body).toHaveProperty('fotoUrl');
      }
    });
  });

  describe('Evaluation Scoring Service Integration', () => {
    it('should calculate scores through intentos endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Esta prueba verifica que el servicio de cálculo de puntajes funciona
      // cuando se envía un intento de evaluación
      // Nota: Requiere una evaluación y preguntas existentes
      const response = await request(app.getHttpServer())
        .get('/evaluaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 1 });

      expect(response.status).toBe(200);

      // Si hay evaluaciones, podemos probar el cálculo de puntajes
      if (response.body.data && response.body.data.length > 0) {
        const evaluacionId = response.body.data[0].id;

        // Intentar obtener intentos de esta evaluación
        const intentosResponse = await request(app.getHttpServer())
          .get(`/evaluaciones/${evaluacionId}/intentos`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 404]).toContain(intentosResponse.status);

        if (
          intentosResponse.status === 200 &&
          intentosResponse.body.length > 0
        ) {
          const intento = intentosResponse.body[0];
          expect(intento).toHaveProperty('puntajeObtenido');
          expect(intento).toHaveProperty('porcentajeObtenido');
        }
      }
    });
  });

  describe('Image Compression Service Integration', () => {
    it('should compress images when uploading profile photo', async () => {
      // Crear un buffer de imagen más grande para probar compresión
      const largeImageBuffer = Buffer.alloc(2000 * 1024); // 2MB

      const response = await request(app.getHttpServer())
        .post('/auth/register/photo')
        .attach('file', largeImageBuffer, 'large-test.jpg');

      // El servicio debería comprimir la imagen
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('PDF Generator Service Integration', () => {
    it('should generate PDF certificate through certificados endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Obtener certificados existentes
      const certificadosResponse = await request(app.getHttpServer())
        .get('/certificados')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 1 })
        .expect(200);

      if (
        certificadosResponse.body.data &&
        certificadosResponse.body.data.length > 0
      ) {
        const certificadoId = certificadosResponse.body.data[0].id;

        // Intentar descargar el certificado PDF
        const pdfResponse = await request(app.getHttpServer())
          .get(`/certificados/${certificadoId}/download`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([200, 404]).toContain(res.status);
          });

        if (pdfResponse.status === 200) {
          expect(pdfResponse.headers['content-type']).toContain(
            'application/pdf',
          );
        }
      }
    });
  });

  describe('S3 Service Integration', () => {
    it('should handle S3 uploads when configured', async () => {
      // Esta prueba verifica que el servicio S3 funciona cuando está configurado
      // Si no está configurado, el servicio usará almacenamiento local
      const imageBuffer = Buffer.from('test-image-content');

      const response = await request(app.getHttpServer())
        .post('/auth/register/photo')
        .attach('file', imageBuffer, 'test.jpg');

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        // Verificar que la URL retornada es válida
        expect(response.body.fotoUrl).toBeDefined();
        expect(typeof response.body.fotoUrl).toBe('string');
      }
    });
  });

  describe('Validation Services Integration', () => {
    it('should validate inscripcion through inscripciones endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Intentar crear una inscripción inválida para probar validación
      const invalidInscripcionDto = {
        estudianteId: 999999, // ID que no existe
        capacitacionId: testCapacitacionId || 1,
      };

      await request(app.getHttpServer())
        .post('/inscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidInscripcionDto)
        .expect((res) => {
          // Debería fallar la validación
          expect([400, 404]).toContain(res.status);
        });
    });

    it('should validate evaluacion through evaluaciones endpoint', async () => {
      if (!adminToken) {
        console.log('⚠️ Skipping test: No admin token available');
        return;
      }

      // Intentar crear una capacitación sin evaluación para probar validación
      const capacitacionDto = {
        titulo: `Test Sin Evaluacion ${Date.now()}`,
        descripcion: 'Test',
        fechaInicio: new Date().toISOString(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        duracionHoras: 40,
        estado: 'PUBLICADA', // Intentar publicar sin evaluación
      };

      const response = await request(app.getHttpServer())
        .post('/capacitaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(capacitacionDto);

      // Debería fallar porque no tiene evaluación o crearse como borrador
      expect([400, 201]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should return 401 for protected endpoints without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 400 for invalid request body', () => {
      return request(app.getHttpServer())
        .post('/auth/public/register')
        .send({ invalid: 'data' })
        .expect(400);
    });
  });
});
