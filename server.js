const express = require("express");
const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.send(`Hello from express! ${process.env.TWILIO_ACCOUNT_SID}`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
