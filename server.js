const express = require("express");
const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send(`Hello from express! ${process.env.BLAHBLAHBLAH}`);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
