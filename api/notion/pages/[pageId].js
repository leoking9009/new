// Notion Page API Proxy
export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { pageId } = req.query;
        const NOTION_API_KEY = process.env.NOTION_API_KEY;
        const NOTION_VERSION = '2022-06-28';

        if (!NOTION_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        let url = `https://api.notion.com/v1/pages/${pageId}`;
        let method = req.method;
        let body = null;

        if (method === 'POST' || method === 'PATCH') {
            body = JSON.stringify(req.body);
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': NOTION_VERSION
            },
            body: body
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Page API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}