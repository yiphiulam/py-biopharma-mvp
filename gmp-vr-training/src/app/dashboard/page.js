"use client";

import Link from 'next/link';
import { BookOpen, AlertTriangle, CheckCircle, Clock, Info, Brain, Home } from 'lucide-react';
import { useTrainingStore } from '../../store/useTrainingStore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const { mistakes, xapiLogs, startFocusMode } = useTrainingStore();
  
  // 分析 xAPI 數據
  // 目標物件: '無菌操作台電源', '分裝瓶蓋', '微量吸管 (Pipette)', '安全注入區', '封蓋與標籤', '無菌培養皿'
  const analysis = {
    'hood_switch': { errors: 0, time: 0, label: '電源開關', step: 1 },
    'petri_dish': { errors: 0, time: 0, label: '無菌培養皿', step: null },
    'pipette': { errors: 0, time: 0, label: '微量吸管', step: 3 },
    'vial': { errors: 0, time: 0, label: '分裝瓶作業', step: 4 } // 簡化為一大類
  };

  mistakes.forEach(m => {
    if (m.objectId?.includes('電源')) analysis.hood_switch.errors++;
    if (m.objectId?.includes('培養皿')) analysis.petri_dish.errors++;
    if (m.objectId?.includes('吸管')) analysis.pipette.errors++;
    if (m.objectId?.includes('危險區') || m.objectId?.includes('分裝瓶')) analysis.vial.errors++;
  });

  const getColor = (errors) => {
    if (errors === 0 && xapiLogs.length > 0) return 'rgba(59, 130, 246, 0.4)'; // Blue (Mastery)
    if (errors >= 2) return 'rgba(239, 68, 68, 0.6)'; // Red (High Risk)
    if (errors === 1) return 'rgba(245, 158, 11, 0.5)'; // Yellow (Hesitation/Low Perf)
    return 'rgba(255, 255, 255, 0.05)'; // Default
  };

  const hasSimulated = xapiLogs.length > 0 || mistakes.length > 0;
  
  // 計算真實連動當前訓練時間
  let totalTimeMs = 0;
  if (xapiLogs.length > 1) {
    const firstTime = new Date(xapiLogs[0].timestamp).getTime();
    const lastTime = new Date(xapiLogs[xapiLogs.length - 1].timestamp).getTime();
    totalTimeMs = lastTime - firstTime;
  }
  
  const formatTime = (ms) => {
    if (!hasSimulated) return '尚未開始';
    if (ms === 0) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };
  
  // 找出最高錯誤的項目來做 AI 補強建議
  let worstZone = null;
  let maxErrs = 0;
  Object.keys(analysis).forEach(k => {
    if (analysis[k].errors > maxErrs) {
      maxErrs = analysis[k].errors;
      worstZone = analysis[k];
    }
  });

  const handleFocusMode = (stepId) => {
    startFocusMode(stepId);
    router.push('/vr-training');
  };



  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/lobby" className="btn" style={{ background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', textDecoration: 'none', borderRadius: '8px' }}>
            <Home size={18} />
            返回大廳
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>學習儀表板</h1>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>歡迎回來，李小明 (荷蘭 Tilburg 廠)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem' }}>
            荷語 / English
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            李
          </div>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <CheckCircle color="var(--success-color)" size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>整體認證進度</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{hasSimulated ? '42%' : '35%'}</div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: hasSimulated ? '42%' : '35%', height: '100%', background: 'var(--success-color)' }}></div>
            </div>
          </div>
        </div>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '12px' }}>
            <Clock color="var(--accent-color)" size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>本期模擬訓練耗時</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatTime(totalTimeMs)}</div>
            <p style={{ fontSize: '0.875rem', margin: 0, marginTop: '0.5rem' }}>依據 xAPI 稽核軌跡即時運算</p>
          </div>
        </div>
      </div>
      
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangle size={20} color="var(--danger-color)" />
        優先待辦任務
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--danger-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                高優先 / 必修
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>蛋白質藥物分裝作業 (Protein Drug Aliquoting)</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>GMP A 級無菌操作模擬訓練</p>
            </div>
            <Link href="/task-preview?taskId=ProteinAliquoting" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <BookOpen size={18} />
              開始模擬訓練
            </Link>
          </div>
        </div>
        
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-color)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                建議 / 基礎
              </div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>SOP-MFG-023 層流箱操作程序</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>層流箱安全開啟、消毒與防護具穿戴規範</p>
            </div>
            <Link href="/task-preview?taskId=SOP-MFG-023" className="btn btn-primary" style={{ textDecoration: 'none', background: 'var(--accent-color)', color: '#0f172a' }}>
              <BookOpen size={18} />
              開始模擬訓練
            </Link>
          </div>
        </div>
      </div>
      
      {hasSimulated && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2.5rem 0 1.5rem 0' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>模組弱項分析熱圖 (Heatmap)</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Heatmap 視覺化 */}
            <div className="glass-panel" style={{ position: 'relative', height: '300px', background: 'url(/textures/lab_bench.png)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.8)' }}></div>
              
              {/* 電源區 */}
              <div title="SOP 2026-V1 3.1: 啟動無菌操作台電源" style={{ position: 'absolute', top: '20%', left: '10%', width: '15%', height: '20%', background: getColor(analysis.hood_switch.errors), border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>電源開關<br/>({analysis.hood_switch.errors} 誤觸)</span>
              </div>
              
              {/* 培養皿區 */}
              <div title="SOP 2026-V1 4.1.2: 環境監測設備不可隨意移動" style={{ position: 'absolute', bottom: '20%', left: '15%', width: '25%', height: '30%', background: getColor(analysis.petri_dish.errors), border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>無菌培養皿<br/>({analysis.petri_dish.errors} 誤觸)</span>
              </div>
              
              {/* 微量吸管區 */}
              <div title="SOP 2026-V1 3.3: 微量吸管操作規範" style={{ position: 'absolute', top: '15%', left: '45%', width: '15%', height: '50%', background: getColor(analysis.pipette.errors), border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>微量吸管<br/>({analysis.pipette.errors} 誤觸)</span>
              </div>
              
              {/* 分裝瓶區 */}
              <div title="SOP 2026-V1 3.2: 45度角無菌注入與手部防護" style={{ position: 'absolute', bottom: '20%', right: '10%', width: '30%', height: '40%', background: getColor(analysis.vial.errors), border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textShadow: '0 1px 2px #000' }}>分裝瓶作業區<br/>({analysis.vial.errors} 誤觸)</span>
              </div>
            </div>
            
            {/* AI 補強推薦 (Remediation) */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
                <Brain size={18} />
                AI 補強建議計畫
              </h3>
              
              {worstZone ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger-color)', fontSize: '0.9rem' }}>偵測到高風險操作：{worstZone.label}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      分析 xAPI 稽核日誌，您在此區域發生 {worstZone.errors} 次順序錯誤。這違反了 <strong>SOP 2026-V1</strong> 的無菌操作順序規範，在實際生產中可能導致產品報廢。
                    </p>
                  </div>
                  
                  {worstZone.step && (
                    <button 
                      onClick={() => handleFocusMode(worstZone.step)}
                      className="btn btn-primary" 
                      style={{ marginTop: 'auto', background: 'var(--danger-color)' }}>
                      進入專注模式 (Focus Mode) 重新練習
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--success-color)' }}>
                  <CheckCircle size={32} />
                  <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>太棒了！您的操作完全符合 GMP 規範，無重大失誤。</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {!hasSimulated && (
        <>
          <h2 style={{ fontSize: '1.25rem', margin: '2.5rem 0 1.5rem 0' }}>模組弱項分析熱圖</h2>
          <div className="glass-panel">
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>完成首次模擬訓練後，系統將為您生成個人弱項分析與補強建議。</p>
          </div>
        </>
      )}
    </div>
  );
}
