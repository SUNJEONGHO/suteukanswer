import { sql } from '@vercel/postgres';

let isInitialized = false;

export async function initDb() {
  if (isInitialized) return;
  try {
    // Automatically create the problems table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS problems (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,
        chapter VARCHAR(100) NOT NULL,
        problem_number INTEGER NOT NULL,
        description TEXT DEFAULT '',
        content_html TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_subject_chapter_number UNIQUE (subject, chapter, problem_number)
      );
    `;
    
    // Add views column if it doesn't exist (for existing tables)
    await sql`
      ALTER TABLE problems ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
    `;
    isInitialized = true;
    console.log('Database initialized: "problems" table ready.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Export the native sql client for queries
export { sql };
