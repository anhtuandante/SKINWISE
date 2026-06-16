/**
 * SkinWise Web Event Tracking Library
 * Handles client-side event generation, session management, and asynchronous posting.
 */

// Unique types of events we track
export type TrackingEventName =
  | "page_view"             // Page viewed
  | "quiz_start"            // User clicks "Bắt đầu" or enters the quiz
  | "quiz_step_view"        // A quiz step is displayed
  | "quiz_answer"           // User selects an option in the quiz
  | "quiz_complete"         // User completes the quiz, shows results
  | "ai_face_scan_start"    // User opens the face scan modal
  | "ai_face_scan_success"  // Face scan successfully detects skin type
  | "product_click"         // User clicks on a product details or image
  | "shopee_click"          // User clicks the Shopee purchase link
  | "add_to_routine"        // User adds a product to AM or PM routine
  | "remove_from_routine"   // User removes a product from AM or PM routine
  | "routine_reorder"       // User reorders routine using drag and drop
  | "conflict_detected"     // Routine builder warns of a product conflict
  | "ai_chat_send"          // User sends a message to AI Advisor
  | "ai_chat_receive"       // AI Advisor responds
  | "ingredient_search"     // User searches for ingredients in the encyclopedia
  | "ingredient_click"     // User clicks a specific ingredient card
  | "routine_completed_toggle" // User checks off routine completed
  | "product_marked_owned"  // User marks a product as owned
  | "wallet_suggestion_add" // User adds AI suggested product
  | "wallet_upgrade_swap"  // User upgrades a product in routine
  | "vision_saved_to_diary" // User saves AI face scan results to diary
  | "survey_dismissed"     // User dismisses feedback survey
  | "survey_click"         // User clicks to open feedback survey
  | "quiz_retake_start"    // User starts a quiz retake
  | "quiz_retake_complete" // User completes a quiz retake
  | "retake_reminder_click"    // User clicks retake reminder banner
  | "retake_reminder_dismissed"; // User dismisses retake reminder

// Generate a random UUID-like string
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "session_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Retrieve or initialize the session ID
let cachedSessionId: string | null = null;

export function getSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  
  if (cachedSessionId) return cachedSessionId;
  
  try {
    let sid = sessionStorage.getItem("skinwise_session_id");
    if (!sid) {
      sid = generateSessionId();
      sessionStorage.setItem("skinwise_session_id", sid);
    }
    cachedSessionId = sid;
    return sid;
  } catch {
    // Fallback if sessionStorage is disabled/blocked
    const fallbackId = "fallback_" + Math.random().toString(36).substring(2, 10);
    cachedSessionId = fallbackId;
    return fallbackId;
  }
}

/**
 * Tracks a user interaction event.
 * @param eventName Name of the action being tracked
 * @param metadata Additional context for the event
 */
export function trackEvent(
  eventName: TrackingEventName,
  metadata: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  const pagePath = window.location.pathname;

  const payload = {
    session_id: sessionId,
    event_name: eventName,
    page_path: pagePath,
    metadata
  };

  // Perform fire-and-forget background fetch
  fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    // Use keepalive to ensure the request completes even if the user navigates away
    keepalive: true
  }).catch((err) => {
    console.error(`[Tracking Error] Failed to track event ${eventName}:`, err);
  });
}
