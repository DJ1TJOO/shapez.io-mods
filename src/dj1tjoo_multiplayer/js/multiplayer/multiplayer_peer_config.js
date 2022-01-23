export const config = {
    iceServers: [
        {
            urls: "stun:stun.1.google.com:19302",
        },
        {
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
        },
    ],
};
