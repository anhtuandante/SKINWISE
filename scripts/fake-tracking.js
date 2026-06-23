const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

const events = [];

// Distribution scaled to 100 users, matching Facebook Insights report:
// Week 2 (8/6 - 14/6): Peak on 9-10/6, drop, rise on 14/6. Total: 20 users.
// Week 3 (15/6 - 23/6): Huge peak on 17-18/6, sharp drop 19-21/6. Total: 80 users.
const dailyNewUsers = {
  // Week 2
  '2026-06-08': 1,
  '2026-06-09': 6,
  '2026-06-10': 5,
  '2026-06-11': 2,
  '2026-06-12': 1,
  '2026-06-13': 1,
  '2026-06-14': 4,
  // Week 3
  '2026-06-15': 8,
  '2026-06-16': 10,
  '2026-06-17': 25,
  '2026-06-18': 22,
  '2026-06-19': 4,
  '2026-06-20': 3,
  '2026-06-21': 2,
  '2026-06-22': 3,
  '2026-06-23': 3
}; // Total 100 users

let userCounter = 1;
const users = [];

for (const [dateStr, count] of Object.entries(dailyNewUsers)) {
  for (let i = 0; i < count; i++) {
    const source = Math.random() < 0.95 ? (Math.random() < 0.6 ? 'facebook_ad' : 'facebook_group') : 'tiktok_video';
    const type = Math.random() < 0.6 ? 'active' : (Math.random() < 0.5 ? 'newbie' : 'churned');
    
    const hour = Math.floor(Math.random() * 14) + 8;
    const minute = Math.floor(Math.random() * 60);
    const joinDate = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00+07:00`);
    
    users.push({ id: `session_fake_u${userCounter}`, type, source, joinDate });
    userCounter++;
  }
}

let dropOffCount = 0;
let faceScansCount = 0;
let chatCount = 0;

users.forEach(user => {
  const { joinDate, id } = user;
  
  // 1. Visit landing page
  events.push({ session_id: id, event_name: 'page_view', page_path: '/', metadata: { source: user.source }, created_at: joinDate.toISOString() });
  
  // 2. Start quiz
  const quizDate = new Date(joinDate.getTime() + 2 * 60000);
  events.push({ session_id: id, event_name: 'quiz_start', page_path: '/quiz', metadata: {}, created_at: quizDate.toISOString() });
  
  for(let step=1; step<=3; step++) {
    const stepDate = new Date(quizDate.getTime() + step * 10000);
    events.push({ session_id: id, event_name: 'quiz_step_view', page_path: '/quiz', metadata: { step }, created_at: stepDate.toISOString() });
  }

  // Exactly 2 users out of 100 drop off at step 3 -> 98/100 = 98% completion rate
  if (dropOffCount < 2) {
    dropOffCount++;
    return; // Stop generating events for this user
  }

  for(let step=4; step<=6; step++) {
    const stepDate = new Date(quizDate.getTime() + step * 10000);
    events.push({ session_id: id, event_name: 'quiz_step_view', page_path: '/quiz', metadata: { step }, created_at: stepDate.toISOString() });
  }

  // Exactly 40 face scans total
  if (faceScansCount < 40) {
    faceScansCount++;
    const scanDate = new Date(quizDate.getTime() + 65000);
    events.push({ session_id: id, event_name: 'ai_face_scan_start', page_path: '/quiz', metadata: {}, created_at: scanDate.toISOString() });
    events.push({ session_id: id, event_name: 'ai_face_scan_success', page_path: '/quiz', metadata: { detectedType: 'oily' }, created_at: new Date(scanDate.getTime() + 5000).toISOString() });
  }

  // Complete quiz (49 times)
  const completeDate = new Date(quizDate.getTime() + 80000);
  events.push({ session_id: id, event_name: 'quiz_complete', page_path: '/results', metadata: { skinType: 'oily' }, created_at: completeDate.toISOString() });

  const resultsDate = new Date(completeDate.getTime() + 20000);
  events.push({ session_id: id, event_name: 'add_to_routine', page_path: '/results', metadata: { category: 'cleanser' }, created_at: resultsDate.toISOString() });

  if (user.type === 'active') {
    const returnDaysCount = Math.floor(Math.random() * 4) + 1;
    for(let i = 1; i <= returnDaysCount; i++) {
      const returnDate = new Date(joinDate.getTime() + (i * 24 * 60 * 60 * 1000));
      if (returnDate > new Date()) continue;

      events.push({ session_id: id, event_name: 'page_view', page_path: '/dashboard', metadata: {}, created_at: returnDate.toISOString() });
      
      const pmDate = new Date(returnDate.getTime() + 10 * 60 * 60 * 1000);
      events.push({ session_id: id, event_name: 'page_view', page_path: '/dashboard', metadata: {}, created_at: pmDate.toISOString() });
      events.push({ session_id: id, event_name: 'routine_completed_toggle', page_path: '/dashboard', metadata: { period: 'PM' }, created_at: new Date(pmDate.getTime() + 5000).toISOString() });

      // Exactly 2 chat interactions total
      if (chatCount < 2) {
        chatCount++;
        const chatDate = new Date(pmDate.getTime() + 20000);
        events.push({ session_id: id, event_name: 'ai_chat_send', page_path: '/dashboard', metadata: { length: 25 }, created_at: chatDate.toISOString() });
        events.push({ session_id: id, event_name: 'ai_chat_receive', page_path: '/dashboard', metadata: {}, created_at: new Date(chatDate.getTime() + 3000).toISOString() });
      }
    }
  }
});

// Sort chronologically
events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

async function run() {
  console.log(`Generated ${events.length} fake tracking events.`);
  
  if (supabase) {
    console.log('Clearing old Supabase tracking events...');
    await supabase.from('tracking_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Inserting into Supabase...');
    for(let i = 0; i < events.length; i += 100) {
      const batch = events.slice(i, i + 100);
      const { error } = await supabase.from('tracking_events').insert(batch);
      if (error) console.error('Supabase batch insertion failed:', error.message);
    }
    console.log('✅ Successfully inserted into Supabase database!');
  }

  const localPath = path.join(__dirname, '../src/data/tracking_logs.json');
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.writeFileSync(localPath, JSON.stringify(events, null, 2));
  console.log(`✅ Successfully wrote to local fallback: ${localPath}`);
}

run();
