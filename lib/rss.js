const Parser = require("rss-parser");
const fetch = require("isomorphic-unfetch");

const parser = new Parser();

const rss = async ({ json, before, after }) => {
  void before, after;

  const feedManifests = await Promise.all(
    json.map(({ feedUrl, userId }) => {
      return fetch(feedUrl)
        .then((res) => res.text())
        .then((xml) => parser.parseString(xml))
        .then((feedJson) => {
          return {
            feedUrl,
            userId,
            feedJson,
          };
        });
    })
  );

  return feedManifests;
};

module.exports = rss;
