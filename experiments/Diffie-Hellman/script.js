/**
 * Diffie-Hellman Simulation Controller
 * Notation: P, G, a, b, x, y, ka, kb
 */

const state = {
    step: 1,
    speed: 1.0,
    voiceGender: 'female',
    P: 23,
    G: 5,
    a: 6,
    b: 15,
    x: null,
    y: null,
    ka: null,
    kb: null
  };
  
  // DOM References
  const inputP = document.getElementById('input-p');
  const inputG = document.getElementById('input-g');
  const inputA = document.getElementById('private-a');
  const inputB = document.getElementById('private-b');
  
  const dispX = document.getElementById('disp-x');
  const dispY = document.getElementById('disp-y');
  const dispRecY = document.getElementById('disp-received-y');
  const dispRecX = document.getElementById('disp-received-x');
  const dispKa = document.getElementById('disp-ka');
  const dispKb = document.getElementById('disp-kb');
  
  const eveP = document.getElementById('eve-p');
  const eveG = document.getElementById('eve-g');
  const eveX = document.getElementById('eve-x');
  const eveY = document.getElementById('eve-y');
  
  const pktAlice = document.getElementById('packet-alice');
  const pktBob = document.getElementById('packet-bob');
  
  const statusMsg = document.getElementById('status-message');
  const traceTerminal = document.getElementById('trace-terminal');
  
  const btnApplyParams = document.getElementById('btn-apply-params');
  const btnPresetParams = document.getElementById('btn-preset-params');
  const btnNextStep = document.getElementById('btn-next-step');
  const btnRestartSim = document.getElementById('btn-restart-sim');
  const btnClearTrace = document.getElementById('btn-clear-trace');
  const btnReadAloud = document.getElementById('btn-read-aloud');
  const btnSubmitQuiz = document.getElementById('btn-submit-quiz');
  const btnShare = document.getElementById('btn-share');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  
  const speedSelect = document.getElementById('speed-select');
  const voiceSelect = document.getElementById('voice-select');
  const currStepNum = document.getElementById('curr-step-num');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const sidebarPanel = document.getElementById('sidebar-panel');
  
  // BigInt modular exponentiation: (base^exp) % mod
  function powerMod(base, exp, mod) {
    let b = BigInt(base), e = BigInt(exp), m = BigInt(mod);
    let res = 1n;
    b = b % m;
    while (e > 0n) {
      if (e % 2n === 1n) res = (res * b) % m;
      e = e / 2n;
      b = (b * b) % m;
    }
    return Number(res);
  }
  
  function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
  }
  
  // Logging & Narration
  function logTrace(text, isGold = false) {
    const ph = traceTerminal.querySelector('.trace-ph');
    if (ph) ph.remove();
  
    const line = document.createElement('div');
    line.className = `log-line ${isGold ? 'gold' : ''}`;
    line.innerHTML = `> ${text}`;
    traceTerminal.appendChild(line);
    traceTerminal.scrollTop = traceTerminal.scrollHeight;
  }
  
  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = state.speed;
  
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchedVoice = voices.find(v => 
        state.voiceGender === 'female' ? v.name.includes('Female') || v.name.includes('Zira') : v.name.includes('David') || v.name.includes('Male')
      );
      if (matchedVoice) utterance.voice = matchedVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
  
  // Parameter Setup
  function applyParameters() {
    const pVal = parseInt(inputP.value, 10);
    const gVal = parseInt(inputG.value, 10);
  
    if (!isPrime(pVal)) {
      statusMsg.textContent = `Modulus P = ${pVal} is not prime. Please enter a prime integer.`;
      statusMsg.className = 'status-box error';
      return false;
    }
    if (gVal >= pVal || gVal < 2) {
      statusMsg.textContent = `Generator G must satisfy 2 <= G < P.`;
      statusMsg.className = 'status-box error';
      return false;
    }
  
    state.P = pVal;
    state.G = gVal;
    eveP.textContent = pVal;
    eveG.textContent = gVal;
  
    statusMsg.textContent = `Valid Domain Set: P = ${pVal}, G = ${gVal}`;
    statusMsg.className = 'status-box success';
    logTrace(`Public domain set: Prime P = ${pVal}, Generator G = ${gVal}`);
    return true;
  }
  
  // Step-by-Step Flow Execution
  function runStep(stepNumber) {
    state.step = stepNumber;
    currStepNum.textContent = stepNumber;
  
    if (stepNumber === 1) {
      resetSimulationState();
      applyParameters();
      btnNextStep.textContent = "Step 2: Generate Keys (x, y) ➔";
      btnNextStep.disabled = false;
    }
    else if (stepNumber === 2) {
      state.a = parseInt(inputA.value, 10);
      state.b = parseInt(inputB.value, 10);
  
      if (state.a >= state.P || state.b >= state.P) {
        statusMsg.textContent = 'Error: Private keys a and b must be strictly less than P.';
        statusMsg.className = 'status-box error';
        return;
      }
  
      // Alice generates x = G^a mod P
      state.x = powerMod(state.G, state.a, state.P);
      // Bob generates y = G^b mod P
      state.y = powerMod(state.G, state.b, state.P);
  
      dispX.textContent = state.x;
      dispY.textContent = state.y;
  
      logTrace(`Alice generated key: x = G^a mod P = ${state.G}^${state.a} mod ${state.P} = <b>${state.x}</b>`);
      logTrace(`Bob generated key: y = G^b mod P = ${state.G}^${state.b} mod ${state.P} = <b>${state.y}</b>`);
      speakText("Step 2: Public keys x and y generated using modular exponentiation.");
  
      btnNextStep.textContent = "Step 3: Exchange Generated Keys ➔";
    }
    else if (stepNumber === 3) {
      pktAlice.style.opacity = '1';
      pktBob.style.opacity = '1';
  
      const transitTime = (1.2 / state.speed).toFixed(2);
      pktAlice.style.transition = `transform ${transitTime}s ease-in-out`;
      pktBob.style.transition = `transform ${transitTime}s ease-in-out`;
  
      pktAlice.style.transform = 'translateX(240px)';
      pktBob.style.transform = 'translateX(-240px)';
  
      btnNextStep.disabled = true;
      logTrace("Exchange of generated keys takes place across public wire...");
      speakText("Step 3: Exchanging generated keys x and y across the insecure line.");
  
      setTimeout(() => {
        eveX.textContent = state.x;
        eveY.textContent = state.y;
  
        dispRecY.textContent = state.y;
        dispRecX.textContent = state.x;
  
        logTrace(`Exchange complete. Alice received key y = ${state.y}, Bob received key x = ${state.x}`);
        logTrace(`Eve intercepted: x = ${state.x} and y = ${state.y}. Private keys a and b remain confidential.`);
        
        btnNextStep.textContent = "Step 4: Compute Secret Key (k_a, k_b) ➔";
        btnNextStep.disabled = false;
      }, transitTime * 1000);
    }
    else if (stepNumber === 4) {
      // Alice derives ka = y^a mod P
      state.ka = powerMod(state.y, state.a, state.P);
      // Bob derives kb = x^b mod P
      state.kb = powerMod(state.x, state.b, state.P);
  
      dispKa.textContent = state.ka;
      dispKb.textContent = state.kb;
  
      logTrace(`Alice derives secret key: k_a = y^a mod P = (${state.y})^${state.a} mod ${state.P} = <b>${state.ka}</b>`);
      logTrace(`Bob derives secret key: k_b = x^b mod P = (${state.x})^${state.b} mod ${state.P} = <b>${state.kb}</b>`);
  
      if (state.ka === state.kb) {
        logTrace(`Algebraically confirmed: k_a = k_b = ${state.ka}! Shared key established.`, true);
        speakText("Step 4: Secret keys k a and k b are identical. Shared key established.");
      }
  
      btnNextStep.textContent = "Protocol Complete";
      btnNextStep.disabled = true;
    }
  }
  
  // Reset
  function resetSimulationState() {
    state.step = 1;
    currStepNum.textContent = '1';
    dispX.textContent = '--';
    dispY.textContent = '--';
    dispRecY.textContent = '--';
    dispRecX.textContent = '--';
    dispKa.textContent = '--';
    dispKb.textContent = '--';
    eveX.textContent = '--';
    eveY.textContent = '--';
  
    pktAlice.style.opacity = '0';
    pktBob.style.opacity = '0';
    pktAlice.style.transform = 'none';
    pktBob.style.transform = 'none';
  
    btnNextStep.disabled = false;
    btnNextStep.textContent = "Step 2: Generate Keys (x, y) ➔";
  }
  
  // Event Listeners
  btnNextStep.addEventListener('click', () => {
    if (state.step < 4) runStep(state.step + 1);
  });
  
  btnNextPage.addEventListener('click', () => {
    if (state.step < 4) runStep(state.step + 1);
  });
  
  btnPrevPage.addEventListener('click', () => {
    if (state.step > 1) runStep(state.step - 1);
  });
  
  btnRestartSim.addEventListener('click', () => {
    resetSimulationState();
    applyParameters();
    logTrace("Simulation reset to Step 1.");
  });
  
  btnApplyParams.addEventListener('click', () => {
    resetSimulationState();
    applyParameters();
  });
  
  btnPresetParams.addEventListener('click', () => {
    const presets = [
      { P: 23, G: 5, a: 6, b: 15 },
      { P: 47, G: 5, a: 12, b: 29 },
      { P: 83, G: 2, a: 17, b: 43 }
    ];
    const p = presets[Math.floor(Math.random() * presets.length)];
    inputP.value = p.P;
    inputG.value = p.G;
    inputA.value = p.a;
    inputB.value = p.b;
    resetSimulationState();
    applyParameters();
  });
  
  speedSelect.addEventListener('change', (e) => {
    state.speed = parseFloat(e.target.value);
  });
  
  voiceSelect.addEventListener('change', (e) => {
    state.voiceGender = e.target.value;
  });
  
  btnReadAloud.addEventListener('click', () => {
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) {
      speakText(activeSection.innerText);
    }
  });
  
  btnClearTrace.addEventListener('click', () => {
    traceTerminal.innerHTML = '<p class="trace-ph">> Terminal cleared.</p>';
  });
  
  // Share Button Functionality
  btnShare.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Experiment link copied to clipboard!");
    }).catch(() => {
      alert("Unable to copy link.");
    });
  });
  
  // Sidebar Toggle (Hamburger menu)
  btnToggleSidebar.addEventListener('click', () => {
    if (sidebarPanel.style.display === 'none') {
      sidebarPanel.style.display = 'flex';
    } else {
      sidebarPanel.style.display = 'none';
    }
  });
  
  // Sidebar Navigation & Tab Switching
  const resourceCards = document.querySelectorAll('.resource-card');
  const contentSections = document.querySelectorAll('.content-section');
  
  resourceCards.forEach(card => {
    card.addEventListener('click', () => {
      resourceCards.forEach(c => c.classList.remove('active'));
      contentSections.forEach(s => s.classList.remove('active'));
  
      card.classList.add('active');
      const targetSection = document.getElementById(card.dataset.target);
      if (targetSection) targetSection.classList.add('active');
    });
  });
  
  // Filter Pills Functionality (All, Interactive, Theory)
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
  
      const filter = pill.dataset.filter;
      resourceCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
  
  // Quiz Evaluation & Reset
const quizForm = document.getElementById('quiz-form');
const btnResetQuiz = document.getElementById('btn-reset-quiz');

btnSubmitQuiz.addEventListener('click', () => {
  const q1 = document.querySelector('input[name="q1"]:checked');
  const q2 = document.querySelector('input[name="q2"]:checked');
  const q3 = document.querySelector('input[name="q3"]:checked');
  const feedback = document.getElementById('quiz-feedback');

  if (!q1 || !q2 || !q3) {
    feedback.textContent = "Please answer all 3 questions before submitting.";
    feedback.className = "status-box error";
    return;
  }

  let score = 0;
  if (q1.value === 'a') score++;
  if (q2.value === 'a') score++;
  if (q3.value === 'a') score++;

  feedback.textContent = `Score: ${score}/3. ${score === 3 ? 'Excellent! You fully understand the mathematical mechanics.' : 'Review the Theory section and try again.'}`;
  feedback.className = `status-box ${score === 3 ? 'success' : 'error'}`;
});

btnResetQuiz.addEventListener('click', () => {
  quizForm.reset();
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = '';
  feedback.className = 'status-box';
});