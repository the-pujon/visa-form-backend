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
/* eslint-disable no-console */
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const configs_1 = __importDefault(require("./app/configs"));
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(configs_1.default.database_url);
            console.log("Database connected successfully");
            server = app_1.default.listen(configs_1.default.port, () => {
                console.log(`Server is running on port ${configs_1.default.port}`);
            });
        }
        catch (err) {
            console.error('Failed to connect database', err);
        }
    });
}
main();
// Export the server and app for Vercel
exports.default = app_1.default;
// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection. Shutting down...');
    console.log(err);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
