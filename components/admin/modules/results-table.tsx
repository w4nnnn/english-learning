'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, MinusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { StudentResult } from '@/lib/actions/user-progress';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
    results: StudentResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (userId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId);
        } else {
            newExpanded.add(userId);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Selesai
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Dalam Progress
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                        <MinusCircle className="w-3.5 h-3.5" />
                        Belum Mulai
                    </span>
                );
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-elegant border border-border overflow-hidden">
            {/* Summary */}
            <div className="px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <span className="text-sm text-muted-foreground">
                        {results.length} siswa
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                            ✓ Selesai: {results.filter(r => r.status === 'completed').length}
                        </span>
                        <span className="text-amber-600">
                            ◐ Progress: {results.filter(r => r.status === 'in_progress').length}
                        </span>
                        <span className="text-slate-500">
                            Rata-rata: {Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Username
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Score
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Progress
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Waktu Selesai
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {results.map((result) => (
                            <Fragment key={result.userId}>
                                <tr 
                                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => toggleRow(result.userId)}
                                >
                                    <td className="px-4 py-4">
                                        <button className="p-1 hover:bg-muted rounded">
                                            {expandedRows.has(result.userId) ? (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-medium text-foreground">
                                            {result.username}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(result.status)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={cn("font-bold text-lg", getScoreColor(result.score))}>
                                            {result.score}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-sm text-muted-foreground">
                                            {result.completedItems}/{result.totalItems}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {result.completedAt 
                                            ? new Date(result.completedAt).toLocaleString('id-ID')
                                            : '-'
                                        }
                                    </td>
                                </tr>
                                {expandedRows.has(result.userId) && (
                                    <tr key={`${result.userId}-details`}>
                                        <td colSpan={6} className="px-4 py-4 bg-muted/10">
                                            <div className="pl-10">
                                                <h4 className="font-semibold text-sm text-foreground mb-3">
                                                    Detail Jawaban
                                                </h4>
                                                <div className="space-y-2">
                                                    {result.responses.map((response, idx) => (
                                                        <div 
                                                            key={response.itemId}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-lg border",
                                                                response.isCorrect === null 
                                                                    ? "bg-slate-50 border-slate-200"
                                                                    : response.isCorrect 
                                                                        ? "bg-green-50 border-green-200"
                                                                        : "bg-red-50 border-red-200"
                                                            )}
                                                        >
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {response.isCorrect === null ? (
                                                                    <MinusCircle className="w-5 h-5 text-slate-400" />
                                                                ) : response.isCorrect ? (
                                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                                ) : (
                                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-foreground">
                                                                    <span>Q{idx + 1}: </span>
                                                                    <ReactMarkdown
                                                                        components={{
                                                                            p: ({ children }) => <span>{children}</span>,
                                                                            strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                                                                        }}
                                                                    >
                                                                        {response.question}
                                                                    </ReactMarkdown>
                                                                </div>
                                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                                    <span className="text-muted-foreground">
                                                                        Jawaban: <span className="font-medium text-foreground">{response.userAnswer || '-'}</span>
                                                                    </span>
                                                                    {response.isCorrect === false && (
                                                                        <span className="text-green-600">
                                                                            Benar: {response.correctAnswer}
                                                                        </span>
                                                                    )}
                                                                    {response.aiScore !== null && (
                                                                        <span className="text-blue-600">
                                                                            AI Score: {response.aiScore}%
                                                                        </span>
                                                                    )}
                                                                    <span className="text-muted-foreground">
                                                                        Percobaan: {response.attemptCount}x
                                                                    </span>
                                                                </div>
                                                                {response.aiFeedback && (
                                                                    <p className="mt-1 text-xs text-slate-600">
                                                                        AI: {response.aiFeedback}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {result.responses.length === 0 && (
                                                        <p className="text-sm text-muted-foreground italic">
                                                            Tidak ada jawaban yang tercatat.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
