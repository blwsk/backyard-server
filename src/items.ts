import { RssFeedItem } from "./rss";
import { makeLogger } from "./logger";

const logger = makeLogger("items");

const getOneHourAgo = () => {
  const now = Date.now();
  return now - 60 * 60 * 1000;
};

export const getRecentItems = (
  feedManifests: {
    feedJson: {
      items: RssFeedItem[];
    };
    userId: string;
    feedUrl: string;
  }[] = []
) => {
  const oneHourAgo = getOneHourAgo();

  const newContentManifests = feedManifests.map((fm) => {
    const {
      feedJson: { items },
      userId,
      feedUrl,
    } = fm;

    logger("Scanning", feedUrl);
    logger("Posts from", items.map(({ pubDate }) => pubDate).join(", "));

    const fromLastHour = items.filter((item) => {
      const { pubDate } = item;

      const ms = new Date(pubDate).getTime();

      return ms >= oneHourAgo;
    });

    return {
      userId,
      itemsToSave: fromLastHour,
      feedUrl,
    };
  });

  return newContentManifests.filter(
    ({ itemsToSave }) => itemsToSave.length > 0
  );
};
