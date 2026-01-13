"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const compression = require('compression');
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/api/v1/uploads',
    });
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
        : [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://initiativehub.org',
            'https://www.initiativehub.org',
        ];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            }
            else {
                console.log(`CORS: Allowing origin ${origin} (not in strict list)`);
                callback(null, true);
            }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204,
    });
    app.use(compression());
    app.use((req, res, next) => {
        if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        else if (req.method === 'GET' && !req.url.includes('/auth/') && !req.url.includes('/docs') && !req.url.includes('/api/v1/health')) {
            res.setHeader('Cache-Control', 'public, max-age=300');
        }
        next();
    });
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false,
    }));
    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Operations Control Panel API')
        .setDescription('REST API for the Operations Control Panel')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .addTag('Roles', 'Role management endpoints')
        .addTag('Dashboard', 'Dashboard module')
        .addTag('Administration', 'Administration module')
        .addTag('Operations', 'Operations module')
        .addTag('Production', 'Production tracking module')
        .addTag('Costing', 'Costing module')
        .addTag('Inventory', 'Inventory & warehousing module')
        .addTag('Assets', 'Assets & maintenance module')
        .addTag('Logistics', 'Logistics & transport module')
        .addTag('Customers', 'Customers & sales module')
        .addTag('Reporting', 'Reporting & analytics module')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map