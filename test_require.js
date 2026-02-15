try {
    console.log('Current directory:', process.cwd());
    const fs = require('fs');
    console.log('controllers dir exists:', fs.existsSync('./controllers'));
    console.log('user.controller.js exists:', fs.existsSync('./controllers/user.controller.js'));

    const controller = require('./controllers/user.controller');
    console.log('Require Success');
} catch (e) {
    console.error('Require Error:', e);
}
