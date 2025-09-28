require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Notion API configuration
const NOTION_API_KEY = process.env.NOTION_API_KEY || 'your-notion-api-key-here';
const NOTION_VERSION = '2022-06-28';

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Notion API proxy routes
app.post('/api/notion/databases/:databaseId/query', async (req, res) => {
    try {
        const { databaseId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/notion/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page get error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/api/notion/pages/:pageId', async (req, res) => {
    try {
        const { pageId } = req.params;
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page patch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/notion/pages', async (req, res) => {
    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page create error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ TaskFlow 서버가 실행 중입니다!`);
    console.log(`🌐 브라우저에서 http://localhost:${PORT} 에 접속하세요`);
    console.log(`📱 모바일에서는 http://[내IP]:${PORT} 로 접속 가능합니다`);
    console.log(`🔗 노션 API 프록시가 활성화되었습니다`);
});