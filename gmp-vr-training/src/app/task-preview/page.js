"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useTrainingStore } from '../../store/useTrainingStore';
import Link from 'next/link';
import { Suspense } from 'react';

function TaskPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get('taskId');
  const { setTaskId } = useTrainingStore();

  const handleStartSimulation = () => {
    setTaskId(taskId); // 設定要載入的任務
    if (taskId === 'SOP-MFG-023') {
      router.push('/vr-trainingpre');
    } else {
      router.push('/vr-training');
    }
  };

  const getTaskDetails = () => {
    if (taskId === 'SOP-MFG-023') {
      return {
        title: '層流箱操作程序 SOP-MFG-023',
        description: '本模組訓練無菌操作台的標準開啟、消毒與清潔流程。',
        steps: [
          { step: 1, title: '安全檢查', desc: '確認 UV 燈關閉' },
          { step: 2, title: '設備啟動', desc: '開啟主電源與風機' },
          { step: 3, title: '消毒準備', desc: '使用 75% 酒精噴灑' },
          { step: 4, title: '無菌清潔', desc: '由內而外擦拭台面' }
        ]
      };
    } else {
      return {
        title: '蛋白質藥物分裝作業',
        description: '本模組訓練 A 級無菌環境下的高風險分裝操作規範。',
        steps: [
          { step: 1, title: '器具就位', desc: '拿取微量吸管' },
          { step: 2, title: '精準抽取', desc: '抽取蛋白質原液' },
          { step: 3, title: '無菌注入', desc: '45度角注入分裝瓶' },
          { step: 4, title: '合規封裝', desc: '無菌封蓋與貼標' }
        ]
      };
    }
  };

  const details = getTaskDetails();

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        background: '#1e293b', width: '100%', maxWidth: '900px', borderRadius: '16px', padding: '3rem',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #334155'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>📋</span>
          {details.title} 流程圖
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '3rem', fontSize: '1.1rem' }}>{details.description} 進入 VR 模擬前，請先複習標準作業流程 (SOP) 關鍵步驟。</p>
        
        {/* 流程圖內容 */}
        <div style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', position: 'relative' }}>
            {/* 連接線 */}
            <div style={{ position: 'absolute', top: '32px', left: '12%', right: '12%', height: '4px', background: '#334155', zIndex: 0 }}></div>
            
            {details.steps.map((item, idx) => (
              <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: taskId === 'SOP-MFG-023' ? '#0ea5e9' : '#10b981', border: '6px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1.5rem', boxShadow: taskId === 'SOP-MFG-023' ? '0 0 20px rgba(14, 165, 233, 0.4)' : '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                  {item.step}
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontSize: '1.25rem' }}>{item.title}</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
          <Link href="/lobby" className="btn btn-secondary" style={{ padding: '1rem 2rem', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#e2e8f0', cursor: 'pointer', fontSize: '1.1rem', textDecoration: 'none', transition: 'all 0.2s' }}>
            返回大廳
          </Link>
          <button onClick={handleStartSimulation} style={{ padding: '1rem 2.5rem', borderRadius: '8px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1.25rem', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            🚀 進入 VR 模擬
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaskPreview() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0b0f19', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>載入中...</div>}>
      <TaskPreviewContent />
    </Suspense>
  );
}
