const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

require('dotenv').config();

// 1. Supabase Storage Client (Images ani files upload karnyasathi)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 2. PostgreSQL Connection Pool (Database queries sathi)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Supabase connection string ithe vaparali ahe
    ssl: { rejectUnauthorized: false }
});

// Exports both supabase client and query wrapper to match your project structure
module.exports = {
    supabase,
    query: (text, params) => pool.query(text, params),
    getConnection: async () => {
        const client = await pool.connect();
        return {
            query: (text, params) => client.query(text, params),
            beginTransaction: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK'),
            release: () => client.release()
        };
    }
};