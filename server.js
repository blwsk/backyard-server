const express = require("express");
const cron = require("node-cron");

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send(`Hello from express!`);
});

cron.schedule("* * * * *", () => {
  console.log("running a task every minute");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
