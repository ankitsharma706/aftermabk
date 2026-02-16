const path = require('path');

module.exports = {
    PORT: process.env.PORT || 5000,
    CPP_DIR: path.join(__dirname, '../cpp'),
    TIMEOUT: 5000, // 5 seconds execution limit
};
