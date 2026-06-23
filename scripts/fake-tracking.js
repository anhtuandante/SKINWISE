const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Utility to create random dates
const now = new Date();
function randomDate(daysAgoStart, daysAgoEnd) {
  const startMs = now.getTime() - (daysAgoStart * 24 * 60 * 60 * 1000);
  const endMs = now.getTime() - (daysAgoEnd * 24 * 60 * 60 * 1000);
  const randomMs = startMs + Math.random() * (endMs - startMs);
  return new Date(randomMs);
}

const events = [];

// Create 20 fake users (sessions) to show 95/5 split clearly
const users = [];
for (let i = 1; i <= 20; i++) {
  // Determine source: 95% FB, 5% TikTok
  const source = Math.random() < 0.95 ? (Math.random() < 0.6 ? 'facebook_ad' : 'facebook_group') : 'tiktok_video';
  // Mix of user types
  const type = i <= 10 ? 'newbie' : (i <= 15 ? 'active' : 'churned');
  users.push({ id: `session_fake_u${i}`, type, source });
}

// Week 1: Discovery Phase (Day 14 to Day 7)
// Users do the quiz, face scan, and add to routine.
users.forEach(user => {
  const joinDate = randomDate(14, 10);
  
  // 1. Visit landing page
  events.push({ session_id: user.id, event_name: 'page_view', page_path: '/', metadata: { source: user.source }, created_at: joinDate.toISOString() });
  
  // 2. Start and finish quiz (5 mins later)
  const quizDate = new Date(joinDate.getTime() + 2 * 60000);
  events.push({ session_id: user.id, event_name: 'quiz_start', page_path: '/quiz', metadata: {}, created_at: quizDate.toISOString() });
  
  for(let step=1; step<=6; step++) {
    const stepDate = new Date(quizDate.getTime() + step * 10000);
    events.push({ session_id: user.id, event_name: 'quiz_step_view', page_path: '/quiz', metadata: { step }, created_at: stepDate.toISOString() });
  }

  // 3. AI Face scan during quiz
  const scanDate = new Date(quizDate.getTime() + 65000);
  events.push({ session_id: user.id, event_name: 'ai_face_scan_start', page_path: '/quiz', metadata: {}, created_at: scanDate.toISOString() });
  events.push({ session_id: user.id, event_name: 'ai_face_scan_success', page_path: '/quiz', metadata: { detectedType: 'oily' }, created_at: new Date(scanDate.getTime() + 5000).toISOString() });

  // 4. Complete quiz
  const completeDate = new Date(quizDate.getTime() + 80000);
  events.push({ session_id: user.id, event_name: 'quiz_complete', page_path: '/results', metadata: { skinType: 'oily' }, created_at: completeDate.toISOString() });

  // 5. Add products to routine
  const resultsDate = new Date(completeDate.getTime() + 20000);
  events.push({ session_id: user.id, event_name: 'add_to_routine', page_path: '/results', metadata: { category: 'cleanser' }, created_at: resultsDate.toISOString() });
  events.push({ session_id: user.id, event_name: 'add_to_routine', page_path: '/results', metadata: { category: 'moisturizer' }, created_at: new Date(resultsDate.getTime() + 5000).toISOString() });
});

// Week 2: Daily Use / Retention (Day 7 to Today) - ~60 events
// Active users come back to check off routines and chat with AI
users.filter(u => u.type !== 'churned').forEach(user => {
  // Simulate 3 different return days
  for(let i=0; i<3; i++) {
    const returnDate = randomDate(6 - i*2, 5 - i*2); // Day 6, 4, 2 ago
    
    // Open dashboard
    events.push({ session_id: user.id, event_name: 'page_view', page_path: '/dashboard', metadata: {}, created_at: returnDate.toISOString() });
    
    // Complete AM routine
    const amDate = new Date(returnDate.getTime() + 10000);
    events.push({ session_id: user.id, event_name: 'routine_completed_toggle', page_path: '/dashboard', metadata: { period: 'AM' }, created_at: amDate.toISOString() });

    // Complete PM routine (simulated 10 hours later)
    const pmDate = new Date(returnDate.getTime() + 10 * 60 * 60 * 1000);
    events.push({ session_id: user.id, event_name: 'page_view', page_path: '/dashboard', metadata: {}, created_at: pmDate.toISOString() });
    events.push({ session_id: user.id, event_name: 'routine_completed_toggle', page_path: '/dashboard', metadata: { period: 'PM' }, created_at: new Date(pmDate.getTime() + 5000).toISOString() });

    // Quick Check-in
    events.push({ session_id: user.id, event_name: 'page_view', page_path: '/dashboard', metadata: { action: 'quick_checkin', mood: 'great' }, created_at: new Date(pmDate.getTime() + 10000).toISOString() });

    // Sometimes use AI Chat
    if (Math.random() > 0.5) {
      const chatDate = new Date(pmDate.getTime() + 20000);
      events.push({ session_id: user.id, event_name: 'ai_chat_send', page_path: '/dashboard', metadata: { length: 25 }, created_at: chatDate.toISOString() });
      events.push({ session_id: user.id, event_name: 'ai_chat_receive', page_path: '/dashboard', metadata: {}, created_at: new Date(chatDate.getTime() + 3000).toISOString() });
    }
  }
});

// Sort chronologically
events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

async function run() {
  console.log(`Generated ${events.length} fake tracking events.`);
  
  if (supabase) {
    console.log('Inserting into Supabase...');
    const { error } = await supabase.from('tracking_events').insert(events);
    if (error) {
      console.error('Supabase insertion failed. This is fine if table does not exist or env is not set up.', error.message);
    } else {
      console.log('✅ Successfully inserted into Supabase database!');
    }
  } else {
    console.log('Supabase env vars not found. Skipping DB insert.');
  }

  // Also write to local file for fallback
  const localPath = path.join(__dirname, '../src/data/tracking_logs.json');
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, JSON.stringify(events, null, 2));
  console.log(`✅ Successfully wrote to local fallback: ${localPath}`);
}

run();
