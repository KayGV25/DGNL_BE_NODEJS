import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import serverConfig from "./configs/serverConfig";

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'DGNL Backend API Document',
        version: '1.0.0',
        description: `
            API documentation for user authentication, registration, and account management.
            
            ## Authentication
            This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
            \`Authorization: Bearer <your-jwt-token>\`
            
            ## Response Format
            All responses follow a consistent format with appropriate HTTP status codes.
        `,
        contact: {
            name: 'API Support',
            email: 'luyendedxh@gmail.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: '/api',
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
            },
        },
        schemas: {
            // Authentication Schemas
            LoginRequest: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: {
                        type: 'string',
                        description: 'Username or email address',
                        example: 'john.doe@example.com',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        description: 'User password (minimum 8 characters)',
                        example: 'strong_password123',
                        minLength: 8
                    },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password', 'username'],
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Valid email address',
                        example: 'john.doe@example.com',
                    },
                    password: {
                        type: 'string',
                        format: 'password',
                        description: 'Password (minimum 8 characters, must contain letters and numbers)',
                        example: 'strong_password123',
                        minLength: 8
                    },
                    username: {
                        type: 'string',
                        description: 'Unique username (3-20 characters)',
                        example: 'johndoe',
                        minLength: 3,
                        maxLength: 20
                    },
                },
            },
            OTPVerifyRequest: {
                type: 'object',
                required: ['user_id', 'otp'],
                properties: {
                    user_id: {
                        type: 'string',
                        description: 'User ID received from login response',
                        example: '1a2b3c4d5e6f'
                    },
                    otp: {
                        type: 'string',
                        description: '6-digit OTP code',
                        example: '123456',
                        pattern: '^[0-9]{6}$'
                    }
                }
            },
            PasswordResetRequest: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Email address for password reset',
                        example: 'john.doe@example.com'
                    }
                }
            },
            
            // Response Schemas
            LoginResponse: {
                type: 'object',
                properties: {
                    user_id: {
                        type: 'string',
                        example: '1a2b3c4d5e6f',
                    },
                    token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    }
                }
            },
            ValidateResponse: {
                type: 'object',
                properties: {
                    jwt_token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                },
            },
            JWTTokenResponse: {
                type: 'object',
                properties: {
                    user_id: {
                        type: 'string',
                        example: '1a2b3c4d5e6f',
                    },
                    token: {
                        type: 'string',
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    }
                },
            },
            OTPRequiredResponse: {
                type: "object",
                properties: {
                    user_id: { 
                        type: "string", 
                        example: "1a2b3c4d5e6f" 
                    },
                    username: { 
                        type: "string", 
                        example: "johndoe" 
                    }
                }
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        example: 'Operation completed successfully'
                    }
                }
            },
            
            // Error Schemas
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'User not found',
                    }
                },
            },
            ValidationError: {
                type: 'object',
                properties: {
                    error: {
                        type: 'string',
                        example: 'Username and password are required and must be strings.'
                    }
                }
            },
            
            // Entity Schemas
            User: {
                type: "object",
                properties: {
                    id: { 
                        type: "string", 
                        description: "Unique user identifier",
                        example: "1a2b3c4d5e6f" 
                    },
                    username: { 
                        type: "string", 
                        description: "User's unique username",
                        example: "johndoe" 
                    },
                    email: { 
                        type: "string", 
                        format: "email",
                        description: "User's email address",
                        example: "john.doe@example.com" 
                    },
                    gender: { 
                        type: "string", 
                        enum: ["male", "female", "other"],
                        description: "User's gender",
                        example: "male" 
                    },
                    dob: { 
                        type: "string", 
                        format: "date", 
                        description: "User's date of birth",
                        example: "2000-01-01" 
                    },
                    coins: { 
                        type: "number", 
                        description: "User's coin balance",
                        example: 100,
                        minimum: 0 
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Account creation timestamp",
                        example: "2024-01-01T12:00:00Z"
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Last update timestamp",
                        example: "2024-01-01T12:00:00Z"
                    }
                }
            }
        },
        
        // Common response templates
        responses: {
            UnauthorizedError: {
                description: 'Authentication token is missing or invalid',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        },
                        example: {
                            success: false,
                            error: 'Unauthorized',
                            message: 'Authentication token is required',
                            statusCode: 401
                        }
                    }
                }
            },
            ValidationError: {
                description: 'Input validation failed',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ValidationError'
                        }
                    }
                }
            },
            NotFoundError: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        },
                        example: {
                            success: false,
                            error: 'Not Found',
                            message: 'The requested resource was not found',
                            statusCode: 404
                        }
                    }
                }
            },
            InternalServerError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Error'
                        },
                        example: {
                            success: false,
                            error: 'Internal Server Error',
                            message: 'An unexpected error occurred',
                            statusCode: 500
                        }
                    }
                }
            }
        },
        
        // Common parameters
        parameters: {
            UserIdParam: {
                name: 'userId',
                in: 'path',
                required: true,
                schema: {
                    type: 'string'
                },
                description: 'Unique user identifier',
                example: '1a2b3c4d5e6f'
            }
        }
    },
    
    // Global security requirement
    security: [
        {
            bearerAuth: []
        }
    ]
};

const options = {
    swaggerDefinition,
    apis: ["./src/routers/**/*.ts", "./src/controllers/**/*.ts"]
}

const swaggerSpec = swaggerJSDoc(options)

const isDev = serverConfig.nodeEnv === "development"

export const setupSwaggerDocs = (app: Express) => {
    if (isDev) {
        // Swagger UI configuration
        const swaggerUiOptions = {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: "Authentication Service API Docs",
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                docExpansion: 'none',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2
            }
        };
        
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
        
        // JSON endpoint for the spec
        app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
        
        console.log(`📚 Swagger docs available at http://localhost:${serverConfig.port}/api-docs`);
        console.log(`📄 Swagger JSON available at http://localhost:${serverConfig.port}/api-docs.json`);
    }
};

export default swaggerSpec;