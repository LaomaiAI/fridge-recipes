import type { DayPlan } from '../lib/match'

interface Props {
  plan: DayPlan[] | null
  readyCount: number
  almostCount: number
  onGenerate: () => void
  onShuffle: () => void
  onAddPlanToList: () => void
}

function MealLine({ label, name, missingNote }: { label: string; name: string | null; missingNote: string }) {
  return (
    <p className="mt-1 text-sm">
      <span className="text-stone-500">{label}：</span>
      {name ? (
        <>
          <span className="font-medium">{name}</span>
          {missingNote && <span className="ml-1 text-xs text-amber-600">{missingNote}</span>}
        </>
      ) : (
        <span className="text-stone-400">去菜市场看看</span>
      )}
    </p>
  )
}

export default function WeekPlan({
  plan,
  readyCount,
  almostCount,
  onGenerate,
  onShuffle,
  onAddPlanToList,
}: Props) {
  if (!plan) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold">一周食谱计划</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          按你冰箱现有的食材，排一份 7 天午餐加晚餐的计划。
          优先排食材齐全的菜，其次排只差 1 样的菜。
          现在能直接做的菜有 {readyCount} 道，只差 1 样的有 {almostCount} 道。
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={readyCount + almostCount === 0}
          className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:bg-stone-300"
        >
          生成一周食谱
        </button>
        {readyCount + almostCount === 0 && (
          <p className="mt-2 text-sm text-stone-500">
            先在“菜谱”页勾选冰箱里的食材，至少凑齐一道菜再来排计划。
          </p>
        )}
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onShuffle}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white"
        >
          换一批
        </button>
        <button
          type="button"
          onClick={onAddPlanToList}
          className="rounded-lg border border-amber-500 px-4 py-2 text-sm text-amber-700"
        >
          把本周缺失食材加入买菜清单
        </button>
      </div>
      {plan.map((day) => (
        <article key={day.day} className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-bold">{day.day}</h3>
          <MealLine
            label="午餐"
            name={day.lunch?.name ?? null}
            missingNote=""
          />
          <MealLine
            label="晚餐"
            name={day.dinner?.name ?? null}
            missingNote=""
          />
        </article>
      ))}
      <p className="text-xs leading-relaxed text-stone-400">
        计划按“食材齐全优先、只差 1 样其次、一周内尽量不重复”排，
        同一份计划每次打开都一样，点“换一批”换一种排法。
      </p>
    </section>
  )
}
