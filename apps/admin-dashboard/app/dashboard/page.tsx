'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getDashboardSummaryAction, generateAiDashboardInsightAction } from '@/app/actions/dashboard.actions';
import { getRecentActivityLogsAction } from '@/app/actions/activity-log.actions';

export default function DashboardPage() {
  // State Metrik Dasbor
  const [summary, setSummary] = useState({
    totalWorkspaces: 0,
    totalArea: 12480,
    activeNodesCount: 0,
    totalScans: 0,
    totalSops: 0,
    distribution: { penyakit: 45, hama: 30, sehat: 25 },
    dailyTrend: [] as { day: string; count: number }[],
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  // State Aktivitas Terbaru
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // State Insight AI
  const [aiInsightHtml, setAiInsightHtml] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Fungsi Load Data
  const loadDashboardData = useCallback(async () => {
    setIsLoadingMetrics(true);
    setIsLoadingLogs(true);

    try {
      const [metricsRes, logsRes] = await Promise.all([
        getDashboardSummaryAction(),
        getRecentActivityLogsAction(5),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setSummary(metricsRes.data as any);
      }
      if (logsRes.success && logsRes.data) {
        setRecentLogs(logsRes.data as any[]);
      }
    } catch (err) {
      console.error('Gagal memuat dasbor umum:', err);
    } finally {
      setIsLoadingMetrics(false);
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handler Hasilkan Ringkasan AI
  const handleGenerateAiInsight = async () => {
    setIsGeneratingAi(true);
    setAiInsightHtml(null);
    try {
      const res = await generateAiDashboardInsightAction();
      if (res.success && res.data) {
        setAiInsightHtml(res.data);
      } else {
        setAiInsightHtml('<p className="text-rose-600">Gagal menyusun panduan AI. Silakan coba lagi.</p>');
      }
    } catch (err) {
      setAiInsightHtml('<p className="text-rose-600">Terjadi kesalahan saat memanggil asisten AI.</p>');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Kalkulasi total pindaian untuk persentase distribusi
  const totalDist = summary.distribution.penyakit + summary.distribution.hama + summary.distribution.sehat;
  const pPenyakit = totalDist > 0 ? Math.round((summary.distribution.penyakit / totalDist) * 100) : 45;
  const pHama = totalDist > 0 ? Math.round((summary.distribution.hama / totalDist) * 100) : 30;
  const pSehat = totalDist > 0 ? Math.round((summary.distribution.sehat / totalDist) * 100) : 25;

  // Nilai maksimum tren harian untuk penskalaan bar
  const maxTrend = summary.dailyTrend.reduce((max, t) => Math.max(max, t.count), 5);

  return (
    <div className="p-4 md:p-8 pb-16 space-y-8 max-w-[1600px] mx-auto w-full">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant/10 pb-6">
        <div>
          <h1 className="text-3xl font-manrope font-extrabold text-primary tracking-tight font-headline">
            Dasbor Utama KARU
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
            Metrik operasional waktu nyata, distribusi pindaian biometrik, dan kendali penasihat AI otonom.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoadingMetrics ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Segarkan Metrik
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-semibold text-xs hover:opacity-95 transition-all shadow-md shadow-emerald-950/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Cetak Laporan
          </button>
        </div>
      </section>

      {/* Metric Cards Seragam dengan gaya premium sistem */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ruang Kerja */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <span className="material-symbols-outlined text-[24px] text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>
              landscape
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Lahan</p>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Aktif</span>
            </div>
            <p className="text-2xl font-manrope font-extrabold text-emerald-700 mt-0.5">
              {isLoadingMetrics ? '...' : `${summary.totalWorkspaces} Area`}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Est. cakupan: {summary.totalArea} Ha</p>
          </div>
        </div>

        {/* Card 2: Node QR */}
        <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-50">
            <span className="material-symbols-outlined text-[24px] text-teal-700" style={{ fontVariationSettings: "'FILL' 1" }}>
              qr_code_scanner
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Node QR Online</p>
            <p className="text-2xl font-manrope font-extrabold text-teal-700 mt-0.5">
              {isLoadingMetrics ? '...' : summary.activeNodesCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Stiker terverifikasi di lapangan</p>
          </div>
        </div>

        {/* Card 3: Pindaian AI */}
        <div className="bg-white rounded-2xl p-5 border border-sky-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-50">
            <span className="material-symbols-outlined text-[24px] text-sky-700" style={{ fontVariationSettings: "'FILL' 1" }}>
              sensors
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Pindaian AI</p>
            <p className="text-2xl font-manrope font-extrabold text-sky-700 mt-0.5">
              {isLoadingMetrics ? '...' : summary.totalScans}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Diagnosis multimodal Gemini</p>
          </div>
        </div>

        {/* Card 4: SOP Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-violet-50">
            <span className="material-symbols-outlined text-[24px] text-violet-700" style={{ fontVariationSettings: "'FILL' 1" }}>
              library_books
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SOP & Panduan</p>
            <p className="text-2xl font-manrope font-extrabold text-violet-700 mt-0.5">
              {isLoadingMetrics ? '...' : summary.totalSops}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Instruksi penanganan terdaftar</p>
          </div>
        </div>
      </section>

      {/* Middle Section: Asymmetric Layout (Analitik Kiri, Aktivitas Kanan) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bagian Kiri: Distribusi & Tren Pindaian AI (2 Kolom) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-primary font-headline">Distribusi Diagnosis & Tren AI</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Proporsi deteksi anomali biometrik (Penyakit vs Hama vs Normal) dan pengiriman data harian
                </p>
              </div>
              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Waktu Nyata
              </span>
            </div>

            {/* Representasi Visual Distribusi Proporsional */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proporsi Sebaran Kasus</p>
              
              {/* Stacked Progress Bar */}
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${pPenyakit}%` }}
                  className="bg-rose-500 h-full transition-all duration-500 hover:brightness-110"
                  title={`Penyakit: ${pPenyakit}%`}
                />
                <div
                  style={{ width: `${pHama}%` }}
                  className="bg-amber-500 h-full transition-all duration-500 hover:brightness-110"
                  title={`Hama: ${pHama}%`}
                />
                <div
                  style={{ width: `${pSehat}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500 hover:brightness-110"
                  title={`Sehat/Normal: ${pSehat}%`}
                />
              </div>

              {/* Legend Distribusi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100/60 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Penyakit</span>
                  </div>
                  <p className="text-base font-extrabold text-rose-950">{pPenyakit}%</p>
                  <p className="text-[9px] text-slate-400 font-bold">{summary.distribution.penyakit} log</p>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100/60 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Hama</span>
                  </div>
                  <p className="text-base font-extrabold text-amber-950">{pHama}%</p>
                  <p className="text-[9px] text-slate-400 font-bold">{summary.distribution.hama} log</p>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/60 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Sehat</span>
                  </div>
                  <p className="text-base font-extrabold text-emerald-950">{pSehat}%</p>
                  <p className="text-[9px] text-slate-400 font-bold">{summary.distribution.sehat} log</p>
                </div>
              </div>
            </div>

            {/* Tren Harian Pindaian (7 Hari Terakhir) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Aktivitas Pemindaian 7 Hari Terakhir
              </p>
              <div className="flex items-end justify-between gap-2 h-32 pt-4 px-2">
                {summary.dailyTrend.map((item, i) => {
                  const heightPercent = maxTrend > 0 ? Math.max(12, Math.round((item.count / maxTrend) * 100)) : 12;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                      {/* Nilai Tooltip hover di atas bar */}
                      <span className="text-[9px] font-bold text-slate-400 group-hover:text-primary transition-colors">
                        {item.count}
                      </span>
                      {/* Bar grafik murni CSS */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] bg-emerald-100 group-hover:bg-primary rounded-t-lg transition-all duration-300 relative"
                      />
                      {/* Label Hari */}
                      <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Metode: Klasifikasi Saraf Multimodal Gemini</span>
            <Link href="/dashboard/reports-ai" className="text-primary font-bold hover:underline flex items-center gap-1">
              Lihat Detail Laporan AI <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Bagian Kanan: Aktivitas Terbaru (1 Kolom) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-primary font-headline">Aktivitas Sistem</h2>
              <span className="material-symbols-outlined text-slate-300 text-[20px]">history</span>
            </div>

            {isLoadingLogs ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <span className="material-symbols-outlined animate-spin text-2xl text-emerald-500 block">refresh</span>
                <p>Memuat jejak audit terbaru...</p>
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-300 block">assignment</span>
                <p>Belum ada riwayat aktivitas yang tercatat.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => {
                  // Tentukan warna ikon berdasarkan tipe
                  let bg = 'bg-slate-100 text-slate-600';
                  let icon = 'info';
                  if (log.type === 'create') { bg = 'bg-emerald-100 text-emerald-700'; icon = 'add_circle'; }
                  else if (log.type === 'update') { bg = 'bg-blue-100 text-blue-700'; icon = 'edit'; }
                  else if (log.type === 'delete') { bg = 'bg-rose-100 text-rose-700'; icon = 'delete'; }
                  else if (log.type === 'auth') { bg = 'bg-violet-100 text-violet-700'; icon = 'login'; }
                  else if (log.type === 'system') { bg = 'bg-amber-100 text-amber-700'; icon = 'memory'; }

                  const timeFormatted = log.createdAt
                    ? new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div key={log.id} className="flex gap-3 group">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} mt-0.5`}>
                        <span className="material-symbols-outlined text-[16px]">{icon}</span>
                      </div>
                      <div className="min-w-0 flex-1 border-b border-slate-50 pb-3 group-last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{log.action}</p>
                          <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">{timeFormatted}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {log.description}
                        </p>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider block mt-1">
                          {log.userName || 'Sistem Otonom'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/dashboard/log-aktivitas"
            className="block text-center w-full mt-6 py-2.5 bg-slate-50 hover:bg-emerald-50/50 text-xs font-bold text-emerald-800 transition-colors rounded-xl border border-slate-200/60"
          >
            Lihat Log Audit Lengkap
          </Link>
        </div>
      </section>

      {/* Bottom Section: Pusat Insight AI Eksekutif berbasis Gemini */}
      <section className="bg-gradient-to-br from-emerald-950 via-primary to-emerald-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Efek latar belakang dekoratif */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 w-60 h-60 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-emerald-400 animate-pulse text-2xl">auto_awesome</span>
              <h2 className="text-xl font-extrabold tracking-tight">Pusat Penasihat Eksekutif AI</h2>
            </div>
            <p className="text-xs md:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
              Ditenagai oleh <strong>Google Gemini 2.5 Flash</strong>. Sistem akan menyusun parameter telemetri pindaian dan status stiker fisik terkini untuk menghasilkan saran tindakan strategis instan.
            </p>
          </div>

          <button
            type="button"
            disabled={isGeneratingAi}
            onClick={handleGenerateAiInsight}
            className="w-full lg:w-auto justify-center px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-80 flex-shrink-0 whitespace-nowrap"
          >
            <span className={`material-symbols-outlined text-[16px] text-emerald-700 ${isGeneratingAi ? 'animate-spin' : ''}`}>
              {isGeneratingAi ? 'autorenew' : 'psychology'}
            </span>
            {isGeneratingAi ? 'Menganalisis Telemetri...' : 'Hasilkan Rekomendasi AI'}
          </button>
        </div>

        {/* Area Tampilan Hasil Analisis AI */}
        <div className="pt-6 relative z-10">
          {isGeneratingAi ? (
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 text-center space-y-3 border border-white/10">
              <span className="material-symbols-outlined text-4xl text-emerald-400 animate-spin block">refresh</span>
              <p className="text-xs font-bold text-emerald-200 tracking-wider uppercase">
                Menyusun Sintesis Prediktif Agronomi...
              </p>
              <p className="text-xs text-emerald-100/60 max-w-md mx-auto">
                Gemini sedang membandingkan sebaran pindaian hama dan memetakan penugasan stiker QR fisik kebun Anda.
              </p>
            </div>
          ) : aiInsightHtml ? (
            <div className="bg-white text-slate-800 rounded-2xl p-6 md:p-8 shadow-inner border border-emerald-100 space-y-4 text-sm leading-relaxed font-medium">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">verified</span>
                Sintesis Rekomendasi Otonom KARU
              </div>
              {/* Render keluaran HTML aman dari Gemini */}
              <div
                className="ai-insight-content space-y-3"
                dangerouslySetInnerHTML={{ __html: aiInsightHtml }}
              />
            </div>
          ) : (
            <div className="bg-black/20 rounded-2xl p-6 text-center border border-white/5">
              <p className="text-xs text-emerald-200/70 font-medium">
                Tekan tombol <strong>"Hasilkan Rekomendasi AI"</strong> di atas untuk menyarikan panduan operasional kebun Anda saat ini.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
