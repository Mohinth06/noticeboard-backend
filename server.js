// ============================================
// 1. MERN & MEAN Basics Overview - Backend
// Node.js Module Initialization and Setup
// ============================================
require("dotenv").config(); // Load .env variables (PORT, MONGODB_URI)
const express = require("express"); // Importing Express
const http = require("http");       // http Module
const https = require("https");     // https Module
const fs = require("fs");           // File System (fs Module)
const path = require("path");
const EventEmitter = require("events"); // Events in Node.js
const cors = require("cors");
const _ = require("lodash"); // Lodash package
const mongoose = require("mongoose"); // MongoDB Mongoose Requirement

// ============================================
// Mongoose MongoDB Setup (Connecting & Schema)
// ============================================
// Uses MONGODB_URI env var (Atlas in production, local in dev)
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noticeBoardDB';
mongoose.connect(MONGO_URI).then(() => {
    logMessage("Connected to MongoDB successfully!");
}).catch(err => {
    logMessage("MongoDB connection failed (Fallback to JSON mock allowed if no DB running): " + err);
});

// Notice Schema Design for Mongo
const noticeSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: String,
    content: String,
    date: String,
    author: String,
    type: String
});
const Notice = mongoose.model('Notice', noticeSchema);

// Importing Entire Module & Destructuring Specific Functions
const { logMessage, printConfig } = require("./custom_module"); 

// 6. Global Objects (Using global in node)
global.appName = "Smart Notice Board Server";
logMessage("Started " + global.appName);

// ============================================
// 2. Events in Node.js
// ============================================
class ActionEmitter extends EventEmitter {}
const myEmitter = new ActionEmitter();

// Creating Event Listener (on)
myEmitter.on("newNotice", (noticeId) => {
    console.log(`[EVENT TRIGGERED] A new notice was created with ID: ${noticeId}`);
    
    // File operations (appendFile)
    fs.appendFile("actions.log", `Notice ${noticeId} added at ${new Date().toISOString()}\n`, (err) => {
        if (err) console.error("Could not write to log");
    });
});

// ============================================
// 2b. path Module — File Path Utilities
// WHY: Handles file paths safely across OS (Windows/Linux)
// HOW: path methods parse and build paths from parts
// ============================================
console.log("[PATH] basename :", path.basename(__filename));          // server.js
console.log("[PATH] dirname  :", path.dirname(__filename));           // ...NoticeBoard
console.log("[PATH] extname  :", path.extname(__filename));           // .js
console.log("[PATH] join     :", path.join(__dirname, "views", "dynamic.ejs")); // joined path
console.log("[PATH] resolve  :", path.resolve("data.json"));          // absolute path
console.log("[PATH] parse    :", path.parse(__filename));             // { root, dir, base, ext, name }
console.log("[PATH] normalize:", path.normalize("/foo//bar/../baz")); // /foo/baz

// ============================================
// 3. File System (fs Module) & Streams
// ============================================
// File Path Information (__filename, __dirname)
console.log("Current Directory:", __dirname);
console.log("Current File:", __filename);

try {
    // Reading Directory Contents, Checking if Directory/File
    const files = fs.readdirSync(__dirname);
    console.log(`[DIR READ] Found ${files.length} items in root directory.`);
    
    const stats = fs.statSync("data.json");
    console.log(`[FILE STAT] data.json size: ${stats.size} bytes`);
    
    // Streams in Node.js
    // Read Stream & Write Stream 
    console.log("[STREAMS] Creating read and write streams for logging...");
    const readStream = fs.createReadStream("data.json", { encoding: "utf8" });
    const writeStream = fs.createWriteStream("streamed_data_backup.json");
    // Piping stream simply
    readStream.pipe(writeStream);
    
    // Filesystem manipulation operations logic demonstrations (mkdir, rmdir, truncate, unlink, rename, watchFile)
    const demoDirPath = path.join(__dirname, "demo_dir");
    
    // Check Existence
    if (!fs.existsSync(demoDirPath)) {
        fs.mkdir(demoDirPath, (err) => { // Creating Directory (mkdir)
            if(!err) {
                fs.writeFile(path.join(demoDirPath, "temp.txt"), "Hello", () => {
                   // Rename files
                   fs.rename(path.join(demoDirPath, "temp.txt"), path.join(demoDirPath, "renamed.txt"), () => {
                       // Watch Files
                       fs.watchFile(path.join(demoDirPath, "renamed.txt"), (curr, prev) => {
                           console.log("File changed!");
                       });
                       
                       // Truncate File
                       fs.truncate(path.join(demoDirPath, "renamed.txt"), 2, () => {
                           // Deleting file
                           fs.unlink(path.join(demoDirPath, "renamed.txt"), () => { // unlink
                               fs.unwatchFile(path.join(demoDirPath, "renamed.txt"));
                               // Removing Directory
                               fs.rmdir(demoDirPath, () => console.log("Demo directory cleaned up.")); // rmdir
                           });
                       });
                   });
                });
            }
        });
    }

} catch(err) {
    console.log("Initial file checks skipped.", err);
}

