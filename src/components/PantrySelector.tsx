import { useMemo, useState } from 'react'
import { PANTRY_GROUPS } from '../data/ingredients'

interface Props {
  selected: Set<string>
  onToggle: (name: string) => void
  onClear: () => void
}

export default function PantrySelector({ selected, onToggle, onClear }: Props) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim()
    if (!q) return PANTRY_GROUPS
    return PANTRY_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((name) => name.includes(q)),
    })).filter((g) => g.items.length > 0)
  }, [query])

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">冰箱里有什么</h2>
        <span className="text-sm text-stone-500">
          已选 {selected.size} 样
          {selected.size > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="ml-2 text-amber-700 underline"
            >
              清空
            </button>
          )}
        </span>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜食材，比如：番茄、鸡蛋"
        className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
      />
      {groups.length === 0 && (
        <p className="mt-3 text-sm text-stone-500">没找到这个食材，换个关键词试试。</p>
      )}
      {groups.map((g) => (
        <div key={g.category} className="mt-3">
          <h3 className="text-sm font-semibold text-stone-500">{g.category}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {g.items.map((name) => {
              const active = selected.has(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggle(name)}
                  className={
                    active
                      ? 'rounded-full bg-amber-500 px-3 py-1.5 text-sm font-medium text-white'
                      : 'rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700'
                  }
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <p className="mt-3 text-xs leading-relaxed text-stone-400">
        盐、油、酱油、醋、葱姜蒜等常备调料默认厨房都有，不用勾选，也不会出现在买菜清单里。
      </p>
    </section>
  )
}
