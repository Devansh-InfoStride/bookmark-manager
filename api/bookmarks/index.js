const { sql } = require('../_lib/db');

function sendMethodNotAllowed(res) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
}

function parseBody(req) {
    if (!req.body) {
        return {};
    }

    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }

    return req.body;
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

async function handleGet(req, res) {
    const { sort = 'date_desc' } = req.query || {};
    let orderBy = 'is_pinned DESC, created_at DESC';

    switch (sort) {
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

    return res.status(200).json(rows.map(normalizeBookmarkRow));
}

async function handlePost(req, res) {
    const body = parseBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const isPinned = Boolean(body.isPinned);

    if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required.' });
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

    return res.status(201).json(normalizeBookmarkRow(rows[0]));
}

module.exports = async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            return await handleGet(req, res);
        }

        if (req.method === 'POST') {
            return await handlePost(req, res);
        }

        return sendMethodNotAllowed(res);
    } catch (error) {
        return res.status(500).json({ error: 'Database request failed.' });
    }
};
