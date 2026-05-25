"use client";

import { useEffect, useRef, useState } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';

export default function VRSopScene() {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [stamp, setStamp] = useState(null); 
  
  const { 
    currentStepIndex, 
    nextStep, 
    triggerMistake, 
    logXAPI, 
    focusModeStepId, 
    show3DHeatmap, 
    mistakes,
    activeSteps,
    currentTaskId
  } = useTrainingStore();
  
  const sceneRef = useRef(null);

  // SOP-MFG-023 層流箱操作狀態
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isUvOn, setIsUvOn] = useState(true);
  const [isAlcoholSprayed, setIsAlcoholSprayed] = useState(false);
  const [isTableWiped, setIsTableWiped] = useState(false);
  const [wornPpe, setWornPpe] = useState({ suit: false, gloves: false, mask: false });
  const [inspectedPart, setInspectedPart] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.AFRAME) {
      import('aframe').then(() => {
        // Register VR Heatmap Material Component
        if (!window.AFRAME.components['vr-heatmap-material']) {
          window.AFRAME.registerComponent('vr-heatmap-material', {
            schema: {
              hoodErrors: { type: 'number', default: 0 },
              pipetteErrors: { type: 'number', default: 0 },
              vialErrors: { type: 'number', default: 0 },
              petriErrors: { type: 'number', default: 0 },
            },
            init: function () {
              // Heatmap visual indicator
            }
          });
        }
        setAframeLoaded(true);
      }).catch((err) => console.error("Error loading A-Frame:", err));
    } else if (window.AFRAME) {
      setAframeLoaded(true);
    }
  }, []);

  // Robust Hover-to-Advance logic for both mouse and gaze cursors
  useEffect(() => {
    if (!aframeLoaded) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const clickables = document.querySelectorAll('.clickable');
    clickables.forEach(el => {
      let timer = null;
      const onEnter = () => {
        timer = setTimeout(() => {
          el.emit('click');
        }, 1500);
      };
      const onLeave = () => {
        if (timer) clearTimeout(timer);
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el._hoverEnter = onEnter;
      el._hoverLeave = onLeave;
    });

    return () => {
      clickables.forEach(el => {
        if (el._hoverEnter) el.removeEventListener('mouseenter', el._hoverEnter);
        if (el._hoverLeave) el.removeEventListener('mouseleave', el._hoverLeave);
      });
    };
  }, [aframeLoaded, currentStepIndex]);


  // 動態更新 3D 懸浮中文解說面板 Canvas
  const updateInspectedCanvas = (title, desc) => {
    const canvas = document.getElementById('inspectedPartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 半透明深藍色玻璃背景
    ctx.fillStyle = 'rgba(11, 21, 41, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 霓虹藍邊框
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Title 繪製
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(title, canvas.width / 2, 70);
    
    // Description 繪製
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    
    // 中文折行演算法
    const words = desc.split('');
    let line = '';
    let y = 140;
    const maxWidth = canvas.width - 80;
    const lineHeight = 38;
    
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n];
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // 通知 A-Frame 貼圖需要更新
    const el = document.getElementById('inspected-part-plane');
    if (el && el.components && el.components.material) {
      const material = el.components.material;
      if (material.material && material.material.map) {
        material.material.map.needsUpdate = true;
      }
    }
  };

  // 點選超淨台部件解說
  const handleShowPartInfo = (partName, partDesc) => {
    setInspectedPart({ name: partName, desc: partDesc });
    logXAPI('inspected', partName);
    
    // 廣播至左下角 AI 智慧助理
    useTrainingStore.setState({
      aiMessage: {
        type: 'info',
        text: `【設備檢視】${partName}：${partDesc}`,
        source: 'SOP-MFG-023 官方設備說明指引'
      }
    });
    
    setTimeout(() => {
      updateInspectedCanvas(partName, partDesc);
    }, 100);
  };

  // 步驟一：UV 燈控制
  const handleToggleUv = () => {
    if (currentTaskId !== 'SOP-MFG-023') {
      handleShowPartInfo('UV 滅菌燈管', '專門用於操作前後對工作台面進行紫外線殺菌消毒。作業中必須處於關閉狀態以防人體輻射危害。');
      return;
    }
    
    if (currentStepIndex === 0) {
      if (isUvOn) {
        setIsUvOn(false);
        logXAPI('deactivated', 'UV_lamp');
        
        // 觸發步驟一完成判定 (如果 Power 也開啟了)
        if (isPowerOn) {
          showComplianceStamp('步驟一合格: 電源/UV燈檢測通過');
          nextStep();
        } else {
          useTrainingStore.setState({
            aiMessage: {
              type: 'info',
              text: 'UV 滅菌燈已安全關閉。請開啟 POWER 電源以啟動正壓氣流風機。',
              source: 'SOP-MFG-023 第 1 步'
            }
          });
        }
      } else {
        handleShowPartInfo('UV 滅菌燈管', 'UV 燈管已為關閉狀態。請開啟電源以啟動超淨台。');
      }
    } else {
      handleShowPartInfo('UV 滅菌燈管', 'UV 滅菌燈管在作業進行中不可重新開啟，以維護無菌安全。');
    }
  };

  // 步驟一：Power 電源控制
  const handleTogglePower = () => {
    if (currentTaskId !== 'SOP-MFG-023') {
      handleShowPartInfo('電源開關', '超淨台的總電源開關，啟動後可驅動高效風機進行空氣層流循環。');
      return;
    }
    
    if (currentStepIndex === 0) {
      if (!isPowerOn) {
        setIsPowerOn(true);
        logXAPI('activated', 'power_switch');
        
        // 觸發步驟一完成判定 (如果 UV 也關閉了)
        if (!isUvOn) {
          showComplianceStamp('步驟一合格: 電源/UV燈檢測通過');
          nextStep();
        } else {
          useTrainingStore.setState({
            aiMessage: {
              type: 'info',
              text: 'POWER 電源已順利啟動。但超淨台仍籠罩在 UV 紫外線危險紫光中，請先關閉 UV 滅菌燈管！',
              source: 'SOP-MFG-023 第 1 步'
            }
          });
        }
      } else {
        handleShowPartInfo('電源開關', '電源已經處於開啟狀態。請關閉 UV 燈管以完成此步驟。');
      }
    } else {
      handleShowPartInfo('電源開關', '電源開關已鎖定。作業進行中請勿任意關閉總電源。');
    }
  };

  // 步驟二：噴灑 75% 酒精
  const handleSprayAlcohol = () => {
    if (currentTaskId !== 'SOP-MFG-023') return;
    
    if (currentStepIndex === 1) {
      setIsAlcoholSprayed(true);
      logXAPI('sprayed', '75%_alcohol_bottle');
      useTrainingStore.setState({
        aiMessage: {
          type: 'info',
          text: '75% 酒精已均勻噴灑於工作台面上。請點選不鏽鋼台面進行大面積無塵布擦拭消毒。',
          source: 'SOP-MFG-023 第 2 步'
        }
      });
    } else {
      useTrainingStore.setState({
        aiMessage: {
          type: 'info',
          text: '75% 酒精消毒噴瓶。依標準程序，此步驟僅在擦拭前執行。',
          source: 'SOP-MFG-023 第 2 步'
        }
      });
    }
  };

  // 步驟二：工作台面擦拭
  const handleWipeTable = () => {
    if (currentTaskId !== 'SOP-MFG-023') {
      handleShowPartInfo('工作台面', '高等級不鏽鋼工作台面，為 Grade A 無菌操作的核心區域。');
      return;
    }
    
    if (currentStepIndex === 1) {
      if (!isAlcoholSprayed) {
        // 未噴酒精直接擦拭，觸發錯誤預防與扣點
        triggerMistake('無菌消毒警告：未噴灑 75% 酒精前直接擦拭台面無法達到預期殺菌功效，請先點選左側酒精噴瓶。', 'workbench');
      } else {
        setIsTableWiped(true);
        showComplianceStamp('步驟二合格: 台面酒精擦拭消毒通過');
        nextStep();
      }
    } else if (currentStepIndex === 0) {
      handleShowPartInfo('工作台面', '工作台面目前被紫外線籠罩中。請先完成步驟一之電源與 UV 燈檢驗。');
    } else {
      handleShowPartInfo('工作台面', '工作台面已完成酒精擦拭消毒，呈現無菌鏡面光澤，可安全作業。');
    }
  };

  // 步驟三：依標準穿戴無塵防護具 (SUIT -> GLOVE -> MASK)
  const handleWearPpe = (type) => {
    if (currentTaskId !== 'SOP-MFG-023' || currentStepIndex !== 2) return;
    
    if (type === 'suit') {
      if (wornPpe.suit) return;
      const newPpe = { ...wornPpe, suit: true };
      setWornPpe(newPpe);
      logXAPI('donned', '無塵衣');
      useTrainingStore.setState({
        aiMessage: {
          type: 'info',
          text: 'SUIT 無塵衣穿戴正確。請繼續點選 GLOVE 穿戴無菌手套。',
          source: 'QC-PPE-001 規範'
        }
      });
    } else if (type === 'gloves') {
      if (wornPpe.gloves) return;
      if (!wornPpe.suit) {
        // 違反穿戴順序
        triggerMistake('無菌裝備穿戴警告：防護具穿戴必須符合標準順序 (無塵衣 ➔ 無菌手套 ➔ 無塵口罩)，請遵循由上而下無菌防護規範，防止交叉污染！', 'sterile_gloves');
      } else {
        const newPpe = { ...wornPpe, gloves: true };
        setWornPpe(newPpe);
        logXAPI('donned', '無菌手套');
        useTrainingStore.setState({
          aiMessage: {
            type: 'info',
            text: 'GLOVE 無菌手套穿戴正確。請繼續點選 MASK 穿戴無塵口罩完成最後防護。',
            source: 'QC-PPE-001 規範'
          }
        });
      }
    } else if (type === 'mask') {
      if (wornPpe.mask) return;
      if (!wornPpe.suit || !wornPpe.gloves) {
        // 違反穿戴順序
        triggerMistake('無菌裝備穿戴警告：防護具穿戴必須符合標準順序 (無塵衣 ➔ 無菌手套 ➔ 無塵口罩)，請遵循由上而下無菌防護規範，防止交叉污染！', 'sterile_mask');
      } else {
        const newPpe = { ...wornPpe, mask: true };
        setWornPpe(newPpe);
        logXAPI('donned', '無塵口罩');
        
        // 三項全部完成
        showComplianceStamp('步驟三合格: PPE 穿戴程序完成');
        nextStep();
      }
    }
  };



  // 顯示合規檢驗印記
  const showComplianceStamp = (text) => {
    setStamp({ visible: true, text });
    setTimeout(() => {
      setStamp(null);
    }, 3000);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      {aframeLoaded && (
        <a-scene embedded style={{ width: '100%', height: '100%' }}
                 vr-mode-ui="enabled: true"
                 renderer="colorManagement: true; physicallyCorrectLights: true">
          <a-assets>
            {/* 隱藏之 Canvas 用於 3D 空間動態中文渲染 */}
            <canvas id="inspectedPartCanvas" width="1024" height="512"></canvas>
          </a-assets>

          {/* 360度真實實驗室背景 */}
          <a-sky src="/lab_custom.jpg" rotation="0 -90 0"></a-sky>

          {/* 基礎照明與燈光 */}
          <a-light type="ambient" intensity="0.8" color="#ffffff"></a-light>
          <a-light type="directional" intensity="1.2" position="2 4 1" castShadow="true"></a-light>

          {/* ----------------- 3D 層流箱主體結構 (Laminar Flow Hood) ----------------- */}
          <a-entity id="laminar-flow-hood" position="0 0 -2.5">
            {/* 1. 超淨台不鏽鋼底座 */}
            <a-box position="0 0.4 0" width="2.4" height="0.8" depth="1.2" color="#64748b" roughness="0.2"></a-box>
            
            {/* 2. 工作台面 (Workbench Surface with Dynamic Emissive Glow) */}
            <a-box position="0 0.8 0" width="2.4" height="0.04" depth="1.2"
                   class="clickable"
                   onClick={handleWipeTable}
                   material={`
                     color: ${isTableWiped ? '#0f172a' : (isAlcoholSprayed ? '#334155' : '#475569')}; 
                     roughness: ${isTableWiped ? 0.05 : 0.2}; 
                     metalness: 0.9;
                     emissive: ${isTableWiped ? '#0088ff' : (isAlcoholSprayed ? '#38bdf8' : '#000000')};
                     emissiveIntensity: ${isTableWiped ? 0.4 : (isAlcoholSprayed ? 0.2 : 0.0)}
                   `}
                   animation={isTableWiped ? "property: material.emissiveIntensity; from: 0.4; to: 0.6; dir: alternate; loop: true; dur: 1500" : ""}>
            </a-box>

            {/* 3. 超淨台上部機箱 (HEPA Filter housing) */}
            <a-box position="0 2.2 0" width="2.4" height="0.4" depth="1.2" color="#cbd5e1" class="clickable" onClick={() => handleShowPartInfo('HEPA 高效過濾器', '高效空氣微粒過濾器 (HEPA)，能過濾 99.97% 的 0.3 微米微粒，為工作區創造 Class 100 (Grade A) 的高度無菌層流環境。')}></a-box>

            {/* 4. 後方鋼壁板 (Backplate) */}
            <a-box position="0 1.5 -0.58" width="2.4" height="1.0" depth="0.04" color="#94a3b8" class="clickable" onClick={() => handleShowPartInfo('後壁板', '高級不鏽鋼一體成型後壁板，易於清潔，無菌 Grade A 級環境之屏障。')}></a-box>

            {/* 5. 左右玻璃側板 (Side Glass Walls) */}
            <a-box position="-1.19 1.5 0" width="0.02" height="1.0" depth="1.18" material="color: #38bdf8; opacity: 0.15; transparent: true"></a-box>
            <a-box position="1.19 1.5 0" width="0.02" height="1.0" depth="1.18" material="color: #38bdf8; opacity: 0.15; transparent: true"></a-box>

            {/* 6. 前置鋼化玻璃滑門 (Glass Slide Door - Translucent overlay) */}
            <a-box position="0 1.55 0.58" width="2.38" height="1.0" depth="0.02"
                   class="clickable"
                   onClick={() => handleShowPartInfo('防護玻璃滑門', '超淨台前側鋼化玻璃安全防護罩。在提供視線的同時，作為物理屏障，防止外在環境塵埃與飛沫侵入無菌區域。')}
                   material="color: #38bdf8; opacity: 0.18; transparent: true; roughness: 0.05">
            </a-box>

            {/* 7. UV 滅菌燈管 (UV Germicidal Tube) */}
            <a-cylinder position="0 1.95 -0.4" radius="0.02" height="1.6" rotation="0 0 90"
                        class="clickable"
                        onClick={handleToggleUv}
                        material={`color: ${isUvOn ? '#e9d5ff' : '#94a3b8'}; emissive: ${isUvOn ? '#a855f7' : '#000000'}; emissiveIntensity: ${isUvOn ? 0.8 : 0}`}>
            </a-cylinder>

            {/* 8. 電源與風力開關控制盒 (Power Box) */}
            <a-box position="-0.9 1.4 0.59" width="0.12" height="0.16" depth="0.04" color="#1e293b">
              {/* Power Button */}
              <a-box position="-0.03 0.03 0.025" width="0.04" height="0.04" depth="0.02"
                     class="clickable"
                     onClick={handleTogglePower}
                     material={`color: ${isPowerOn ? '#10b981' : '#ef4444'}; emissive: ${isPowerOn ? '#10b981' : '#000000'}; emissiveIntensity: 0.5`}>
              </a-box>
              <a-text value="POWER" align="center" position="-0.03 -0.04 0.04" scale="0.1 0.1 0.1" color="white"></a-text>

              {/* UV Indicator */}
              <a-box position="0.03 0.03 0.025" width="0.04" height="0.04" depth="0.02"
                     class="clickable"
                     onClick={handleToggleUv}
                     material={`color: ${isUvOn ? '#a855f7' : '#475569'}; emissive: ${isUvOn ? '#a855f7' : '#000000'}; emissiveIntensity: 0.5`}>
              </a-box>
              <a-text value="UV" align="center" position="0.03 -0.04 0.04" scale="0.1 0.1 0.1" color="white"></a-text>
            </a-box>

            {/* ---------------- 任務一：SOP-MFG-023 專用視覺與道具 ---------------- */}
            <a-entity id="sop-mfg-task-entities">
                {/* 紫色 UV 滅菌危險強光 */}
                {isUvOn && (
                  <a-light type="point" color="#a855f7" intensity="2.5" distance="3" position="0 1.5 0"></a-light>
                )}

                {/* 垂直高效正流風機氣流視覺 (Airflow cyan particle wind stream simulation) */}
                {isPowerOn && (
                  <a-entity id="airflow-simulation">
                    <a-plane position="0 1.4 0" rotation="-90 0 0" width="2.2" height="1.0"
                             material="color: #22d3ee; opacity: 0.08; transparent: true; wireframe: true"
                             animation="property: position; to: 0 0.85 0; loop: true; dur: 2000; easing: linear">
                    </a-plane>
                    <a-plane position="0 1.7 0" rotation="-90 0 0" width="2.2" height="1.0"
                             material="color: #22d3ee; opacity: 0.05; transparent: true; wireframe: true"
                             animation="property: position; to: 0 1.15 0; loop: true; dur: 2000; easing: linear">
                    </a-plane>
                  </a-entity>
                )}

                {/* 75% 酒精消毒噴罐 */}
                {currentStepIndex === 1 && (
                  <a-entity id="alcohol-spray-bottle" position="-0.7 0.82 0.3" rotation="0 45 0">
                    <a-cylinder class="clickable"
                                onClick={handleSprayAlcohol}
                                radius="0.035" height="0.16"
                                material="color: #0ea5e9; roughness: 0.3; metalness: 0.5">
                    </a-cylinder>
                    <a-box position="0 0.09 0" width="0.03" height="0.04" depth="0.06" color="#0284c7"></a-box>
                    <a-text value="75% ALCOHOL" align="center" position="0 0.16 0" scale="0.13 0.13 0.13" color="#38bdf8"></a-text>
                  </a-entity>
                )}

                {/* PPE 穿戴 Holographic 控制面板 (Floating 3D glass panel on the right) */}
                {currentStepIndex === 2 && (
                  <a-entity id="ppe-wearing-panel" position="0.8 1.1 0.4" rotation="0 -30 0">
                    {/* Panel Backdrop */}
                    <a-plane width="0.5" height="0.32" material="color: #0f172a; opacity: 0.85; transparent: true; roughness: 0.1; metalness: 0.8" shadow="cast: true"></a-plane>
                    <a-text value="QC-PPE-001 PPE BOARD" align="center" position="0 0.11 0.01" scale="0.12 0.12 0.12" color="#38bdf8"></a-text>

                    {/* SUIT (無塵衣) Button */}
                    <a-box position="-0.15 -0.04 0.01" width="0.11" height="0.07" depth="0.02"
                           class="clickable"
                           onClick={() => handleWearPpe('suit')}
                           material={`color: ${wornPpe.suit ? '#10b981' : '#f59e0b'}; emissive: ${wornPpe.suit ? '#10b981' : '#000000'}; emissiveIntensity: 0.4`}>
                      {/* Gaze Reticle animation indicator */}
                      {!wornPpe.suit && (
                        <a-box position="0 0 0" width="0.13" height="0.09" depth="0.03" material="color: #38bdf8; opacity: 0.2; transparent: true; wireframe: true"
                               animation="property: material.opacity; to: 0.6; dir: alternate; loop: true; dur: 1000"></a-box>
                      )}
                      <a-text value="SUIT" align="center" position="0 0 0.015" scale="0.16 0.16 0.16" color="white"></a-text>
                    </a-box>

                    {/* GLOVE (無菌手套) Button */}
                    <a-box position="0 -0.04 0.01" width="0.11" height="0.07" depth="0.02"
                           class="clickable"
                           onClick={() => handleWearPpe('gloves')}
                           material={`color: ${wornPpe.gloves ? '#10b981' : (wornPpe.suit ? '#38bdf8' : '#64748b')}; emissive: ${wornPpe.gloves ? '#10b981' : (wornPpe.suit ? '#38bdf8' : '#000000')}; emissiveIntensity: 0.4`}>
                      {wornPpe.suit && !wornPpe.gloves && (
                        <a-box position="0 0 0" width="0.13" height="0.09" depth="0.03" material="color: #38bdf8; opacity: 0.2; transparent: true; wireframe: true"
                               animation="property: material.opacity; to: 0.6; dir: alternate; loop: true; dur: 1000"></a-box>
                      )}
                      <a-text value="GLOVE" align="center" position="0 0 0.015" scale="0.16 0.16 0.16" color="white"></a-text>
                    </a-box>

                    {/* MASK (無塵口罩) Button */}
                    <a-box position="0.15 -0.04 0.01" width="0.11" height="0.07" depth="0.02"
                           class="clickable"
                           onClick={() => handleWearPpe('mask')}
                           material={`color: ${wornPpe.mask ? '#10b981' : (wornPpe.suit && wornPpe.gloves ? '#38bdf8' : '#64748b')}; emissive: ${wornPpe.mask ? '#10b981' : (wornPpe.suit && wornPpe.gloves ? '#38bdf8' : '#000000')}; emissiveIntensity: 0.4`}>
                      {wornPpe.suit && wornPpe.gloves && !wornPpe.mask && (
                        <a-box position="0 0 0" width="0.13" height="0.09" depth="0.03" material="color: #38bdf8; opacity: 0.2; transparent: true; wireframe: true"
                               animation="property: material.opacity; to: 0.6; dir: alternate; loop: true; dur: 1000"></a-box>
                      )}
                      <a-text value="MASK" align="center" position="0 0 0.015" scale="0.16 0.16 0.16" color="white"></a-text>
                    </a-box>
                  </a-entity>
                )}
              </a-entity>



            {/* 3D 懸浮中文解說面板 */}
            {inspectedPart && (
              <a-entity id="inspected-part-panel" position="0 1.5 -0.56" rotation="-5 0 0">
                <a-plane id="inspected-part-plane" width="1.1" height="0.55" 
                         material="shader: flat; src: #inspectedPartCanvas; transparent: true">
                </a-plane>
              </a-entity>
            )}
          </a-entity>

          {/* Camera and Reticle (Gaze Raycaster with Reticle Fusing animation) */}
          <a-entity id="camera-rig" position="0 1.5 0">
            <a-entity camera look-controls>
              {/* Reticle Gaze Cursor */}
              <a-entity cursor="fuse: true; fuseTimeout: 1500;"
                        position="0 0 -1"
                        geometry="primitive: ring; radiusInner: 0.015; radiusOuter: 0.024"
                        material="color: #38bdf8; shader: flat; opacity: 0.85"
                        raycaster="objects: .clickable"
                        animation__fusing="property: scale; startEvents: fusing; easing: easeInQuad; dur: 1500; from: 1 1 1; to: 0.1 0.1 0.1"
                        animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeOutQuad; dur: 200; to: 1 1 1">
              </a-entity>

              {/* Compliance Stamp (合規標章印記) */}
              {stamp && stamp.visible && (
                <a-entity position="0 0.3 -1.2"
                          animation="property: position; to: 0 0.45 -1.2; dur: 2000; easing: easeOutQuad">
                  <a-plane width="0.7" height="0.18" color="#10b981" opacity="0.25" transparent="true"></a-plane>
                  <a-text value={stamp.text} align="center" position="0 0 0.015" scale="0.25 0.25 0.25" color="#10b981"></a-text>
                </a-entity>
              )}
            </a-entity>

            {/* Hand Controllers (Laser beam pointers for standard VR headsets) */}
            <a-entity laser-controls="hand: left" raycaster="objects: .clickable; far: 5"></a-entity>
            <a-entity laser-controls="hand: right" raycaster="objects: .clickable; far: 5"></a-entity>
          </a-entity>

        </a-scene>
      )}
    </div>
  );
}
