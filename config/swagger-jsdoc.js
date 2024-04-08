const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

/**
 * swagger-jsdoc - 配置项
 */
module.exports = swaggerJSDoc({
    failOnErrors: true,
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API文档',
            version: '1.0.0',
            description: 'express接口文档',
        },
        externalDocs: {
          description: "swagger参考配置",
          url: "https://editor.swagger.io/",
        },
    },
    apis: [path.resolve(__dirname, './../router/*.js')],
});