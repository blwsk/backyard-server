import unfetch from "isomorphic-unfetch";
import dotenv from "dotenv";

dotenv.config();

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

export const getAccessToken = async () => {
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

    const { access_token, token_type, expires_in } = await response.json();

    return { access_token, token_type, expires_in };
  } catch (e) {
    console.log("Error while fetching access token", e);
    return {};
  }
};
