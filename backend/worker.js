export default {
    async fetch(request, env) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            if (path === '/api/messages') {
                if (request.method === 'GET') {
                    return await this.getMessages(request, env, corsHeaders);
                } else if (request.method === 'POST') {
                    return await this.postMessage(request, env, corsHeaders);
                }
            }

            return new Response('Not Found', { status: 404, headers: corsHeaders });
        } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
        }
    },

    async getMessages(request, env, corsHeaders) {
        const { results } = await env.DB.prepare(
            'SELECT * FROM messages ORDER BY created_at DESC LIMIT 50'
        ).all();

        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    },

    async postMessage(request, env, corsHeaders) {
        const body = await request.json();
        const { content, nickname } = body;

        if (!content || content.length > 500) {
            return new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400, headers: corsHeaders });
        }

        const safeNickname = (nickname || 'Anonymous').slice(0, 50);
        const timestamp = Date.now();

        await env.DB.prepare(
            'INSERT INTO messages (content, nickname, created_at) VALUES (?, ?, ?)'
        ).bind(content, safeNickname, timestamp).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
