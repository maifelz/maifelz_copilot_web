'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Sparkles, Database, ArrowRight, TrendingUp, ChevronRight, Zap,
  BarChart3, FileSpreadsheet, Lightbulb, MessageSquare, Bot, User, CheckCircle2,
  Download, RefreshCw, Key, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { generateReport, getPromptSuggestions, getQuickStats, getConnections, getAIStatus, getStoredAuth, type AIReport } from '@/lib/api';
import Header from '@/components/layout/Header';
import KPICard from '@/components/dashboard/KPICard';
import ReportChart from '@/components/charts/ReportChart';
import ReportDataTable from '@/components/dashboard/ReportDataTable';
import PromptBar from '@/components/chat/PromptBar';
import ConnectOdooModal from '@/components/modals/ConnectOdooModal';
import ApiKeyModal from '@/components/modals/ApiKeyModal';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  report?: AIReport;
  timestamp: string;
}

function renderFormattedText(text: string) {
  if (!text) return null;
  // Splits by **bold** text and converts to clean styled elements
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      // Amounts ($XX,XXX)
      if (inner.startsWith('$')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold text-slate-900 bg-emerald-50 border border-emerald-200/80 text-[14px]"
          >
            {inner}
          </span>
        );
      }
      // Codes & Invoices (INV..., SO...)
      if (inner.includes('INV') || inner.includes('SO') || inner.includes('Lead') || inner.includes('#')) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md font-bold text-[#5a165d] bg-[#5a165d]/10 border border-[#5a165d]/20 font-mono text-xs"
          >
            {inner}
          </span>
        );
      }
      return (
        <strong key={index} className="font-bold text-slate-900 px-0.5">
          {inner}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function DashboardPage() {
  const {
    connections, activeConnectionId, setActiveConnection,
    isGenerating, setGenerating, currentReport, setCurrentReport,
    addReport, setConnections
  } = useAppStore();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ gemini_active: boolean; engine: string; provider?: string } | null>(null);
  const [quickStats, setQuickStats] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'insights'>('chart');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Conversational Thread
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const activeConn = connections.find(c => c.id === activeConnectionId);

  const loadAIStatus = () => {
    getAIStatus().then(setAiStatus).catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const auth = getStoredAuth();
    getConnections().then((conns) => {
      setConnections(conns);
      if (conns && conns.length > 0) {
        const target = (auth?.tenant?.connection_id && conns.find(c => c.id === auth.tenant.connection_id))
          || (activeConnectionId && conns.find(c => c.id === activeConnectionId))
          || conns[0];
        if (target) {
          setActiveConnection(target.id);
        }
      }
    }).catch(() => {});
    loadAIStatus();
  }, []);

  useEffect(() => {
    if (!activeConnectionId) return;
    getQuickStats(activeConnectionId).then(setQuickStats).catch(() => {});
  }, [activeConnectionId]);

  const handleSpeakReport = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice playback is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const rawText = currentReport?.direct_answer || currentReport?.executive_summary || '';
    if (!rawText) return;

    // Strip markdown bold and symbols for clean spoken voice
    const spokenText = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(spokenText);

    // Language locale mapping
    const lang = currentReport?.language || 'en';
    if (lang === 'ml' || /[\u0D00-\u0D7F]/.test(spokenText)) {
      utterance.lang = 'ml-IN';
    } else if (lang === 'hi' || /[\u0900-\u097F]/.test(spokenText)) {
      utterance.lang = 'hi-IN';
    } else if (lang === 'ar' || /[\u0600-\u06FF]/.test(spokenText)) {
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = 'en-US';
    }

    // Try finding matching voice for language
    try {
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(utterance.lang.substring(0, 2).toLowerCase()));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    } catch (_) {}

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handlePrompt = async (prompt: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (!activeConnectionId) {
      toast.error('Please connect an Odoo database first');
      setShowConnectModal(true);
      return;
    }

    const userMsgId = String(Date.now());
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newMessages);

    setGenerating(true);
    try {
      const report = await generateReport(activeConnectionId, prompt);
      setCurrentReport(report);
      addReport(report);

      setMessages([
        ...newMessages,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: report.direct_answer || report.executive_summary,
          report,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (!report.success && report.error) {
        toast.error(`Partial result: ${report.error}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to generate answer');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="mAifelZ AI Copilot"
        subtitle={activeConn ? `Connected to ${activeConn.company_name || activeConn.label} (Odoo ${activeConn.odoo_version})` : 'Enterprise ERP Intelligence'}
        onOpenAIConfig={() => setShowApiKeyModal(true)}
        aiActive={Boolean(aiStatus?.gemini_active)}
        aiEngineLabel={aiStatus?.engine || (aiStatus?.gemini_active ? 'Google Gemini 2.0 Flash' : 'Smart ERP Intelligence')}
      />

      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">

        {/* ── Enterprise Quick Stats Strip ── */}
        {activeConnectionId && Object.keys(quickStats).length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(quickStats).map((stat: any, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{stat.count?.toLocaleString()} active records</div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#5a165d]/5 flex items-center justify-center text-[#5a165d]">
                  <TrendingUp size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── No Connection Hero (if DB not connected) ── */}
        {!activeConnectionId && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-200 bg-white p-10 md:p-14 text-center shadow-xs"
          >
            <div className="max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#5a165d]/5 border border-[#5a165d]/15 text-[#5a165d] text-xs font-semibold mb-6">
                <Sparkles size={13} /> Official Odoo Partner AI Platform
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Conversational ERP Intelligence for{' '}
                <span className="text-[#5a165d]">Odoo</span>
              </h2>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-8">
                Connect your Odoo database and ask questions in natural language.
                Get real conversational answers, executive charts, and spreadsheet-quality records.
              </p>

              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl bg-[#5a165d] text-white text-sm font-semibold hover:bg-[#48114a] transition-all shadow-sm hover:shadow-md"
              >
                <Database size={16} />
                Connect Odoo Database
                <ArrowRight size={14} />
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                {['Universal XML-RPC', 'Odoo v12–v19+', 'Odoo.sh & On-Prem', 'Zero Modules Required'].map(f => (
                  <span key={f} className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Conversational Thread / Answer Canvas ── */}
        {currentReport && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ChatGPT / Gemini Style Conversational Answer Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
              {/* Assistant Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5a165d] flex items-center justify-center text-white shadow-xs">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">mAifelZ AI Assistant</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#5a165d]/10 text-[#5a165d] text-[10px] font-bold">
                        {currentReport.report_title}
                      </span>
                      {currentReport.engine && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                          <Sparkles size={10} className="text-emerald-600" />
                          {currentReport.engine}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Response generated with {currentReport.engine || 'Google Gemini 2.0 Flash'} from live Odoo ERP query
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentReport(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Direct Conversational Narrative (Like ChatGPT / Gemini) */}
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#5a165d] uppercase tracking-wider">
                    <Sparkles size={14} className="text-[#5a165d]" /> Executive Findings
                  </div>

                  {/* Multilingual Voice Readout / Speak Button */}
                  <button
                    onClick={handleSpeakReport}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer',
                      isSpeaking
                        ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/20'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-[#5a165d]'
                    )}
                    title={isSpeaking ? 'Stop speaking' : 'Listen to report (Voice Readout)'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={14} />
                        <span>Stop Reading</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} className="text-[#5a165d]" />
                        <span>Listen to Report</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-slate-800 text-[15px] leading-relaxed font-normal">
                  {renderFormattedText(currentReport.direct_answer || currentReport.executive_summary)}
                </div>
                {currentReport.direct_answer && currentReport.executive_summary && currentReport.executive_summary.trim() !== '' && currentReport.executive_summary.trim() !== currentReport.direct_answer.trim() && (
                  <p className="text-xs text-slate-500 pt-2 border-t border-slate-200 leading-relaxed">
                    {renderFormattedText(currentReport.executive_summary)}
                  </p>
                )}
              </div>

              {/* KPI Cards Strip */}
              {currentReport.kpi_cards && currentReport.kpi_cards.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentReport.kpi_cards.map((kpi, i) => (
                    <KPICard key={i} kpi={kpi} index={i} delay={i * 0.05} />
                  ))}
                </div>
              )}

              {/* Tabs: Visual Chart vs Detailed Records vs Insights */}
              <div className="pt-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab('chart')}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                      activeTab === 'chart'
                        ? 'bg-[#5a165d] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <BarChart3 size={14} />
                    Visual Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('table')}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                      activeTab === 'table'
                        ? 'bg-[#5a165d] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <FileSpreadsheet size={14} />
                    Data Records ({currentReport.table_records?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                      activeTab === 'insights'
                        ? 'bg-[#5a165d] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Lightbulb size={14} />
                    Executive Insights
                  </button>
                </div>

                {/* Tab Content */}
                <div className="pt-5">
                  {activeTab === 'chart' && currentReport.sections && currentReport.sections.length > 0 && (
                    <div className="space-y-6">
                      {currentReport.sections.map((sec, sIdx) => (
                        sec.data && sec.data.length > 0 && (
                          <div key={sIdx} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 shadow-xs">
                            {currentReport.sections.length > 1 && (
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#5a165d]" />
                                  {sec.title}
                                </h4>
                                {sec.summary && (
                                  <span className="text-[11px] text-slate-500 font-medium">{sec.summary}</span>
                                )}
                              </div>
                            )}
                            <ReportChart section={sec} height={currentReport.sections.length > 1 ? 280 : 340} />
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {activeTab === 'table' && currentReport.table_records && (
                    <ReportDataTable
                      title={`${currentReport.report_title} Records`}
                      columns={currentReport.table_columns}
                      records={currentReport.table_records}
                    />
                  )}

                  {activeTab === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentReport.insights.length > 0 && (
                        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                            <TrendingUp size={13} className="text-[#5a165d]" /> Key Analytical Insights
                          </h4>
                          <ul className="space-y-2">
                            {currentReport.insights.map((ins, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5a165d] mt-1.5 flex-shrink-0" />
                                {ins}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentReport.recommendations.length > 0 && (
                        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                            <Zap size={13} className="text-amber-600" /> Executive Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {currentReport.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Interactive Chatter: Follow-up & Clarity Box ── */}
              {(currentReport.clarification_question || (currentReport.follow_up_suggestions && currentReport.follow_up_suggestions.length > 0)) && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  {currentReport.clarification_question && (
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 via-white to-purple-50/40 border border-purple-200/70 shadow-xs">
                      <div className="w-8 h-8 rounded-xl bg-[#5a165d] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                        <Sparkles size={16} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#5a165d] uppercase tracking-wider">
                            Interactive Assistant Clarity
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {renderFormattedText(currentReport.clarification_question)}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentReport.follow_up_suggestions && currentReport.follow_up_suggestions.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <MessageSquare size={13} className="text-[#5a165d]" />
                        <span>Quick Responses & Drill-Down Options:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {currentReport.follow_up_suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handlePrompt(suggestion)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#5a165d] text-slate-700 hover:text-white border border-slate-200 hover:border-[#5a165d] text-xs font-semibold transition-all shadow-xs hover:shadow-sm group cursor-pointer"
                          >
                            <span className="text-slate-400 group-hover:text-white">↳</span>
                            <span>{suggestion}</span>
                            <ChevronRight size={13} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Loading Animation ── */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#5a165d]/10 text-[#5a165d] flex items-center justify-center animate-bounce">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Querying your Odoo ERP & analyzing...</p>
              <p className="text-xs text-slate-500 mt-1">Fetching live records, computing aggregations, and structuring answers...</p>
            </div>
          </motion.div>
        )}

        {/* ── Smart Suggestions Strip ── */}
        {activeConnectionId && !currentReport && !isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#5a165d]" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Suggested Queries for Your ERP</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { title: 'How many leads generated today & details', prompt: 'how many lead generated to day , and provide details' },
                { title: 'Which is highest value invoice this month?', prompt: 'which is highest value invoice in this month' },
                { title: 'What is our last invoice number?', prompt: 'last invoice number' },
                { title: 'Top 10 customers by revenue', prompt: 'Show top 10 customers by revenue' },
                { title: 'Show all overdue unpaid invoices', prompt: 'What are our overdue invoices?' },
                { title: 'Sales pipeline overview by stage', prompt: 'Sales pipeline by stage with expected revenue' },
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePrompt(s.prompt)}
                  className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#5a165d]/50 hover:bg-[#5a165d]/5 transition-all text-xs font-medium text-slate-700 hover:text-[#5a165d] flex items-center justify-between group shadow-xs"
                >
                  <span className="truncate">{s.title}</span>
                  <ArrowRight size={13} className="text-slate-400 group-hover:text-[#5a165d] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Prompt Bar (Sticky at bottom when connected) ── */}
        {activeConnectionId && (
          <div className="pt-2 sticky bottom-4 z-20">
            <PromptBar onSubmit={handlePrompt} isLoading={isGenerating} />
          </div>
        )}
      </div>

      {/* Connect Odoo Modal */}
      {showConnectModal && (
        <ConnectOdooModal
          onClose={() => setShowConnectModal(false)}
          onSuccess={() => setShowConnectModal(false)}
        />
      )}

      {/* AI Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSuccess={loadAIStatus}
        />
      )}
    </div>
  );
}
