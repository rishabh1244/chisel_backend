"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const login_and_register_1 = require("../routes/services/Auth/login and register");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        const result = await (0, login_and_register_1.login)(username, password);
        res.json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({ error: message });
    }
});
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        const result = await (0, login_and_register_1.register)(username, password);
        res.status(201).json(result);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        res.status(400).json({ error: message });
    }
});
exports.default = router;
