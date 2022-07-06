const express = require("express");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
require("dotenv").config();


// create express app
const app = express();


// creating middleware
const nocache = (_, resp, next) => {
    resp.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    resp.header("Expires", "-1");
    resp.header("Pragma", "no-cache");
    resp.header("Access-Control-Allow-Origin", "*");
    next();
};


// generate token handler...
// note : every express request handler has 3 arguments (req, resp, next) ... "req" has all the request data, "resp" has all methods to return it to the user, and "next" is a function to call to continue the request processing
const generateRTCToken = (req, resp) => {
    // check if the request is valid and has params and if it's not it will return an error
    !req.params && resp.status(500).json({ error: "please add the required params" });
    // get channelName from the request params
    const channelName = req.params.channel;
    if (!channelName) {
        // if the channelName is not valid it will return an error
        return resp.status(500).json({ error: "channel is required" });
    }
    // get the user id from the request params
    let uid = req.params.uid;
    if (!uid || uid === "") {
        return resp.status(500).json({ error: "uid is required" });
    }
    // get role
    let role;
    if (req.params.role === "publisher") {
        role = RtcRole.PUBLISHER;
    } else if (req.params.role === "audience") {
        role = RtcRole.SUBSCRIBER;
    } else {
        return resp.status(500).json({ error: "role is incorrect" });
    }

    //
    let expireTime = req.query.expiry;
    if (!expireTime || expireTime === "") {
        expireTime = 3600;
    } else {
        expireTime = parseInt(expireTime, 10);
    }
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    //

    let token;
    if (req.params.tokentype === "userAccount") {
        token = RtcTokenBuilder.buildTokenWithAccount(
            process.env.APP_ID,
            process.env.APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpireTime
        );
    } else if (req.params.tokentype === "uid") {
        token = RtcTokenBuilder.buildTokenWithUid(
            process.env.APP_ID,
            process.env.APP_CERTIFICATE,
            channelName,
            uid,
            role,
            privilegeExpireTime
        );
    } else {
        return resp.status(500).json({ error: "token type is invalid" });
    }

    return resp.json({ rtcToken: token });
};


// main app request url ... eg: if you request http://localhost:8080/ it will return "Hello World" as a string ...
app.get("/", (req, res) => {
    res.send("استشرني!");
});


// generate token api handler... when you request http://localhost:8080/rtc/:channel/:uid/:role/:tokentype/:expiry it call the "generateRTCToken" function and it will return a token if avery arguments is correct
// note : nocache is a middleware that prevent the browser from caching the response
app.get("/rtc/:channel/:role/:tokentype/:uid", nocache, generateRTCToken);


// enable app to listening to specific port on the server and it make the app up and running
app.listen(process.env.PORT, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
});