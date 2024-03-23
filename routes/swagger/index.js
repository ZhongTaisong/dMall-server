const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const fs = require("fs");
const path = require("path");
const YAML = require('yaml');

const file  = fs.readFileSync(path.resolve(__dirname, './swagger.yaml'), 'utf8')
const swaggerDocument = YAML.parse(file)

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;