import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { auth } from "./lib/auth";
import * as item from "./item";
import * as clip from "./clip";
import * as email from "./email";
import { applyApollo } from "./graphql";
import { verifyPhoneNumber, confirmPhoneNumber } from "./sms";
import {
  getUserMetadataByEmailIngestAddress,
  getUserMetadataByPhoneNumber,
} from "./userMeta";

dotenv.config();

const { PORT } = process.env;

const app = express();

app.use(express.json({ limit: "50mb" }));

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(req.method, req.path, req.body);
    next();
  }
);

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

app.delete("/api/items", auth, item.deleteItemsBulk);

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

/**
 * SMS
 */
app.put("/api/sms/verify", auth, verifyPhoneNumber);
app.put("/api/sms/confirm", auth, confirmPhoneNumber);

/**
 * User Metadata
 */
app.get("/api/user/email", auth, getUserMetadataByEmailIngestAddress);
app.get("/api/user/phone", auth, getUserMetadataByPhoneNumber);

export const listen = () => {
  app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
  });
};
