const getOneHourAgo = () => {
  const now = Date.now();
  return now - 60 * 60 * 1000;
};

const getRecentItems = (feedManifests = []) => {
  const oneHourAgo = getOneHourAgo();

  const itemsToSave = feedManifests.map((fm) => {
    const {
      feedJson: { items },
      userId,
      feedUrl,
    } = fm;

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

  return itemsToSave.filter(({ itemsToSave }) => itemsToSave.length > 0);
};

module.exports = getRecentItems;
