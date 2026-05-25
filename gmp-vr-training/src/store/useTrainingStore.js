import { create } from 'zustand';

export const SOP_STEPS_ALIQUOTING = [
  { id: 1, title: '步驟一：器具就位', desc: '拿取微量吸管 (Pipette)，準備進行蛋白質藥物抽取作業。', actionTarget: 'pipette_pickup' },
  { id: 2, title: '步驟二：精準抽取', desc: '從蛋白質原液瓶中準確抽取 1ml 蛋白質原液，動作需平穩避免產生氣泡。', actionTarget: 'protein_stock' },
  { id: 3, title: '步驟三：無菌注入', desc: '將吸管尖端以 45 度角對準分裝瓶內壁緩慢注入。警告：手部或手臂絕不可越過已開蓋的培養皿或瓶口上方！', actionTarget: 'inject' },
  { id: 4, title: '步驟四：合規封裝', desc: '無菌封蓋與貼標，立即將分裝瓶蓋旋緊密封，並貼上含有批號的標籤。', actionTarget: 'seal' },
];

export const SOP_STEPS = SOP_STEPS_ALIQUOTING;

export const SOP_STEPS_HOOD = [
  { id: 1, title: '步驟一：確認層流箱電源與 UV 燈狀態', desc: '確認層流箱電源開啟後，UV 燈已關閉（點擊相關部件可以查看設備說明與名稱）。', actionTarget: 'uv_confirm' },
  { id: 2, title: '步驟二：以 75% 酒精擦拭工作台面', desc: '拿取 75% 酒精噴瓶，均勻噴灑並擦拭工作台面，待其乾燥後方可作業。', actionTarget: 'alcohol_wipe' },
  { id: 3, title: '步驟三：依標準穿戴無塵防護具', desc: '依照 QC-PPE-001 規範，點選穿戴無塵衣、無菌手套與口罩，完成個人無菌防護。', actionTarget: 'ppe_wear' }
];

export const useTrainingStore = create((set, get) => ({
  currentTaskId: 'ProteinAliquoting', // 'ProteinAliquoting' or 'SOP-MFG-023'
  activeSteps: SOP_STEPS_ALIQUOTING,
  currentStepIndex: 0,
  mistakes: [],
  isSimulating: false,
  aiMessage: null,
  xapiLogs: [], // xAPI 稽核紀錄系統
  focusModeStepId: null, // 新增: 專注模式目標步驟 (null 表示關閉)
  show3DHeatmap: false, // 3D VR Heatmap 模式
  
  setTaskId: (taskId) => {
    const steps = taskId === 'SOP-MFG-023' ? SOP_STEPS_HOOD : SOP_STEPS_ALIQUOTING;
    set({ 
      currentTaskId: taskId, 
      activeSteps: steps, 
      currentStepIndex: 0, 
      mistakes: [], 
      aiMessage: null,
      xapiLogs: [],
      focusModeStepId: null,
      show3DHeatmap: false
    });
  },

  startSimulation: () => {
    const steps = get().currentTaskId === 'SOP-MFG-023' ? SOP_STEPS_HOOD : SOP_STEPS_ALIQUOTING;
    set({ 
      isSimulating: true, 
      currentStepIndex: 0, 
      mistakes: [], 
      aiMessage: null, 
      xapiLogs: [], 
      focusModeStepId: null, 
      show3DHeatmap: false,
      activeSteps: steps
    });
    get().logXAPI('initialized', `VR_Simulation_Module_${get().currentTaskId}`);
  },

  enable3DHeatmap: () => {
    set({ show3DHeatmap: true, isSimulating: true, focusModeStepId: null });
  },
  
  // 啟動專注模式 (Focus Mode)
  startFocusMode: (stepId) => {
    const steps = get().activeSteps;
    const stepIdx = steps.findIndex(s => s.id === stepId);
    set({ 
      isSimulating: true, 
      currentStepIndex: stepIdx !== -1 ? stepIdx : 0, 
      focusModeStepId: stepId,
      mistakes: [],
      aiMessage: { type: 'info', text: '已進入專注模式 (Focus Mode)。隔離其他干擾，請專注練習此步驟。' },
      xapiLogs: []
    });
    get().logXAPI('initialized_focus_mode', `Step_${stepId}`);
  },

  // xAPI 追蹤系統：記錄 Actor, Verb, Object, 以及 Hesitation Time
  logXAPI: (verb, object, result = {}) => {
    const timestamp = new Date().toISOString();
    const state = get();
    // 計算與上一筆紀錄的時間差 (Hesitation Time)
    let timeDeltaMs = 0;
    if (state.xapiLogs.length > 0) {
      const lastLog = state.xapiLogs[state.xapiLogs.length - 1];
      timeDeltaMs = new Date(timestamp).getTime() - new Date(lastLog.timestamp).getTime();
    }

    const statement = {
      actor: { name: 'Li Xiao Ming', mbox: 'mailto:li.xiaoming@pharma.com' },
      verb: { id: `http://adlnet.gov/expapi/verbs/${verb}`, display: verb },
      object: { id: `http://pharma.training/objects/${object}`, display: object },
      result: { ...result, hesitationTimeMs: timeDeltaMs },
      timestamp
    };
    
    set((state) => ({ xapiLogs: [...state.xapiLogs, statement] }));
    console.log('[xAPI Log Tracked]:', statement); 
  },
  
  nextStep: () => set((state) => {
    const nextIdx = state.currentStepIndex + 1;
    const steps = state.activeSteps;
    state.logXAPI('completed', steps[state.currentStepIndex].actionTarget, { success: true });
    
    if (nextIdx < steps.length) {
      return { currentStepIndex: nextIdx, aiMessage: { type: 'info', text: '步驟執行正確，請繼續下一步。' } };
    }
    
    state.logXAPI('completed', `VR_Simulation_Module_${state.currentTaskId}`, { success: true, score: 100 - (state.mistakes.length * 10) });
    return { currentStepIndex: nextIdx, aiMessage: null };
  }),
  
  triggerMistake: (customMessage, objectId) => {
    const errorMsg = {
      type: 'error',
      text: customMessage || '提示：此動作與當前 SOP 步驟不符。這是非懲罰性的模擬環境，請不用擔心，參考左側的當前任務提示後再次嘗試。',
      source: 'SOP 2026-V1 錯誤預防指南',
    };
    
    set((state) => {
      state.logXAPI('failed', objectId || 'unknown_object', { success: false, response: customMessage });
      return { 
        mistakes: [...state.mistakes, { msg: customMessage, time: new Date().toISOString(), objectId }],
        aiMessage: errorMsg 
      };
    });
    
    setTimeout(() => {
      set((state) => state.aiMessage?.type === 'error' ? { aiMessage: null } : {});
    }, 6000);
  },
  
  askAI: (question) => {
    const taskName = get().currentTaskId === 'SOP-MFG-023' ? '層流箱操作' : '蛋白質分裝';
    set({ 
      aiMessage: { 
        type: 'info', 
        text: `關於「${question}」：${taskName}需嚴格遵守 Grade A 級無菌規範，操作前需確認氣流穩定及工作台面完成75%酒精擦拭消毒。`, 
        source: 'SOP 2.1 節: 環境要求' 
      } 
    });
  },
  
  clearAiMessage: () => set({ aiMessage: null })
}));
