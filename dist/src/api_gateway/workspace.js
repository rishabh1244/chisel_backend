"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/createProject', (_req, res) => {
    res.json({ message: 'working' });
});
router.post('/editProject', (_req, res) => {
    res.json({ message: 'working' });
});
exports.default = router;
