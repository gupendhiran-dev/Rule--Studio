import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type SimResult } from '../lib/data';

type Props = {
  results: SimResult[];
  baseScore?: number;
};

type WaterfallBar = {
  name: string;
  shortName: string;
  value: number;
  start: number;
  end: number;
  type: 'base' | 'rule' | 'final';
  triggered: boolean;
};

const BAR_COLORS = {
  base: '#6B7280',
  rule_triggered: '#00C853',
  rule_not: '#E5E7EB',
  final_safe: '#00C853',
  final_warn: '#F97316',
  final_danger: '#D32F2F',
};

function truncate(s: string, n = 22) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function finalColor(score: number) {
  if (score >= 70) return BAR_COLORS.final_danger;
  if (score >= 30) return BAR_COLORS.final_warn;
  return BAR_COLORS.final_safe;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: WaterfallBar = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white border border-jumio-border rounded-lg shadow-lg p-3 text-xs max-w-[220px]">
      <p className="font-semibold text-jumio-text mb-1">{d.name}</p>
      {d.type === 'base' && <p className="text-gray-500">Starting base risk score</p>}
      {d.type === 'rule' && (
        <div className="space-y-0.5">
          <p className={d.triggered ? 'text-green-600 font-medium' : 'text-gray-400'}>
            {d.triggered ? '✓ Rule triggered' : '○ Not triggered'}
          </p>
          {d.triggered && <p className="text-gray-600">Score contribution: <strong>+{d.value}</strong></p>}
          <p className="text-gray-500">Running total: <strong>{d.end}</strong></p>
        </div>
      )}
      {d.type === 'final' && (
        <div className="space-y-0.5">
          <p className="text-gray-600 font-medium">Final Risk Score: <strong>{d.value}</strong></p>
          <p className={d.value >= 70 ? 'text-red-600' : d.value >= 30 ? 'text-orange-500' : 'text-green-600'}>
            {d.value >= 70 ? '🔴 High Risk' : d.value >= 30 ? '🟡 Moderate Risk' : '🟢 Low Risk'}
          </p>
        </div>
      )}
    </div>
  );
};

// Custom bar shape that renders as a floating waterfall bar
const WaterfallBarShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || payload.type === 'rule' && !payload.triggered) {
    // Render a ghost outline for non-triggered rules
    return (
      <rect
        x={x} y={y} width={width} height={Math.max(height, 2)}
        fill="#F3F4F6" stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 2"
        rx={3}
      />
    );
  }
  let fill = BAR_COLORS.base;
  if (payload.type === 'rule') fill = BAR_COLORS.rule_triggered;
  if (payload.type === 'final') fill = finalColor(payload.value);
  return (
    <rect x={x} y={y} width={width} height={Math.max(height, 4)} fill={fill} rx={3} />
  );
};


export default function ScoreJourney({ results, baseScore = 0 }: Props) {
  const triggered = results.filter(r => r.triggered);

  // Build waterfall data
  const bars: WaterfallBar[] = [];
  let running = baseScore;

  // Base score bar
  bars.push({
    name: 'Base Score',
    shortName: 'Base',
    value: baseScore,
    start: 0,
    end: baseScore,
    type: 'base',
    triggered: true,
  });

  // One bar per triggered rule
  results.forEach(r => {
    const contribution = r.triggered ? r.scoreContribution : 0;
    bars.push({
      name: r.ruleName,
      shortName: truncate(r.ruleName, 18),
      value: contribution,
      start: running,
      end: Math.min(100, running + contribution),
      type: 'rule',
      triggered: r.triggered,
    });
    if (r.triggered) running = Math.min(100, running + contribution);
  });

  // Final score
  const finalScore = Math.min(100, running);
  bars.push({
    name: 'Final Score',
    shortName: 'Final',
    value: finalScore,
    start: 0,
    end: finalScore,
    type: 'final',
    triggered: true,
  });

  // For recharts waterfall: each bar needs [invisible_start, visible_value]
  const chartData = bars.map(b => ({
    ...b,
    invisible: b.type === 'base' || b.type === 'final' ? 0 : b.start,
    visible: b.type === 'rule' && !b.triggered ? 4 : // show a tiny placeholder
              b.type === 'base' || b.type === 'final' ? b.value : b.value,
    label: b.type === 'rule' && !b.triggered ? '–' : `+${b.value}`,
  }));

  // Custom label on top of bars
  const CustomLabel = (props: any) => {
    const { x, y, width, index } = props;
    const bar = bars[index];
    if (!bar) return null;
    let label = '';
    if (bar.type === 'base') label = String(bar.value);
    else if (bar.type === 'final') label = String(bar.value);
    else if (bar.triggered) label = `+${bar.value}`;
    else return null;

    const color = bar.type === 'final' ? finalColor(bar.value) :
                  bar.type === 'base' ? '#6B7280' : '#00C853';
    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle"
        fill={color} fontSize={11} fontWeight={600}>
        {label}
      </text>
    );
  };


  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-jumio-text text-sm">Score Journey</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How the final risk score was calculated step by step
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Final Score</div>
            <div className={`text-2xl font-bold leading-none mt-0.5 ${finalScore >= 70 ? 'text-red-600' : finalScore >= 30 ? 'text-orange-500' : 'text-jumio-green'}`}>
              {finalScore}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${finalScore >= 70 ? 'bg-red-600' : finalScore >= 30 ? 'bg-orange-500' : 'bg-jumio-green'}`}>
            {finalScore >= 70 ? 'HIGH' : finalScore >= 30 ? 'MED' : 'LOW'}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 8 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey="shortName"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={chartData.length > 8 ? -30 : 0}
              textAnchor={chartData.length > 8 ? 'end' : 'middle'}
              height={chartData.length > 8 ? 50 : 28}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            {/* Threshold reference lines */}
            <ReferenceLine y={29} stroke="#FCD34D" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '29', position: 'right', fontSize: 9, fill: '#D97706' }} />
            <ReferenceLine y={70} stroke="#FCA5A5" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: '70', position: 'right', fontSize: 9, fill: '#DC2626' }} />
            {/* Invisible stacking base (for waterfall float) */}
            <Bar dataKey="invisible" stackId="w" fill="transparent" />
            {/* Visible bar */}
            <Bar dataKey="visible" stackId="w" shape={<WaterfallBarShape />} label={<CustomLabel />}>
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-gray-400 flex-shrink-0" />Base score
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: '#00C853' }} />Rule triggered
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded border border-dashed border-gray-300 flex-shrink-0" />Not triggered
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: finalColor(finalScore) }} />Final score
        </div>
      </div>

      {/* Step-by-step text summary */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Score Breakdown</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-gray-600">Base Risk Score</span>
          <span className="ml-auto font-mono font-semibold text-gray-700">{baseScore}</span>
        </div>
        {results.filter(r => r.triggered).map(r => (
          <div key={r.ruleId} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#00C853' }} />
            <span className="text-gray-600 truncate flex-1">{r.ruleName}</span>
            <span className="ml-auto font-mono font-semibold text-green-600 flex-shrink-0">+{r.scoreContribution}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-1.5 flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: finalColor(finalScore) }} />
          <span className="font-semibold text-gray-700">Final Score</span>
          {finalScore === 100 && baseScore + triggered.reduce((s, r) => s + r.scoreContribution, 0) > 100 && (
            <span className="text-[10px] text-gray-400">(capped at 100)</span>
          )}
          <span className="ml-auto font-mono font-bold text-base" style={{ color: finalColor(finalScore) }}>{finalScore}</span>
        </div>
      </div>
    </div>
  );
}
