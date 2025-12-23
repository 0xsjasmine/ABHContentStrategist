'use client';

import { useState } from 'react';
import type { TrendingTopic } from '@/app/api/pulse/topics/route';

const BRAND_RED = '#C41E3A';

// Heat level to color
function getHeatColor(heat: number): string {
  if (heat >= 9) return '#DC2626'; // red-600
  if (heat >= 7) return '#EA580C'; // orange-600
  if (heat >= 5) return '#CA8A04'; // yellow-600
  if (heat >= 3) return '#65A30D'; // lime-600
  return '#6B7280'; // gray-500
}

// Topic type badge colors
function getTypeColor(type: string): { bg: string; text: string } {
  switch (type) {
    case 'buzz':
      return { bg: '#FEE2E2', text: '#DC2626' }; // red
    case 'rising':
      return { bg: '#DCFCE7', text: '#16A34A' }; // green
    case 'evergreen':
      return { bg: '#DBEAFE', text: '#2563EB' }; // blue
    default:
      return { bg: '#F3F4F6', text: '#6B7280' }; // gray
  }
}

// Forecast prediction to icon
function getForecastIcon(prediction: string): string {
  switch (prediction) {
    case 'peak': return '📈';
    case 'grow': return '🚀';
    case 'stable': return '➡️';
    case 'fade': return '📉';
    case 'dead': return '💀';
    default: return '❓';
  }
}

interface TopicCardProps {
  topic: TrendingTopic;
}

