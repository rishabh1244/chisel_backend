"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/listUsers', (_req, res) => {
    res.json({ message: 'working' });
});
router.post('/sendInvite', (_req, res) => {
    res.json({ message: 'working' });
});
router.get('/searchUsers', (_req, res) => {
    res.json({ message: 'working' });
});
exports.default = router;
