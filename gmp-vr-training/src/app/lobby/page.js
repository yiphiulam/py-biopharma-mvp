"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainingStore } from '../../store/useTrainingStore';

export default function VRLobby() {
  const router = useRouter();
  const { setTaskId } = useTrainingStore();
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [user, setUser] = useState(null);
  
  // 轉場狀態
  const [isEnteringSimulation, setIsEnteringSimulation] = useState(false);
  const [hoveredEnterId, setHoveredEnterId] = useState(null);

  // 1. 驗證登入 Session
  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (!session) {
      router.push('/'); // 未登入則導回首頁
    } else {
      setUser(JSON.parse(session));
    }
  }, [router]);

  // 2. 動態加載 A-Frame
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.AFRAME) {
      import('aframe')
        .then(() => setAframeLoaded(true))
        .catch((err) => console.error("Error loading A-Frame:", err));
    } else if (window.AFRAME) {
      setAframeLoaded(true);
    }
  }, []);

  // 3. 繪製中文文字到 Canvas (解決 A-Frame 不支援中文的問題)
  useEffect(() => {
    if (aframeLoaded) {
      setTimeout(() => {
        // 第一個任務的文字
        const canvas1 = document.getElementById('sopTextCanvas');
        if (canvas1) {
          const ctx1 = canvas1.getContext('2d');
          ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
          ctx1.fillStyle = 'white';
          ctx1.textAlign = 'center';
          ctx1.textBaseline = 'middle';
          ctx1.font = 'bold 56px sans-serif';
          ctx1.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx1.shadowBlur = 4;
          ctx1.shadowOffsetX = 2;
          ctx1.shadowOffsetY = 2;
          ctx1.fillText('SOP-MFG-023 任務', canvas1.width / 2, canvas1.height / 2);
          
          const material1 = document.getElementById('sop-text-img')?.components?.material;
          if (material1 && material1.material && material1.material.map) {
            material1.material.map.needsUpdate = true;
          }
        }

        // 第二個任務的文字
        const canvas2 = document.getElementById('proteinTextCanvas');
        if (canvas2) {
          const ctx2 = canvas2.getContext('2d');
          ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
          ctx2.fillStyle = 'white';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.font = 'bold 56px sans-serif';
          ctx2.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx2.shadowBlur = 4;
          ctx2.shadowOffsetX = 2;
          ctx2.shadowOffsetY = 2;
          ctx2.fillText('蛋白質藥物分裝作業任務', canvas2.width / 2, canvas2.height / 2);
          
          const material2 = document.getElementById('protein-text-img')?.components?.material;
          if (material2 && material2.material && material2.material.map) {
            material2.material.map.needsUpdate = true;
          }
        }
      }, 500); // 確保 canvas 已經掛載到 DOM
    }
  }, [aframeLoaded]);

  // 4. 進入實體 VR 模擬操作
  const handleStartSimulation = (scenarioId) => {
    if (isEnteringSimulation) return;
    
    setIsEnteringSimulation(true);
    setTaskId(scenarioId); // 寫入 Zustand 狀態

    setTimeout(() => {
      router.push('/vr-training');
    }, 1500);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#0b0f19' }}>
      
      {/* 📺 1. 轉場黑色遮罩 (Cinematic Screen Fade Overlay) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000000',
        zIndex: 50,
        opacity: isEnteringSimulation ? 1 : 0,
        pointerEvents: isEnteringSimulation ? 'all' : 'none',
        transition: 'opacity 1.5s ease'
      }}>
        {isEnteringSimulation && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#38bdf8',
            textAlign: 'center',
            fontFamily: 'sans-serif'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '3px solid rgba(56, 189, 248, 0.1)',
              borderTopColor: '#38bdf8',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem auto'
            }}></div>
            <h3 style={{ fontSize: '1.25rem', letterSpacing: '1px', fontWeight: 'bold' }}>
              正在載入【{useTrainingStore.getState().currentTaskId === 'SOP-MFG-023' ? '層流箱操作程序 SOP-MFG-023' : '蛋白質藥物分裝作業'}】模擬環境...
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>依據 FDA GMP 規範自動指派合規測試模組</p>
          </div>
        )}
      </div>

      {/* 📊 2. 頂部狀態列 UI Overlay (Navigation to Dashboard) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 40,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none' // Let A-Frame handle background clicks
      }}>
        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>全球 GMP/GDP 沉浸式教育大廳</h1>
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.4)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '1.2rem' }}>📊</span> 學習儀表板
          </button>
        </div>
      </div>



      {/* 🧊 3. A-Frame 3D 場景核心 */}
      {aframeLoaded && (
        <a-scene embedded style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
                 vr-mode-ui="enabled: true"
                 renderer="colorManagement: true; physicallyCorrectLights: true">
          <a-assets>
            <img id="sky-img" src="/lab_custom.jpg" crossOrigin="anonymous" alt="Lobby 360" />
            <img id="sop-icon-white" src="/sop_icon_white.png" crossOrigin="anonymous" alt="SOP Icon" />
            <img id="protein-icon-white" src="/protein_icon_white.png" crossOrigin="anonymous" alt="Protein Icon" />
            <canvas id="sopTextCanvas" width="512" height="128"></canvas>
            <canvas id="proteinTextCanvas" width="1024" height="128"></canvas>
          </a-assets>

          {/* 360-degree Sky */}
          <a-sky src="#sky-img" rotation="0 -90 0"></a-sky>

          {/* Ambient Lighting */}
          <a-light type="ambient" intensity="1.0" color="#ffffff"></a-light>
          <a-light type="directional" position="-1 2 1" intensity="1.5" color="#ffffff"></a-light>

          {/* 🔘 3D Interactive Buttons Group (置於大廳正前方) */}
          <a-entity id="portals-container" position="0 1.5 -3">
            
            {/* 任務一按鈕：SOP-MFG-023 (改為圖示) */}
            <a-entity position="-1.5 0 0"
                      class="clickable"
                      scale={hoveredEnterId === 'SOP-MFG-023' ? '1.1 1.1 1' : '1.0 1.0 1'}
                      onMouseEnter={() => setHoveredEnterId('SOP-MFG-023')}
                      onMouseLeave={() => setHoveredEnterId(null)}
                      onClick={() => router.push('/task-preview?taskId=SOP-MFG-023')}>
              
              {/* 白色背景的層流箱 Icon */}
              <a-image src="#sop-icon-white" width="1.2" height="1.2" position="0 0 0" material="shader: flat; transparent: false"></a-image>
              
              {/* 光環提示效果 (Hover) */}
              {hoveredEnterId === 'SOP-MFG-023' && (
                <a-ring radius-inner="0.65" radius-outer="0.7" color="#38bdf8" material="shader: flat; transparent: true; opacity: 0.8" position="0 0 -0.01" animation="property: rotation; to: 0 0 -360; loop: true; dur: 8000; easing: linear"></a-ring>
              )}
              
              {/* Canvas 渲染的中文字 (解決 A-Frame 不支援中文的問題) */}
              <a-image id="sop-text-img" src="#sopTextCanvas" width="2" height="0.5" position="0 -0.8 0.01" material="shader: flat; transparent: true"></a-image>
            </a-entity>

            {/* 任務二按鈕：蛋白質藥物分裝作業 (改為圖示) */}
            <a-entity position="1.5 0 0"
                      class="clickable"
                      scale={hoveredEnterId === 'ProteinAliquoting' ? '1.1 1.1 1' : '1.0 1.0 1'}
                      onMouseEnter={() => setHoveredEnterId('ProteinAliquoting')}
                      onMouseLeave={() => setHoveredEnterId(null)}
                      onClick={() => router.push('/task-preview?taskId=ProteinAliquoting')}>
              
              {/* 白色背景的蛋白質分裝 Icon */}
              <a-image src="#protein-icon-white" width="1.2" height="1.2" position="0 0 0" material="shader: flat; transparent: false"></a-image>
              
              {/* 光環提示效果 (Hover) */}
              {hoveredEnterId === 'ProteinAliquoting' && (
                <a-ring radius-inner="0.65" radius-outer="0.7" color="#34d399" material="shader: flat; transparent: true; opacity: 0.8" position="0 0 -0.01" animation="property: rotation; to: 0 0 360; loop: true; dur: 8000; easing: linear"></a-ring>
              )}
              
              {/* Canvas 渲染的中文字 */}
              <a-image id="protein-text-img" src="#proteinTextCanvas" width="4" height="0.5" position="0 -0.8 0.01" material="shader: flat; transparent: true"></a-image>
            </a-entity>

          </a-entity>

          {/* Camera + Raycaster Cursor for WebVR */}
          <a-entity id="camera-rig" position="0 1.6 0">
            <a-entity camera look-controls>
              <a-entity cursor="fuse: true; fuseTimeout: 1500;"
                        position="0 0 -1"
                        geometry="primitive: ring; radiusInner: 0.015; radiusOuter: 0.025"
                        material="color: #38bdf8; shader: flat; opacity: 0.8"
                        raycaster="objects: .clickable"
                        animation__fusing="property: scale; startEvents: fusing; easing: easeInQuad; dur: 1500; from: 1 1 1; to: 0.1 0.1 0.1"
                        animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeOutQuad; dur: 200; to: 1 1 1">
              </a-entity>
            </a-entity>
          </a-entity>
        </a-scene>
      )}

      {/* CSS 動畫樣式 */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
