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
  
  document.addEventListener('DOMContentLoaded', () => {
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
    const btnResetQuiz = document.getElementById('btn-reset-quiz');
    const quizForm = document.getElementById('quiz-form');
    const btnShare = document.getElementById('btn-share');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  
    const speedSelect = document.getElementById('speed-select');
    const voiceSelect = document.getElementById('voice-select');
    const currStepNum = document.getElementById('curr-step-num');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const sidebarPanel = document.getElementById('sidebar-panel');
  
    const resourceCards = document.querySelectorAll('.resource-card');
    const contentSections = document.querySelectorAll('.content-section');
    const filterPills = document.querySelectorAll('.filter-pill');
  
    // --- Math Helpers (BigInt to prevent overflow) ---
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
  
    // --- Logging & Narration ---
    function logTrace(text, isGold = false) {
      if (!traceTerminal) return;
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
          state.voiceGender === 'female'
            ? v.name.includes('Female') || v.name.includes('Zira')
            : v.name.includes('David') || v.name.includes('Male')
        );
        if (matchedVoice) utterance.voice = matchedVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  
    // --- Parameter Validation ---
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
      if (eveP) eveP.textContent = pVal;
      if (eveG) eveG.textContent = gVal;
  
      statusMsg.textContent = `Valid Domain Set: P = ${pVal}, G = ${gVal}`;
      statusMsg.className = 'status-box success';
      logTrace(`Public domain set: Prime P = ${pVal}, Generator G = ${gVal}`);
      return true;
    }
  
    // --- Step-by-Step Flow Execution ---
    function runStep(stepNumber) {
      state.step = stepNumber;
      if (currStepNum) currStepNum.textContent = stepNumber;
  
      if (stepNumber === 1) {
        resetSimulationState();
        applyParameters();
        if (btnNextStep) {
          btnNextStep.textContent = "Step 2: Generate Keys (x, y) ➔";
          btnNextStep.disabled = false;
        }
      } else if (stepNumber === 2) {
        state.a = parseInt(inputA.value, 10);
        state.b = parseInt(inputB.value, 10);
  
        if (state.a >= state.P || state.b >= state.P) {
          statusMsg.textContent = 'Error: Private keys a and b must be strictly less than P.';
          statusMsg.className = 'status-box error';
          return;
        }
  
        state.x = powerMod(state.G, state.a, state.P);
        state.y = powerMod(state.G, state.b, state.P);
  
        dispX.textContent = state.x;
        dispY.textContent = state.y;
  
        logTrace(`Alice generated key: x = G^a mod P = ${state.G}^${state.a} mod ${state.P} = <b>${state.x}</b>`);
        logTrace(`Bob generated key: y = G^b mod P = ${state.G}^${state.b} mod ${state.P} = <b>${state.y}</b>`);
        speakText("Step 2: Public keys x and y generated using modular exponentiation.");
  
        if (btnNextStep) btnNextStep.textContent = "Step 3: Exchange Generated Keys ➔";
      } else if (stepNumber === 3) {
        pktAlice.style.opacity = '1';
        pktBob.style.opacity = '1';
  
        const transitTime = (1.2 / state.speed).toFixed(2);
        pktAlice.style.transition = `transform ${transitTime}s ease-in-out`;
        pktBob.style.transition = `transform ${transitTime}s ease-in-out`;
  
        pktAlice.style.transform = 'translateX(240px)';
        pktBob.style.transform = 'translateX(-240px)';
  
        if (btnNextStep) btnNextStep.disabled = true;
        logTrace("Exchange of generated keys takes place across public wire...");
        speakText("Step 3: Exchanging generated keys x and y across the insecure line.");
  
        setTimeout(() => {
          if (eveX) eveX.textContent = state.x;
          if (eveY) eveY.textContent = state.y;
  
          dispRecY.textContent = state.y;
          dispRecX.textContent = state.x;
  
          logTrace(`Exchange complete. Alice received key y = ${state.y}, Bob received key x = ${state.x}`);
          logTrace(`Eve intercepted: x = ${state.x} and y = ${state.y}. Private keys a and b remain confidential.`);
  
          if (btnNextStep) {
            btnNextStep.textContent = "Step 4: Compute Secret Key (k_a, k_b) ➔";
            btnNextStep.disabled = false;
          }
        }, transitTime * 1000);
      } else if (stepNumber === 4) {
        state.ka = powerMod(state.y, state.a, state.P);
        state.kb = powerMod(state.x, state.b, state.P);
  
        dispKa.textContent = state.ka;
        dispKb.textContent = state.kb;
  
        logTrace(`Alice derives secret key: k_a = y^a mod P = (${state.y})^${state.a} mod ${state.P} = <b>${state.ka}</b>`);
        logTrace(`Bob derives secret key: k_b = x^b mod P = (${state.x})^${state.b} mod ${state.P} = <b>${state.kb}</b>`);
  
        if (state.ka === state.kb) {
          logTrace(`Algebraically confirmed: k_a = k_b = ${state.ka}! Shared key established.`, true);
          speakText("Step 4: Secret keys k a and k b are identical. Shared key established.");
        }
  
        if (btnNextStep) {
          btnNextStep.textContent = "Protocol Complete";
          btnNextStep.disabled = true;
        }
      }
    }
  
    // --- Reset Simulation State ---
    function resetSimulationState() {
      state.step = 1;
      if (currStepNum) currStepNum.textContent = '1';
      dispX.textContent = '--';
      dispY.textContent = '--';
      dispRecY.textContent = '--';
      dispRecX.textContent = '--';
      dispKa.textContent = '--';
      dispKb.textContent = '--';
      if (eveX) eveX.textContent = '--';
      if (eveY) eveY.textContent = '--';
  
      pktAlice.style.opacity = '0';
      pktBob.style.opacity = '0';
      pktAlice.style.transform = 'none';
      pktBob.style.transform = 'none';
  
      if (btnNextStep) {
        btnNextStep.disabled = false;
        btnNextStep.textContent = "Step 2: Generate Keys (x, y) ➔";
      }
    }
  
    // --- Button Listeners ---
    if (btnNextStep) {
      btnNextStep.addEventListener('click', () => {
        if (state.step < 4) runStep(state.step + 1);
      });
    }
  
    if (btnNextPage) {
      btnNextPage.addEventListener('click', () => {
        if (state.step < 4) runStep(state.step + 1);
      });
    }
  
    if (btnPrevPage) {
      btnPrevPage.addEventListener('click', () => {
        if (state.step > 1) runStep(state.step - 1);
      });
    }
  
    if (btnRestartSim) {
      btnRestartSim.addEventListener('click', () => {
        resetSimulationState();
        applyParameters();
        logTrace("Simulation reset to Step 1.");
      });
    }
  
    if (btnApplyParams) {
      btnApplyParams.addEventListener('click', () => {
        resetSimulationState();
        applyParameters();
      });
    }
  
    if (btnPresetParams) {
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
    }
  
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        state.speed = parseFloat(e.target.value);
      });
    }
  
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        state.voiceGender = e.target.value;
      });
    }
  
    if (btnReadAloud) {
      btnReadAloud.addEventListener('click', () => {
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
          speakText(activeSection.innerText);
        }
      });
    }
  
    if (btnClearTrace) {
      btnClearTrace.addEventListener('click', () => {
        traceTerminal.innerHTML = '<p class="trace-ph">> Terminal cleared.</p>';
      });
    }
  
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          alert("Experiment link copied to clipboard!");
        }).catch(() => {
          alert("Unable to copy link.");
        });
      });
    }
  
    if (btnToggleSidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        if (sidebarPanel.style.display === 'none') {
          sidebarPanel.style.display = 'flex';
        } else {
          sidebarPanel.style.display = 'none';
        }
      });
    }
  
    // --- Left Sidebar Navigation & Section Toggling ---
    resourceCards.forEach(card => {
      card.addEventListener('click', () => {
        resourceCards.forEach(c => c.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));
  
        card.classList.add('active');
        const targetSection = document.getElementById(card.dataset.target);
        if (targetSection) targetSection.classList.add('active');
      });
    });
  
    // --- Filter Pills Functionality (All, Interactive, Theory) ---
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
  
    // --- Quiz Evaluation & Reset (Test Your Understanding - 5 Questions) ---
    if (btnSubmitQuiz) {
      btnSubmitQuiz.addEventListener('click', () => {
        const answers = {
          q1: 'b', // CDH / DLP assumption
          q2: 'b', // Full multiplicative group order P - 1
          q3: 'a', // (x*y) mod P = G^(a+b) mod P != G^(ab) mod P
          q4: 'b', // Pohlig-Hellman on smooth order (P - 1)
          q5: 'c'  // Two independent keys (Alice-Mallory and Mallory-Bob)
        };
  
        const selected = {};
        let answeredCount = 0;
  
        for (let i = 1; i <= 5; i++) {
          const choice = document.querySelector(`input[name="q${i}"]:checked`);
          if (choice) {
            selected[`q${i}`] = choice.value;
            answeredCount++;
          }
        }
  
        const feedback = document.getElementById('quiz-feedback');
  
        if (answeredCount < 5) {
          feedback.textContent = `Please answer all 5 questions before submitting. (${answeredCount}/5 answered)`;
          feedback.className = "status-box error";
          return;
        }
  
        let score = 0;
        for (let key in answers) {
          if (selected[key] === answers[key]) {
            score++;
          }
        }
  
        if (score === 5) {
          feedback.textContent = `Score: 5/5 (100%). Outstanding! You have mastered the mathematical and theoretical foundations of the Diffie–Hellman protocol.`;
          feedback.className = "status-box success";
        } else {
          feedback.textContent = `Score: ${score}/5. Review the mathematical proof, primitive root properties, and MitM flow in the Theory section, then try again.`;
          feedback.className = "status-box error";
        }
      });
    }
  
    if (btnResetQuiz && quizForm) {
      btnResetQuiz.addEventListener('click', () => {
        quizForm.reset();
        const feedback = document.getElementById('quiz-feedback');
        if (feedback) {
          feedback.textContent = '';
          feedback.className = 'status-box';
        }
      });
    }
  });