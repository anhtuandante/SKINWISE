"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/store/user-store";
import { useSkinStore } from "@/store/useSkinStore";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  syncLocalToCloud: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  syncLocalToCloud: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const syncingRef = useRef(false);

  const syncLocalToCloud = async () => {
    if (!user) return;
    const userState = useUserStore.getState();
    const skinState = useSkinStore.getState();
    
    // 1. Sync Profile
    const profileData = {
      skin_type: userState.skinType,
      concerns: userState.concerns,
      budget: userState.budget,
      allergies: userState.allergies,
      quiz_completed: userState.quizCompleted,
      barrier: userState.barrier,
      barrier_status: userState.barrierStatus,
      lifestyle: userState.lifestyle,
      preference: userState.preference,
      title: userState.title,
      main_goal: userState.mainGoal,

      age: userState.birthYear ? String(userState.birthYear) : "",
      gender: userState.gender,
      environment: userState.environment,
      makeup_frequency: userState.makeupFrequency,
      texture_preference: userState.texturePreference,
      active_ingredients: userState.activeIngredients,
      avoided_ingredients: userState.avoidedIngredients,
      cycle_start_date: userState.cycleStartDate,
      cycle_length: userState.cycleLength,
    };
    
    await supabase.from("profiles").upsert({ id: user.id, ...profileData });

    // 2. Sync Diary Logs
    if (skinState.diaryLogs.length > 0) {
      const logsToInsert = skinState.diaryLogs.map(log => ({
        user_id: user.id,
        date: log.date,
        day_name: log.dayName,
        mood: log.mood,
        is_partial: log.isPartial || false,
        source: log.source || 'manual',
        metrics: log.metrics,
        ai_original_metrics: log.aiOriginalMetrics || null,
        user_corrected: log.userCorrected || false,

        lifestyle: log.lifestyle || [],
        note: log.note || '',
        image: (log.images && log.images.length > 0) ? log.images[0] : null,
        am_routine_completed: log.amRoutineCompleted || false,
        pm_routine_completed: log.pmRoutineCompleted || false,
      }));
      
      await supabase.from("diary_logs").upsert(logsToInsert, { onConflict: 'user_id,date' });
    }
  };

  const fetchCloudData = async (userId: string) => {
    syncingRef.current = true;
    try {
       // Fetch Profile
       const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
       if (profile) {
          useUserStore.setState({
            skinType: profile.skin_type || "",
            concerns: profile.concerns || [],
            budget: profile.budget || "",
            allergies: profile.allergies || "",
            quizCompleted: profile.quiz_completed || false,
            barrier: profile.barrier || "",
            barrierStatus: profile.barrier_status || "stable",
            lifestyle: profile.lifestyle || [],
            preference: profile.preference || "",
            title: profile.title || "",
            mainGoal: profile.main_goal || "",

            birthYear: profile.age ? parseInt(profile.age) : undefined,
            gender: profile.gender || "",
            environment: profile.environment || "",
            makeupFrequency: profile.makeup_frequency || "",
            texturePreference: profile.texture_preference || "",
            activeIngredients: profile.active_ingredients || [],
            avoidedIngredients: profile.avoided_ingredients || [],
            cycleStartDate: profile.cycle_start_date || "",
            cycleLength: profile.cycle_length || 28,
          });
       }

       // Fetch Diary Logs
       const { data: logs } = await supabase.from("diary_logs").select("*").eq("user_id", userId);
       if (logs && logs.length > 0) {
          const formattedLogs = logs.map(log => ({
            id: log.id,
            date: log.date,
            dayName: log.day_name,
            mood: log.mood,
            isPartial: log.is_partial,
            source: log.source,
            metrics: log.metrics,
            aiOriginalMetrics: log.ai_original_metrics,
            userCorrected: log.user_corrected,

            lifestyle: log.lifestyle,
            note: log.note,
            images: log.image ? [log.image] : [],
            amRoutineCompleted: log.am_routine_completed,
            pmRoutineCompleted: log.pm_routine_completed,
          }));
          useSkinStore.getState().setDiaryLogs(formattedLogs);
       }
    } finally {
       setTimeout(() => { syncingRef.current = false; }, 1000);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchCloudData(session.user.id);
      }
      setIsLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user && _event === 'SIGNED_IN') {
           await fetchCloudData(session.user.id);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const unsubUser = useUserStore.subscribe((state) => {
      if (syncingRef.current || !state.isHydrated) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const profileData = {
          skin_type: state.skinType,
          concerns: state.concerns,
          budget: state.budget,
          allergies: state.allergies,
          quiz_completed: state.quizCompleted,
          barrier: state.barrier,
          barrier_status: state.barrierStatus,
          lifestyle: state.lifestyle,
          preference: state.preference,
          title: state.title,
          main_goal: state.mainGoal,

          age: state.birthYear ? String(state.birthYear) : "",
          gender: state.gender,
          environment: state.environment,
          makeup_frequency: state.makeupFrequency,
          texture_preference: state.texturePreference,
          active_ingredients: state.activeIngredients,
          avoided_ingredients: state.avoidedIngredients,
          cycle_start_date: state.cycleStartDate,
          cycle_length: state.cycleLength,
        };
        await supabase.from("profiles").update(profileData).eq("id", user.id);
      }, 2000);
    });

    const unsubSkin = useSkinStore.subscribe(async (state, prevState) => {
      if (syncingRef.current || !state.isHydrated) return;
      if (state.diaryLogs !== prevState.diaryLogs) {
         const logsToInsert = state.diaryLogs.map(log => ({
            user_id: user.id,
            date: log.date,
            day_name: log.dayName,
            mood: log.mood,
            is_partial: log.isPartial || false,
            source: log.source || 'manual',
            metrics: log.metrics,
            ai_original_metrics: log.aiOriginalMetrics || null,
            user_corrected: log.userCorrected || false,

            lifestyle: log.lifestyle || [],
            note: log.note || '',
            image: (log.images && log.images.length > 0) ? log.images[0] : null,
            am_routine_completed: log.amRoutineCompleted || false,
            pm_routine_completed: log.pmRoutineCompleted || false,
          }));
          await supabase.from("diary_logs").upsert(logsToInsert, { onConflict: 'user_id,date' });
      }
    });

    return () => {
      unsubUser();
      unsubSkin();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    useUserStore.getState().resetQuiz();
    useSkinStore.getState().clearJournal();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, syncLocalToCloud }}>
      {children}
    </AuthContext.Provider>
  );
}
