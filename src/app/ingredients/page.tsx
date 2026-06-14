"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import ingredientsData from "@/data/ingredients.json"
import { Ingredient } from "@/types"
import { SKIN_LABELS } from "@/lib/constants"
import { trackEvent } from "@/lib/tracking"
import { supabase } from "@/lib/supabase"
import { useUserStore } from "@/store/user-store"

const allIngredients = (ingredientsData as { ingredients: Ingredient[] }).ingredients

const CATEGORY_LABELS: Record<string, string> = {
  brightening: "Sáng da",
  "anti-aging": "Chống lão hóa",
  hydrating: "Cấp ẩm",
  exfoliant: "Tẩy da chết",
  soothing: "Làm dịu",
  barrier: "Hàng rào",
  "acne-fighting": "Trị mụn",
  moisturizing: "Dưỡng ẩm",
  antioxidant: "Chống oxy hóa",
  texture: "Kết cấu",
  sunscreen: "Chống nắng",
  solvent: "Dung môi",
}



export default function IngredientsPage() {
  const user = useUserStore()
  const [ingredients, setIngredients] = useState<Ingredient[]>(allIngredients)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = useMemo(() => {
    return Array.from(new Set(ingredients.map((i) => i.category)))
  }, [ingredients])

  // Load ingredients from Supabase
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("*");
        
        if (!error && data && data.length > 0) {
          const mapped: Ingredient[] = data.map((i) => ({
            id: i.id,
            name: i.name,
            nameVi: i.name_vi,
            category: i.category,
            benefits: i.benefits || [],
            skinTypes: i.skin_types || [],
            timeOfDay: i.time_of_day as Ingredient["timeOfDay"],
            pregnancy: i.pregnancy,
            conflictsWith: i.conflicts_with || []
          }));
          setIngredients(mapped);
        }
      } catch (err) {
        console.warn("Failed to load ingredients from Supabase, using local fallback:", err);
      }
    };
    loadIngredients();
  }, []);

  // Track search queries with 500ms debounce
  useEffect(() => {
    if (!search.trim()) return;
    const timer = setTimeout(() => {
      trackEvent("ingredient_search", { query: search });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        !search ||
        ing.name.toLowerCase().includes(search.toLowerCase()) ||
        ing.nameVi.toLowerCase().includes(search.toLowerCase())
      const matchesCat = !selectedCategory || ing.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [ingredients, search, selectedCategory])

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-screen-lg mx-auto px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-[0.2em] text-muted">Bách khoa thành phần</p>
            <h1 className="text-headline font-semibold">Tìm hiểu trước khi bôi lên da</h1>
          </div>
          <Link 
            href={user.quizCompleted ? "/dashboard" : "/quiz"} 
            className="text-caption text-muted hover:text-fg transition-colors"
          >
            {user.quizCompleted ? "← Quay lại Workspace" : "← Quay lại quiz"}
          </Link>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-6 py-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tiếng Việt hoặc tiếng Anh..."
            className="w-full sm:w-1/2 border border-line rounded-xl px-4 py-3 bg-white focus:border-fg outline-none transition-colors"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg border text-caption transition-all ${
                selectedCategory === null ? "border-fg bg-surface" : "border-line hover:border-fg/60"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-caption transition-all ${
                  selectedCategory === cat ? "border-fg bg-surface" : "border-line hover:border-fg/60"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map((ing) => {
            const expanded = expandedId === ing.id
            return (
              <div
                key={ing.id}
                className="border border-line rounded-xl p-4 hover:border-fg/50 transition-all bg-white shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0 bg-gradient-to-br from-accent-light to-accent shadow-sm">
                      {ing.nameVi[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-body font-semibold">{ing.nameVi}</div>
                      <div className="text-caption text-muted">{ing.name}</div>
                      <div className="text-caption text-muted mt-1">{CATEGORY_LABELS[ing.category] || ing.category}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nextState = !expanded;
                      if (nextState) {
                        trackEvent("ingredient_click", { ingredientId: ing.id, name: ing.name });
                      }
                      setExpandedId(nextState ? ing.id : null);
                    }}
                    className="text-caption text-muted hover:text-fg transition-colors"
                  >
                    {expanded ? "Thu gọn" : "Chi tiết"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-caption text-muted">
                  {(Array.isArray(ing.skinTypes) ? ing.skinTypes : ["all"]).map((st) => (
                    <span key={st} className="px-2 py-1 rounded-md bg-surface border border-line">
                      {SKIN_LABELS[st] || st}
                    </span>
                  ))}
                  <span className="px-2 py-1 rounded-md bg-surface border border-line">{ing.timeOfDay}</span>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-2 text-body text-muted">
                    <div className="font-semibold text-fg">Lợi ích</div>
                    <ul className="list-disc list-inside space-y-1">
                      {ing.benefits.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <div className="text-caption">An toàn thai kỳ: {ing.pregnancy ? "Có" : "Không"}</div>
                    {ing.conflictsWith && (
                      <div className="text-caption">
                        Tránh kết hợp với: {ing.conflictsWith.map((c) => c).join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
