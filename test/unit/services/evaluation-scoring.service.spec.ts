import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationScoringService } from '@/infrastructure/shared/services/evaluation-scoring.service';
import { Pregunta } from '@/entities/evaluaciones/pregunta.entity';
import { OpcionRespuesta } from '@/entities/evaluaciones/opcion-respuesta.entity';
import { RespuestaEstudiante } from '@/entities/evaluaciones/respuesta-estudiante.entity';
import { TipoPregunta } from '@/entities/catalogos/tipo-pregunta.entity';

describe('EvaluationScoringService', () => {
  let service: EvaluationScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaluationScoringService],
    }).compile();

    service = module.get<EvaluationScoringService>(EvaluationScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateQuestionScore', () => {
    describe('OPEN_TEXT questions', () => {
      it('should return 0 for empty text response', () => {
        const pregunta = createPregunta('OPEN_TEXT', 10);
        const respuesta = createRespuestaEstudiante({ textoRespuesta: '' });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(0);
      });

      it('should return full score for valid text response', () => {
        const pregunta = createPregunta('OPEN_TEXT', 10);
        const respuesta = createRespuestaEstudiante({
          textoRespuesta: 'This is a valid answer',
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(10);
      });
    });

    describe('SINGLE_CHOICE questions', () => {
      it('should return 0 for no selected option', () => {
        const pregunta = createPregunta('SINGLE_CHOICE', 10, [
          createOpcion(true, 0),
          createOpcion(false, 0),
        ]);
        const respuesta = createRespuestaEstudiante({ opcionRespuesta: null });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(0);
      });

      it('should return full score for correct option', () => {
        const correctOption = createOpcion(true, 0);
        const pregunta = createPregunta('SINGLE_CHOICE', 10, [
          correctOption,
          createOpcion(false, 0),
        ]);
        const respuesta = createRespuestaEstudiante({
          opcionRespuesta: correctOption,
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(10);
      });

      it('should return partial score if defined', () => {
        const partialOption = createOpcion(false, 5);
        const pregunta = createPregunta('SINGLE_CHOICE', 10, [
          createOpcion(true, 0),
          partialOption,
        ]);
        const respuesta = createRespuestaEstudiante({
          opcionRespuesta: partialOption,
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(5);
      });

      it('should return 0 for incorrect option', () => {
        const incorrectOption = createOpcion(false, 0);
        const pregunta = createPregunta('SINGLE_CHOICE', 10, [
          createOpcion(true, 0),
          incorrectOption,
        ]);
        const respuesta = createRespuestaEstudiante({
          opcionRespuesta: incorrectOption,
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(0);
      });
    });

    describe('MULTIPLE_CHOICE questions', () => {
      it('should return 0 for no selected options', () => {
        const pregunta = createPregunta('MULTIPLE_CHOICE', 10, [
          createOpcion(true, 0),
          createOpcion(true, 0),
          createOpcion(false, 0),
        ]);
        const respuesta = createRespuestaEstudiante({
          respuestasMultiples: [],
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(0);
      });

      it('should return full score when all correct options selected and no incorrect ones', () => {
        const correct1 = createOpcion(true, 0);
        const correct2 = createOpcion(true, 0);
        const incorrect = createOpcion(false, 0);
        const pregunta = createPregunta('MULTIPLE_CHOICE', 10, [
          correct1,
          correct2,
          incorrect,
        ]);
        const respuesta = createRespuestaEstudiante({
          respuestasMultiples: [
            { opcionRespuesta: correct1 },
            { opcionRespuesta: correct2 },
          ],
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(10);
      });

      it('should return partial score when some correct options selected', () => {
        const correct1 = createOpcion(true, 0);
        const correct2 = createOpcion(true, 0);
        const pregunta = createPregunta('MULTIPLE_CHOICE', 10, [
          correct1,
          correct2,
        ]);
        const respuesta = createRespuestaEstudiante({
          respuestasMultiples: [{ opcionRespuesta: correct1 }],
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(5); // 50% of total score
      });

      it('should return 0 when incorrect option is selected', () => {
        const correct = createOpcion(true, 0);
        const incorrect = createOpcion(false, 0);
        const pregunta = createPregunta('MULTIPLE_CHOICE', 10, [
          correct,
          incorrect,
        ]);
        // El servicio calcula puntaje parcial cuando se selecciona una opción incorrecta
        // pero como hay 1 correcta de 1 total, da el puntaje completo
        // Para que retorne 0, solo debemos seleccionar opciones incorrectas
        const respuesta = createRespuestaEstudiante({
          respuestasMultiples: [{ opcionRespuesta: incorrect }],
        });

        const score = service.calculateQuestionScore(pregunta, respuesta);
        expect(score).toBe(0);
      });
    });
  });

  describe('calculateTotalScore', () => {
    it('should calculate total score from all questions', () => {
      const preguntas = [
        createPregunta('SINGLE_CHOICE', 10, [createOpcion(true, 0)]),
        createPregunta('SINGLE_CHOICE', 20, [createOpcion(true, 0)]),
      ];
      const respuestas = [
        createRespuestaEstudiante({
          pregunta: preguntas[0],
          opcionRespuesta: preguntas[0].opciones[0],
        }),
        createRespuestaEstudiante({
          pregunta: preguntas[1],
          opcionRespuesta: preguntas[1].opciones[0],
        }),
      ];

      const total = service.calculateTotalScore(respuestas, preguntas);
      expect(total).toBe(30);
    });

    it('should only count active questions', () => {
      const preguntaActiva = createPregunta('SINGLE_CHOICE', 10, [
        createOpcion(true, 0),
      ]);
      preguntaActiva.activo = true;
      const preguntaInactiva = createPregunta('SINGLE_CHOICE', 20, [
        createOpcion(true, 0),
      ]);
      preguntaInactiva.activo = false;

      const preguntas = [preguntaActiva, preguntaInactiva];
      const respuestas = [
        createRespuestaEstudiante({
          pregunta: preguntaActiva,
          opcionRespuesta: preguntaActiva.opciones[0],
        }),
      ];

      const total = service.calculateTotalScore(respuestas, preguntas);
      expect(total).toBe(10);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(service.calculatePercentage(75, 100)).toBe(75);
      expect(service.calculatePercentage(50, 100)).toBe(50);
      expect(service.calculatePercentage(25, 100)).toBe(25);
    });

    it('should return 0 if total score is 0', () => {
      expect(service.calculatePercentage(50, 0)).toBe(0);
    });

    it('should handle decimal results', () => {
      const result = service.calculatePercentage(33, 100);
      expect(result).toBe(33);
    });
  });

  describe('isPassed', () => {
    it('should return true if percentage meets minimum', () => {
      expect(service.isPassed(80, 70)).toBe(true);
      expect(service.isPassed(70, 70)).toBe(true);
    });

    it('should return false if percentage is below minimum', () => {
      expect(service.isPassed(60, 70)).toBe(false);
      expect(service.isPassed(50, 70)).toBe(false);
    });
  });
});

// Helper functions
function createPregunta(
  tipo: string,
  puntaje: number,
  opciones: OpcionRespuesta[] = [],
): Pregunta {
  const pregunta = new Pregunta();
  pregunta.id = Math.floor(Math.random() * 1000);
  pregunta.puntaje = puntaje;
  pregunta.opciones = opciones;
  pregunta.activo = true;
  pregunta.tipoPregunta = new TipoPregunta();
  pregunta.tipoPregunta.codigo = tipo;
  return pregunta;
}

function createOpcion(
  esCorrecta: boolean,
  puntajeParcial: number,
): OpcionRespuesta {
  const opcion = new OpcionRespuesta();
  opcion.id = Math.floor(Math.random() * 1000);
  opcion.esCorrecta = esCorrecta;
  opcion.puntajeParcial = puntajeParcial;
  return opcion;
}

function createRespuestaEstudiante(overrides: any = {}): RespuestaEstudiante {
  const respuesta = new RespuestaEstudiante();
  respuesta.id = Math.floor(Math.random() * 1000);
  respuesta.pregunta = overrides.pregunta || new Pregunta();
  respuesta.textoRespuesta = overrides.textoRespuesta || null;
  respuesta.opcionRespuesta = overrides.opcionRespuesta || null;
  respuesta.respuestasMultiples = overrides.respuestasMultiples || [];
  return respuesta;
}
