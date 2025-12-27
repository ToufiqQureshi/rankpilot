import React, { useMemo } from 'react';
import { Target, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';

export const SeoSidebar = ({ content }) => {

    // SEO Analysis Logic
    const analysis = useMemo(() => {
        const words = content.split(/\s+/).filter(Boolean).length;
        const hasH1 = /^#\s/.test(content) || /\n#\s/.test(content);
        const headingCount = (content.match(/^#{2,6}\s/gm) || []).length;
        const paragraphs = content.split(/\n\s*\n/).filter(Boolean);
        const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 60).length;

        // Scoring (Simple Weighting)
        let score = 0;
        if (words > 1000) score += 40;
        else if (words > 600) score += 20;

        if (hasH1) score += 20;
        if (headingCount >= 3) score += 20;
        if (longParagraphs === 0) score += 20;

        // Cap at 100
        return {
            score: Math.min(100, score),
            metrics: { words, hasH1, headingCount, longParagraphs }
        };
    }, [content]);

    const getScoreColor = (s) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <div className="w-[300px] bg-white border-l border-gray-200 h-full flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" /> SEO Scorecard
                </span>
                <span className={`text-2xl font-extrabold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">

                {/* 1. Word Count Check */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <span>Content Depth</span>
                        <span>{analysis.metrics.words} / 1500</span>
                    </div>
                    {analysis.metrics.words >= 1500 ? (
                        <div className="p-3 bg-green-50 rounded-lg flex gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-none" />
                            <p className="text-xs text-green-700 font-medium">Excellent depth. Comprehensive content verified.</p>
                        </div>
                    ) : (
                        <div className="p-3 bg-amber-50 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-none" />
                            <p className="text-xs text-amber-700 font-medium">Add more content. Aim for 1500+ words for competitive keywords.</p>
                        </div>
                    )}
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (analysis.metrics.words / 1500) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* 2. Headline Check */}
                <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Structure</div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Main Title (H1)</span>
                        {analysis.metrics.hasH1 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">Subheadings</span>
                        <span className={`text-sm font-bold ${analysis.metrics.headingCount >= 3 ? 'text-green-500' : 'text-gray-400'}`}>
                            {analysis.metrics.headingCount} Found
                        </span>
                    </div>
                </div>

                {/* 3. Readability */}
                <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Readability</div>
                    {analysis.metrics.longParagraphs > 0 ? (
                        <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-600 font-medium mb-1">Warning: {analysis.metrics.longParagraphs} long paragraphs found.</p>
                            <p className="text-[11px] text-red-500">Break them down to max 3-4 lines for mobile readiness.</p>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Paragraph lengths are optimal.</span>
                        </div>
                    )}
                </div>

                {/* Pro Upsell */}
                <div className="mt-8 p-4 bg-slate-900 rounded-xl text-center">
                    <BarChart2 className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <h4 className="text-white text-sm font-bold">Keyword Optimization</h4>
                    <p className="text-white/60 text-xs mt-1 mb-3">Connect SEMrush API to see rankable keywords.</p>
                    <button className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                        Configure
                    </button>
                </div>

            </div>
        </div>
    );
};