// ============================================
// 4. Timing Functions (setTimeout, setInterval)
// ============================================
let count = 0;
// setInterval with Anonymous Function
const timer = setInterval(() => {
    count++;
    if(count > 1) { // Stop Interval to prevent endless logging loop
        clearInterval(timer); 
    }
}, 5000);

// ============================================
// 5. Express Setup & Server Creation
// ============================================
const app = express();

// Dynamic CORS — allows local dev + deployed Vercel frontends
const allowedOrigins = [
    'http://localhost:5173',  // React dev
    'http://localhost:4200',  // Angular dev
    process.env.REACT_URL,    // deployed React on Vercel
    process.env.ANGULAR_URL,  // deployed Angular on Vercel
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('CORS: Origin not allowed: ' + origin));
    },
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    credentials: true
}));

app.use(express.json()); // Built-in middleware body parser
app.use(express.urlencoded({ extended: true }));

// Setting View Engine for Dynamic Pages (.ejs)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware (Serving HTML Files via static)
// Using __dirname as Root
app.use(express.static(path.join(__dirname, "public")));
app.use('/data', express.static(__dirname)); // To serve xml and json directly for frontend

// ============================================
// Express Router — Mounting modular route file
// WHY: Keeps server.js clean; all /api/* routes
//      are defined in routes/noticesRouter.js
// HOW: app.use('/api', router) prefixes all router
//      routes with /api automatically
// ============================================
const noticesRouter = require("./routes/noticesRouter");
app.use("/api", noticesRouter);

// ============================================
// 6. Handling Requests & Sending Responses (Express)
// ============================================
// Default Route to Main Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html")); // Absolute Path
});

// ============================================
// 7. Dynamic Pages & View Engines (.ejs)
// NOTE: /api/* routes are now handled by noticesRouter
// ============================================
app.get("/dynamic", (req, res) => {
    res.render("dynamic", { serverTime: new Date().toString(), title: "Department EJS Page" });
});

// Redirection
app.get("/old-board", (req, res) => {
    // 3xx -> Redirection
    res.redirect("/dynamic");
});

// ============================================
// 8. Basic Idea of Routing (Switch statement, http Module equivalent)
// Creating Server using standard http module just to demonstrate URL-based routing purely.
// HTTP Request & Response, Structure of Request/Response
const rawServer = http.createServer((req, res) => {
    console.log(`[RAW SERVER] Request: Method=${req.method}, URL=${req.url}`); // Logging Requests
    
    // URL-based Routing via Switch
    switch(req.url) {
        case '/ping':
            res.writeHead(200, { "Content-Type": "text/plain" }); // resp.setHeader equivalent
            res.write("pong"); // resp.write
            res.end(); // resp.end
            break;
        case '/api/notices.xml':
            // Read and serve XML
            fs.readFile("data.xml", "utf8", (err, xmlData) => {
                if(err) {
                    res.writeHead(500); 
                    return res.end("Error");
                }
                res.writeHead(200, { "Content-Type": "text/xml" });
                res.write(xmlData);
                res.end();
            });
            break;
        default:
            // 4xx -> Client Error (Default Route / 404)
            res.writeHead(404, { "Content-Type": "text/html" });
            res.write("<h1>404 Not Found in Raw Server</h1>");
            res.end();
            break;
    }
});
rawServer.listen(3001, () => {
    console.log("Raw HTTP Server listening on port 3001 (For XML API Demo)");
});

// ============================================
// Middleware (Default Route for Express) - Executed Last!
// Handling Unknown Routes (404 Page)
// ============================================
app.use((req, res, next) => {
    res.status(404).send("<h1>404 Page Not Found</h1><p>Express Middleware Fallback.</p>");
});

// ============================================
// 9. Node App Startup & HTTPS Notes
// ============================================
const PORT = process.env.PORT || 3000;

// Creating Server using Express app.listen()
app.listen(PORT, () => {
    console.log(`Main Express Server listening on http://localhost:${PORT}`);
});

/* 
// Note on SSL Certificate Creation and HTTPS Server setup as requested:
// OpenSSL Command to generate keys:
// > openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"
const httpsOptions = {
    // key: fs.readFileSync('key.pem'),
    // cert: fs.readFileSync('cert.pem')
};
// https.createServer(httpsOptions, app).listen(443);
*/
