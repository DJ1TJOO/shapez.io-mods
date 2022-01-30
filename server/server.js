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
    let host = false;
    socket.emit("id", socket.id);

    //createRoom function
    socket.on("createRoom", room => {
        socket.join(room);
        host = true;
    });

    //destroyRoom function
    socket.on("destroyRoom", roomId => {
        if (!host) {
            return socket.emit("error", { error: 403, errorMessage: "Forbidden" });
        }
        const room = [...io.sockets.adapter.rooms.get(roomId)];
        if (!room) {
            return socket.emit("error", { error: 404, errorMessage: "Room not found" });
        }

        for (let i = 0; i < room.length; i++) {
            io.sockets.sockets.get(room[i]).disconnect(true);
        }
    });

    //kickPlayer function
    socket.on("kick", socketId => {
        if (!host) {
            return socket.emit("error", { error: 403, errorMessage: "Forbidden" });
        }

        const socket = io.sockets.sockets.get(socketId);
        if (!socket) {
            return socket.emit("error", { error: 404, errorMessage: "Room not found" });
        }

        socket.disconnect(true);
    });

    //joinRoom function
    socket.on("joinRoom", (room, id) => {
        host = false;
        if ([...io.sockets.adapter.rooms.keys()].indexOf(room) >= 0) {
            socket.join(room);
            socket.to(room).emit("createPeer", { receiverId: id, room: room });
        } else socket.emit("error", { error: 404, errorMessage: "Room not found" });
    });

    socket.on("signal", data => {
        io.to(data.receiverId).emit("signal", {
            senderId: data.senderId,
            receiverId: data.receiverId,
            signal: data.signal,
        });
    });

    //close the connection
    socket.on("disconnect", function () {
        console.log("Disconnecting user");
    });
});

server.listen(8888, () => {
    console.log(`go to ${secure ? "wss" : "ws"}://localhost:8888`);
});
