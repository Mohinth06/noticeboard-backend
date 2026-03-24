// ============================================
// 1. JavaScript Basics & Data Types
// Variable Declaration
// ============================================
var systemName = "Department Notice Board"; // Global scope var
let noticeCount = 0; // Block scope let
const MAX_NOTICES = 100; // Constant

// ============================================
// localStorage — Browser Storage API
// WHY: Persist user preferences across page reloads
//      without needing a server or database.
// HOW: localStorage stores key-value strings in browser.
//      Data survives refresh but not private/incognito wipe.
// ============================================
const LocalStorageDemo = {
    // Store data — setItem(key, value)
    saveUsername(name) {
        localStorage.setItem("nb_username", name);           // setItem
        console.log("[localStorage] Saved username:", name);
    },

    // Get data — getItem(key)
    loadUsername() {
        let name = localStorage.getItem("nb_username");      // getItem
        console.log("[localStorage] Loaded username:", name);
        return name || "Guest";
    },

    // Store user's last search term
    saveSearchTerm(term) {
        localStorage.setItem("nb_lastSearch", term);
    },

    // Load last search term to pre-fill search box
    loadSearchTerm() {
        return localStorage.getItem("nb_lastSearch") || "";  // getItem
    },

    // Remove a single key — removeItem(key)
    clearSearch() {
        localStorage.removeItem("nb_lastSearch");            // removeItem
        console.log("[localStorage] Search term cleared.");
    },

    // Clear everything stored by this app — clear()
    clearAll() {
        localStorage.removeItem("nb_username");
        localStorage.removeItem("nb_lastSearch");
        console.log("[localStorage] All app data cleared.");
    }
};

// Data Types & typeof operator
let isOnline = true;
let boardInfo = { version: 1.0, author: "Admin" };
console.log(`Type of systemName: ${typeof systemName}`); // string
console.log(`Type of isOnline: ${typeof isOnline}`);     // boolean
console.log(`Type of boardInfo: ${typeof boardInfo}`);   // object

// ============================================
// 13. Advanced JavaScript Concepts (Classes, Objects)
// ============================================
class Notice {
    // Constructors
    constructor(id, title, content, date, author, type) {
        this.id = id;
        this.title = title;
        this._content = content; // Private convention for getter
        this.date = date;
        this.author = author;
        this.type = type;
    }

    // Getters & Setters
    get content() {
        return this._content.toUpperCase();
    }
    set content(newContent) {
        if (newContent.length > 5) this._content = newContent;
    }

    // Function Definition, Return Statement
    getFormattedDate() {
        return new Date(this.date).toDateString();
    }
}

// ============================================
// 4 & 5. DOM & Content Manipulation
// ============================================
// Global variables referencing DOM
const noticeList = document.getElementById("notice-list"); // getElementById
const timerBox = document.querySelector("#timer-box");     // querySelector

// Function with Arguments
function createNoticeCard(noticeObj, badgeColorClass) {
    // 8. DOM Element Creation & Manipulation
    let card = document.createElement("div"); // createElement
    // setAttribute
    card.setAttribute("class", "notice-card");
    card.setAttribute("data-id", noticeObj.id);

    // Using innerHTML vs textContent
    card.innerHTML = `
        <span class="badge ${badgeColorClass}">${noticeObj.type}</span>
        <h3>${noticeObj.title}</h3>
        <p class="content-text"></p>
        <small><strong>${noticeObj.author}</strong> - ${noticeObj.getFormattedDate()}</small>
        <button class="delete-btn" onclick="removeNotice(event)">X</button>
    `;

    // textContent (security against XSS)
    let paragraph = card.querySelector(".content-text");
    paragraph.textContent = noticeObj.content; // textContent

    // insertAdjacentElement (DOM Traversal equivalent)
    noticeList.insertAdjacentElement("beforeend", card);
    noticeCount++;
}

// 4. Document Object Model - getElementsByClassName & querySelectorAll
function highlightUrgentTasks() {
    let badges = document.getElementsByClassName("urgent"); // getElementsByClassName
    for (let i = 0; i < badges.length; i++) {
        badges[i].style.border = "2px solid red";
    }

    let allCards = document.querySelectorAll(".notice-card"); // querySelectorAll
    console.log(`Currently there are ${allCards.length} cards on the board.`);
}

// ============================================
// 17. XML Parsing in JavaScript
// ============================================
function parseXMLNotices(xmlString) {
    // DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml"); // parseFromString

    // Accessing XML Data & Counting Elements
    const notices = xmlDoc.getElementsByTagName("notice"); // getElementsByTagName
    console.log(`Found ${notices.length} XML notices.`);

    for (let i = 0; i < notices.length; i++) {
        let node = notices[i];
        let id = node.getAttribute("id");
        let type = node.getAttribute("type");

        // DOM Traversal (Child Elements)
        let title = node.getElementsByTagName("title")[0].childNodes[0].nodeValue; // childNodes
        let content = node.getElementsByTagName("content")[0].firstChild.nodeValue; // firstChild
        let date = node.getElementsByTagName("date")[0].textContent;
        let author = node.getElementsByTagName("author")[0].textContent;

        let obj = new Notice(id, title, content, date, author, type);
        createNoticeCard(obj, "urgent");
    }
}

