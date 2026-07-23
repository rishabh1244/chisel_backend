"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../../../models/User"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
function generateUserId() {
    return Math.floor(100000 + Math.random() * 900000);
}
async function register(username, password) {
    const existing = await User_1.default.findOne({ username });
    if (existing) {
        throw new Error('Username already exists');
    }
    let userid;
    let isUnique = false;
    do {
        userid = generateUserId();
        const dup = await User_1.default.findOne({ userid });
        if (!dup)
            isUnique = true;
    } while (!isUnique);
    const salt = await bcryptjs_1.default.genSalt(10);
    const password_hash = await bcryptjs_1.default.hash(password, salt);
    const user = await User_1.default.create({ userid, username, password_hash });
    const token = jsonwebtoken_1.default.sign({ userid: user.userid, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { userid: user.userid, username: user.username } };
}
async function login(username, password) {
    const user = await User_1.default.findOne({ username });
    if (!user) {
        throw new Error('Invalid username or password');
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid username or password');
    }
    const token = jsonwebtoken_1.default.sign({ userid: user.userid, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: { userid: user.userid, username: user.username } };
}
