"use client";

import { useTrainingStore } from '../store/useTrainingStore';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function SOPGuide() {
  const { currentStepIndex, aiMessage, activeSteps, currentTaskId } = useTrainingStore();
  const currentStep = activeSteps[currentStepIndex];
  const isCompleted = currentStepIndex >= activeSteps.length;

  if (isCompleted) {
    return (
      <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '2rem', left: '2rem', width: '350px', zIndex: 10, background: 'rgba(16, 185, 129, 0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <CheckCircle2 color="white" size={28} />
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>模擬訓練完成</h2>
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
          您已順利完成【{currentTaskId === 'SOP-MFG-023' ? '層流箱操作程序 SOP-MFG-023' : '蛋白質藥物分裝作業'}】的所有標準作業程序 (SOP)。系統已自動產生您的 xAPI 數位紀錄，並上傳至 LMS 供 QA 稽核。
        </p>
      </div>
    );
  }

  return (
    <>
      {/* SOP 步驟引導面板 */}
      <div className="glass-panel" style={{ position: 'absolute', top: '2rem', left: '2rem', width: '350px', zIndex: 10, pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            當前任務 ({currentStepIndex + 1}/{activeSteps.length})
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>
          {currentStep.title}
        </h2>
        
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {currentStep.desc}
        </p>
 
        <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            background: 'var(--accent-color)', 
            width: `${((currentStepIndex) / activeSteps.length) * 100}%`,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* AI Agent 即時回饋視窗 (P2) - 重構至左下角 */}
      {aiMessage && (
        <div className="glass-panel animate-fade-in" style={{ 
          position: 'absolute', 
          bottom: '2rem', 
          left: '2rem', 
          width: '380px', 
          zIndex: 20, 
          borderLeft: `4px solid ${aiMessage.type === 'error' ? 'var(--danger-color)' : 'var(--success-color)'}`,
          background: aiMessage.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          boxShadow: aiMessage.type === 'error' ? '0 8px 32px 0 rgba(239, 68, 68, 0.15)' : '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
          backdropFilter: 'blur(20px)',
          border: aiMessage.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            {aiMessage.type === 'error' ? (
              <AlertTriangle color="var(--danger-color)" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <CheckCircle2 color="var(--success-color)" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            
            <div>
              <div style={{ fontWeight: '700', marginBottom: '0.35rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1rem' }}>🤖</span>
                {aiMessage.type === 'error' ? 'AI 實境監護 (虛擬 SME)' : 'AI 智慧助理即時播送'}
              </div>
              <p style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.95)', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {aiMessage.text}
              </p>
              {aiMessage.source && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  <Info size={12} />
                  規範來源：{aiMessage.source}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
