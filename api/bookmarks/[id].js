const { sql } = require('../_lib/db');
const verifyToken = require('../_lib/auth');

function sendMethodNotAllowed(res) {
    res.setHeader('Allow', 'PATCH, DELETE');
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

function getIdFromRequest(req) {
    const { id } = req.query;
    if (Array.isArray(id)) {
        return id[0];
    }

    return id;
}

async function handlePatch(req, res, id, user) {
    const body = parseBody(req);
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
            WHERE id = $1 AND user_id = $6
            RETURNING
                id,
                name,
                url,
                COALESCE(description, '') AS description,
                is_pinned AS "isPinned"
        `,
        [id, name, url, description, isPinned, user.userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Bookmark not found.' });
    }

    return res.status(200).json(normalizeBookmarkRow(rows[0]));
}

async function handleDelete(res, id, user) {
    const rows = await sql.query(
        `
            DELETE FROM bookmarks
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `,
        [id, user.userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Bookmark not found.' });
    }

    return res.status(200).json({ deletedId: String(rows[0].id) });
}

module.exports = async function handler(req, res) {
    const id = getIdFromRequest(req);

    if (!id) {
        return res.status(400).json({ error: 'Bookmark id is required.' });
    }

    try {
        let user;
        try {
            user = verifyToken(req);
        } catch (authError) {
            return res.status(401).json({ error: authError.message });
        }

        if (req.method === 'PATCH') {
            return await handlePatch(req, res, id, user);
        }

        if (req.method === 'DELETE') {
            return await handleDelete(res, id, user);
        }

        return sendMethodNotAllowed(res);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Database request failed.' });
    }
};
