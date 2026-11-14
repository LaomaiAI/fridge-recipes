import { STAPLE_INGREDIENTS } from '../data/ingredients'
import type { MatchResult } from '../lib/match'

interface Props {
  result: MatchResult
  expanded: boolean
  onToggleExpand: () => void
  picked: boolean
  onTogglePick: () => void
}

function statusBadge(result: MatchResult) {
  if (result.status === 'ready') {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        食材齐全
      </span>
    )
  }
  if (result.status === 'almost') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        只差 1 样
      </span>
    )
  }
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
      还差 {result.missingCount} 样
    </span>
  )
}

export default function RecipeCard({
  result,
  expanded,
  onToggleExpand,
  picked,
  onTogglePick,
}: Props) {
  const { recipe, have, missing } = result
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-start justify-between text-left"
      >
        <div>
          <h3 className="text-base font-bold">{recipe.name}</h3>
          <p className="mt-1 text-xs text-stone-500">
            {recipe.category} · {recipe.difficulty} · 约 {recipe.minutes} 分钟 ·{' '}
            {recipe.servings}
          </p>
        </div>
        {statusBadge(result)}
      </button>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {have.map((name) => (
          <span
            key={name}
            className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
          >
            有 {name}
          </span>
        ))}
        {missing.map((name) => (
          <span
            key={name}
            className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
          >
            缺 {name}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
        >
          {expanded ? '收起做法' : '看做法'}
        </button>
        <button
          type="button"
          onClick={onTogglePick}
          className={
            picked
              ? 'rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white'
              : 'rounded-lg border border-amber-500 px-3 py-1.5 text-sm text-amber-700'
          }
        >
          {picked ? '已加入买菜清单' : '加入买菜清单'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <h4 className="text-sm font-semibold">食材</h4>
          <ul className="mt-2 space-y-1 text-sm">
            {recipe.ingredients.map((ing) => {
              const isStaple = STAPLE_INGREDIENTS.has(ing.name)
              const owned = have.includes(ing.name)
              return (
                <li key={ing.name} className="flex justify-between">
                  <span>
                    {ing.name}
                    {isStaple && (
                      <span className="ml-1 text-xs text-stone-400">常备</span>
                    )}
                  </span>
                  <span className="text-stone-500">
                    {ing.amount}
                    {!isStaple && (
                      <span className={owned ? ' text-green-600' : ' text-amber-600'}>
                        {owned ? '（有）' : '（缺）'}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
          <h4 className="mt-4 text-sm font-semibold">做法</h4>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-stone-400">
            标签：{recipe.tags.join('、')}
          </p>
        </div>
      )}
    </article>
  )
}
