import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface IPCSection {
    chapter: number;
    chapter_title: string;
    Section: number | string;
    section_title: string;
    section_desc: string;
}

let ipcData: IPCSection[] = [];

try {
    const dataPath = path.join(__dirname, '../../data/ipc.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    ipcData = JSON.parse(rawData);
} catch (error) {
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
            results = results.filter(item =>
                item.section_title.toLowerCase().includes(query) ||
                item.section_desc.toLowerCase().includes(query) ||
                String(item.Section).includes(query)
            );
        }

        const limitNum = parseInt(String(limit));
        results = results.slice(0, limitNum);

        res.json({
            total: results.length,
            sections: results,
        });
    } catch (error: any) {
        console.error('[ipc search error]', error);
        res.status(500).json({ error: 'failed to search ipc sections' });
    }
});

router.get('/chapters', (req, res) => {
    try {
        const chapters = ipcData.reduce((acc: any[], item) => {
            if (!acc.find(c => c.chapter === item.chapter)) {
                acc.push({
                    chapter: item.chapter,
                    title: item.chapter_title,
                });
            }
            return acc;
        }, []);

        res.json({ chapters });
    } catch (error: any) {
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
    } catch (error: any) {
        console.error('[ipc section error]', error);
        res.status(500).json({ error: 'failed to get ipc section' });
    }
});

export default router;