function TopicCard({ topic }: TopicCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeColors = getTypeColor(topic.topicType);
  const heatColor = getHeatColor(topic.currentHeat);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{topic.displayName}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
              >
                {topic.topicType}
              </span>
            </div>
            <p className="text-xs text-gray-500">{topic.keyword}</p>
          </div>
          {/* Heat indicator */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: heatColor }}
            >
              {topic.currentHeat}
            </div>
            <span className="text-[10px] text-gray-400 mt-1">HEAT</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3">{topic.description}</p>

        {/* Forecast mini view */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-400">Forecast:</span>
          <span title="7 days">
            {getForecastIcon(topic.forecast.sevenDays.prediction)} 7d
          </span>
          <span title="30 days">
            {getForecastIcon(topic.forecast.thirtyDays.prediction)} 30d
          </span>
          <span title="3 months">
            {getForecastIcon(topic.forecast.threeMonths.prediction)} 3mo
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm font-medium w-full text-left"
          style={{ color: BRAND_RED }}
        >
          {isExpanded ? '− Less details' : '+ More details'}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Why trending */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Why It's Trending</h4>
            <p className="text-sm text-gray-700">{topic.whyTrending}</p>
          </div>

          {/* Forecast breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Growth Forecast</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">7 Days</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{topic.forecast.sevenDays.reasoning}</span>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getHeatColor(topic.forecast.sevenDays.heatLevel) }}
                  >
                    {topic.forecast.sevenDays.heatLevel} {getForecastIcon(topic.forecast.sevenDays.prediction)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">30 Days</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{topic.forecast.thirtyDays.reasoning}</span>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getHeatColor(topic.forecast.thirtyDays.heatLevel) }}
                  >
                    {topic.forecast.thirtyDays.heatLevel} {getForecastIcon(topic.forecast.thirtyDays.prediction)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">3 Months</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{topic.forecast.threeMonths.reasoning}</span>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: getHeatColor(topic.forecast.threeMonths.heatLevel) }}
                  >
                    {topic.forecast.threeMonths.heatLevel} {getForecastIcon(topic.forecast.threeMonths.prediction)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABH Angle */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xs font-semibold uppercase" style={{ color: BRAND_RED }}>ABH Angle</h4>
              <span
                className="px-2 py-0.5 text-xs rounded-full text-white capitalize"
                style={{ backgroundColor: BRAND_RED }}
              >
                {topic.abhAngle.pillar}
              </span>
              <span className="text-xs font-bold" style={{ color: BRAND_RED }}>
                {topic.abhAngle.relevance}/10
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{topic.abhAngle.suggestedTake}</p>
            <p className="text-xs text-gray-500 italic">💡 {topic.abhAngle.contentIdea}</p>
          </div>

          {/* Risk level */}
          {topic.riskLevel !== 'safe' && (
            <div className={`p-2 rounded-lg text-sm ${
              topic.riskLevel === 'risky' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}>
              ⚠️ <strong>{topic.riskLevel === 'risky' ? 'High Risk' : 'Moderate Risk'}:</strong> {topic.riskNote}
            </div>
          )}

          {/* Related keywords */}
          {topic.relatedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {topic.relatedKeywords.map((kw, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Summary card
interface TopicsSummaryProps {
  heatmapSummary: {
    hottestTopic: string;
    risingStars: string[];
    evergreenGold: string[];
    fadingFast: string[];
    abhSweetSpot: string;
  };
  weeklyForecast: {
    biggestOpportunity: string;
    avoidThis: string;
    watchList: string[];
  };
}

export function TopicsSummary({ heatmapSummary, weeklyForecast }: TopicsSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">🔥 This Week's Heatmap</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Hottest & Sweet Spot */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-50 rounded-lg">
            <span className="text-xs font-semibold text-red-600 uppercase">Hottest Right Now</span>
            <p className="text-sm font-medium text-gray-900 mt-1">{heatmapSummary.hottestTopic}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
            <span className="text-xs font-semibold uppercase" style={{ color: BRAND_RED }}>ABH Sweet Spot</span>
            <p className="text-sm font-medium text-gray-900 mt-1">{heatmapSummary.abhSweetSpot}</p>
          </div>
        </div>

        {/* Rising Stars */}
        {heatmapSummary.risingStars.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">🚀 Rising Stars</h4>
            <div className="flex flex-wrap gap-2">
              {heatmapSummary.risingStars.map((topic, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evergreen */}
        {heatmapSummary.evergreenGold.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2">💎 Evergreen Gold</h4>
            <div className="flex flex-wrap gap-2">
              {heatmapSummary.evergreenGold.map((topic, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fading */}
        {heatmapSummary.fadingFast.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">📉 Fading Fast</h4>
            <div className="flex flex-wrap gap-2">
              {heatmapSummary.fadingFast.map((topic, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-500 text-sm rounded-full line-through">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Forecast */}
        <div className="p-3 bg-amber-50 rounded-lg">
          <h4 className="text-xs font-semibold text-amber-700 uppercase mb-2">📅 This Week</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-green-700">✓ Post About:</span>
              <span className="text-gray-700 ml-1">{weeklyForecast.biggestOpportunity}</span>
            </div>
            <div>
              <span className="font-medium text-red-700">✗ Avoid:</span>
              <span className="text-gray-700 ml-1">{weeklyForecast.avoidThis}</span>
            </div>
            {weeklyForecast.watchList.length > 0 && (
              <div>
                <span className="font-medium text-amber-700">👀 Watch:</span>
                <span className="text-gray-700 ml-1">{weeklyForecast.watchList.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main heatmap grid
interface TopicsHeatmapProps {
  topics: TrendingTopic[];
  heatmapSummary: TopicsSummaryProps['heatmapSummary'];
  weeklyForecast: TopicsSummaryProps['weeklyForecast'];
}

export default function TopicsHeatmap({ topics, heatmapSummary, weeklyForecast }: TopicsHeatmapProps) {
  const [filterType, setFilterType] = useState<'all' | 'buzz' | 'rising' | 'evergreen'>('all');

  const filteredTopics = filterType === 'all'
    ? topics
    : topics.filter(t => t.topicType === filterType);

  // Sort by heat level
  const sortedTopics = [...filteredTopics].sort((a, b) => b.currentHeat - a.currentHeat);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <TopicsSummary heatmapSummary={heatmapSummary} weeklyForecast={weeklyForecast} />

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Show:</span>
        {(['all', 'buzz', 'rising', 'evergreen'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
              filterType === type
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? `All (${topics.length})` : type}
          </button>
        ))}
      </div>

      {/* Topics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTopics.map((topic, idx) => (
          <TopicCard key={`${topic.keyword}-${idx}`} topic={topic} />
        ))}
      </div>

      {sortedTopics.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No topics found for this filter.
        </div>
      )}
    </div>
  );
}
