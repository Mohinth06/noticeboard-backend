// ============================================
// 8. Modules in Node.js
// Exporting & Importing Modules 
// ============================================

// Using exports Keyword (Overwriting Issue in module.exports avoided by appending)
exports.logMessage = function(msg) {
    console.log(`[CustomModule]: ${msg}`);
};

// Exporting Objects & Functions
const config = { maxRetries: 3, timeout: 5000 };
function printConfig() {
    console.log("Config Details:", config);
}

// module.exports completely mapping the custom exports
module.exports = {
    logMessage: exports.logMessage, // re-exporting to avoid overwrite issue
    printConfig,
    config
};
