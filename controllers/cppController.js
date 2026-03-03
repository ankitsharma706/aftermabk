const cppService = require('../services/cppService');

const compile = async (req, res) => {
    try {
        const { fileName } = req.body;
        const result = await cppService.compileCpp(fileName);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

const run = async (req, res) => {
    try {
        const { fileName } = req.body;
        const result = await cppService.runCpp(fileName);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
};

module.exports = {
    compile,
    run
};
