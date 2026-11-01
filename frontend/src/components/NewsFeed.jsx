import React, { useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  Calendar,
  Globe,
  Search,
  Rss,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function NewsFeed({ newsData }) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!newsData) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 text-xs text-zinc-500">
        No open-source news intelligence available.
      </div>
    );
  }

  if (newsData.error) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1">
          <AlertCircle className="w-4 h-4" />
          <span>News Aggregation Notice</span>
        </div>
        <p className="text-xs text-zinc-400">
          {newsData.error}
        </p>
      </div>
    );
  }

  const articles = Array.isArray(newsData.articles) ? newsData.articles : [];
  const provider = newsData.provider || 'Open Signals';
  const total = newsData.total_articles ?? articles.length;

  const filteredArticles = articles.filter((art) => {
    if (!filterQuery.trim()) return true;
    const query = filterQuery.toLowerCase();
    const title = (art.title || '').toLowerCase();
    const source = (art.source || '').toLowerCase();
    return title.includes(query) || source.includes(query);
  });

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Not available') return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-4">
      {/* Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Disaster Signals & News
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                ({articles.length} reports)
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              Target Area: <strong className="text-zinc-400 font-normal">{newsData.location || 'Active Region'}</strong>
            </span>
          </div>
        </div>

        {/* Provider badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Rss className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-zinc-400 text-[11px]">Source Provider:</span>
            <span className="font-semibold text-zinc-200">{provider}</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {articles.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter news by keyword or source domain..."
            className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
      )}

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 italic">
          {filterQuery ? 'No reports matched your search term.' : 'No recent disaster news reported for this location.'}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredArticles.map((article, index) => {
            const formattedDate = formatDate(article.published_at);
            const sourceName = article.source || 'Open Media';
            const url = article.url;

            return (
              <div
                key={index}
                className="group p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-all space-y-1.5"
              >
                {/* Meta header: Publisher, Date, Provider */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-400">
                    <Globe className="w-3 h-3 text-zinc-500" />
                    <span>{sourceName}</span>
                    {article.provider && article.provider !== provider && (
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-800">
                        {article.provider}
                      </span>
                    )}
                  </div>

                  {formattedDate && (
                    <div className="flex items-center gap-1 text-zinc-500 text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                </div>

                {/* Headline link */}
                <div>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-medium text-zinc-200 hover:text-blue-400 flex items-start gap-1.5 transition-colors group-hover:underline"
                    >
                      <span className="leading-snug">{article.title || 'Untitled Report'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ) : (
                    <span className="text-xs sm:text-sm font-medium text-zinc-200 leading-snug">
                      {article.title || 'Untitled Report'}
                    </span>
                  )}
                </div>

                {/* Short snippet / description if backend returns it */}
                {article.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {article.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Notice */}
      <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Verified open-source data feed</span>
        <span>Original sources preserved without fabrication</span>
      </div>
    </div>
  );
}
