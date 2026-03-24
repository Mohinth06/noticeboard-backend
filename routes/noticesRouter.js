// ============================================
// Express Router — routes/noticesRouter.js
// WHY: Splits routes into separate files to keep
//      server.js clean and modular.
// HOW: Express Router groups related routes.
//      Mounted in server.js with app.use('/api', noticesRouter)
// ============================================
const express  = require("express");
const fs       = require("fs");
const path     = require("path");
const mongoose = require("mongoose");

const router = express.Router(); // Create Router instance

// ============================================
// path Module Demo (inside router)
// WHY: path helps handle file paths cross-platform
// HOW: basename = filename, dirname = folder, extname = extension
// ============================================
console.log("[PATH MODULE] basename :", path.basename(__filename));   // noticesRouter.js
console.log("[PATH MODULE] dirname  :", path.dirname(__filename));    // ...routes
console.log("[PATH MODULE] extname  :", path.extname(__filename));    // .js
console.log("[PATH MODULE] join     :", path.join(__dirname, "..", "data.json")); // absolute path to data.json
console.log("[PATH MODULE] resolve  :", path.resolve("data.json"));  // resolve to absolute

// ============================================
// Notice Schema (shared — re-declared for Router file scope)
// ============================================
const noticeSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    title: String,
    content: String,
    date: String,
    author: String,
    type: String
});
// Use existing model if already compiled, else create
const Notice = mongoose.models.Notice || mongoose.model("Notice", noticeSchema);

// Author Schema — used for $lookup (MongoDB join demo)
const authorSchema = new mongoose.Schema({
    name: String,
    department: String,
    email: String
});
const Author = mongoose.models.Author || mongoose.model("Author", authorSchema);

// ============================================
// app.all() — Runs for ALL HTTP methods
// WHY: Useful for logging, auth checks, or CORS
//      on a specific route regardless of method.
// HOW: Placed before specific routes to act as
//      per-route middleware
// ============================================
router.all("/notices", (req, res, next) => {
    console.log(`[app.all] /api/notices hit → Method: ${req.method} at ${new Date().toISOString()}`);
    next(); // Pass control to the next matching handler
});

// ============================================
// GET /api/notices — Fetch all notices
// ============================================
router.get("/notices", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            fs.readFile(path.join(__dirname, "..", "data.json"), "utf8", (err, data) => {
                if (!err && data) res.status(200).json(JSON.parse(data));
                else res.status(200).json([]);
            });
            return;
        }
        const notices = await Notice.find();
        if (notices.length === 0) {
            fs.readFile(path.join(__dirname, "..", "data.json"), "utf8", async (err, data) => {
                if (!err && data) {
                    let parsed = JSON.parse(data);
                    await Notice.insertMany(parsed);
                    res.status(200).json(parsed);
                } else {
                    res.status(200).json([]);
                }
            });
            return;
        }
        res.setHeader("Content-Type", "application/json");
        res.status(200).json(notices);
    } catch (error) {
        console.error("MongoDB GET Error:", error);
        res.status(500).send("Database Server Error");
    }
});

// ============================================
// POST /api/notices — Add a new notice
// ============================================
router.post("/notices", async (req, res) => {
    try {
        let newNoticeObj = {
            id: Date.now(),
            title:   req.body.title   || "Untitled",
            content: req.body.content || "No Content",
            date:    new Date().toISOString().split("T")[0],
            author:  req.body.author  || "Guest",
            type:    req.body.type    || "General"
        };
        if (mongoose.connection.readyState === 1) {
            let newNotice = new Notice(newNoticeObj);
            await newNotice.save();
        }
        fs.readFile(path.join(__dirname, "..", "data.json"), "utf8", (err, data) => {
            if (!err) {
                let notices = JSON.parse(data);
                notices.push(newNoticeObj);
                fs.writeFile(path.join(__dirname, "..", "data.json"), JSON.stringify(notices, null, 2), "utf8", () => {});
            }
        });
        res.status(201).json(newNoticeObj);
    } catch (error) {
        console.error("MongoDB POST Error:", error);
        res.status(500).send("Database Error");
    }
});

// ============================================
// GET /api/dynamic — EJS data as JSON
// ============================================
router.get("/dynamic", (req, res) => {
    res.json({
        title: "Department EJS Page",
        serverTime: new Date().toString(),
        description: "This data is rendered server-side by Express + EJS, and also exposed as a JSON API for React and Angular to consume."
    });
});

// ============================================
// GET /api/notices/with-authors — MongoDB $lookup
// WHY: $lookup performs a LEFT JOIN between two
//      collections (like SQL JOIN).
// HOW: Joins 'notices' with 'authors' on author name.
//      Returns each notice enriched with author details.
// ============================================
router.get("/notices/with-authors", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "MongoDB not connected. $lookup requires MongoDB." });
        }

        // Seed some demo authors if none exist
        const authorCount = await Author.countDocuments();
        if (authorCount === 0) {
            await Author.insertMany([
                { name: "Admin",   department: "IT",       email: "admin@notice.com" },
                { name: "Dean",    department: "Academic", email: "dean@notice.com"  },
                { name: "HOD",     department: "CSE",      email: "hod@notice.com"   },
                { name: "Guest",   department: "Visitor",  email: "guest@notice.com" }
            ]);
            console.log("[MongoDB] Seeded demo authors for $lookup demo.");
        }

        // $lookup — MongoDB Aggregation Join
        // Joins 'notices' collection with 'authors' collection
        // matching notice.author == author.name
        const result = await Notice.aggregate([
            {
                $lookup: {
                    from:         "authors",      // collection to join
                    localField:   "author",       // field in notices
                    foreignField: "name",         // field in authors
                    as:           "author_details" // output array field
                }
            },
            {
                // Flatten author_details array → single object
                $addFields: {
                    author_info: { $arrayElemAt: ["$author_details", 0] }
                }
            },
            {
                // Remove raw array, keep clean output
                $project: { author_details: 0 }
            }
        ]);

        res.status(200).json(result);
    } catch (error) {
        console.error("$lookup Error:", error);
        res.status(500).send("Aggregation Error");
    }
});

module.exports = router;
