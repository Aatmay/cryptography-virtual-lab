/**
 * Diffie-Hellman Simulation Controller & Course Manager
 * Notation: P, G, a, b, x, y, ka, kb
 * Supports arbitrary large numbers up to 20 digits using BigInt & 15-base Miller-Rabin
 */

const state = {
  step: 1,
  speed: 1.0,
  voiceGender: 'female',
  P: 23n,
  G: 5n,
  a: 6n,
  b: 15n,
  x: null,
  y: null,
  ka: null,
  kb: null,
  unlockedIndex: 0
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
  const stepperCounter = document.getElementById('stepper-counter');
  const sidebarPanel = document.getElementById('sidebar-panel');

  const resourceCards = document.querySelectorAll('.resource-card');
  const contentSections = document.querySelectorAll('.content-section');
  const filterPills = document.querySelectorAll('.filter-pill');
  const completeButtons = document.querySelectorAll('.btn-complete-next');
  const simCompleteBox = document.getElementById('sim-complete-box');
  const quizCompleteBox = document.getElementById('quiz-complete-box');

  // --- Course Progression & View Management ---
  function activateSection(index) {
    resourceCards.forEach(c => c.classList.remove('active'));
    contentSections.forEach(s => s.classList.remove('active'));

    const card = resourceCards[index];
    if (card) {
      card.classList.add('active');
      const targetSec = document.getElementById(card.dataset.target);
      if (targetSec) targetSec.classList.add('active');

      // Stepper counter visibility: ONLY display during Interactive Simulation
      if (stepperCounter) {
        if (card.dataset.target === 'section-simulation') {
          stepperCounter.style.display = 'flex';
        } else {
          stepperCounter.style.display = 'none';
        }
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Ensure stepper is hidden initially on Aim & Objectives
  if (stepperCounter) stepperCounter.style.display = 'none';

  function unlockNextSection(currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < resourceCards.length) {
      if (nextIndex > state.unlockedIndex) {
        state.unlockedIndex = nextIndex;
      }

      // Mark current section completed with green SVG checkmark
      const currBadge = document.getElementById(`badge-${currentIndex}`);
      if (currBadge) {
        currBadge.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        currBadge.className = 'res-status-badge done-icon';
      }

      // Unlock next section card
      const nextCard = resourceCards[nextIndex];
      nextCard.classList.remove('locked');
      const nextBadge = document.getElementById(`badge-${nextIndex}`);
      if (nextBadge) {
        nextBadge.innerHTML = '';
      }

      activateSection(nextIndex);
    }
  }

  completeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.complete, 10);
      unlockNextSection(idx);
    });
  });

  // --- BigInt Modular Exponentiation: (base^exp) % mod ---
  function powerMod(base, exp, mod) {
    let b = BigInt(base) % BigInt(mod);
    let e = BigInt(exp);
    const m = BigInt(mod);
    let res = 1n;
    while (e > 0n) {
      if (e & 1n) res = (res * b) % m;
      b = (b * b) % m;
      e >>= 1n;
    }
    return res;
  }

  // --- Miller-Rabin Primality Test for 20-digit Integers ---
  function isPrime(n) {
    n = BigInt(n);
    if (n <= 1n) return false;
    if (n <= 3n) return true;
    if ((n % 2n) === 0n || (n % 3n) === 0n) return false;

    const smallPrimes = [5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
    for (let p of smallPrimes) {
      if (n === p) return true;
      if (n % p === 0n) return false;
    }

    let d = n - 1n;
    let s = 0n;
    while ((d % 2n) === 0n) {
      d /= 2n;
      s += 1n;
    }

    const bases = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
    for (let a of bases) {
      if (n <= a) break;
      let x = powerMod(a, d, n);
      if (x === 1n || x === n - 1n) continue;

      let composite = true;
      for (let r = 1n; r < s; r++) {
        x = (x * x) % n;
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      if (composite) return false;
    }
    return true;
  }

  function parseBigIntInput(val) {
    if (!val) return null;
    const clean = val.toString().trim();
    if (!/^\d+$/.test(clean)) return null;
    return BigInt(clean);
  }

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

  function applyParameters() {
    const pVal = parseBigIntInput(inputP.value);
    const gVal = parseBigIntInput(inputG.value);

    if (pVal === null || gVal === null) {
      statusMsg.textContent = 'Please enter valid positive integers for P and G.';
      statusMsg.className = 'status-box error';
      return false;
    }

    if (!isPrime(pVal)) {
      statusMsg.textContent = `Modulus P = ${pVal.toString()} is NOT prime. Please enter a prime integer.`;
      statusMsg.className = 'status-box error';
      return false;
    }

    if (gVal >= pVal || gVal < 2n) {
      statusMsg.textContent = 'Generator G must satisfy 2 <= G < P.';
      statusMsg.className = 'status-box error';
      return false;
    }

    state.P = pVal;
    state.G = gVal;

    const pStr = pVal.toString();
    const gStr = gVal.toString();

    if (eveP) eveP.textContent = pStr;
    if (eveG) eveG.textContent = gStr;

    statusMsg.textContent = `Valid Domain Set: P (${pStr.length} digits) = ${pStr}, G = ${gStr}`;
    statusMsg.className = 'status-box success';
    logTrace(`Public domain set verified: Prime P (${pStr.length} digits) = ${pStr}, Generator G = ${gStr}`);
    return true;
  }

  function runStep(stepNumber) {
    state.step = stepNumber;
    if (currStepNum) currStepNum.textContent = stepNumber;

    if (stepNumber === 1) {
      resetSimulationState();
      if (!applyParameters()) return;
      if (btnNextStep) {
        btnNextStep.textContent = "Step 2: Generate Keys (x, y) ➔";
        btnNextStep.disabled = false;
      }
    } else if (stepNumber === 2) {
      const aVal = parseBigIntInput(inputA.value);
      const bVal = parseBigIntInput(inputB.value);

      if (aVal === null || bVal === null) {
        statusMsg.textContent = 'Error: Enter valid positive integers for private keys a and b.';
        statusMsg.className = 'status-box error';
        return;
      }

      if (aVal >= state.P || bVal >= state.P) {
        statusMsg.textContent = 'Error: Private keys a and b must be strictly less than P.';
        statusMsg.className = 'status-box error';
        return;
      }

      state.a = aVal;
      state.b = bVal;

      state.x = powerMod(state.G, state.a, state.P);
      state.y = powerMod(state.G, state.b, state.P);

      dispX.textContent = state.x.toString();
      dispY.textContent = state.y.toString();

      logTrace(`Alice generated public key: x = G^a mod P = <b>${state.x.toString()}</b>`);
      logTrace(`Bob generated public key: y = G^b mod P = <b>${state.y.toString()}</b>`);
      speakText("Step 2: Public keys x and y computed via modular exponentiation.");

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
      logTrace("Exchanging public keys across insecure line...");
      speakText("Step 3: Exchanging generated public keys x and y.");

      setTimeout(() => {
        const xStr = state.x.toString();
        const yStr = state.y.toString();

        if (eveX) eveX.textContent = xStr;
        if (eveY) eveY.textContent = yStr;

        dispRecY.textContent = yStr;
        dispRecX.textContent = xStr;

        logTrace(`Exchange complete. Alice received y = ${yStr}, Bob received x = ${xStr}`);
        logTrace(`Eve intercepts public values x and y. Private keys a and b remain confidential.`);

        if (btnNextStep) {
          btnNextStep.textContent = "Step 4: Compute Secret Key (k_a, k_b) ➔";
          btnNextStep.disabled = false;
        }
      }, transitTime * 1000);
    } else if (stepNumber === 4) {
      state.ka = powerMod(state.y, state.a, state.P);
      state.kb = powerMod(state.x, state.b, state.P);

      const kaStr = state.ka.toString();
      const kbStr = state.kb.toString();

      dispKa.textContent = kaStr;
      dispKb.textContent = kbStr;

      logTrace(`Alice computes secret key: k_a = y^a mod P = <b>${kaStr}</b>`);
      logTrace(`Bob computes secret key: k_b = x^b mod P = <b>${kbStr}</b>`);

      if (state.ka === state.kb) {
        logTrace(`Algebraically verified: k_a == k_b == ${kaStr}! Full 20-digit precision confirmed.`, true);
        speakText("Step 4: Shared secret keys are identical. Key agreement established successfully.");

        if (simCompleteBox) simCompleteBox.style.display = 'flex';
      }

      if (btnNextStep) {
        btnNextStep.textContent = "Protocol Complete";
        btnNextStep.disabled = true;
      }
    }
  }

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
        {
          // 2-digit textbook
          P: "23",
          G: "5",
          a: "6",
          b: "15"
        },
        {
          // 16-digit prime
          P: "1000000000000037",
          G: "2",
          a: "654321987654321",
          b: "987654321123456"
        },
        {
          // 20-digit Prime (10^19 + 51)
          P: "10000000000000000051",
          G: "2",
          a: "1234567890987654321",
          b: "9876543210123456789"
        },
        {
          // 20-digit Prime (10^19 + 69)
          P: "10000000000000000069",
          G: "3",
          a: "5432167890123456789",
          b: "8765432109876543210"
        }
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
      if (activeSection) speakText(activeSection.innerText);
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
      sidebarPanel.style.display = (sidebarPanel.style.display === 'none') ? 'flex' : 'none';
    });
  }

  resourceCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('locked')) return;
      activateSection(idx);
    });
  });

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

  // Quiz Evaluation & Course Gate (80% passing criteria = 4/5)
  if (btnSubmitQuiz) {
    btnSubmitQuiz.addEventListener('click', () => {
      const answers = {
        q1: 'b',
        q2: 'b',
        q3: 'a',
        q4: 'b',
        q5: 'c'
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
        if (selected[key] === answers[key]) score++;
      }

      const percentage = (score / 5) * 100;

      if (percentage >= 80) {
        feedback.textContent = `Score: ${score}/5 (${percentage}%). Passed! You have successfully cleared the threshold to unlock the References section.`;
        feedback.className = "status-box success";
        if (quizCompleteBox) quizCompleteBox.style.display = 'flex';
      } else {
        feedback.textContent = `Score: ${score}/5 (${percentage}%). Passing criteria is 80% (minimum 4/5). Please review the Theory and try again.`;
        feedback.className = "status-box error";
        if (quizCompleteBox) quizCompleteBox.style.display = 'none';
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
      if (quizCompleteBox) quizCompleteBox.style.display = 'none';
    });
  }
});