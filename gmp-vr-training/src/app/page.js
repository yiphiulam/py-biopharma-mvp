"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn, Lock, Mail, Server, RefreshCw } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('gmp-operator@pharma.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "正在聯絡 SSO 單一登入伺服器...",
    "進行 SAML 2.0 安全認證憑證交換...",
    "寫入 21 CFR Part 11 合規數位稽核簽章...",
    "身分驗證成功！正在載入 WebVR 大廳場景..."
  ];

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setLoadingStep(0);
  };

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingMessages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isLoading]);

  // 3. 處理登入完成後的跳轉與 Session 寫入 (避免在 setState 中觸發 side-effects)
  useEffect(() => {
    if (isLoading && loadingStep === loadingMessages.length - 1) {
      const redirectTimeout = setTimeout(() => {
        // 寫入登入 session 到 localStorage
        localStorage.setItem('userSession', JSON.stringify({
          email: 'gmp-operator@pharma.com',
          name: '李小明',
          role: '高級無菌操作員',
          factory: '荷蘭 Tilburg 廠',
          token: 'sso_gmp_token_2026_xyz'
        }));
        
        // 平滑跳轉至 WebVR Lobby 大廳
        router.push('/lobby');
      }, 600); // 讓最後一步驟資訊停留 600ms，增進閱讀體驗與儀式感
      return () => clearTimeout(redirectTimeout);
    }
  }, [isLoading, loadingStep, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      background: '#090d16',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* 🚀 背景霓虹光暈與微粒子特效 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '25%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)',
        filter: 'blur(40px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* 🔒 登入卡片 */}
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 22, 36, 0.8)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* 廠徽/Logo區 */}
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
            padding: '1.25rem',
            borderRadius: '50%',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 0 25px rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={44} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#94a3b8', letterSpacing: '2px', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>PHARMAESSENTIA</h2>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0.25rem 0 0.5rem 0' }}>沉浸式 GMP/GDP 培訓系統</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>企業級 WebVR 模擬實務操作平台</p>
        </div>

        {isLoading ? (
          /* 🔄 SSO 載入動畫狀態 */
          <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '3px solid rgba(59, 130, 246, 0.1)',
                borderTopColor: '#3b82f6',
                animation: 'spin 1s linear infinite'
              }}></div>
              <Server size={24} color="#3b82f6" style={{ position: 'absolute' }} />
            </div>
            
            <div style={{ minHeight: '3rem' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f8fafc', marginBottom: '0.25rem', transition: 'all 0.3s ease' }}>
                {loadingMessages[loadingStep]}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', letterSpacing: '1px' }}>
                [ xAPI 數位稽核軌跡啟動中 ]
              </div>
            </div>

            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '1rem' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(to right, #3b82f6, #10b981)',
                width: `${((loadingStep + 1) / loadingMessages.length) * 100}%`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}></div>
            </div>
          </div>
        ) : (
          /* 📝 帳密輸入表單 */
          <form onSubmit={handleLogin} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 預設帳號標籤提示 */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>預設快速登入人員 (SSO 驗證)</div>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600' }}>李小明 - 荷蘭 Tilburg 廠高級操作員</div>
              </div>
              <div style={{
                fontSize: '0.7rem',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}>
                已授權
              </div>
            </div>

            {/* Email欄位 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>企業電子郵件</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '1rem' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem 0.85rem 2.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* 密碼欄位 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '500' }}>SSO 驗證密碼</label>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6', cursor: 'pointer' }}>忘記企業密碼？</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '1rem' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="輸入您的驗證密碼"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem 0.85rem 2.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            </div>

            {/* 記住憑證與自動登入 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.25rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6' }} />
                在受信任裝置上保持登入 (SSO)
              </label>
            </div>

            {/* 登入按鈕群組 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                }}
              >
                <LogIn size={20} />
                SSO 企業安全登入
              </button>
            </div>
          </form>
        )}

        {/* 21 CFR Part 11 宣告 */}
        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.72rem',
          color: '#64748b',
          lineHeight: '1.4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 'bold' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            符合 FDA 21 CFR Part 11 電子記錄規範
          </div>
          <div style={{ maxWidth: '400px' }}>
            本系統將依據 GMP 數位合規紀錄要求，以 xAPI 協議即時儲存包含操作延遲、順序誤觸及專注度在內的完整稽核軌跡 (Audit Trail)。
          </div>
        </div>
      </div>

      {/* 頁尾著作權資訊 */}
      <footer style={{
        marginTop: '2rem',
        fontSize: '0.75rem',
        color: '#475569',
        position: 'relative',
        zIndex: 10
      }}>
        © 2026 PharmaEssentia Corp. 版權所有。沉浸式培訓 MVP 模組 V1.2.6
      </footer>

      {/* 旋轉動畫 Styles */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
