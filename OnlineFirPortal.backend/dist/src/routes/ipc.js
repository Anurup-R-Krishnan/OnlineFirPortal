"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
let ipcData = [];
try {
    const dataPath = path_1.default.join(__dirname, '../../data/ipc.json');
    const rawData = fs_1.default.readFileSync(dataPath, 'utf-8');
    ipcData = JSON.parse(rawData);
}
catch (error) {
    console.error('[ipc data load error]', error);
}
router.get('/search', (req, res) => {
    try {
        const { q, chapter, limit = '50' } = req.query;
        let results = ipcData;
        if (chapter) {
            results = results.filter(item => item.chapter === parseInt(String(chapter)));
        }
        if (q) {
            const query = String(q).toLowerCase();
            results = results.filter(item => item.section_title.toLowerCase().includes(query) ||
                item.section_desc.toLowerCase().includes(query) ||
                String(item.Section).includes(query));
        }
        const limitNum = parseInt(String(limit));
        results = results.slice(0, limitNum);
        res.json({
            total: results.length,
            sections: results,
        });
    }
    catch (error) {
        console.error('[ipc search error]', error);
        res.status(500).json({ error: 'failed to search ipc sections' });
    }
});
router.get('/chapters', (req, res) => {
    try {
        const chapters = ipcData.reduce((acc, item) => {
            if (!acc.find(c => c.chapter === item.chapter)) {
                acc.push({
                    chapter: item.chapter,
                    title: item.chapter_title,
                });
            }
            return acc;
        }, []);
        res.json({ chapters });
    }
    catch (error) {
        console.error('[ipc chapters error]', error);
        res.status(500).json({ error: 'failed to get ipc chapters' });
    }
});
router.get('/section/:section', (req, res) => {
    try {
        const { section } = req.params;
        const sectionData = ipcData.find(item => String(item.Section) === section);
        if (!sectionData) {
            res.status(404).json({ error: 'section not found' });
            return;
        }
        res.json(sectionData);
    }
    catch (error) {
        console.error('[ipc section error]', error);
        res.status(500).json({ error: 'failed to get ipc section' });
    }
});
exports.default = router;
//# sourceMappingURL=ipc.js.map