// ============================================
// 18. Embedding XML in HTML (Fetching the element)
// ============================================
function loadEmbeddedXML() {
    let scriptTag = document.getElementById("embedded-xml");
    if (scriptTag) {
        let xmlContent = scriptTag.textContent;
        parseXMLNotices(xmlContent);
    }
}

// Fetch externally served XML
async function fetchServerXML() {
    try {
        let response = await fetch("/api/notices.xml");
        let xmlText = await response.text();
        parseXMLNotices(xmlText);
    } catch (e) {
        console.error("XML Fetch Error", e);
    }
}

// Fetch JSON (JASON representation)
async function fetchJSONConfig() {
    try {
        let response = await fetch("/api/notices");
        let jsonData = await response.json();

        jsonData.forEach(data => {
            let n = new Notice(data.id, data.title, data.content, data.date, data.author, data.type);
            createNoticeCard(n, "");
        });
    } catch (e) {
        console.error("JSON Fetch Error", e);
    }
}

// ============================================
// 9. Removing Elements & 11. DOM Traversal
// ============================================
// Inline onclick Handler
function removeNotice(event) {
    // event Object, event.target
    let targetElement = event.target;

    // Traversing up to Parent Element (parentNode, parentElement)
    let card = targetElement.parentNode; // parentNode

    // Siblings checks (previousElementSibling, nextSibling)
    let sibling = card.previousElementSibling;
    if (sibling) console.log(`Deleted notice that was after: ${sibling.querySelector('h3').textContent}`);
    else console.log(`Deleted the very first notice. Next one is:`, card.nextSibling);

    // .remove()
    card.remove();
}

// ============================================
// 10. Advanced Event Handling & Styling via Events
// ============================================
document.body.addEventListener("click", function (event) {
    // 12. Multiple Events on Same Element (Also testing event listen)
    // Styling via Events dynamically
    if (event.target.tagName === 'H3') {
        event.target.style.color = "#d97706";
        // Alert
        alert("You clicked a headline: " + event.target.textContent);
    }
});

// onkeyup event via JS Event Listeners hook instead of inline, fulfills Advanced Event requirement combinations
document.getElementById("seconds-input").addEventListener("keyup", function (e) {
    console.log("onkeyup executed:", e.target.value);
});

function changeHoverText(event) {
    event.target.textContent = "Hovered!";
    event.target.style.background = "#2563eb";
}
function resetHoverText(event) {
    event.target.textContent = "Hover Me";
    event.target.style.background = "#10b981";
}

// ============================================
// 14. Timing Functions
// ============================================
// Digital Clock via setInterval
function startDigitalClock() {
    let clockDiv = document.getElementById("clock");
    setInterval(() => {
        let now = new Date();
        clockDiv.textContent = now.toLocaleTimeString();
    }, 1000);
}

// Countdown Timer Demo
let countdownTimer;
function startCountdown() {
    let input = document.getElementById("seconds-input").value;

    // 7. Type Conversion (Converting Text to Number)
    let time = Number(input);

    if (isNaN(time) || time <= 0) {
        alert("Please enter a valid positive number");
        return;
    }

    timerBox.textContent = `Time remaining: ${time}s`;

    if (countdownTimer) clearInterval(countdownTimer); // reset previous

    countdownTimer = setInterval(() => {
        time--;
        timerBox.textContent = `Time remaining: ${time}s`;
        if (time <= 0) {
            clearInterval(countdownTimer);
            timerBox.textContent = "Time's up!";

            // setTimeout example
            setTimeout(() => {
                timerBox.textContent = "Enter seconds and click start.";
            }, 3000);
        }
    }, 1000);
}

// Onload Handler via Body
function initializeBoard() {
    console.log("Board Initializing...");
    startDigitalClock();

    // ── localStorage: Load saved user preferences ──
    let savedUser = LocalStorageDemo.loadUsername();
    console.log(`[localStorage] Welcome back, ${savedUser}!`);

    let savedSearch = LocalStorageDemo.loadSearchTerm();
    if (savedSearch) {
        console.log(`[localStorage] Restoring last search: "${savedSearch}"`);
    }

    // Save username if not already set (first visit demo)
    if (!localStorage.getItem("nb_username")) {
        LocalStorageDemo.saveUsername("Notice User");
    }

    // Auto-save search term whenever user types in seconds-input
    // (reusing existing input for demo; in real app would be a search box)
    document.getElementById("seconds-input").addEventListener("input", function (e) {
        LocalStorageDemo.saveSearchTerm(e.target.value);
    });

    // Load embedded XML then fetch external
    loadEmbeddedXML();
    fetchServerXML().then(() => {
        fetchJSONConfig().then(() => {
            highlightUrgentTasks();

            // lastChild usage
            let lastNotice = noticeList.lastChild;
            if (lastNotice) console.log("Last item appended.", lastNotice);
        });
    });

    // insertAdjacentHTML Demo
    let container = document.querySelector(".container");
    container.insertAdjacentHTML("beforeend", "<hr><p><em>System fully initialized.</em></p>");
}
