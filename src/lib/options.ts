import type { Payment } from './types';

export const PAYMENT_OPTIONS: { value: Payment; label: string }[] = [
  { value: 'paid', label: '已付' },
  { value: 'unverified', label: '扣款待确认' },
  { value: 'unpaid', label: '已订未付' },
];

export const OFFSET_OPTIONS = [
  { value: '', label: '未填写（按订单补充）' },
  { value: '+09:00', label: 'UTC+09:00 日本时间' },
  { value: '+08:00', label: 'UTC+08:00 中国时间' },
  { value: '-08:00', label: 'UTC−08:00 温哥华冬令时' },
  { value: '+00:00', label: 'UTC' },
];
