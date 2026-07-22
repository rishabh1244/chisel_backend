"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./api_gateway/auth"));
const workspace_1 = __importDefault(require("./api_gateway/workspace"));
const users_1 = __importDefault(require("./api_gateway/users"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
(0, db_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/workspace', workspace_1.default);
app.use('/api/users', users_1.default);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
