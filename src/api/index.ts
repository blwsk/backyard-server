import dotenv from "dotenv";
import express from "express";
import { auth } from "./lib/auth";
import * as item from "./item";
import * as clip from "./clip";
import { applyApollo } from "./graphql";

dotenv.config();

const { PORT } = process.env;

const app = express();

app.use(express.json());

app.use(auth);

applyApollo(app);

/**
 * ITEMS
 */
app.post("/api/item", item.createItem);

app.get("/api/item/:itemId", item.getItemById);

app.get("/api/items", item.getItemsPaginated);

app.delete("/api/item/:itemId", item.deleteItemById);

app.get("/api/item/:itemId/clips", item.getClipsForItem);

/**
 * CLIPS
 */
app.post("/api/clip", clip.createClip);

app.get("/api/clip/:clipId", clip.getClipById);

app.delete("/api/clip/:clipId", clip.deleteClipById);

export const listen = () => {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
  });
};
