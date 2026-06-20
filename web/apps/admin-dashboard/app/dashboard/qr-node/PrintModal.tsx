'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getBatchWithNodesAction } from '@/app/actions/qr-node.actions';

type BatchInfo = {
  id: string;
  workspaceName?: string;
  zone?: string;
  nodeCount: number;
};

type NodeInfo = {
  id: string;
};

type PrintModalProps = {
  batchId: string;
  onClose: () => void;
  onPrinted: () => void;
};

export default function PrintModal({ batchId, onClose, onPrinted }: PrintModalProps) {
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await getBatchWithNodesAction(batchId);
      if (res.success && res.batch && res.nodes) {
        setBatch(res.batch as any);
        setNodes(res.nodes);
      } else {
        alert('Gagal memuat detail batch untuk cetak.');
        onClose();
      }
      setLoading(false);
    }
    loadData();
  }, [batchId, onClose]);

  const handlePrintOS = () => {
    window.print();
    onPrinted();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-emerald-600 text-3xl">progress_activity</span>
          <p className="font-bold text-slate-700">Memuat Data Cetak...</p>
        </div>
      </div>
    );
  }

  if (!batch) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:block print:relative print:z-auto print:bg-white pointer-events-none">
        
        {/* Modal Container (Non-Printable UI) */}
        <div className="bg-slate-100 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden print:hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
          
          {/* Header Action */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-manrope font-extrabold text-primary">Pratinjau Cetak: {batch.id}</h2>
              <p className="text-sm font-medium text-slate-500">
                {batch.workspaceName} • {batch.zone} • {batch.nodeCount} node
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>

              <button 
                type="button"
                onClick={handlePrintOS}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl text-sm font-bold hover:brightness-105 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Cetak & Save PDF
              </button>
            </div>
          </div>

          {/* Scrollable Preview Area */}
          <div className="flex-1 overflow-auto p-8 bg-slate-200/50">
            <div className="bg-white mx-auto shadow-sm" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
              
              <div className="grid grid-cols-4 gap-4" style={{ backgroundColor: 'white' }}>
                  {nodes.map((node: any) => (
                    <div 
                      key={node.id} 
                      className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      <div className="font-bold text-[9px] tracking-wider mb-2 text-center text-black">
                        KARU QR NODE
                      </div>
                      <QRCodeSVG 
                        value={`KARU:NODE:${node.id}`} 
                        size={100} 
                        level="M" 
                        includeMargin={false} 
                      />
                      <div className="mt-3 text-center w-full">
                        <p className="text-[11px] font-mono font-extrabold text-black truncate tracking-widest">{node.id}</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 truncate">{batch?.zone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Render the actual printable content in a Portal directly to document.body */}
      {typeof window !== 'undefined' && createPortal(
        <div id="print-section" className="hidden print:block bg-white text-black">
          <div className="grid grid-cols-4 gap-4">
            {nodes.map((node: any) => (
              <div 
                key={node.id} 
                className="flex flex-col items-center justify-center p-4 border border-dashed border-black rounded-xl"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <div className="font-bold text-[10px] tracking-wider mb-2 text-center text-black">
                  KARU QR NODE
                </div>
                <QRCodeSVG 
                  value={`KARU:NODE:${node.id}`} 
                  size={120} 
                  level="M" 
                  includeMargin={false} 
                />
                <div className="mt-3 text-center w-full">
                  <p className="text-[12px] font-mono font-extrabold text-black truncate tracking-widest">{node.id}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5 truncate">{batch?.zone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Inject Print Styles globally when modal is open */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Buka kunci scroll yang ada di layout utama */
          html, body {
            height: auto !important;
            min-height: 100vh !important;
            overflow: visible !important;
            background-color: white !important;
          }
          /* Sembunyikan semua konten bawaan body kecuali print-section */
          body > *:not(#print-section) {
            display: none !important;
          }
          /* Tampilkan print section sebagai elemen normal block */
          #print-section {
            display: block !important;
            position: static !important;
            width: 100% !important;
          }
          @page { margin: 15mm; }
        }
      `}} />
    </>
  );
}
