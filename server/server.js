const secure = false;
let server;

if (secure) {
    const https = require("https");
    const fs = require("fs");

    const options = {
        key: fs.readFileSync("key.pem"),
        cert: fs.readFileSync("cert.pem"),
    };

    server = https.createServer(options, (req, res) => {});
} else {
    const http = require("http");
    server = http.createServer((req, res) => {});
}

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", function (socket) {
    console.log("User connected");
    socket.emit("id", socket.id);

    //createRoom function
    socket.on("createRoom", room => {
        socket.join(room);
    });

    //joinRoom function
    socket.on("joinRoom", (room, id) => {
        if ([...io.sockets.adapter.rooms.keys()].indexOf(room) >= 0) {
            socket.join(room);
            socket.to(room).emit("createPeer", { receiverId: id, room: room });
        } else socket.emit("error", { error: 404, errorMessage: "Room not found" });
    });

    socket.on("signal", data => {
        io.to(data.receiverId).emit("signal", {
            peerId: data.peerId,
            senderId: data.senderId,
            receiverId: data.receiverId,
            signal: data.signal,
        });
    });

    //close the connection
    socket.on("close", function () {
        console.log("Disconnecting user");
    });
});

server.listen(8889, () => {
    console.log(`go to ${secure ? "wss" : "ws"}://localhost:8889`);
});
