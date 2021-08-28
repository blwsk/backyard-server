import express from "express";

const { BACKYARD_SERVER_SECRET, NODE_ENV } = process.env;

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

export const localOnly = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (
    req.headers.host &&
    req.headers.host.indexOf("localhost") > -1
  ) {
    next();
  } else {
    res.send("Unauthorized");
  }
};
