"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/login', (_req, res) => {
    res.json({ message: 'working' });
});
router.post('/signup', (_req, res) => {
    res.json({ message: 'working' });
});
exports.default = router;
