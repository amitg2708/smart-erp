const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart College ERP API',
      version: '2.0.0',
      description: 'Comprehensive REST API documentation for Smart College ERP System',
      contact: { name: 'ERP Admin', email: 'admin@college.edu' },
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}`, description: 'Development Server' },
      { url: process.env.PROD_URL || 'https://your-erp.com', description: 'Production Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'faculty', 'student'] },
            isActive: { type: 'boolean' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            rollNumber: { type: 'string' },
            course: { type: 'string' },
            year: { type: 'number' },
            branch: { type: 'string' },
          },
        },
        Result: {
          type: 'object',
          properties: {
            subject: { type: 'string' },
            semester: { type: 'number' },
            assignmentMarks: { type: 'number', maximum: 30 },
            testMarks: { type: 'number', maximum: 30 },
            projectMarks: { type: 'number', maximum: 40 },
            total: { type: 'number' },
          },
        },
        Fee: {
          type: 'object',
          properties: {
            semester: { type: 'number' },
            totalFees: { type: 'number' },
            paidAmount: { type: 'number' },
            pendingAmount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'partial', 'paid', 'overdue'] },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
