const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

const compileCpp = (fileName) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(config.CPP_DIR, fileName);
        const outputName = path.basename(fileName, path.extname(fileName));
        const outputPath = path.join(config.CPP_DIR, outputName);

        // Check if source file exists
        if (!fs.existsSync(filePath)) {
            return reject({ error: 'Source file not found', details: filePath });
        }

        const command = `g++ "${filePath}" -o "${outputPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject({ error: 'Compilation failed', details: stderr });
            }
            resolve({ message: 'Compilation successful', outputFile: outputName });
        });
    });
};

const runCpp = (fileName) => {
    return new Promise((resolve, reject) => {
        const outputName = path.basename(fileName, path.extname(fileName));
        // We assume the binary is in the same directory as source
        const binaryPath = path.join(config.CPP_DIR, outputName);

        if (!fs.existsSync(binaryPath)) {
            return reject({ error: 'Compiled binary not found. Please compile first.' });
        }

        const child = spawn(binaryPath);

        let output = '';
        let errorOutput = '';

        const timeout = setTimeout(() => {
            child.kill();
            reject({ error: 'Time Limit Exceeded', details: `Execution timed out after ${config.TIMEOUT}ms` });
        }, config.TIMEOUT);

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
                resolve({
                    output: output,
                    error: errorOutput || `Process exited with code ${code}`
                });
            } else {
                resolve({ output: output });
            }
        });

        child.on('error', (err) => {
            clearTimeout(timeout);
            reject({ error: 'Execution failed', details: err.message });
        });
    });
};

module.exports = {
    compileCpp,
    runCpp
};
