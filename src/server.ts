import express from "express";
import "./database.js";

const app = express();

app.get("/", (req, res) => {
  res.send("Salut");
});

app.listen(3000);