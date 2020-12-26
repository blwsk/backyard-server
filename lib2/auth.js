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
exports.getAccessToken = void 0;
var isomorphic_unfetch_1 = __importDefault(require("isomorphic-unfetch"));
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var _a = process.env, AUTH0_CLIENT_ID = _a.AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET = _a.AUTH0_CLIENT_SECRET, AUTH0_AUDIENCE = _a.AUTH0_AUDIENCE, AUTH0_TOKEN_URI = _a.AUTH0_TOKEN_URI;
var getAccessToken = function () { return __awaiter(void 0, void 0, void 0, function () {
    var options, response, _a, access_token, token_type, expires_in;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                options = {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        client_id: AUTH0_CLIENT_ID,
                        client_secret: AUTH0_CLIENT_SECRET,
                        audience: AUTH0_AUDIENCE,
                        grant_type: "client_credentials",
                    }),
                };
                return [4 /*yield*/, isomorphic_unfetch_1.default(AUTH0_TOKEN_URI, options)];
            case 1:
                response = _b.sent();
                return [4 /*yield*/, response.json()];
            case 2:
                _a = _b.sent(), access_token = _a.access_token, token_type = _a.token_type, expires_in = _a.expires_in;
                return [2 /*return*/, { access_token: access_token, token_type: token_type, expires_in: expires_in }];
        }
    });
}); };
exports.getAccessToken = getAccessToken;
