"use client";

import { useState } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';
import { MessageSquare, Send, X, BookOpen, AlertCircle } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: '您好，我是您的專屬 GMP/GDP 訓練助理。關於「蛋白質分裝作業」的法規與 SOP 問題，請隨時發問。', source: null }
  ]);
  
  const { askAI } = useTrainingStore();

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = input.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Simulate RAG Backend Processing
    setTimeout(() => {
      // Mock Response logic with Guardrails (FM1 Prevention)
      let aiResponseText = '';
      let sourceStr = '';
      let isHallucinationGuard = false;

      const msgLower = userMsg.toLowerCase();

      if (msgLower.includes('溫度') || msgLower.includes('temperature')) {
        isHallucinationGuard = true;
        aiResponseText = '目前知識庫無對應文件，建議諮詢 SME (A2) 或查閱批次製造文件 BMR-TL-2024。';
        sourceStr = null;
      } else if (msgLower.includes('petri dish') || msgLower.includes('培養皿')) {
        aiResponseText = '根據標準操作程序，無菌培養皿(Sterile Petri Dish)主要用於環境落菌監測。在本分裝作業情境中，請勿隨意移動或開啟非作業所需的培養皿，以免干擾 Laminar Flow Hood 內的單向氣流屏障，增加產品污染風險。';
        sourceStr = 'SOP-2026-V1 第 4.1.2 節: 無塵室環境監測與設備擺放規範';
      } else {
        aiResponseText = `針對您的提問：根據最新規範，分裝作業需於 Grade A 無菌操作台中進行，且手部不得越過已開蓋容器的上方以避免交叉污染。`;
        sourceStr = 'SOP-2026-V1 第 3.2 章: 無菌操作與防護';
      }

      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: aiResponseText, 
        source: sourceStr,
        isGuard: isHallucinationGuard
      }]);
      
      // Log interaction to xAPI (21 CFR Part 11 Audit Trail)
      useTrainingStore.getState().logXAPI('queried', 'AI_Agent', { query: userMsg, response: aiResponseText });
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
        style={{ 
          position: 'absolute', 
          bottom: '2rem', 
          right: '2rem', 
          borderRadius: '50%', 
          width: '60px', 
          height: '60px', 
          padding: 0,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 30
        }}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      position: 'absolute', 
      bottom: '2rem', 
      right: '2rem', 
      width: '380px', 
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden',
      zIndex: 30
    }}>
      <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '1rem', margin: 0 }}>RAG 智慧問答助理</h3>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%'
          }}>
            <div style={{ 
              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
              fontSize: '0.9rem'
            }}>
              {msg.isGuard && <AlertCircle size={14} color="var(--warning-color)" style={{ marginBottom: '4px', display: 'block' }} />}
              {msg.text}
            </div>
            {msg.source && (
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BookOpen size={12} />
                {msg.source}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="詢問 SOP 或法規問題..." 
          style={{ 
            flex: 1, 
            background: 'rgba(0,0,0,0.2)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '20px', 
            padding: '0.5rem 1rem',
            color: 'white',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
