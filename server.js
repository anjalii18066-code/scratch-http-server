const http = require("http");
const WebSocket = require("ws");
const os = require("os");

let clients = [];
let latestStage = "";

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "localhost";
}

const localIP = getLocalIP();

const server = http.createServer((req, res) => {

    console.log("Request received:", req.method, req.url);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = req.url;

// ✅ ADD THIS HERE 👇
if (url === "/server-info") {

    const data = {
        internalURL: "https://scratch-http-server.vercel.app/stage",
        externalURL: "https://scratch-http-server.vercel.app"
    };

    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify(data));

    return;
}

    // ✅ POST stage image
    if (req.method === "POST" && url === "/stage") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const data = JSON.parse(body);
            latestStage = data.image;

            console.log("Stage updated");

            res.writeHead(200, {"Content-Type":"text/plain"});
            res.end("ok");
        });

        return;
    }

    // ✅ GET latest image
    if (url.startsWith("/latest-image")) {

        if (!latestStage) {
            res.writeHead(404);
            res.end();
            return;
        }

        res.writeHead(200, { "Content-Type": "image/jpeg" });

        const base64Data = latestStage.replace(/^data:image\/jpeg;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        res.end(buffer);
        return;
    }

    // ✅ GET stage page
    if (req.method === "GET" && url === "/stage") {

        res.writeHead(200, {"Content-Type":"text/html"});

        res.end(`
        <html>
        <body>
        <h2>Scratch Live Stage</h2>

        <img id="stage" width="480"/>

        <script>
        setInterval(() => {
            document.getElementById("stage").src = "/latest-image?" + Date.now();
        }, 500);
        </script>

        </body>
        </html>
        `);

        return;
    }

});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Scratch connected");
    clients.push(ws);
});

server.listen(42001, () => {
    console.log("Server running at http://127.0.0.1:42001");
});