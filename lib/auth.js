const fetch = require("isomorphic-unfetch");
const dotenv = require("dotenv");

dotenv.config();

const {
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_AUDIENCE,
  AUTH0_TOKEN_URI,
} = process.env;

const getAccessToken = async () => {
  const options = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: AUTH0_AUDIENCE,
      grant_type: "client_credentials",
    }),
  };

  const response = await fetch(AUTH0_TOKEN_URI, options);

  const { access_token, token_type, expires_in } = await response.json();

  return { access_token, token_type, expires_in };
};

module.exports = getAccessToken;
