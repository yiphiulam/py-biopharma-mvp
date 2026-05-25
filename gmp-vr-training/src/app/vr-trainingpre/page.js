"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import SOPGuide from '../../components/SOPGuide';
import AIAssistant from '../../components/AIAssistant';
import { useTrainingStore } from '../../store/useTrainingStore';
import { useEffect } from 'react';

// 動態載入 VRSopScene，停用 SSR
const VRSopScene = dynamic(() => import('../../components/VRSopScene'), { 
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
      <div style={{ color: 'var(--text-secondary)' }}>載入沉浸式 360° 模擬環境中...</div>
    </div>
  )
});

export default function VRTraining() {
  const { startSimulation } = useTrainingStore();

  useEffect(() => {
    // 進入頁面時初始化狀態
    startSimulation();
  }, [startSimulation]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* 頂部導覽列 */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        padding: '1rem 2rem', 
        zIndex: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
      }}>
        <Link href="/lobby" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: '500' }}>
          <ChevronLeft size={20} />
          返回模擬大廳
        </Link>
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          LIVE: GMP A 級無菌操作模擬
        </div>
      </div>

      {/* 360度場景核心 (P1) */}
      <VRSopScene />

      {/* SOP 步驟引導與即時回饋 (P2) */}
      <SOPGuide />

      {/* RAG 智慧問答助理 (P3) */}
      <AIAssistant />
    </div>
  );
}
