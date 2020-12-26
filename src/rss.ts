const Parser = require("rss-parser");
const fetch = require("isomorphic-unfetch");

const parser = new Parser();

export const rss = async ({
  json,
  before,
  after,
}: {
  json: { feedUrl: string; userId: string }[];
  before?: string;
  after?: string;
}) => {
  void before, after;

  const feedManifests = await Promise.all(
    json.map(({ feedUrl, userId }) => {
      return fetch(feedUrl)
        .then((res: Response) => res.text())
        .then((xml: string) => parser.parseString(xml))
        .then((feedJson: object) => {
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
