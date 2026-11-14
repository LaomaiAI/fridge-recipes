import type { ShoppingItem } from '../lib/match'

interface Props {
  items: ShoppingItem[]
  checked: Set<string>
  onToggleCheck: (name: string) => void
  onClear: () => void
}

export default function ShoppingList({ items, checked, onToggleCheck, onClear }: Props) {
  if (items.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">买菜清单</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          清单还是空的。在“菜谱”页点“加入买菜清单”，或者在“一周食谱”页
          生成计划后点“把本周缺失食材加入买菜清单”，缺的东西会自动汇总到这里。
        </p>
      </section>
    )
  }

  const done = items.filter((i) => checked.has(i.name)).length

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">买菜清单</h2>
        <span className="text-sm text-stone-500">
          已买 {done}/{items.length}
          <button
            type="button"
            onClick={onClear}
            className="ml-2 text-amber-700 underline"
          >
            清空清单
          </button>
        </span>
      </div>
      <ul className="mt-3 divide-y divide-stone-100">
        {items.map((item) => {
          const isChecked = checked.has(item.name)
          return (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => onToggleCheck(item.name)}
                className="flex w-full items-start gap-3 py-3 text-left"
              >
                <span
                  className={
                    isChecked
                      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-green-500 bg-green-500 text-xs text-white'
                      : 'mt-0.5 h-5 w-5 shrink-0 rounded border border-stone-300'
                  }
                >
                  {isChecked ? '✓' : ''}
                </span>
                <span className={isChecked ? 'text-stone-400 line-through' : ''}>
                  <span className="font-medium">{item.name}</span>
                  {item.amounts.length > 0 && (
                    <span className="ml-2 text-sm text-stone-500">
                      {item.amounts.join(' / ')}
                    </span>
                  )}
                  <span className="block text-xs text-stone-400">
                    做 {item.dishCount} 道菜要用：{item.dishes.join('、')}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-stone-400">
        清单按缺失食材汇总，同名食材只出现一次；调料默认厨房常备，不进清单。
      </p>
    </section>
  )
}
