"use client";

import { useEffect, useRef, useState } from 'react';
import { useTrainingStore, SOP_STEPS } from '../store/useTrainingStore';

export default function VRScene() {
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
  
  const currentStep = activeSteps[currentStepIndex];
  const sceneRef = useRef(null);



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

  // Register custom simple-grab component for interaction feedback
useEffect(() => {
  if (!aframeLoaded) return;
  // Define component only once
  if (!window.AFRAME.components['simple-grab']) {
    window.AFRAME.registerComponent('simple-grab', {
      init: function () {
        this.isGrabbed = false;
        this.originalParent = this.el.parentEl;
        this.originalPosition = null;
        this.meshes = [];

        const setGlow = (colorHex, intensity) => {
          if (this.meshes.length === 0) {
            this.el.object3D.traverse((node) => {
              if (node.isMesh && node.material) {
                this.meshes.push({
                  mesh: node,
                  origEmissive: node.material.emissive ? node.material.emissive.clone() : new window.THREE.Color(0x000000),
                  origIntensity: node.material.emissiveIntensity || 0
                });
              }
            });
          }
          this.meshes.forEach(m => {
            if (!m.mesh.material) return;
            // Ensure the material supports emissive, or inject a dummy color if missing
            if (!m.mesh.material.emissive) {
              m.mesh.material.emissive = new window.THREE.Color(0x000000);
            }
            if (colorHex === null) {
              m.mesh.material.emissive.copy(m.origEmissive);
              m.mesh.material.emissiveIntensity = m.origIntensity;
            } else {
              m.mesh.material.emissive.setHex(colorHex);
              m.mesh.material.emissiveIntensity = intensity;
            }
            m.mesh.material.needsUpdate = true;
          });
        };

        this.el.addEventListener('mouseenter', () => {
          if (!this.isGrabbed) setGlow(0x34d399, 0.4); // Emerald Green
        });
        this.el.addEventListener('mouseleave', () => {
          if (!this.isGrabbed) setGlow(null, null);
        });
        this.el.addEventListener('click', () => {
          if (!this.isGrabbed) {
            const camera = document.querySelector('#camera-rig');
            if (camera) {
              this.originalPosition = { ...this.el.getAttribute('position') };
              this.originalParent = this.el.parentEl;
              this.el.object3D.parent = camera.object3D;
              this.isGrabbed = true;
              setGlow(0xffbf00, 0.5); // Amber Gold
            }
          } else {
            if (this.originalParent) {
              this.el.object3D.parent = this.originalParent.object3D;
              this.el.setAttribute('position', this.originalPosition);
            }
            this.isGrabbed = false;
            setGlow(0x34d399, 0.4);
          }
        });
      }
    });
  }


  // Apply components to all clickable objects
  const clickEls = document.querySelectorAll('.clickable');
  clickEls.forEach(el => {
    el.setAttribute('simple-grab', '');
  });
}, [aframeLoaded]);

// Global A-Frame click listener to bridge to React state
useEffect(() => {
  if (!aframeLoaded) return;
  const scene = sceneRef.current;
  if (!scene) return;
  
  const triggerStep = (target) => {
    if (target && target.classList && target.classList.contains('clickable')) {
      const stepStr = target.getAttribute('data-step');
      const stepName = target.getAttribute('data-name');
      if (stepStr && stepName) {
        handleAliquotingStep(parseInt(stepStr, 10), stepName);
      }
    }
  };

  const handleSceneClick = (e) => {
    triggerStep(e.target);
  };
  scene.addEventListener('click', handleSceneClick);

  // Attach hover logic directly to elements to avoid raycaster conflicts
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
    scene.removeEventListener('click', handleSceneClick);
    clickables.forEach(el => {
      if (el._hoverEnter) el.removeEventListener('mouseenter', el._hoverEnter);
      if (el._hoverLeave) el.removeEventListener('mouseleave', el._hoverLeave);
    });
  };
}, [aframeLoaded, currentStepIndex]); // Re-bind when step changes so handleAliquotingStep closure is fresh


  // 任務二：蛋白質藥物分裝步驟處理
  const handleAliquotingStep = (stepNum, name) => {
    if (currentStepIndex === stepNum - 1) {
      showComplianceStamp(`完成：${name}`);
      nextStep();
    } else {
      triggerMistake(`操作步驟錯誤：當前應進行【${activeSteps[currentStepIndex].title}】！`, `step_${stepNum}`);
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
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>

      {aframeLoaded && (
        <a-scene embedded ref={sceneRef}
                 vr-mode-ui="enabled: true" 
                 shadow="type: pcfsoft; autoUpdate: true"
                 antialias="true"
                 renderer="colorManagement: true; physicallyCorrectLights: true; toneMapping: ACESFilmic; toneMappingExposure: 1.2">
          <a-assets>

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
            
            {/* 2. 工作台面 */}
            <a-box position="0 0.8 0" width="2.4" height="0.04" depth="1.2"
                   color="#475569" roughness="0.2" metalness="0.9"></a-box>

            {/* 3. 超淨台上部機箱 */}
            <a-box position="0 2.2 0" width="2.4" height="0.4" depth="1.2" color="#cbd5e1"></a-box>

            {/* 4. 後方鋼壁板 */}
            <a-box position="0 1.5 -0.58" width="2.4" height="1.0" depth="0.04" color="#94a3b8"></a-box>

            {/* 5. 左右玻璃側板 */}
            <a-box position="-1.19 1.5 0" width="0.02" height="1.0" depth="1.18" material="color: #38bdf8; opacity: 0.15; transparent: true"></a-box>
            <a-box position="1.19 1.5 0" width="0.02" height="1.0" depth="1.18" material="color: #38bdf8; opacity: 0.15; transparent: true"></a-box>

            {/* 6. 前置鋼化玻璃滑門 */}
            <a-box position="0 1.55 0.58" width="2.38" height="1.0" depth="0.02"
                   material="color: #38bdf8; opacity: 0.18; transparent: true; roughness: 0.05">
            </a-box>

            {/* 7. UV 滅菌燈管 */}
            <a-cylinder position="0 1.95 -0.4" radius="0.02" height="1.6" rotation="0 0 90"
                        material={`color: #94a3b8; emissive: #000000; emissiveIntensity: 0`}>
            </a-cylinder>

            {/* 8. 電源與風力開關控制盒 */}
            <a-box position="-0.9 1.4 0.59" width="0.12" height="0.16" depth="0.04" color="#1e293b">
              {/* Power Button */}
              <a-box position="-0.03 0.03 0.025" width="0.04" height="0.04" depth="0.02"
                     material={`color: #10b981; emissive: #10b981; emissiveIntensity: 0.5`}>
              </a-box>
              <a-text value="POWER" align="center" position="-0.03 -0.04 0.04" scale="0.1 0.1 0.1" color="white"></a-text>

              {/* UV Indicator */}
              <a-box position="0.03 0.03 0.025" width="0.04" height="0.04" depth="0.02"
                     material={`color: #475569; emissive: #000000; emissiveIntensity: 0.5`}>
              </a-box>
              <a-text value="UV" align="center" position="0.03 -0.04 0.04" scale="0.1 0.1 0.1" color="white"></a-text>
            </a-box>

            <a-entity id="protein-aliquot-task-entities">
                 {/* 左側無菌培養皿 */}
                 <a-entity position="-1.2 1  -2.5" class="clickable" simple-grab>
                   <a-cylinder radius="0.15" height="0.02" material="color: #ffffff; opacity: 0.6; transparent: true; roughness: 0.02; metalness: 0.2;" shadow="cast: true; receive: true"></a-cylinder>
                 </a-entity>
                 {/* 蛋白質原液瓶 (Step 2: 精準抽取) */}
                 <a-cylinder position="0 1.05 -2.7" radius="0.1" height="0.2"
                               material="color: #bae6fd; opacity: 0.8; transparent: true; roughness: 0.01; metalness: 0.3;"
                               shadow="cast: true; receive: true"
                               {...(currentStepIndex === 1 ? { class: "clickable", "simple-grab": "", "data-step": "2", "data-name": "精準抽取" } : {})}>
                   <a-cylinder position="0 -0.05 0" radius="0.09" height="0.1" material="color: #fcd34d; opacity: 0.9" shadow="cast: true"></a-cylinder>
                   <a-text value="Protein Stock" color="#38bdf8" scale="0.3 0.3 0.3" position="0 0.15 0" align="center"></a-text>
                   {/* Hint for step 2 */}
                   { currentStepIndex === 1 && (
                     <a-box position="0 0 0" width="0.24" height="0.24" depth="0.24" material="color: #fcd34d; opacity: 0.3; transparent: true; wireframe: true"
                            animation="property: material.opacity; to: 0.8; dir: alternate; loop: true; dur: 1000"></a-box>
                   )}
                 </a-cylinder>
                 {/* 右側分裝瓶架與分裝瓶 */}
                 <a-box position="0.6 0.97 -2.4" width="0.4" height="0.04" depth="0.3"
                        material="color: #94a3b8; metalness: 0.6; roughness: 0.4;" shadow="cast: true; receive: true">
                   {/* 目標分裝瓶 */}
                   <a-entity position="-0.12 0.04 -0.08">
                     <a-cylinder radius="0.04" height="0.12"
                                 material="color: #ffffff; opacity: 0.5; transparent: true; roughness: 0; metalness: 0.2;"
                                 shadow="cast: true"></a-cylinder>
                     <a-cylinder position="0 0.07 0" radius="0.042" height="0.03"
                                 material="color: #fbbf24; emissive: #fbbf24; emissiveIntensity: 0.5">
                     </a-cylinder>
                   </a-entity>
                 </a-box>

                {/* 分裝瓶 (Vial) */}
                <a-entity position="0 0.82 0.1">
                  <a-cylinder position="0 0.04 0" radius="0.02" height="0.08" color="#f1f5f9" opacity="0.8" roughness="0.1"></a-cylinder>
                  <a-cylinder position="0 0.09 0" radius="0.022" height="0.02" color="#475569"></a-cylinder>
                  <a-text value="VIAL" align="center" position="0 0.14 0" scale="0.1 0.1 0.1" color="white"></a-text>
                </a-entity>

                {/* 吸管放置架與微量吸管 (Pipette - 步驟一：器具就位) */}
                <a-entity position="0.3 0.82 0.1">
                   {/* 放置架 */}
                   <a-box position="0 0.02 0" width="0.08" height="0.04" depth="0.08" color="#334155"></a-box>
                   {/* 移液吸管 */}
                   {currentStepIndex === 0 ? (
                     <a-entity position="0 0.1 0" animation="property: position; to: 0 0.12 0; dir: alternate; loop: true; dur: 1000">
                       <a-cylinder class="clickable" simple-grab data-step="1" data-name="器具就位"
                                   radius="0.006" height="0.16" color="#38bdf8" opacity="0.9"></a-cylinder>
                       <a-box class="clickable" simple-grab data-step="1" data-name="器具就位"
                              position="0 0.08 0" width="0.015" height="0.03" depth="0.015" color="#0284c7"></a-box>
                       {/* Highlight for step 1 */}
                       { currentStep?.id === 1 && (
                         <a-box position="0 0.02 0" width="0.04" height="0.22" depth="0.04" material="color: #38bdf8; opacity: 0.3; transparent: true; wireframe: true"
                                animation="property: material.opacity; to: 0.8; dir: alternate; loop: true; dur: 1000"></a-box>
                       )}
                     </a-entity>
                   ) : (
                     <a-entity position="0 0.1 0">
                       <a-cylinder radius="0.006" height="0.16" color="#cbd5e1" opacity="0.6"></a-cylinder>
                       <a-box position="0 0.08 0" width="0.015" height="0.03" depth="0.015" color="#64748b"></a-box>
                     </a-entity>
                   )}
                   <a-text value="PIPETTE" align="center" position="0 0.22 0" scale="0.1 0.1 0.1" color="white"></a-text>
                 </a-entity>

                {/* 模擬無菌注入區域 (45度角) - 步驟三：無菌注入 */}
                {currentStepIndex === 2 && (
                  <a-entity position="0 0.96 0.1">
                    <a-box class="clickable" data-step="3" data-name="無菌注入"
                           position="0 0 0" width="0.15" height="0.15" depth="0.15"
                           material="color: #22d3ee; opacity: 0.3; transparent: true; wireframe: true"
                           animation="property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear">
                    </a-box>
                    <a-text value="Inject Here" align="center" position="0 0.12 0" scale="0.15 0.15 0.15" color="#22d3ee"></a-text>
                  </a-entity>
                )}

                {/* 模擬封裝區域 - 步驟四：合規封裝 */}
                {/* 模擬封裝區域 - 步驟四：合規封裝 */}
                {currentStepIndex === 3 && (
                  <a-entity position="0 0.94 0.1">
                    <a-box class="clickable" data-step="4" data-name="合規封裝"
                           position="0 0 0" width="0.12" height="0.12" depth="0.12"
                           material="color: #a855f7; opacity: 0.3; transparent: true; wireframe: true"
                           animation="property: scale; to: 1.2 1.2 1.2; dir: alternate; loop: true; dur: 800">
                    </a-box>
                    <a-text value="Seal & Label" align="center" position="0 0.1 0" scale="0.15 0.15 0.15" color="#a855f7"></a-text>
                  </a-entity>
                )}
              </a-entity>



                  {/* ---------------- 任務 SOP-MFG-023 專屬物件 ---------------- */}
                  { currentTaskId === 'SOP-MFG-023' && (
                    <>
                      {/* Step 2: 75% Alcohol Wipe */}
                      <a-entity position="-0.5 1.05 -2.2">
                        <a-cylinder class="clickable" simple-grab data-step="2" data-name="75% 酒精噴瓶"
                                    radius="0.05" height="0.15" color="#e2e8f0">
                          <a-cylinder position="0 0.09 0" radius="0.015" height="0.04" color="#cbd5e1"></a-cylinder>
                          <a-box position="0.03 0.12 0" width="0.06" height="0.02" depth="0.02" color="#3b82f6"></a-box>
                        </a-cylinder>
                        <a-text value="75% Alcohol" align="center" position="0 0 0.06" scale="0.15 0.15 0.15" color="#000000"></a-text>
                        { currentStepIndex === 1 && (
                          <a-box position="0 0.05 0" width="0.14" height="0.22" depth="0.14" material="color: #3b82f6; opacity: 0.3; transparent: true; wireframe: true" animation="property: material.opacity; to: 0.8; dir: alternate; loop: true; dur: 1000"></a-box>
                        )}
                      </a-entity>

                      {/* Step 3: PPE Station (無塵衣、無菌手套與口罩) */}
                      <a-entity position="-1.5 1.3 -1.2" rotation="0 45 0">
                        {/* Cleanroom Suit */}
                        <a-box class="clickable" simple-grab data-step="3" data-name="穿戴 PPE"
                               width="0.4" height="0.6" depth="0.2" color="#f8fafc" material="opacity: 0.8; transparent: true" position="0 0.3 0"></a-box>
                        {/* Gloves */}
                        <a-box class="clickable" simple-grab data-step="3" data-name="穿戴 PPE"
                               width="0.1" height="0.2" depth="0.05" color="#bae6fd" position="-0.12 0.45 0.12"></a-box>
                        <a-box class="clickable" simple-grab data-step="3" data-name="穿戴 PPE"
                               width="0.1" height="0.2" depth="0.05" color="#bae6fd" position="0.12 0.45 0.12"></a-box>
                        {/* Mask */}
                        <a-plane class="clickable" simple-grab data-step="3" data-name="穿戴 PPE"
                                 width="0.2" height="0.1" color="#cbd5e1" position="0 0.65 0.11" rotation="0 0 0"></a-plane>
                        <a-text value="PPE Station" align="center" position="0 0.8 0" scale="0.3 0.3 0.3" color="#ffffff"></a-text>
                        { currentStepIndex === 2 && (
                          <a-box position="0 0.4 0" width="0.5" height="0.8" depth="0.3" material="color: #22d3ee; opacity: 0.3; transparent: true; wireframe: true" animation="property: material.opacity; to: 0.8; dir: alternate; loop: true; dur: 1000"></a-box>
                        )}
                      </a-entity>
                    </>
                  )}


          </a-entity>

          {/* PC Mouse Cursor for Desktop interaction */}
          <a-entity cursor="rayOrigin: mouse" raycaster="objects: .clickable"></a-entity>

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
