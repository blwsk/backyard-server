import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const { BACKYARD_SERVER_SECRET, BACKYARD_SERVER_CLIENT_ID } = process.env;

export const auth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const { authorization, Authorization } = req.headers;

  const authorizationHeader = <string>(authorization || Authorization);

  let token;
  let error;

  try {
    token = authorizationHeader.split("Bearer ").find((str) => str !== "");
  } catch (e) {
    error = e;
  }

  if (error) {
    res.status(400).send("Missing valid Bearer token in Authorization header");
    return;
  }

  if (!BACKYARD_SERVER_SECRET || !BACKYARD_SERVER_CLIENT_ID) {
    res.status(500).send("Invalid configuration");
    return;
  }

  const tokenMatchesHmac =
    crypto
      .createHmac("sha256", BACKYARD_SERVER_SECRET)
      .update(BACKYARD_SERVER_CLIENT_ID)
      .digest("hex") === token;

  if (!tokenMatchesHmac) {
    res.status(401).send("Unauthorized");
    return;
  }

  // Authorized
  next();
};
