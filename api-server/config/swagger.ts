import { SwaggerConfig } from '@ioc:Adonis/Addons/Swagger'

export default {
  uiEnabled: true, //disable or enable swaggerUi route
  uiUrl: 'docs', // url path to swaggerUI
  specEnabled: true, //disable or enable swagger.json route
  specUrl: '/swagger.json',

  middleware: [], // middlewares array, for protect your swagger docs and spec endpoints

  options: {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'paf-admin API documentation ',
        version: '0.0.1',
        description: 'Yes, here are the docs...'
      },
      components: {
        securitySchemes: {
          authToken: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      },
      security: [
        {
          "authToken": []
        }
      ]
    },

    apis: [
      'app/**/*.ts',
      'docs/swagger/**/*.yml',
      'start/routes.ts'
    ],
    basePath: ''
  },
  mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'RUNTIME',
  specFilePath: 'docs/swagger.json'
} as SwaggerConfig
