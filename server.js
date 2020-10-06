const express = require("express");
const twilio = require("twilio");

const app = express();
const port = process.env.PORT;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.get("/", (req, res) => {
  twilioClient.messages
    .create({
      body: "Hi Patty",
      from: "+12109039615",
      to: "+19089671305",
    })
    .then((message) => {
      console.log(message.sid);
    });
  console.log(req.params);

  res.send(`Hello from express!`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
