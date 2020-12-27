import unfetch from "isomorphic-unfetch";
import dotenv from "dotenv";
import { makeLogger } from "./logger";

dotenv.config();

const logger = makeLogger("auth");

const {
  // current
  AUTH_CLIENT_ID,
  AUTH_CLIENT_SECRET,
  AUTH_AUDIENCE,
  AUTH_TOKEN_URI,

  // old
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_TOKEN_URI,
} = process.env;

const _AUTH_CLIENT_ID = AUTH_CLIENT_ID || AUTH0_CLIENT_ID;
const _AUTH_CLIENT_SECRET = AUTH_CLIENT_SECRET || AUTH0_CLIENT_SECRET;
const _AUTH_AUDIENCE = AUTH_AUDIENCE || AUTH0_AUDIENCE;
const _AUTH_TOKEN_URI = AUTH_TOKEN_URI || AUTH0_TOKEN_URI;

const ONE_MINUTE_MS = 60 * 1000;

let cachedAccessToken: string | null = null;
let expiresAt: number | null = null;

export const getAccessToken = async (): Promise<{
  access_token?: string;
}> => {
  if (
    typeof cachedAccessToken === "string" &&
    expiresAt &&
    Date.now() < expiresAt
  ) {
    logger("Using cached access token");
    return { access_token: cachedAccessToken };
  }

  try {
    const options = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: _AUTH_CLIENT_ID,
        client_secret: _AUTH_CLIENT_SECRET,
        audience: _AUTH_AUDIENCE,
        grant_type: "client_credentials",
      }),
    };

    const response = await unfetch(<string>_AUTH_TOKEN_URI, options);

    const {
      access_token,
      token_type,
      expires_in,
    }: {
      access_token: string;
      token_type: string;
      expires_in: number;
    } = await response.json();

    void token_type; // it's always Bearer

    // cache access token
    const expiresInMs = expires_in * 1000; // converts seconds to milliseconds
    cachedAccessToken = access_token;
    expiresAt = Date.now() + expiresInMs - ONE_MINUTE_MS;

    logger("Using fresh access token");

    return { access_token: cachedAccessToken };
  } catch (e) {
    logger("Error while fetching access token", e);
    return {};
  }
};
