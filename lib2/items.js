"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentItems = void 0;
var getOneHourAgo = function () {
    var now = Date.now();
    return now - 60 * 60 * 1000;
};
var getRecentItems = function (feedManifests) {
    if (feedManifests === void 0) { feedManifests = []; }
    var oneHourAgo = getOneHourAgo();
    var itemsToSave = feedManifests.map(function (fm) {
        var items = fm.feedJson.items, userId = fm.userId, feedUrl = fm.feedUrl;
        var fromLastHour = items.filter(function (item) {
            var pubDate = item.pubDate;
            var ms = new Date(pubDate).getTime();
            return ms >= oneHourAgo;
        });
        return {
            userId: userId,
            itemsToSave: fromLastHour,
            feedUrl: feedUrl,
        };
    });
    return itemsToSave.filter(function (_a) {
        var itemsToSave = _a.itemsToSave;
        return itemsToSave.length > 0;
    });
};
exports.getRecentItems = getRecentItems;
