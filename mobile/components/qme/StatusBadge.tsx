import { View, Text } from 'react-native';
import { colors, radius, font } from '../../lib/theme';

type Status = 'waiting' | 'ready' | 'checked_in' | 'cancelled' | 'no_show' | 'active' | 'paused' | 'closed' | 'draft' | 'completed';

const config: Record<string, { bg: string; text: string; label: string }> = {
  waiting:    { bg: '#EFF6FF', text: '#2563EB', label: 'Waiting' },
  ready:      { bg: colors.successBg, text: colors.success, label: 'Ready' },
  checked_in: { bg: colors.successBg, text: colors.success, label: 'Checked In' },
  cancelled:  { bg: colors.dangerBg,  text: colors.danger,  label: 'Cancelled' },
  no_show:    { bg: colors.warningBg, text: colors.warning, label: 'No Show' },
  active:     { bg: colors.successBg, text: colors.success, label: 'Active' },
  paused:     { bg: colors.warningBg, text: colors.warning, label: 'Paused' },
  closed:     { bg: colors.gray100,   text: colors.gray500, label: 'Closed' },
  draft:      { bg: colors.gray100,   text: colors.gray500, label: 'Draft' },
  completed:  { bg: '#EFF6FF',        text: '#2563EB',      label: 'Completed' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? config.closed;
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: font.size.xs, fontWeight: font.weight.bold }}>{c.label}</Text>
    </View>
  );
}
