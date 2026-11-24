// script.js - Back.Benchers Notes & Syllabus Management
(function () {
  'use strict';

  // --- 1. CONFIGURATION ---
  const years = [
    { id: 1, label: '1st Year' },
    { id: 2, label: '2nd Year' },
    { id: 3, label: '3rd Year' },
    { id: 4, label: '4th Year' }
  ];

  const branches = ['CSE', 'CSE(AIML)', 'CSE(DS)', 'CSE(Design)', 'ECE', 'EEE', 'CIV', 'MECH'];

  // --- 2. STATE MANAGEMENT ---
  const state = {
    year: null,
    branch: null,
    semester: null
  };

  // --- 3. DOM ELEMENTS ---
  const els = {
    yearContainer: document.getElementById('year-container'),
    branchSection: document.getElementById('branch-section'),
    branchContainer: document.getElementById('branch-container'),
    semSection: document.getElementById('semester-section'),
    resourcesSection: document.getElementById('resources-section'),
    notesContainer: document.getElementById('notes-container'),
    sylContainer: document.getElementById('syllabus-container'),
    breadcrumb: document.getElementById('breadcrumb-text'),
    leftTitle: document.getElementById('left-title')
  };

  // --- 4. HELPERS ---
  function esc(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Resolve true binary PDF URL (handles GitHub LFS vs normal blob vs Vercel static)
  function resolveAssetUrls(relPath, isLfs) {
    const encodedRel = relPath.split('/').map(p => encodeURIComponent(p)).join('/');
    const lfsCdn = `https://media.githubusercontent.com/media/Narendra2904/Btech-notes/main/assets/${encodedRel}`;
    const rawGithub = `https://raw.githubusercontent.com/Narendra2904/Btech-notes/main/assets/${encodedRel}`;
    const local = `assets/${encodedRel}`;

    return {
      primary: isLfs ? lfsCdn : local,
      lfsCdn,
      rawGithub,
      local,
      filename: relPath.split('/').pop()
    };
  }

  // --- 5. HIGH-PERFORMANCE PDF VIEWER & OPENER ---
  window.openPdfViewer = async function (relPath, title = 'Notes Viewer', isLfs = false, unitLabel = '') {
    const modal = document.getElementById('pdf-modal');
    const modalTitle = document.getElementById('pdf-modal-title');
    const modalSubtitle = document.getElementById('pdf-modal-subtitle');
    const frameContainer = document.getElementById('pdf-frame-container');
    const downloadBtn = document.getElementById('pdf-download-btn');
    const newTabBtn = document.getElementById('pdf-newtab-btn');
    const loader = document.getElementById('pdf-loader');

    if (!modal) {
      // Fallback if modal not in DOM: open directly
      const urls = resolveAssetUrls(relPath, isLfs);
      window.open(urls.primary, '_blank');
      return;
    }

    const urls = resolveAssetUrls(relPath, isLfs);
    const filename = urls.filename;

    modalTitle.textContent = title;
    modalSubtitle.textContent = unitLabel ? `${unitLabel} • ${filename}` : filename;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    loader.classList.remove('hidden');
    frameContainer.innerHTML = '';

    // Direct actions fallback handlers
    downloadBtn.onclick = () => window.triggerDownload(urls.lfsCdn, filename);
    newTabBtn.onclick = () => window.open(urls.lfsCdn, '_blank');

    try {
      // Fetch binary PDF blob for zero-CORS / zero-plugin preview
      // Try LFS CDN first if LFS, or raw/local
      let fetchUrl = isLfs ? urls.lfsCdn : urls.rawGithub;
      let resp = await fetch(fetchUrl).catch(() => null);

      if (!resp || !resp.ok) {
        resp = await fetch(urls.lfsCdn).catch(() => null);
      }
      if (!resp || !resp.ok) {
        resp = await fetch(urls.local).catch(() => null);
      }

      if (!resp || !resp.ok) {
        throw new Error('Network fetch returned non-200');
      }

      let blob = await resp.blob();

      // Check if it returned a Git LFS text pointer (<500 bytes with 'git-lfs')
      if (blob.size < 500) {
        const text = await blob.text();
        if (text.includes('git-lfs')) {
          console.log('[PDF Viewer] Received LFS pointer, switching to media CDN...');
          resp = await fetch(urls.lfsCdn);
          if (resp.ok) {
            blob = await resp.blob();
          }
        }
      }

      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);

      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      newTabBtn.onclick = () => {
        window.open(blobUrl, '_blank');
      };

      const iframe = document.createElement('iframe');
      iframe.src = `${blobUrl}#view=FitH&toolbar=1`;
      iframe.className = 'w-full h-full min-h-[65vh] border-0 bg-zinc-100';
      iframe.title = title;

      loader.classList.add('hidden');
      frameContainer.appendChild(iframe);
    } catch (err) {
      console.warn('[PDF Viewer] In-page frame preview failed, showing direct action UI:', err);
      loader.classList.add('hidden');
      frameContainer.innerHTML = `
        <div class="p-8 text-center bg-yellow-50 border-2 border-black m-4">
          <div class="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center mx-auto mb-4 font-black text-xl">📄</div>
          <h3 class="text-xl font-black mb-2 text-black">${esc(title)}</h3>
          <p class="text-sm font-mono text-gray-600 mb-6 max-w-md mx-auto">
            Direct in-browser preview was intercepted. You can view or save this PDF right now using the buttons below:
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <a href="${urls.lfsCdn}" target="_blank" rel="noopener noreferrer" 
               class="px-6 py-3 bg-black text-white font-black neo-shadow hover:bg-yellow-400 hover:text-black transition-colors uppercase text-sm flex items-center gap-2">
              <span>Open in New Tab</span> <span>↗</span>
            </a>
            <button onclick="window.triggerDownload('${urls.lfsCdn}', '${esc(filename)}')" 
                    class="px-6 py-3 bg-yellow-400 text-black border-2 border-black font-black neo-shadow hover:bg-black hover:text-white transition-colors uppercase text-sm flex items-center gap-2">
              <span>Download PDF</span> <span>📥</span>
            </button>
          </div>
        </div>
      `;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  window.closePdfViewer = function () {
    const modal = document.getElementById('pdf-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
      const frameContainer = document.getElementById('pdf-frame-container');
      if (frameContainer) frameContainer.innerHTML = '';
    }
  };

  window.triggerDownload = async function (url, filename) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // --- 6. CATALOG RETRIEVAL ---
  function getSubjectsFromCatalog(year, branch, semester) {
    if (!window.NOTES_CATALOG || !branch || !year || !semester) return [];
    const b = window.NOTES_CATALOG[branch];
    if (!b) return [];
    const y = b[year];
    if (!y) return [];
    return y[semester] || [];
  }

  // --- 7. SUBJECT FOLDERS & UNITS RENDERING ---
  function createSubjectFolderDOM(subject) {
    const folder = document.createElement('div');
    folder.className = 'subject-folder group relative bg-white border-2 border-black p-4 shadow-[4px_4px_0] fade-in mb-4';
    folder.setAttribute('data-subject-code', subject.code);

    const hasUnits = subject.units && subject.units.length > 0;
    const hasFullNotes = !!subject.fullNotes;

    const sylBtn = subject.syllabus
      ? `<button onclick="window.openPdfViewer('${subject.syllabus.relPath}', '${esc(subject.title)} Syllabus', ${subject.syllabus.isLfs}, 'Syllabus Copy')"
                 class="text-xs font-bold text-pink-600 hover:underline hover:bg-pink-100 px-2 py-1 border-2 border-transparent hover:border-pink-300 transition-all mr-2">
           SYLLABUS
         </button>`
      : '';

    const unitsCountLabel = hasUnits ? `${subject.units.length} Units` : (hasFullNotes ? 'Full Book' : 'Notes');

    folder.innerHTML = `
      <div class="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div class="flex items-center gap-3">
          <div class="bg-blue-200 p-3 border-2 border-black shrink-0">
            <i data-lucide="folder" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="font-bold text-lg text-black leading-tight">${esc(subject.title)}</div>
            <div class="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-2">
              <span class="bg-zinc-100 border border-black px-1.5 py-0.2 font-bold">${esc(subject.code)}</span>
              <span>•</span>
              <span>${unitsCountLabel}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${sylBtn}
          <button class="toggle-units px-4 py-2 border-2 border-black bg-yellow-300 hover:bg-yellow-400 font-bold text-sm uppercase transition-colors">
            Open Folder
          </button>
        </div>
      </div>
      <div class="units-area mt-4 hidden border-t-2 border-dashed border-gray-300 pt-4"></div>
    `;

    const toggleBtn = folder.querySelector('.toggle-units');
    const unitsArea = folder.querySelector('.units-area');

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (unitsArea.classList.contains('hidden')) {
        unitsArea.innerHTML = renderUnitsHTML(subject);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
        unitsArea.classList.remove('hidden');
        toggleBtn.textContent = 'Close Folder';
        toggleBtn.classList.replace('bg-yellow-300', 'bg-white');
      } else {
        unitsArea.classList.add('hidden');
        toggleBtn.textContent = 'Open Folder';
        toggleBtn.classList.replace('bg-white', 'bg-yellow-300');
      }
    });

    return folder;
  }

  function renderUnitsHTML(subject) {
    let html = '';

    // If complete full notes exist (e.g. HCI_Full.pdf, Heat-Transfer.pdf)
    if (subject.fullNotes) {
      html += `
        <div class="mb-4 p-3 bg-green-50 border-2 border-black flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-300 border-2 border-black">
              <i data-lucide="book" class="w-5 h-5 text-black"></i>
            </div>
            <div>
              <div class="font-bold text-sm text-black">Complete Subject Book / Full Notes</div>
              <div class="text-[11px] text-gray-500 font-mono">${esc(subject.fullNotes.filename)}</div>
            </div>
          </div>
          <button onclick="window.openPdfViewer('${subject.fullNotes.relPath}', '${esc(subject.title)} Complete Notes', ${subject.fullNotes.isLfs}, 'Full Notes Book')"
                  class="px-4 py-2 bg-black text-white text-xs font-bold uppercase neo-shadow hover:bg-yellow-400 hover:text-black transition-colors shrink-0">
            Open Book 📖
          </button>
        </div>
      `;
    }

    if (subject.units && subject.units.length > 0) {
      html += `
        <div class="unit-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${subject.units.map(u => `
            <div class="bg-zinc-50 border-2 border-black p-3 hover:bg-yellow-100 transition-colors flex items-center justify-between gap-3 group/unit">
              <div class="flex items-center gap-3 min-w-0">
                <div class="p-2 bg-white border-2 border-black text-pink-500 group-hover/unit:text-black transition-colors shrink-0">
                  <i data-lucide="file-text" class="w-4 h-4"></i>
                </div>
                <div class="truncate">
                  <div class="font-bold text-sm text-black">${esc(u.title)}</div>
                  <div class="text-[10px] text-gray-500 font-mono truncate">${esc(u.filename)}</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="window.openPdfViewer('${u.relPath}', '${esc(subject.title)}', ${u.isLfs}, '${esc(u.title)}')"
                        title="Preview Notes"
                        class="px-3 py-1.5 bg-yellow-300 hover:bg-black hover:text-white border border-black font-bold text-xs uppercase transition-colors">
                  Open 👁️
                </button>
                <button onclick="window.triggerDownload('${resolveAssetUrls(u.relPath, u.isLfs).lfsCdn}', '${esc(u.filename)}')"
                        title="Download PDF"
                        class="p-1.5 bg-white hover:bg-yellow-200 border border-black transition-colors">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (!subject.fullNotes) {
      html += `
        <div class="p-4 bg-yellow-50 border border-black text-xs font-mono text-gray-700">
          Unit-wise notes for this subject are being formatted. In the meantime, you can access the syllabus copy above or ask Back.Benchers AI.
        </div>
      `;
    }

    return html;
  }

  // --- 8. SYLLABUS CARDS RENDERING ---
  function createSyllabusCard(item) {
    return `
      <div class="relative bg-white border-2 border-black p-4 shadow-[4px_4px_0] hover:shadow-[6px_6px_0] transition-all mb-4 flex items-center justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <div class="p-2.5 border-2 border-black bg-pink-300 shrink-0">
            <i data-lucide="check-circle" class="w-5 h-5 text-black"></i>
          </div>
          <div class="truncate">
            <h3 class="font-bold text-base leading-tight mb-1 text-black">${esc(item.title)}</h3>
            <div class="text-xs text-gray-500 font-mono">${esc(item.subtitle || 'Syllabus Copy')}</div>
          </div>
        </div>
        <button onclick="window.openPdfViewer('${item.relPath}', '${esc(item.title)}', ${item.isLfs}, 'Syllabus')"
                class="px-4 py-2 bg-pink-400 hover:bg-black hover:text-white border-2 border-black font-bold text-xs uppercase transition-colors shrink-0">
          View 📜
        </button>
      </div>
    `;
  }

  function getSyllabusList(year, branch, semester, subjects) {
    const list = [];

    // Add subject-specific syllabi
    if (subjects && subjects.length > 0) {
      subjects.forEach(sub => {
        if (sub.syllabus) {
          list.push({
            title: `${sub.title} Syllabus`,
            subtitle: `${sub.code} • Subject Specific`,
            relPath: sub.syllabus.relPath,
            isLfs: sub.syllabus.isLfs
          });
        }
      });
    }

    // Add common branch R23/R22 syllabus if exists
    list.push({
      title: `${branch} Regulation Syllabus & Academic Info`,
      subtitle: `Year ${year} Sem ${semester}`,
      relPath: `${branch}/year${year}/sem${semester}/syllabus-r23.pdf`,
      isLfs: true
    });

    return list;
  }

  // --- 9. RENDER HELPERS ---
  function renderYears() {
    if (!els.yearContainer) return;
    els.yearContainer.innerHTML = years.map(y => {
      const active = state.year === y.id ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]' : 'bg-zinc-900 text-gray-400 hover:text-white border-white/20';
      return `
        <button onclick="window.setYear(${y.id})" class="h-28 md:h-32 border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${active}">
          <span class="text-4xl md:text-5xl font-black">${y.id}</span>
          <span class="uppercase tracking-widest text-xs font-bold font-mono">Year</span>
        </button>
      `;
    }).join('');
  }

  function renderBranches() {
    if (!els.branchContainer) return;
    els.branchContainer.innerHTML = branches.map(b => {
      const active = state.branch === b ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]' : 'bg-white text-black hover:bg-yellow-100';
      return `
        <button onclick="window.setBranch('${b}')" class="py-3.5 border-2 border-black font-black text-base md:text-lg neo-shadow hover:translate-y-[-2px] transition-transform ${active}">
          ${b}
        </button>
      `;
    }).join('');
  }

  function renderSemesters() {
    [1, 2].forEach(num => {
      const btn = document.getElementById(`sem-btn-${num}`);
      if (!btn) return;
      btn.className = (state.semester === num)
        ? "flex-1 py-5 border-2 border-black font-black text-lg md:text-xl bg-black text-white shadow-[4px_4px_0px_0px_rgba(234,179,8,1)]"
        : "flex-1 py-5 border-2 border-black font-black text-lg md:text-xl hover:bg-yellow-400 bg-white transition-all";
    });
  }

  // --- 10. ACTION HANDLERS ---
  window.setYear = function (y) {
    state.year = y;
    state.branch = null;
    state.semester = null;
    renderYears();
    renderBranches();

    if (els.branchSection) els.branchSection.classList.remove('hidden');
    if (els.semSection) els.semSection.classList.add('hidden');
    if (els.resourcesSection) els.resourcesSection.classList.add('hidden');

    if (window.lucide) window.lucide.createIcons();
    if (els.branchSection) els.branchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.setBranch = function (b) {
    state.branch = b;
    state.semester = null;
    renderBranches();
    renderSemesters();

    if (els.semSection) els.semSection.classList.remove('hidden');
    if (els.resourcesSection) els.resourcesSection.classList.add('hidden');

    if (window.lucide) window.lucide.createIcons();
    if (els.semSection) els.semSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  window.setSemester = function (s) {
    state.semester = s;
    renderSemesters();

    const subjects = getSubjectsFromCatalog(state.year, state.branch, state.semester);

    if (subjects.length === 0) {
      els.notesContainer.innerHTML = `
        <div class="p-6 border-4 border-black bg-yellow-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">📚</span>
            <h3 class="text-xl font-black uppercase">Notes In Preparation</h3>
          </div>
          <p class="text-sm font-medium text-gray-800 mb-4">
            Notes for <b>${esc(state.branch)} Year ${state.year} Sem ${state.semester}</b> are currently being indexed and uploaded.
          </p>
          <div class="flex flex-wrap gap-3">
            <button onclick="window.openAIChat('Find notes or syllabus for ${esc(state.branch)} Year ${state.year} Sem ${state.semester}')" 
                    class="px-4 py-2 bg-black text-white font-black text-xs uppercase neo-shadow hover:bg-yellow-400 hover:text-black transition-colors flex items-center gap-1.5">
              <span>Ask AI Assistant ✨</span>
            </button>
            <button onclick="document.getElementById('upload-form-btn') && document.getElementById('upload-form-btn').click()"
                    class="px-4 py-2 bg-yellow-400 text-black border-2 border-black font-black text-xs uppercase neo-shadow hover:bg-black hover:text-white transition-colors">
              <span>Have Notes? Upload Here 📤</span>
            </button>
          </div>
        </div>
      `;
    } else {
      els.notesContainer.innerHTML = '';
      subjects.forEach(sub => {
        const dom = createSubjectFolderDOM(sub);
        els.notesContainer.appendChild(dom);
      });
    }

    const syllabus = getSyllabusList(state.year, state.branch, state.semester, subjects);
    els.sylContainer.innerHTML = syllabus.map(s => createSyllabusCard(s)).join('');

    if (els.breadcrumb) {
      els.breadcrumb.innerHTML = `
        <button onclick="window.setYear(${state.year})" class="text-blue-800 hover:text-pink-600 hover:underline font-black uppercase transition-colors">YEAR ${state.year}</button> 
        <span class="text-gray-400 font-bold mx-1">/</span>
        <button onclick="window.setBranch('${state.branch}')" class="text-blue-800 hover:text-pink-600 hover:underline font-black uppercase transition-colors">${state.branch}</button> 
        <span class="text-gray-400 font-bold mx-1">/</span>
        <span class="bg-black text-white px-2 py-0.5 font-bold">SEM ${state.semester}</span>
      `;
    }

    els.resourcesSection.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
    els.resourcesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // --- 11. INITIALIZATION & SOCIAL MODAL ---
  document.addEventListener('DOMContentLoaded', () => {
    renderYears();
    renderBranches();

    const semContainer = document.getElementById('semester-container');
    if (semContainer) {
      semContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sem]');
        if (btn) window.setSemester(Number(btn.getAttribute('data-sem')));
      });
    }

    // Social modal handlers
    window.openSocialModal = (type) => {
      const modal = document.getElementById('social-modal');
      const title = document.getElementById('modal-title');
      const links = document.getElementById('modal-links');
      const iconContainer = document.getElementById('modal-icon-container');
      if (!modal) return;

      modal.classList.remove('hidden');
      modal.classList.add('flex');

      const socialData = {
        instagram: {
          title: "Instagram",
          icon: "instagram",
          color: "bg-pink-400",
          links: [
            { name: "Madhan Myana", url: "https://www.instagram.com/madhan.myana/" },
            { name: "Narendra Yenagandula", url: "https://instagram.com/narendra_yenagandula" }
          ]
        },
        linkedin: {
          title: "LinkedIn",
          icon: "linkedin",
          color: "bg-blue-400",
          links: [
            { name: "Madhan Myana", url: "https://www.linkedin.com/in/madhan-myana-7ab90a335/" },
            { name: "Narendra Yenagandula", url: "https://www.linkedin.com/in/narendra-yenagandula/" }
          ]
        },
        github: {
          title: "GitHub",
          icon: "github",
          color: "bg-gray-200",
          links: [
            { name: "Madhan Myana", url: "https://github.com/madhanmyana" },
            { name: "Narendra Yenagandula", url: "https://github.com/Narendra2904" }
          ]
        }
      };

      const data = socialData[type] || socialData['linkedin'];
      iconContainer.className = `inline-flex p-3 border-2 border-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${data.color}`;
      iconContainer.innerHTML = `<i data-lucide="${data.icon}" class="w-8 h-8 text-black"></i>`;
      title.innerText = data.title;

      links.innerHTML = data.links.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="block border-2 border-black p-4 font-bold hover:bg-black hover:text-white transition-colors mb-4">
          <span>${link.name}</span> <span class="float-right">→</span>
        </a>
      `).join('');

      if (window.lucide) window.lucide.createIcons();
    };

    window.closeSocialModal = () => {
      const modal = document.getElementById('social-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    };

    if (window.lucide) window.lucide.createIcons();
  });

  // --- 12. FEEDBACK FORM HANDLER ---
  window.handleFeedback = function (e) {
    e.preventDefault();
    const text = document.getElementById('feedback-text').value;
    if (!text) return;

    const subject = "Website Feedback: Back.Benchers";
    const emailTo = "yenagandula.narendra@gmail.com";
    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = mailtoLink;

    document.getElementById('feedback-text').value = '';
    alert("Opening your email client to send feedback!");
  };

  // Keyboard shortcut: Escape closes all open modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closePdfViewer();
      window.closeAIChat();
      window.closeSocialModal();
    }
  });

})();
