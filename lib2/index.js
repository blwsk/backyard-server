"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_cron_1 = __importDefault(require("node-cron"));
var isomorphic_unfetch_1 = __importDefault(require("isomorphic-unfetch"));
var dotenv_1 = __importDefault(require("dotenv"));
var auth_1 = require("./auth");
var rss_1 = require("./rss");
var items_1 = require("./items");
dotenv_1.default.config();
var BACKYARD_ROOT_URI = process.env.BACKYARD_ROOT_URI;
var makeSaveItemsForUser = function (_a) {
    var access_token = _a.access_token;
    return function (_a) {
        var userId = _a.userId, itemsToSave = _a.itemsToSave, feedUrl = _a.feedUrl;
        var params = [
            "userId=" + userId,
            "feedUrl=" + encodeURIComponent(feedUrl),
        ].join("&");
        var uri = BACKYARD_ROOT_URI + "/api/rss/bulk-save?" + params;
        return isomorphic_unfetch_1.default(uri, {
            method: "POST",
            body: JSON.stringify(itemsToSave),
            headers: {
                Authorization: "Bearer " + access_token,
            },
        }).then(function (res) { return res.json(); });
    };
};
node_cron_1.default.schedule("* * * * *", function () { return __awaiter(void 0, void 0, void 0, function () {
    var access_token, _a, json, before, after, message, feedManifests, recentItems, saveItemsForUser, bulkSaveResult, num;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, auth_1.getAccessToken()];
            case 1:
                access_token = (_b.sent()).access_token;
                return [4 /*yield*/, isomorphic_unfetch_1.default(BACKYARD_ROOT_URI + "/api/rss/poll-subs", {
                        method: "GET",
                        headers: {
                            Authorization: "Bearer " + access_token,
                        },
                    }).then(function (r) { return r.json(); })];
            case 2:
                _a = _b.sent(), json = _a.json, before = _a.before, after = _a.after, message = _a.message;
                console.log(message);
                return [4 /*yield*/, rss_1.rss({ json: json, before: before, after: after })];
            case 3:
                feedManifests = _b.sent();
                recentItems = items_1.getRecentItems(feedManifests);
                /**
                 * If no new items, do nothing
                 */
                if (recentItems.length === 0) {
                    console.log("\tNo recent items to save.");
                    return [2 /*return*/];
                }
                saveItemsForUser = makeSaveItemsForUser({ access_token: access_token });
                return [4 /*yield*/, Promise.all(recentItems.map(function (_a) {
                        var userId = _a.userId, itemsToSave = _a.itemsToSave, feedUrl = _a.feedUrl;
                        return saveItemsForUser({ userId: userId, itemsToSave: itemsToSave, feedUrl: feedUrl });
                    }))];
            case 4:
                bulkSaveResult = _b.sent();
                void bulkSaveResult;
                num = recentItems.reduce(function (acc, _a) {
                    var itemsToSave = _a.itemsToSave;
                    return (acc += itemsToSave.length);
                }, 0);
                console.log("\tSent " + num + " items to backyard.wtf");
                return [2 /*return*/];
        }
    });
}); });
