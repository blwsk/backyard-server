import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { auth } from "./lib/auth";
import * as item from "./item";
import * as clip from "./clip";
import * as email from "./email";
import { applyApollo } from "./graphql";

dotenv.config();

const { PORT } = process.env;

const app = express();

app.use(express.json());

// app.use(
//   (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     console.log("hey", req.body);
//     next();
//   }
// );

/**
 * GRAPHQL
 */
app.use("/graphql", auth);

applyApollo(app);

/**
 * ITEMS
 */
app.post("/api/item", auth, item.createItem);

app.get("/api/item/:itemId", auth, item.getItemById);

app.get("/api/items", auth, item.getItemsPaginated);

app.delete("/api/item/:itemId", auth, item.deleteItemById);

app.get("/api/item/:itemId/clips", auth, item.getClipsForItem);

/**
 * CLIPS
 */
app.post("/api/clip", auth, clip.createClip);

app.get("/api/clip/:clipId", auth, clip.getClipById);

app.delete("/api/clip/:clipId", auth, clip.deleteClipById);

/**
 * EMAIL
 */
const upload = multer();

app.post("/api/email", upload.none(), email.receiveInboundEmail);

export const listen = () => {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
  });
};
