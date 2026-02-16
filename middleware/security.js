const validateFileName = (req, res, next) => {
    const { fileName } = req.body;
    if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
    }
    // Allow alphanumeric, underscores, and dots. Prevent directory traversal.
    const fileRegex = /^[a-zA-Z0-9_]+\.cpp$/;
    if (!fileRegex.test(fileName)) {
        return res
            .status(400)
            .json({
                error:
                    "Invalid file name. Only alphanumeric characters and underscores are allowed, and it must end with .cpp",
            });
    }
    next();
};

module.exports = {
    validateFileName,
};
