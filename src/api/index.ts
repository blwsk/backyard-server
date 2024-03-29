import express from "express";
import multer from "multer";
import { auth, localOnly } from "./lib/auth";
import * as item from "./item";
import * as clip from "./clip";
import * as email from "./email";
import { applyApollo } from "./graphql";
import { graphiql } from "./lib/graphiql";
import { verifyPhoneNumber, confirmPhoneNumber } from "./sms";
import {
  getUserMetadataByEmailIngestAddress,
  getUserMetadataByPhoneNumber,
} from "./userMeta";

const { PORT } = process.env;

const app = express();

app.use(express.json({ limit: "50mb" }));

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(req.method, req.path, req.body);
    next();
  }
);

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send("Hello from api.backyard.wtf");
});

/**
 * GRAPHQL
 */
app.use("/graphql", auth);

applyApollo(app);

app.get("/graphiql", localOnly, graphiql);

/**
 * ITEMS
 */
app.post("/api/item", auth, item.createItem);

app.get("/api/item/:itemId", auth, item.getItemById);

app.get("/api/items", auth, item.getItemsPaginated);

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
