require('dotenv').config();

const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const { sql } = require('./api/_lib/db');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8'
    });
    res.end(JSON.stringify(payload));
}

function normalizeBookmarkRow(row) {
    return {
        id: String(row.id),
        name: row.name,
        url: row.url,
        description: row.description || '',
        isPinned: Boolean(row.isPinned)
    };
}

function parseBody(req) {
    return new Promise((resolve) => {
        const chunks = [];

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            if (chunks.length === 0) {
                resolve({});
                return;
            }

            try {
                const text = Buffer.concat(chunks).toString('utf8');
                resolve(text ? JSON.parse(text) : {});
            } catch (error) {
                resolve({});
            }
        });
    });
}

async function handleBookmarksCollection(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const sortParam = requestUrl.searchParams.get('sort') || 'date_desc';

    if (req.method === 'GET') {
        let orderBy = 'is_pinned DESC, created_at DESC';
        
        switch (sortParam) {
            case 'name_asc':
                orderBy = 'is_pinned DESC, name ASC';
                break;
            case 'name_desc':
                orderBy = 'is_pinned DESC, name DESC';
                break;
            case 'date_asc':
                orderBy = 'is_pinned DESC, created_at ASC';
                break;
            case 'date_desc':
            default:
                orderBy = 'is_pinned DESC, created_at DESC';
                break;
        }

        const rows = await sql.query(`
            SELECT
                id,
                name,
                url,
                COALESCE(description, '') AS description,
                is_pinned AS "isPinned"
            FROM bookmarks
            ORDER BY ${orderBy}
        `);

        sendJson(res, 200, rows.map(normalizeBookmarkRow));
        return;
    }

    if (req.method === 'POST') {
        const body = await parseBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const url = typeof body.url === 'string' ? body.url.trim() : '';
        const description = typeof body.description === 'string' ? body.description.trim() : '';
        const isPinned = Boolean(body.isPinned);

        if (!name || !url) {
            sendJson(res, 400, { error: 'Name and URL are required.' });
            return;
        }

        const rows = await sql.query(
            `
                INSERT INTO bookmarks (name, url, description, is_pinned)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    name,
                    url,
                    COALESCE(description, '') AS description,
                    is_pinned AS "isPinned"
            `,
            [name, url, description, isPinned]
        );

        sendJson(res, 201, normalizeBookmarkRow(rows[0]));
        return;
    }

    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
}

async function handleBookmarkItem(req, res, bookmarkId) {
    if (req.method === 'PATCH') {
        const body = await parseBody(req);
        const name = typeof body.name === 'string' ? body.name.trim() : null;
        const url = typeof body.url === 'string' ? body.url.trim() : null;
        const description = typeof body.description === 'string' ? body.description.trim() : null;
        const isPinned = typeof body.isPinned === 'boolean' ? body.isPinned : null;

        const rows = await sql.query(
            `
                UPDATE bookmarks
                SET
                    name = COALESCE($2, name),
                    url = COALESCE($3, url),
                    description = COALESCE($4, description),
                    is_pinned = COALESCE($5, is_pinned)
                WHERE id = $1
                RETURNING
                    id,
                    name,
                    url,
                    COALESCE(description, '') AS description,
                    is_pinned AS "isPinned"
            `,
            [bookmarkId, name, url, description, isPinned]
        );

        if (rows.length === 0) {
            sendJson(res, 404, { error: 'Bookmark not found.' });
            return;
        }

        sendJson(res, 200, normalizeBookmarkRow(rows[0]));
        return;
    }

    if (req.method === 'DELETE') {
        const rows = await sql.query(
            `
                DELETE FROM bookmarks
                WHERE id = $1
                RETURNING id
            `,
            [bookmarkId]
        );

        if (rows.length === 0) {
            sendJson(res, 404, { error: 'Bookmark not found.' });
            return;
        }

        sendJson(res, 200, { deletedId: String(rows[0].id) });
        return;
    }

    res.setHeader('Allow', 'PATCH, DELETE');
    sendJson(res, 405, { error: 'Method not allowed.' });
}

async function serveStaticAsset(res, requestPath) {
    const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.join(publicDir, normalizedPath);

    if (!filePath.startsWith(publicDir)) {
        sendJson(res, 400, { error: 'Invalid path.' });
        return;
    }

    try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();

        res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'application/octet-stream'
        });
        res.end(fileBuffer);
    } catch (error) {
        if (normalizedPath !== '/index.html') {
            try {
                const fallback = await fs.readFile(path.join(publicDir, 'index.html'));
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=utf-8'
                });
                res.end(fallback);
                return;
            } catch (fallbackError) {
                // Fall through to 404.
            }
        }

        res.writeHead(404, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end('Not found');
    }
}

const server = http.createServer(async (req, res) => {
    try {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);
        const { pathname } = requestUrl;

        if (pathname === '/api/bookmarks') {
            await handleBookmarksCollection(req, res);
            return;
        }

        if (pathname.startsWith('/api/bookmarks/')) {
            const bookmarkId = decodeURIComponent(pathname.slice('/api/bookmarks/'.length));
            if (!bookmarkId) {
                sendJson(res, 400, { error: 'Bookmark id is required.' });
                return;
            }

            await handleBookmarkItem(req, res, bookmarkId);
            return;
        }

        await serveStaticAsset(res, pathname);
    } catch (error) {
        sendJson(res, 500, { error: 'Server error.' });
    }
});

server.listen(PORT, () => {
    console.log(`Bookmark Manager running at http://localhost:${PORT}`);
});
