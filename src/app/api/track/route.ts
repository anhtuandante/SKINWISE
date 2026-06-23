import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const maxDuration = 10;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_LOG_PATH = path.join(process.cwd(), "src/data/tracking_logs.json");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body || !body.session_id || !body.event_name || !body.page_path) {
      return new Response(JSON.stringify({ error: "Missing required tracking parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { session_id, event_name, page_path, metadata = {} } = body;
    const timestamp = new Date().toISOString();

    const eventData = {
      session_id,
      event_name,
      page_path,
      metadata,
      created_at: timestamp
    };

    let savedToDb = false;
    let dbError = null;

    // 1. Try writing to Supabase
    try {
      const { error } = await supabase
        .from("tracking_events")
        .insert([eventData]);
      
      if (error) {
        dbError = error.message;
      } else {
        savedToDb = true;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

    // 2. Local file logging fallback / parallel log in development
    const isDev = process.env.NODE_ENV === "development";
    if (isDev || !savedToDb) {
      try {
        let existingLogs = [];
        
        // Ensure data directory exists
        const dir = path.dirname(LOCAL_LOG_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(LOCAL_LOG_PATH)) {
          const fileContent = fs.readFileSync(LOCAL_LOG_PATH, "utf8");
          existingLogs = JSON.parse(fileContent);
        }
        
        existingLogs.push({
          ...eventData,
          id: Math.random().toString(36).substring(2, 11),
          fallback_log: !savedToDb,
          db_error: dbError
        });

        // Limit to last 1000 events to prevent file growing indefinitely
        if (existingLogs.length > 1000) {
          existingLogs = existingLogs.slice(-1000);
        }

        fs.writeFileSync(LOCAL_LOG_PATH, JSON.stringify(existingLogs, null, 2), "utf8");
      } catch (fileErr) {
        console.error("Failed to write tracking log to local file:", fileErr);
      }
    }

    if (!savedToDb) {
      console.warn(`Tracking event stored locally. Database Write Warning: ${dbError}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      saved_to_db: savedToDb, 
      warning: dbError 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Tracking API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Add a GET endpoint to fetch tracking events for the admin dashboard (combining DB and local file fallback)
export async function GET() {
  try {
    let events: { created_at: string; [key: string]: unknown }[] = [];
    let source = "database";
    let dbError = null;
    let dbSuccess = false;

    // 1. Try to read from Supabase
    try {
      const { data, error } = await supabase
        .from("tracking_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        dbError = error.message;
      } else if (data) {
        events = data;
        dbSuccess = true;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

    // 2. Fallback to local logs ONLY if Supabase fetch failed
    if (!dbSuccess) {
      source = "local_file";
      try {
        if (fs.existsSync(LOCAL_LOG_PATH)) {
          const fileContent = fs.readFileSync(LOCAL_LOG_PATH, "utf8");
          events = JSON.parse(fileContent);
          // Sort descending by created_at
          events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
      } catch (fileErr) {
        console.error("Failed to read local tracking logs:", fileErr);
      }
    }

    return new Response(JSON.stringify({ 
      events, 
      source, 
      db_error: dbError 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Tracking API Fetch Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Add a DELETE endpoint to clear all tracking events (DB and local fallback)
export async function DELETE() {
  try {
    let clearedDb = false;
    let clearedFile = false;
    let dbError = null;

    // 1. Try to delete all rows from Supabase
    try {
      const { error } = await supabase
        .from("tracking_events")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all rows since all UUIDs are not zero

      if (error) {
        dbError = error.message;
      } else {
        clearedDb = true;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }

    // 2. Clear local log file
    try {
      if (fs.existsSync(LOCAL_LOG_PATH)) {
        fs.writeFileSync(LOCAL_LOG_PATH, JSON.stringify([], null, 2), "utf8");
        clearedFile = true;
      }
    } catch (fileErr) {
      console.error("Failed to clear local tracking logs:", fileErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cleared_db: clearedDb,
      cleared_file: clearedFile,
      db_error: dbError 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Tracking API Delete Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
