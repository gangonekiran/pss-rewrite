import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "PSS Rewrite API",
      version: "1.0.0",
      description:
        "API documentation for the PSS Rewrite application backend.",
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "Authentication and login APIs",
      },
      {
        name: "Dashboard",
        description: "Dashboard APIs",
      },
      {
        name: "Clients",
        description: "Client management APIs",
      },
      {
        name: "Input Forms",
        description: "Client input form APIs",
      },
    ],

    components: {
      schemas: {
        Client: {
          type: "object",
          properties: {
            ChildID: {
              type: "integer",
              example: 1,
            },
            Region: {
              type: "string",
              example: "Region 1",
            },
            LastName: {
              type: "string",
              example: "Smith",
            },
            FirstName: {
              type: "string",
              example: "John",
            },
            SS: {
              type: "string",
              example: "123-45-6789",
            },
            SSTemp: {
              type: "string",
              example: "",
            },
            DOB: {
              type: "string",
              format: "date",
              example: "2020-01-15",
            },
            Gender: {
              type: "string",
              example: "M",
            },
            Notes: {
              type: "string",
              example: "Client notes",
            },
            NonEarlyIntervention: {
              type: "boolean",
              example: false,
            },
          },
        },

        InputForm: {
          type: "object",
          additionalProperties: true,
          description:
            "Input form data. Available fields depend on the selected form configuration.",
        },

        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "An error occurred",
            },
          },
        },
      },

      responses: {
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },

        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },

  apis: [
    "./src/routes/**/*.ts",
    "./src/modules/**/*.routes.ts",
    "./src/modules/**/*.controller.ts",
  ],

  failOnErrors: true,
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);