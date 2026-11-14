import { useEffect, useMemo, useState } from 'react'
import PantrySelector from './components/PantrySelector'
import RecipeCard from './components/RecipeCard'
import ShoppingList from './components/ShoppingList'
import WeekPlan from './components/WeekPlan'
import { RECIPES } from './data/recipes'
import {
  aggregateShoppingList,
  generateWeekPlan,
  matchRecipes,
} from './lib/match'

type Tab = 'recipes' | 'plan' | 'list'

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveSet(key: string, value: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(value)))
}

function loadSeed(): number | null {
  const raw = localStorage.getItem('fridge-recipes:plan-seed')
  return raw === null ? null : Number(raw)
}

export default function App() {
  const [tab, setTab] = useState<Tab>('recipes')
  const [selected, setSelected] = useState<Set<string>>(() =>
    loadSet('fridge-recipes:pantry'),
  )
  const [picked, setPicked] = useState<Set<string>>(() =>
    loadSet('fridge-recipes:picked'),
  )
  const [planSeed, setPlanSeed] = useState<number | null>(loadSeed)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() =>
    loadSet('fridge-recipes:checked'),
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => saveSet('fridge-recipes:pantry', selected), [selected])
  useEffect(() => saveSet('fridge-recipes:picked', picked), [picked])
  useEffect(() => saveSet('fridge-recipes:checked', checkedItems), [checkedItems])
  useEffect(() => {
    if (planSeed === null) {
      localStorage.removeItem('fridge-recipes:plan-seed')
    } else {
      localStorage.setItem('fridge-recipes:plan-seed', String(planSeed))
    }
  }, [planSeed])

  const matches = useMemo(() => matchRecipes(selected), [selected])
  const readyCount = matches.filter((m) => m.status === 'ready').length
  const almostCount = matches.filter((m) => m.status === 'almost').length

  const plan = useMemo(
    () => (planSeed === null ? null : generateWeekPlan(matches, planSeed)),
    [matches, planSeed],
  )

  const shoppingItems = useMemo(() => {
    const ids = new Set(picked)
    if (plan) {
      for (const day of plan) {
        if (day.lunch) ids.add(day.lunch.id)
        if (day.dinner) ids.add(day.dinner.id)
      }
    }
    const results = matches.filter((m) => ids.has(m.recipe.id))
    return aggregateShoppingList(results)
  }, [matches, picked, plan])

  const toggleSelected = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const togglePicked = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleChecked = (name: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const addPlanToList = () => {
    if (!plan) return
    setPicked((prev) => {
      const next = new Set(prev)
      for (const day of plan) {
        if (day.lunch) next.add(day.lunch.id)
        if (day.dinner) next.add(day.dinner.id)
      }
      return next
    })
    setTab('list')
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'recipes', label: '菜谱' },
    { id: 'plan', label: '一周食谱' },
    { id: 'list', label: '买菜清单', badge: shoppingItems.length },
  ]

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16">
      <header className="py-6 text-center">
        <h1 className="text-2xl font-bold">冰箱食材菜谱</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          打开冰箱，勾上已有的食材，马上知道今晚能做什么菜、还缺什么。
        </p>
        <p className="mt-1 text-xs text-stone-400">
          菜谱库 {RECIPES.length} 道家常菜 · 匹配全部在本地计算，不上传任何数据
        </p>
      </header>

      <nav className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white'
                : 'flex-1 rounded-lg bg-white px-3 py-2 text-sm text-stone-700 shadow-sm'
            }
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && ` (${t.badge})`}
          </button>
        ))}
      </nav>

      {tab === 'recipes' && (
        <div className="space-y-4">
          <PantrySelector
            selected={selected}
            onToggle={toggleSelected}
            onClear={() => setSelected(new Set())}
          />
          <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
            {selected.size === 0 ? (
              <p className="text-stone-600">
                先勾选冰箱里的食材，下面会按“缺得最少”排出能做的菜。
              </p>
            ) : (
              <p>
                食材齐全 <span className="font-bold text-green-700">{readyCount} 道</span>
                ，只差 1 样{' '}
                <span className="font-bold text-amber-700">{almostCount} 道</span>，
                全部 {matches.length} 道按缺失食材数从少到多排列。
              </p>
            )}
          </div>
          {matches.map((result) => (
            <RecipeCard
              key={result.recipe.id}
              result={result}
              expanded={expandedId === result.recipe.id}
              onToggleExpand={() =>
                setExpandedId((prev) =>
                  prev === result.recipe.id ? null : result.recipe.id,
                )
              }
              picked={picked.has(result.recipe.id)}
              onTogglePick={() => togglePicked(result.recipe.id)}
            />
          ))}
        </div>
      )}

      {tab === 'plan' && (
        <WeekPlan
          plan={plan}
          readyCount={readyCount}
          almostCount={almostCount}
          onGenerate={() => setPlanSeed(Math.floor(Math.random() * 1000000))}
          onShuffle={() => setPlanSeed(Math.floor(Math.random() * 1000000))}
          onAddPlanToList={addPlanToList}
        />
      )}

      {tab === 'list' && (
        <ShoppingList
          items={shoppingItems}
          checked={checkedItems}
          onToggleCheck={toggleChecked}
          onClear={() => {
            setPicked(new Set())
            setCheckedItems(new Set())
          }}
        />
      )}

      <footer className="mt-8 text-center text-xs leading-relaxed text-stone-400">
        <p>
          菜谱用量与做法按家庭常见做法编写，仅供参考；口味请按自家习惯调整。
        </p>
        <p className="mt-1">数据只存在你的浏览器本地，不上传、不收集。</p>
      </footer>
    </div>
  )
}
