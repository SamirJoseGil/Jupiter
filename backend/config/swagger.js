const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Jupiter API',
      version: '1.0.0',
      description: 'API para la gestion de PQRSDfDf con soporte de IA y autenticacion JWT.'
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                status: { type: 'integer', example: 400 },
                message: { type: 'string', example: 'Validation error' }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'admin@jupiter.test' },
            department: { type: 'string', example: 'Infraestructura' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@jupiter.test' },
            password: { type: 'string', example: 'Admin123456' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        IngestRequest: {
          type: 'object',
          required: ['content', 'channel'],
          properties: {
            content: { type: 'string', minLength: 20, maxLength: 5000, example: 'Mi solicitud es sobre reparacion de vias en el barrio X.' },
            channel: { type: 'string', enum: ['web', 'email', 'chat', 'phone', 'social'], example: 'web' }
          }
        },
        Pqr: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 12 },
            content: { type: 'string' },
            channel: { type: 'string', example: 'web' },
            classification: { type: 'string', nullable: true, example: 'Infraestructura' },
            confidence: { type: 'integer', nullable: true, example: 87 },
            summary: { type: 'string', nullable: true },
            topics: {
              type: 'array',
              items: { type: 'string' },
              example: ['vias', 'reparacion', 'barrio']
            },
            multi_dependency: { type: 'boolean', example: false },
            assigned_department: { type: 'string', nullable: true, example: 'Infraestructura' },
            assigned_to_user_id: { type: 'integer', nullable: true, example: 1 },
            status: { type: 'string', enum: ['pending', 'analyzed', 'assigned', 'resolved'], example: 'pending' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        PqrListResponse: {
          type: 'object',
          properties: {
            PQRSDf: {
              type: 'array',
              items: { $ref: '#/components/schemas/Pqr' }
            }
          }
        },
        StatusUpdateRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'analyzed', 'assigned', 'resolved'],
              example: 'assigned'
            }
          }
        },
        AssignRequest: {
          type: 'object',
          required: ['department'],
          properties: {
            userId: { type: 'integer', nullable: true, example: 1 },
            department: { type: 'string', example: 'Infraestructura' }
          }
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Estado del servicio' },
      { name: 'Auth', description: 'Autenticacion de administradores' },
      { name: 'PQR', description: 'Gestion de solicitudes PQRSDfDf' }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
