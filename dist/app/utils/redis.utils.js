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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllCachedData = exports.deleteCachedData = exports.getCachedData = exports.cacheData = void 0;
/* eslint-disable no-console */
const redis_config_1 = __importDefault(require("../configs/redis.config"));
const cacheData = (key, value, ttl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis_config_1.default.setEx(key, ttl, JSON.stringify(value));
        console.log(`Data cached for key: ${key}`);
    }
    catch (error) {
        console.error(`Failed to cache data for key: ${key}`, error);
    }
});
exports.cacheData = cacheData;
const getCachedData = (key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedData = yield redis_config_1.default.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    }
    catch (error) {
        console.error(`Failed to get cached data for key: ${key}`, error);
        return null;
    }
});
exports.getCachedData = getCachedData;
const deleteCachedData = (pattern) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const matchingKeys = yield redis_config_1.default.keys(pattern);
        if (matchingKeys.length > 0) {
            yield Promise.all(matchingKeys.map((key) => redis_config_1.default.del(key)));
            console.log('Successfully deleted cached data');
        }
        return true;
    }
    catch (error) {
        console.error('Error deleting cached data:', error);
        return false;
    }
});
exports.deleteCachedData = deleteCachedData;
const clearAllCachedData = () => __awaiter(void 0, void 0, void 0, function* () {
    yield redis_config_1.default.flushAll();
});
exports.clearAllCachedData = clearAllCachedData;
