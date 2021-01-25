const Parser = require("rss-parser");
const unfetch = require("isomorphic-unfetch");

const parser = new Parser();

export interface RssFeedItem {
  title?: string;
  link: string;
  pubDate: string;
  author?: string;
  content?: string;
  contentSnippet?: string;
  id?: string;
  isoDate?: string;
}

export const rss = async ({
  json,
  before,
  after,
}: {
  json: { feedUrl: string; userId: string }[];
  before?: string;
  after?: string;
}): Promise<
  {
    feedUrl: string;
    userId: string;
    feedJson: {
      items: RssFeedItem[];
    };
  }[]
> => {
  void before, after;

  const feedManifests = await Promise.all(
    json.map(({ feedUrl, userId }) => {
      return unfetch(feedUrl)
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
