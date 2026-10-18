import type { ChecklistGroup, ChecklistItem } from './types';

export const GROUP_LABEL: Record<ChecklistGroup, string> = {
  docs: '证件签证',
  flight: '航班',
  hotel: '酒店',
  car: '租车',
  ski: '雪票',
  insurance: '保险',
  luggage: '行李',
  gear: '装备',
  food: '餐厅',
  plan: '行程',
};

export const GROUP_ORDER: ChecklistGroup[] = ['docs', 'flight', 'hotel', 'car', 'ski', 'insurance', 'luggage', 'gear', 'food', 'plan'];

/** Priority first, then items with a due date (soonest first), then the rest in list order. */
export function sortTodos(items: ChecklistItem[]): ChecklistItem[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      if (a.item.priority !== b.item.priority) return a.item.priority ? -1 : 1;
      const da = a.item.due || '9999';
      const db = b.item.due || '9999';
      if (da !== db) return da < db ? -1 : 1;
      return a.i - b.i;
    })
    .map((x) => x.item);
}
