import express from "express";
import dotenv from "dotenv";

dotenv.config();

const { BACKYARD_SERVER_SECRET } = process.env;

export const auth = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!BACKYARD_SERVER_SECRET) {
    res.status(500).send("Invalid configuration");
    return;
  }

  const { authorization, Authorization } = req.headers;

  const authorizationHeader = <string>(authorization || Authorization);

  let token;
  let error;

  try {
    token = authorizationHeader.split("Bearer ").find((str) => str !== "");
  } catch (e) {
    error = e;
  }

  const tokenMatchesSecret = BACKYARD_SERVER_SECRET === token;

  if (error || !tokenMatchesSecret) {
    res.status(401).send("Unauthorized");
    return;
  }

  // Authorized
  next();
};