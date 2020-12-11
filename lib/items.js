const getOneHourAgo = () => {
  const now = Date.now();
  return now - 60 * 60 * 1000;
};

const getRecentItems = (feedManifests) => {
  const oneHourAgo = getOneHourAgo();

  const itemsToSave = feedManifests.map((fm) => {
    const {
      feedJson: { items },
      userId,
    } = fm;

    const mostRecent = items[0];

    /**
     * omit first element, since we already have it^
     */
    const fromLastHour = items.slice(1).filter((item) => {
      const { pubDate } = item;

      const ms = new Date(pubDate).getTime();

      return ms >= oneHourAgo;
    });

    const merged = [mostRecent, ...fromLastHour];

    // merged.forEach((item) => {
    //   const { title, link, pubDate, content } = item;

    //   console.log({
    //     title: JSON.stringify(title),
    //     link,
    //     pubDate: new Date(pubDate).getTime(),
    //     // content,
    //   });
    // });

    return {
      userId,
      itemsToSave: merged,
    };
  });

  return itemsToSave;
};

module.exports = getRecentItems;
