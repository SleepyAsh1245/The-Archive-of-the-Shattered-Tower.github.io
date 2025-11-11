const chapters = {
  1: { title: "The Tower (XVI) – The Void", file: "chap1.txt", tarot: [
    { name: "The Tower (XVI)", interpretation: "Sudden change, upheaval, revelation." },
    { name: "The Hanged Man (XII - Reversed)", interpretation: "Delay, resistance, suspension." },
    { name: "The Moon (XVIII)", interpretation: "Illusion, intuition, subconscious." }
  ], nextChapter: 2 },
  2: { title: "The Hermit (IX) – The Gift of Knowledge", file: "chap2.txt", tarot: [
    { name: "The Tower (XVI)", interpretation: "Sudden change, upheaval, revelation." },
    { name: "The Tower (XVI - Reversed)", interpretation: "Collapse, awakening, necessary change." },
    { name: "The Hanged Man (XII - Reversed)", interpretation: "Delay, resistance, suspension." },
    { name: "The Moon (XVIII)", interpretation: "Illusion, intuition, subconscious." },
    { name: "The Hermit (IX)", interpretation: "Soul-searching, introspection, guidance." },
  ], nextChapter: 3 ,prevChapter: 1 },
  3: { title: "The Empress (III) - The Genesis ", file: "chap3.txt", tarot: [
    { name: "The Tower (XVI)", interpretation: "Sudden change, upheaval, revelation." },
    { name: "The Tower (XVI - Reversed)", interpretation: "Collapse, awakening, necessary change." },
    { name: "The Hanged Man (XII - Reversed)", interpretation: "Delay, resistance, suspension." },
    { name: "The Moon (XVIII)", interpretation: "Illusion, intuition, subconscious." },
    { name: "The Hermit (IX)", interpretation: "Soul-searching, introspection, guidance." },
    { name: "The Empress (III)", interpretation: "Creation, abundance, nurturing." },
  ] , nextChapter: 4 , prevChapter: 2 },
  4: { title: "The Justice (XI) - The Reckoning", file: "chap4.txt", tarot: [
    { name: "COMING SOON", interpretation: "(THE FATE OF THOSE WHO WAIT, SHALL NOT FALL FOR AN OBVIOUS FATE)\n--SA Oranyth" },
  ] , prevChapter: 3 },  
};

const storyEl = document.getElementById('story'),
      tarotEl = document.getElementById('tarotDisplay'),
      choicesEl = document.getElementById('choices'),
      chapterEnd = document.getElementById('chapterEnd'),
      skipBtn = document.getElementById('skipBtn'),
      voiceBtn = document.getElementById('voiceBtn'),
      themeSelector = document.getElementById('themeSelector');
      Return = document.getElementById('Return');

let current = 1, skipping = false, utterance = null, typingTimeout = null;

// Cancel functions
function cancelTyping(){ if(typingTimeout){ clearTimeout(typingTimeout); typingTimeout=null; } }
function cancelSpeech(){ if(utterance){ speechSynthesis.cancel(); utterance=null; voiceBtn.textContent='🔊 Play Voice'; } }

// Typewriter
async function typeWriter(text, speed = 25){
  cancelTyping(); skipping = false; storyEl.textContent = '';
  return new Promise(resolve => {
    let i = 0;
    function nextChar(){
      if(skipping){ storyEl.textContent = text; resolve(); return; }
      if(i < text.length){ storyEl.textContent += text[i]; i++; typingTimeout = setTimeout(nextChar, speed); }
      else{ typingTimeout = null; resolve(); }
    }
    nextChar();
  });
}

// Choices
function clearChoices(){ choicesEl.innerHTML = ''; }
function showChoices(list){ clearChoices(); list.forEach((c, idx) => {
  const b = document.createElement('button'); 
  b.className = 'choice'; 
  b.innerHTML = `<strong>${idx+1}</strong> ${c.text}`; 
  b.addEventListener('click', c.action); 
  choicesEl.appendChild(b);
}); }

// Chapter end
function concludeChapter(){
  cancelTyping(); cancelSpeech();
  storyEl.textContent = `--- End of Chapter ${current} ---\n\nThis chapter ends here.`;
  chapterEnd.classList.remove('hidden'); tarotEl.classList.add('hidden'); clearChoices();

  if(chapters[current].prevChapter){
    const prevBtn = document.createElement('button'); 
    prevBtn.className = 'choice'; 
    prevBtn.innerHTML = 'Previous Chapter'; 
    prevBtn.addEventListener('click', () => loadChapter(chapters[current].prevChapter)); 
    choicesEl.appendChild(prevBtn);
  }
  if(chapters[current].nextChapter){
    const nextBtn = document.createElement('button'); 
    nextBtn.className = 'choice'; 
    nextBtn.innerHTML = 'Next Chapter'; 
    nextBtn.addEventListener('click', () => loadChapter(chapters[current].nextChapter)); 
    choicesEl.appendChild(nextBtn);
  }
}
function toRoman(num) {
  const romans = [
    ["M",1000], ["CM",900], ["D",500], ["CD",400],
    ["C",100], ["XC",90], ["L",50], ["XL",40],
    ["X",10], ["IX",9], ["V",5], ["IV",4], ["I",1]
  ];
  let result = '';
  for (const [roman, value] of romans) {
    while (num >= value) {
      result += roman;
      num -= value;
    }
  }
  return result;
}

