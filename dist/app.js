"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const cors_1 = __importDefault(require("cors"));
// import { express } from 'express';
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./app/routes"));
// import notFoundRouteHandler from './app/middlewares/notFoundRouteHandler';
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
//start 
app.use("/api", routes_1.default);
app.get('/', (req, res) => {
    res.send('Hello World!');
});
const notFoundRouteHandler = (req, res, next) => {
    res.status(http_status_1.default.NOT_FOUND).json({
        success: false,
        statusCode: http_status_1.default.NOT_FOUND,
        message: "Not Found",
    });
    next(); // Add this line to call the next middleware
};
app.use(notFoundRouteHandler);
app.use(globalErrorHandler_1.default);
exports.default = app;
