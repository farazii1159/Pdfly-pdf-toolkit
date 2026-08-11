'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
});

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PDFly API',
    version: '1.0.0',
    description:
      'REST API documentation for PDFly document conversion and PDF processing tools.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Application health and dependency status',
    },
    {
      name: 'Conversion',
      description: 'Word document conversion APIs',
    },
    {
      name: 'PDF Tools',
      description: 'PDF processing and document tool APIs',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check application health',
        description:
          'Checks whether the application is running and whether LibreOffice is available.',
        responses: {
          '200': {
            description: 'Application health information returned successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    libreOfficeAvailable: {
                      type: 'boolean',
                      example: true,
                    },
                    libreOfficeVersion: {
                      type: 'string',
                      nullable: true,
                      example: 'LibreOffice 25.2.3.2',
                    },
                    envConfigured: {
                      type: 'object',
                      properties: {
                        supabaseUrl: {
                          type: 'boolean',
                          example: true,
                        },
                        supabaseAnonKey: {
                          type: 'boolean',
                          example: true,
                        },
                        supabaseServiceRoleKey: {
                          type: 'boolean',
                          example: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/convert': {
      post: {
        tags: ['Conversion'],
        summary: 'Convert a Word document to PDF',
        description:
          'Uploads a DOCX file, converts it to PDF using LibreOffice, stores the files, and returns a temporary download URL.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Word DOCX file to convert.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Word document converted successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    downloadUrl: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://example.com/signed-download-url',
                    },
                    filename: {
                      type: 'string',
                      example: 'document.pdf',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid or missing DOCX file.',
          },
          '500': {
            description: 'Server or conversion error.',
          },
        },
      },
    },

    '/api/tools': {
      post: {
        tags: ['PDF Tools'],
        summary: 'Process a file using a PDF tool',
        description:
          'Processes uploaded files using the selected PDFly tool. Authentication is required.',
        security: [
          {
            supabaseAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['tool', 'files'],
                properties: {
                  tool: {
                    type: 'string',
                    description: 'PDFly tool slug.',
                    example: 'word-to-pdf',
                  },
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                    description: 'Input file(s) for the selected tool.',
                  },
                  range: {
                    type: 'string',
                    description: 'Page range used by the split tool.',
                    example: '1-3',
                  },
                  text: {
                    type: 'string',
                    description: 'Text used by the edit or watermark tools.',
                    example: 'Sample text',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    description: 'Password used by protect/unlock tools.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'File processed successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    downloadUrl: {
                      type: 'string',
                      format: 'uri',
                    },
                    filename: {
                      type: 'string',
                      example: 'document-word-to-pdf.pdf',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid tool or input.',
          },
          '401': {
            description: 'Authentication required.',
          },
          '500': {
            description: 'Processing or server error.',
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      supabaseAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Supabase authenticated user access token.',
      },
    },
  },
};

export default function ApiDocsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      <SwaggerUI spec={swaggerSpec} />
    </main>
  );
}