// Load chapter
async function loadChapter(id){
  current = id;
  cancelTyping(); cancelSpeech();
  tarotEl.classList.add('hidden'); chapterEnd.classList.add('hidden'); clearChoices(); storyEl.textContent = '';

    document.querySelector('.logo').textContent = `CH. ${toRoman(current)}`;

  // Fetch chapter text from .txt file
  try {
    const response = await fetch(chapters[current].file);
    if(!response.ok) throw new Error('Chapter file not found.');
    const text = await response.text();
    await typeWriter(text); // typewriter animation
  } catch(e) {
    storyEl.textContent = "Error loading chapter text.";
    console.error(e);
  }

  showChoices([{ text: 'Continue', action: concludeChapter }]);
}

// Skip button
skipBtn.addEventListener('click', () => { skipping = true; });

// Voice button
voiceBtn.addEventListener('click', () => {
  if(speechSynthesis.speaking){ cancelSpeech(); return; }
  fetch(chapters[current].file)
    .then(res => res.text())
    .then(text => {
      utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1; utterance.pitch = 1; utterance.lang = 'en-US';
      utterance.onend = () => { utterance = null; voiceBtn.textContent='🔊 Play Voice'; };
      speechSynthesis.speak(utterance); voiceBtn.textContent='🔇 Stop Voice';
    });
});

// Replay / Tarot / Placeholder buttons
document.getElementById('replayBtn').addEventListener('click', () => loadChapter(current));
document.getElementById('cardsBtn').addEventListener('click', () => {
  cancelTyping();
  cancelSpeech();
  storyEl.textContent = '';
  tarotEl.innerHTML = '';
  tarotEl.classList.remove('hidden');
  chapterEnd.classList.add('hidden'); 

  const wrapper = document.createElement('div');
  wrapper.className = 'tarot-cards';

  (chapters[current].tarot || []).forEach(card => {
    const el = document.createElement('div');
    el.className = 'tarot-card';
    el.innerHTML = `
      <div class='tarot-card-inner'>
        <div class='tarot-card-front'>${card.name}</div>
        <div class='tarot-card-back'>${card.interpretation}</div>
      </div>
    `;
    el.addEventListener('click', () => {
      wrapper.querySelectorAll('.tarot-card').forEach(c => {
        if (c !== el) c.classList.remove('flipped');
      });
      el.classList.toggle('flipped');
    });
    wrapper.appendChild(el);
  });

  tarotEl.appendChild(wrapper);

  showChoices([
    {
      text: 'Return',
      action: () => {
        tarotEl.classList.add('hidden');
        chapterEnd.classList.remove('hidden');
        concludeChapter();
      }
    }
  ]);
});
document.getElementById('placeholderBtn').addEventListener('click', () => typeWriter('This section is under construction.'));

// Theme picker
const themeBtn = document.getElementById('themeBtn');
const themeDropdown = document.getElementById('themeDropdown');

themeBtn.addEventListener('click', () => {
  themeDropdown.style.display = themeDropdown.style.display === 'flex' ? 'none' : 'flex';
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!themeBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
    themeDropdown.style.display = 'none';
  }
});

// Define your themes
const themes = {
  default: {
    '--bg': '#0c0a1c',
    '--card': '#1a142f',
    '--text': '#dcd6f7',
    '--muted': '#9c94c7',
    '--accent': '#a77fff'
  },
  red: {
    '--bg': '#1c0a0a',
    '--card': '#2f1414',
    '--text': '#f7d6d6',
    '--muted': '#c79494',
    '--accent': '#ff7f7f'
  },
  bubblegum: {
    '--bg': '#fff0f6',
    '--card': '#ffd6e8',
    '--text': '#4a003f',
    '--muted': '#cc7da1',
    '--accent': '#ff5fa2'
  },
  midnight: {
    '--bg': '#080f26',
    '--card': '#101a3a',
    '--text': '#d0d9ff',
    '--muted': '#7a87b6',
    '--accent': '#5f9eff'
  }
};

// Apply theme
document.querySelectorAll('.theme-dropdown button').forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedTheme = themes[btn.dataset.theme];
    for (let key in selectedTheme) {
      document.documentElement.style.setProperty(key, selectedTheme[key]);
    }
    themeDropdown.style.display = 'none';
  });
});


// Initial load
loadChapter(current);

