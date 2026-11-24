// ai-assistant.js - Smart AI Notes Finder & Study Assistant for Back.Benchers
(function () {
  'use strict';

  // --- 1. STATE & STORAGE ---
  const AI_STATE = {
    apiKey: localStorage.getItem('bb_gemini_key') || '',
    history: [],
    catalogIndex: []
  };

  // --- 2. BUILD SEARCH INDEX ---
  function buildIndex() {
    if (!window.NOTES_CATALOG) return;
    const index = [];
    for (const [branch, years] of Object.entries(window.NOTES_CATALOG)) {
      for (const [year, sems] of Object.entries(years)) {
        for (const [sem, subjects] of Object.entries(sems)) {
          for (const sub of subjects) {
            index.push({
              branch,
              year: Number(year),
              sem: Number(sem),
              code: sub.code,
              title: sub.title,
              syllabus: sub.syllabus,
              fullNotes: sub.fullNotes,
              units: sub.units || [],
              searchTokens: [
                branch.toLowerCase(),
                `year ${year}`,
                `year${year}`,
                `y${year}`,
                `sem ${sem}`,
                `sem${sem}`,
                `s${sem}`,
                `${year}-${sem}`,
                `${year}/${sem}`,
                sub.code.toLowerCase(),
                ...sub.title.toLowerCase().split(/\s+/),
                ...((sub.units || []).map(u => `unit ${u.unit}`))
              ]
            });
          }
        }
      }
    }
    AI_STATE.catalogIndex = index;
    console.log(`[AI Assistant] Indexed ${index.length} subjects.`);
  }

  // --- 3. NATURAL LANGUAGE SEARCH ENGINE ---
  function searchNotes(query) {
    if (!AI_STATE.catalogIndex.length) buildIndex();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    // Extract intents
    const unitMatch = q.match(/unit\s*(\d+)/i) || q.match(/u\s*(\d+)/i);
    const requestedUnit = unitMatch ? parseInt(unitMatch[1], 10) : null;
    const isSyllabus = /syllabus|syllabi|curriculum|topics/i.test(q);

    // Branch detection
    let matchedBranch = null;
    if (/\baiml\b|ai\s*&?\s*ml/i.test(q)) matchedBranch = 'CSE(AIML)';
    else if (/\bds\b|data\s*science/i.test(q)) matchedBranch = 'CSE(DS)';
    else if (/\bdesign\b/i.test(q)) matchedBranch = 'CSE(Design)';
    else if (/\bcse\b|computer\s*science/i.test(q)) matchedBranch = 'CSE';
    else if (/\bece\b|electronics/i.test(q)) matchedBranch = 'ECE';
    else if (/\beee\b|electrical/i.test(q)) matchedBranch = 'EEE';
    else if (/\bciv\b|civil/i.test(q)) matchedBranch = 'CIV';
    else if (/\bmech\b|mechanical/i.test(q)) matchedBranch = 'MECH';

    // Year & Sem detection
    let matchedYear = null;
    let matchedSem = null;
    const semYearPattern = q.match(/([1-4])\s*[-/]\s*([1-2])/);
    if (semYearPattern) {
      matchedYear = parseInt(semYearPattern[1], 10);
      matchedSem = parseInt(semYearPattern[2], 10);
    } else {
      const yMatch = q.match(/([1-4])(?:st|nd|rd|th)?\s*year/i) || q.match(/year\s*([1-4])/i);
      if (yMatch) matchedYear = parseInt(yMatch[1], 10);
      const sMatch = q.match(/([1-2])(?:st|nd)?\s*sem/i) || q.match(/sem\s*([1-2])/i);
      if (sMatch) matchedSem = parseInt(sMatch[1], 10);
    }

    // Clean query words for fuzzy keyword matching
    const stopWords = new Set(['notes', 'note', 'pdf', 'unit', 'units', 'give', 'me', 'find', 'get', 'for', 'the', 'of', 'in', 'and', 'all', 'to', 'please', 'show', 'search', 'want', 'i', 'need', 'open', 'material', 'materials', 'study', 'book', 'books']);
    const rawTokens = q.split(/[\s,._/-]+/).filter(w => w.length > 0);
    const keywords = rawTokens.filter(w => w.length > 1 && !stopWords.has(w) && !/^\d+$/.test(w));
    const tokenSet = new Set(rawTokens);

    // Common synonyms / subject alias expansion
    const isMath1 = (tokenSet.has('maths') || tokenSet.has('math') || tokenSet.has('m1') || tokenSet.has('mathematics')) && (tokenSet.has('1') || tokenSet.has('i') || tokenSet.has('m1') || q.includes('maths 1') || q.includes('math 1') || q.includes('maths-1'));
    const isMath2 = (tokenSet.has('maths') || tokenSet.has('math') || tokenSet.has('m2') || tokenSet.has('mathematics')) && (tokenSet.has('2') || tokenSet.has('ii') || tokenSet.has('m2') || q.includes('maths 2') || q.includes('math 2') || q.includes('maths-2'));

    // Score subjects
    const scored = AI_STATE.catalogIndex.map(item => {
      let score = 0;
      const codeLower = item.code.toLowerCase();
      const titleLower = item.title.toLowerCase();

      // Branch bonus
      if (matchedBranch) {
        if (item.branch.toLowerCase() === matchedBranch.toLowerCase()) score += 45;
        else score -= 15;
      }

      // Year bonus
      if (matchedYear) {
        if (item.year === matchedYear) score += 35;
        else score -= 10;
      }

      // Sem bonus
      if (matchedSem) {
        if (item.sem === matchedSem) score += 30;
        else score -= 10;
      }

      // Code exact word match (avoid substring false positives like 'te' in 'notes')
      if (tokenSet.has(codeLower)) {
        score += 80;
      }

      // Math 1 & Math 2 alias handling
      if (isMath1 && (codeLower === 'm1' || codeLower === 'maths1')) {
        score += 100;
      }
      if (isMath2 && (codeLower === 'm2' || codeLower === 'maths2')) {
        score += 100;
      }

      // Title match
      const titleWords = titleLower.split(/\s+/);
      for (const kw of keywords) {
        if (titleLower.includes(kw)) {
          score += 40;
        }
        for (const tw of titleWords) {
          if (tw === kw) {
            score += 35;
          } else if (tw.startsWith(kw) && kw.length >= 3) {
            score += 20;
          }
        }
      }

      // Common subject keyword aliases
      if (tokenSet.has('physics') && (codeLower === 'ap' || titleLower.includes('physics'))) score += 70;
      if (tokenSet.has('chemistry') && (codeLower === 'ec' || titleLower.includes('chemistry'))) score += 70;
      if (tokenSet.has('circuits') && (codeLower === 'edc' || titleLower.includes('circuit'))) score += 60;
      if (tokenSet.has('algorithms') && (codeLower === 'daa' || codeLower === 'ada' || titleLower.includes('algorithm'))) score += 70;
      if (tokenSet.has('networks') && (codeLower === 'cn' || codeLower === 'cns' || titleLower.includes('network'))) score += 70;
      if (tokenSet.has('compiler') && (codeLower === 'cd' || codeLower === 'acd' || titleLower.includes('compiler'))) score += 70;
      if (tokenSet.has('cloud') && (codeLower === 'cc' || titleLower.includes('cloud'))) score += 70;

      // Unit requested match
      if (requestedUnit) {
        const hasUnit = (item.units || []).some(u => u.unit === requestedUnit);
        if (hasUnit) score += 25;
      }

      // Syllabus requested match
      if (isSyllabus && item.syllabus) {
        score += 25;
      }

      return { item, score, requestedUnit, isSyllabus };
    });

    scored.sort((a, b) => b.score - a.score);
    // Filter reasonable threshold
    const top = scored.filter(s => s.score > 20).slice(0, 5);
    return top;
  }

  // --- 4. GEMINI API CLIENT ---
  async function queryGemini(prompt, systemInstruction = '') {
    if (!AI_STATE.apiKey) return null;
    
    // Support models: gemini-1.5-flash or gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_STATE.apiKey}`;
    
    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || null;
    } catch (e) {
      console.warn('[AI Assistant] Gemini API error:', e.message);
      return null;
    }
  }

  // --- 5. RENDER CHAT RESPONSE ---
  function createSubjectCardHTML(sub, requestedUnit = null, isSyllabus = false) {
    const unitsHTML = (sub.units || []).map(u => {
      const isTarget = requestedUnit && u.unit === requestedUnit;
      const highlight = isTarget ? 'bg-yellow-400 text-black border-black font-black scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-yellow-200 text-black border-black';
      return `
        <button onclick="window.openPdfViewer('${sub.branch}/year${sub.year}/sem${sub.sem}/${encodeURIComponent(u.filename)}', '${esc(sub.title)}', ${u.isLfs}, '${esc(u.title)}')"
                class="px-2.5 py-1 text-xs border border-black font-mono transition-transform ${highlight}">
          ${esc(u.title)} ${isTarget ? '⭐' : ''}
        </button>
      `;
    }).join('');

    const sylBtn = sub.syllabus ? `
      <button onclick="window.openPdfViewer('${sub.branch}/year${sub.year}/sem${sub.sem}/${encodeURIComponent(sub.syllabus.filename)}', '${esc(sub.title)} Syllabus', ${sub.syllabus.isLfs}, 'Syllabus Copy')"
              class="px-3 py-1 text-xs border border-black bg-pink-300 hover:bg-pink-400 font-bold text-black transition-colors flex items-center gap-1">
        <span>📜 Syllabus</span>
      </button>
    ` : '';

    const fullBtn = sub.fullNotes ? `
      <button onclick="window.openPdfViewer('${sub.branch}/year${sub.year}/sem${sub.sem}/${encodeURIComponent(sub.fullNotes.filename)}', '${esc(sub.title)} Full Notes', ${sub.fullNotes.isLfs}, 'Complete Book')"
              class="px-3 py-1 text-xs border border-black bg-green-300 hover:bg-green-400 font-bold text-black transition-colors flex items-center gap-1">
        <span>📖 Complete Notes</span>
      </button>
    ` : '';

    return `
      <div class="bg-white border-2 border-black p-3.5 mb-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="bg-black text-white text-[10px] font-black px-1.5 py-0.5 uppercase tracking-wider">${esc(sub.branch)}</span>
              <span class="bg-yellow-300 text-black text-[10px] font-bold px-1.5 py-0.5 border border-black">Y${sub.year} S${sub.sem}</span>
              <span class="text-xs font-mono font-bold text-gray-500">[${esc(sub.code)}]</span>
            </div>
            <h4 class="font-black text-sm md:text-base mt-1 text-black">${esc(sub.title)}</h4>
          </div>
          <button onclick="window.navigateToSubject('${sub.branch}', ${sub.year}, ${sub.sem}, '${sub.code}')" 
                  title="View full folder on page"
                  class="p-1 border border-black hover:bg-yellow-300 text-xs font-bold shrink-0">
            📂 Jump
          </button>
        </div>

        <div class="text-[11px] font-mono font-bold text-gray-600 mb-1.5">
          AVAILABLE NOTES (${sub.units ? sub.units.length : 0} Units):
        </div>

        <div class="flex flex-wrap gap-1.5 mb-2">
          ${unitsHTML || '<span class="text-xs text-gray-500 italic">No individual units. Check full notes or syllabus.</span>'}
        </div>

        <div class="flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-300">
          ${fullBtn}
          ${sylBtn}
        </div>
      </div>
    `;
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- 6. PROCESS USER QUERY ---
  async function handleAIQuery(query, container) {
    if (!query || !query.trim()) return;
    const q = query.trim();

    // Append user message
    appendMessage(container, 'user', esc(q));

    // Typing loader
    const loaderId = 'ai-loader-' + Date.now();
    appendMessage(container, 'ai', `
      <div id="${loaderId}" class="flex items-center gap-2 py-2 font-mono text-xs">
        <div class="w-3 h-3 bg-yellow-400 rounded-full border border-black animate-ping"></div>
        <span>Searching notes catalog & preparing guidance...</span>
      </div>
    `);
    scrollChatBottom();

    // 1. Search catalog
    const matches = searchNotes(q);

    // 2. Query Gemini if API key is provided
    let aiExplanation = '';
    if (AI_STATE.apiKey) {
      try {
        const topSummary = matches.slice(0, 3).map(m => `${m.item.title} (${m.item.branch} Year ${m.item.year} Sem ${m.item.sem})`).join(', ');
        const sysPrompt = "You are Back.Benchers AI, a helpful, enthusiastic, witty engineering study assistant for JNTUH B.Tech students. The student is asking about notes/syllabus. Keep answers concise, actionable, and encouraging. Give backbencher tips (high-weightage topics, exam strategy) in 2-3 short bullet points.";
        const userPrompt = `Student asks: "${q}". The matching subjects in our library are: [${topSummary}]. Provide a quick study tip or summary for them.`;
        aiExplanation = await queryGemini(userPrompt, sysPrompt);
      } catch (err) {
        console.warn('Gemini request failed:', err);
      }
    }

    // Remove loader
    const loaderEl = document.getElementById(loaderId);
    if (loaderEl) loaderEl.closest('.chat-bubble-ai').remove();

    // Build AI reply HTML
    let replyHTML = '';
    if (aiExplanation) {
      replyHTML += `<div class="mb-3 text-xs md:text-sm font-medium leading-relaxed bg-yellow-50 p-3 border-l-4 border-yellow-400 text-gray-800">${esc(aiExplanation).replace(/\n/g, '<br>')}</div>`;
    }

    if (matches.length > 0) {
      replyHTML += `<p class="font-bold text-xs md:text-sm mb-2 text-black">🎯 Found ${matches.length} matching subjects in the library:</p>`;
      replyHTML += matches.map(m => createSubjectCardHTML(m.item, m.requestedUnit, m.isSyllabus)).join('');
    } else {
      replyHTML += `
        <div class="p-3 bg-red-50 border-2 border-black text-xs md:text-sm">
          <p class="font-bold text-red-600 mb-1">🔍 No direct notes match found for "${esc(q)}".</p>
          <p class="text-gray-700">Tips:</p>
          <ul class="list-disc list-inside mt-1 text-gray-600 font-mono text-xs">
            <li>Try searching by subject name (e.g. <b>Machine Learning</b>, <b>Maths 1</b>)</li>
            <li>Try searching by subject code (e.g. <b>DAA</b>, <b>CN</b>, <b>AI</b>, <b>DL</b>)</li>
            <li>Specify branch & year (e.g. <b>CSE 3-1</b>, <b>AIML 3rd year</b>)</li>
          </ul>
        </div>
      `;
    }

    appendMessage(container, 'ai', replyHTML);
    scrollChatBottom();
  }

  function appendMessage(container, sender, html) {
    if (!container) return;
    const msgDiv = document.createElement('div');
    if (sender === 'user') {
      msgDiv.className = 'flex justify-end mb-3';
      msgDiv.innerHTML = `
        <div class="bg-black text-white font-mono text-xs md:text-sm px-4 py-2.5 max-w-[85%] border-2 border-black shadow-[3px_3px_0px_0px_rgba(234,179,8,1)]">
          ${html}
        </div>
      `;
    } else {
      msgDiv.className = 'flex justify-start mb-3 chat-bubble-ai';
      msgDiv.innerHTML = `
        <div class="bg-white text-black text-xs md:text-sm p-4 max-w-[95%] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
          <div class="flex items-center gap-1.5 mb-2 font-mono text-[11px] font-black text-yellow-600 uppercase tracking-widest">
            <span class="w-2 h-2 bg-yellow-400 rounded-full border border-black inline-block"></span>
            BACK.BENCHERS AI
          </div>
          ${html}
        </div>
      `;
    }
    container.appendChild(msgDiv);
    if (window.lucide) window.lucide.createIcons();
  }

  function scrollChatBottom() {
    const box = document.getElementById('ai-chat-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  // --- 7. MODAL TOGGLE & EVENT LISTENERS ---
  window.openAIChat = function (prefilledQuery = '') {
    const modal = document.getElementById('ai-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-messages');

    // If initial greeting not present, add it
    if (container && container.children.length === 0) {
      appendMessage(container, 'ai', `
        <p class="font-bold text-sm mb-1">Hey Backbencher! 🎓</p>
        <p class="text-xs text-gray-700 leading-relaxed mb-3">
          I can instantly find any unit notes, complete subject books, or syllabus copies across all branches and semesters.
        </p>
        <div class="font-mono text-[11px] text-gray-500 mb-2">QUICK SUGGESTIONS:</div>
        <div class="flex flex-wrap gap-1.5">
          <button onclick="window.sendAIPrompt('Machine Learning 3rd year notes')" class="text-xs bg-yellow-100 border border-black px-2 py-1 hover:bg-yellow-300 font-bold">🤖 Machine Learning Notes</button>
          <button onclick="window.sendAIPrompt('DAA Unit 3')" class="text-xs bg-yellow-100 border border-black px-2 py-1 hover:bg-yellow-300 font-bold">⚡ DAA Unit 3</button>
          <button onclick="window.sendAIPrompt('Maths 1 1st year')" class="text-xs bg-yellow-100 border border-black px-2 py-1 hover:bg-yellow-300 font-bold">📐 Maths 1 Notes</button>
          <button onclick="window.sendAIPrompt('Civil 3-1 syllabus and notes')" class="text-xs bg-yellow-100 border border-black px-2 py-1 hover:bg-yellow-300 font-bold">🏗️ Civil 3-1</button>
          <button onclick="window.sendAIPrompt('Cloud Computing Unit 4')" class="text-xs bg-yellow-100 border border-black px-2 py-1 hover:bg-yellow-300 font-bold">☁️ Cloud Computing</button>
        </div>
      `);
    }

    if (prefilledQuery) {
      if (input) input.value = prefilledQuery;
      window.submitAIChat();
    } else {
      if (input) setTimeout(() => input.focus(), 100);
    }
  };

  window.closeAIChat = function () {
    const modal = document.getElementById('ai-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  };

  window.sendAIPrompt = function (text) {
    const input = document.getElementById('ai-chat-input');
    if (input) input.value = text;
    window.submitAIChat();
  };

  window.submitAIChat = function () {
    const input = document.getElementById('ai-chat-input');
    const container = document.getElementById('ai-chat-messages');
    if (!input || !container) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleAIQuery(text, container);
  };

  // Quick Hero Search Bar Handler
  window.handleHeroSearch = function (e) {
    if (e) e.preventDefault();
    const heroInput = document.getElementById('hero-ai-search-input');
    if (!heroInput) return;
    const query = heroInput.value.trim();
    if (query) {
      window.openAIChat(query);
      heroInput.value = '';
    } else {
      window.openAIChat();
    }
  };

  // Jump from AI Card to the actual folder on the webpage
  window.navigateToSubject = function (branch, year, sem, code) {
    window.closeAIChat();
    if (typeof window.setYear === 'function') window.setYear(year);
    if (typeof window.setBranch === 'function') window.setBranch(branch);
    if (typeof window.setSemester === 'function') window.setSemester(sem);

    setTimeout(() => {
      const folderEl = document.querySelector(`[data-subject-code="${code}"]`);
      if (folderEl) {
        folderEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        folderEl.classList.add('ring-4', 'ring-yellow-400');
        setTimeout(() => folderEl.classList.remove('ring-4', 'ring-yellow-400'), 3000);
        // Automatically open units if closed
        const toggleBtn = folderEl.querySelector('.toggle-units');
        const unitsArea = folderEl.querySelector('.units-area');
        if (toggleBtn && unitsArea && unitsArea.classList.contains('hidden')) {
          toggleBtn.click();
        }
      } else {
        const sec = document.getElementById('resources-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 400);
  };

  // API Key modal / prompt
  window.promptGeminiKey = function () {
    const current = AI_STATE.apiKey || '';
    const newKey = prompt("Enter your free Google Gemini API Key (stored locally in your browser):\nGet one free at https://aistudio.google.com/app/apikey\n(Leave blank to use default offline instant search):", current);
    if (newKey !== null) {
      AI_STATE.apiKey = newKey.trim();
      localStorage.setItem('bb_gemini_key', AI_STATE.apiKey);
      updateKeyBadge();
      alert(AI_STATE.apiKey ? "Gemini AI Key saved! Full study assistance enabled." : "API Key cleared. Using built-in offline search.");
    }
  };

  function updateKeyBadge() {
    const btn = document.getElementById('ai-key-btn');
    if (btn) {
      if (AI_STATE.apiKey) {
        btn.innerHTML = '⚡ Gemini AI: Active';
        btn.className = 'text-[10px] font-mono border border-black bg-green-300 text-black px-2 py-0.5 font-bold';
      } else {
        btn.innerHTML = '⚙️ Add Gemini Key (Optional)';
        btn.className = 'text-[10px] font-mono border border-black bg-zinc-200 hover:bg-yellow-300 text-black px-2 py-0.5 font-bold';
      }
    }
  }

  // Init
  window.searchNotes = searchNotes;
  window.buildIndex = buildIndex;

  document.addEventListener('DOMContentLoaded', () => {
    buildIndex();
    updateKeyBadge();

    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.submitAIChat();
        }
      });
    }

    const heroInput = document.getElementById('hero-ai-search-input');
    if (heroInput) {
      heroInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.handleHeroSearch();
        }
      });
    }
  });

})();
