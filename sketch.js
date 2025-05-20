import './style.css';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Update constants
const GENERATION_INTERVAL = 12000; // Slightly longer pause (12 seconds)
const MAX_DIALOGUE_LENGTH = 12; // Keep more lines visible
const TYPING_BASE_SPEED = 60; // Slightly faster base typing
const PAUSE_BETWEEN_LINES = 1200; // Longer pause between lines
const FADE_DURATION = 2000; // Longer fade transitions

// Remove scroll-related variables
let isLoading = true;
let sampleSound;
let isSoundPlaying = false;
let lastGenerationTime = 0;

// Dialogue variables
let dialogueHistory = [];
const LINE_HEIGHT = 84; // Reduced by 30%
const FONT_SIZE = 67; // Reduced by 30%

// Update title Y position
const TITLE_Y = 112; // Reduced by 30%

// Add language configurations
const LANGUAGES = {
  'Español': {
    title: ["—¿Olvidaste algo?", "—Si tan solo."],
    prompt: `Crea un intercambio minimalista muy corto (2-4 palabras cada uno) en español. Usa guiones largos. Que se sienta como fragmentos:

—¿Dónde lo dejaste?
—En los espacios entre recuerdos.

Continúa con un breve intercambio. Mantén cada línea bajo 4 palabras. Enfócate en la pérdida, la memoria, la ausencia.`
  },
  'English': {
    title: ["—Forgetting something?", "—If only."],
    prompt: `Create a very short, minimalist exchange (2-4 words each). Use em dashes. Make it feel like fragments:

—Where did you leave it?
—In the spaces between memories.

Continue with just one brief exchange. Keep each line under 4 words. Focus on loss, memory, absence.`
  },
  'Français': {
    title: ["—Tu oublies quelque chose ?", "—Si seulement."],
    prompt: `Créez un très court échange minimaliste (2-4 mots chacun) en français. Utilisez des tirets. Que cela ressemble à des fragments:

—Où l'as-tu laissé ?
—Dans les espaces entre les souvenirs.

Continuez avec un bref échange. Gardez chaque ligne sous 4 mots. Concentrez-vous sur la perte, la mémoire, l'absence.`
  },
  'Deutsch': {
    title: ["—Vergisst du etwas?", "—Wenn nur."],
    prompt: `Erstelle einen sehr kurzen, minimalistischen Austausch (2-4 Wörter) auf Deutsch. Verwende Gedankenstriche. Es soll sich wie Fragmente anfühlen:

—Wo hast du es gelassen?
—In den Räumen zwischen Erinnerungen.

Fahre mit einem kurzen Austausch fort. Halte jede Zeile unter 4 Wörtern. Fokussiere dich auf Verlust, Erinnerung, Abwesenheit.`
  },
  'Italiano': {
    title: ["—Dimenticando qualcosa?", "—Se solo."],
    prompt: `Crea uno scambio minimalista molto breve (2-4 parole ciascuno) in italiano. Usa i trattini. Fallo sentire come frammenti:

—Dove l'hai lasciato?
—Negli spazi tra i ricordi.

Continua con un breve scambio. Mantieni ogni riga sotto le 4 parole. Concentrati su perdita, memoria, assenza.`
  },
  'Português': {
    title: ["—Esquecendo algo?", "—Se ao menos."],
    prompt: `Crie uma troca minimalista muito curta (2-4 palavras cada) em português. Use travessões. Faça parecer fragmentos:

—Onde você deixou?
—Nos espaços entre memórias.

Continue com uma breve troca. Mantenha cada linha com menos de 4 palavras. Foque em perda, memória, ausência.`
  },
  '日本語': {
    title: ["—何か忘れてる？", "—ただそれだけ。"],
    prompt: `日本語で非常に短い、ミニマルな会話（各2-4語）を作成してください。ダッシュを使用し、断片的な感じにしてください：

—どこに置いた？
—記憶の間の空間に。

短い会話を続けてください。各行を4語以下に保ってください。喪失、記憶、不在に焦点を当ててください。`
  },
  '中文': {
    title: ["—忘记什么了？", "—要是能。"],
    prompt: `用中文创建一个非常简短的对话（每句2-4个字）。使用破折号。让它感觉像片段：

—你把它放在哪里？
—在记忆的缝隙间。

继续一个简短的对话。每行保持在4个字以内。关注失落、记忆、缺失。`
  },
  '한국어': {
    title: ["—뭔가 잊으셨나요?", "—그저 그뿐."],
    prompt: `한국어로 매우 짧은 미니멀한 대화(각 2-4단어)를 만드세요. 대시를 사용하고 단편적인 느낌이 들도록 하세요:

—어디에 두었나요?
—기억 사이의 공간에.

짧은 대화를 이어가세요. 각 줄을 4단어 이하로 유지하세요. 상실, 기억, 부재에 초점을 맞추세요.`
  },
  'Русский': {
    title: ["—Что-то забыла?", "—Если бы."],
    prompt: `Создайте очень короткий, минималистичный обмен (2-4 слова каждый) на русском языке. Используйте тире. Пусть это звучит как фрагменты:

—Где ты это оставила?
—В пространствах между воспоминаниями.

Продолжите краткий обмен. Держите каждую строку менее 4 слов. Сосредоточьтесь на потере, памяти, отсутствии.`
  },
  'العربية': {
    title: ["—هل نسيت شيئاً؟", "—لو فقط."],
    prompt: `أنشئ حواراً قصيراً للغاية (2-4 كلمات لكل سطر) بالعربية. استخدم الشرطات. اجعله يبدو كأجزاء متقطعة:

—أين تركته؟
—في المساحات بين الذكريات.

واصل بتبادل قصير. حافظ على كل سطر تحت 4 كلمات. ركز على الفقدان والذاكرة والغياب.`
  },
  'हिंदी': {
    title: ["—कुछ भूल गए?", "—काश ऐसा होता।"],
    prompt: `हिंदी में एक बहुत छोटा, न्यूनतम संवाद बनाएं (प्रत्येक 2-4 शब्द)। डैश का उपयोग करें। इसे टुकड़ों की तरह महसूस कराएं:

—कहाँ छोड़ दिया?
—यादों के बीच की जगहों में।

एक छोटे संवाद के साथ जारी रखें। प्रत्येक पंक्ति को 4 शब्दों से कम रखें। खो जाने, स्मृति, अनुपस्थिति पर ध्यान दें।`
  },
  'Ελληνικά': {
    title: ["—Ξεχνάς κάτι;", "—Μακάρι μόνο."],
    prompt: `Δημιούργησε μια πολύ σύντομη, μινιμαλιστική συνομιλία (2-4 λέξεις η καθεμία) στα ελληνικά. Χρησιμοποίησε παύλες. Κάνε το να μοιάζει με αποσπάσματα:

—Πού το άφησες;
—Στα κενά μεταξύ αναμνήσεων.

Συνέχισε με μια σύντομη ανταλλαγή. Κράτησε κάθε γραμμή κάτω από 4 λέξεις. Εστίασε στην απώλεια, τη μνήμη, την απουσία.`
  },
  'Türkçe': {
    title: ["—Bir şey mi unuttun?", "—Keşke."],
    prompt: `Türkçe'de çok kısa, minimalist bir diyalog oluşturun (her biri 2-4 kelime). Kısa çizgi kullanın. Parçalar gibi hissettirin:

—Nerede bıraktın?
—Anıların arasındaki boşluklarda.

Kısa bir alışverişle devam edin. Her satırı 4 kelimenin altında tutun. Kayıp, hafıza, yokluk üzerine odaklanın.`
  },
  'Polski': {
    title: ["—Coś zapomniałeś?", "—Gdyby tylko."],
    prompt: `Stwórz bardzo krótką, minimalistyczną wymianę (2-4 słowa każda) po polsku. Użyj myślników. Niech brzmi jak fragmenty:

—Gdzie to zostawiłeś?
—W przestrzeniach między wspomnieniami.

Kontynuuj krótką wymianę. Zachowaj każdą linię poniżej 4 słów. Skup się na stracie, pamięci, nieobecności.`
  },
  'Nederlands': {
    title: ["—Iets vergeten?", "—Was het maar zo."],
    prompt: `Maak een zeer korte, minimalistische uitwisseling (2-4 woorden elk) in het Nederlands. Gebruik gedachtestreepjes. Laat het aanvoelen als fragmenten:

—Waar heb je het gelaten?
—In de ruimtes tussen herinneringen.

Ga door met een korte uitwisseling. Houd elke regel onder 4 woorden. Focus op verlies, geheugen, afwezigheid.`
  },
  'Svenska': {
    title: ["—Glömmer du något?", "—Om bara."],
    prompt: `Skapa ett mycket kort, minimalistiskt utbyte (2-4 ord vardera) på svenska. Använd tankstreck. Låt det kännas som fragment:

—Var lämnade du det?
—I utrymmena mellan minnena.

Fortsätt med ett kort utbyte. Håll varje rad under 4 ord. Fokusera på förlust, minne, frånvaro.`
  },
  'Čeština': {
    title: ["—Zapomněl jsi něco?", "—Kéž by jen."],
    prompt: `Vytvořte velmi krátkou, minimalistickou výměnu (2-4 slova každá) v češtině. Použijte pomlčky. Ať to působí jako fragmenty:

—Kde jsi to nechal?
—V prostorách mezi vzpomínkami.

Pokračujte krátkou výměnou. Udržujte každý řádek pod 4 slovy. Zaměřte se na ztrátu, paměť, nepřítomnost.`
  },
  'Tiếng Việt': {
    title: ["—Quên gì à?", "—Giá mà thế."],
    prompt: `Tạo một cuộc trao đổi rất ngắn, tối giản (mỗi câu 2-4 từ) bằng tiếng Việt. Sử dụng dấu gạch ngang. Làm cho nó có cảm giác như những mảnh ghép:

—Bạn để nó đâu?
—Trong khoảng trống giữa ký ức.

Tiếp tục với một cuộc trao đổi ngắn. Giữ mỗi dòng dưới 4 từ. Tập trung vào mất mát, ký ức, vắng mặt.`
  },
  'ไทย': {
    title: ["—ลืมอะไรหรือเปล่า?", "—ถ้าเพียงแค่นั้น"],
    prompt: `สร้างบทสนทนาสั้นๆ แบบมินิมอล (2-4 คำต่อบรรทัด) ในภาษาไทย ใช้เครื่องหมายขีด ให้รู้สึกเหมือนเป็นส่วนๆ:

—คุณทิ้งมันไว้ที่ไหน?
—ในช่องว่างระหว่างความทรงจำ

ดำเนินการต่อด้วยบทสนทนาสั้นๆ รักษาให้แต่ละบรรทัดมีไม่เกิน 4 คำ มุ่งเน้นเรื่องการสูญเสีย ความทรงจำ การขาดหาย`
  }
};

// Color system
const COLORS = {
  // Base palette
  base: {
    white: '#fffffa',    // Off-white
    darkTeal: '#0d5c63', // Deep teal
    teal: '#44a1a0',     // Medium teal
    lightTeal: '#78cdd7', // Light teal
    midTeal: '#247b7b'   // Rich teal
  },
  
  // Functional colors
  theme: {
    background: '#0d5c63',    // darkTeal for background
    text: {
      primary: '#fffffa',     // white for main text
      secondary: '#78cdd7',   // lightTeal for secondary
      accent: '#44a1a0'       // teal for accents
    },
    interactive: {
      hover: '#78cdd7',       // lightTeal
      active: '#247b7b',      // midTeal
      focus: '#44a1a0'        // teal
    }
  },
  
  // State-based combinations
  states: {
    typing: {
      color: '#78cdd7',       // lightTeal
      shadow: '#247b7b'       // midTeal
    },
    loading: {
      primary: '#44a1a0',     // teal
      secondary: '#fffffa'    // white
    },
    fading: {
      start: '#fffffa',       // white
      end: '#247b7b'         // midTeal
    }
  }
};

// Change default language to Spanish
let currentLanguage = 'Español';
let isStarted = true; // Start immediately

// Add typing effect variables
let isTyping = false;
let currentTypingIndex = 0;
let typingSpeed = 50; // milliseconds per character
let lastTypingTime = 0;
let currentTypingLines = [];

// Add rhythm variables
let typingVariation = 0;
let pauseStartTime = 0;
let isPaused = false;

// Add easing functions
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Update generateText to handle typing effect
async function generateText(p) {
  try {
    isLoading = true;
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ 
        "role": "user", 
        "content": LANGUAGES[currentLanguage].prompt
      }],
      temperature: 0.9,
      max_tokens: 50
    });

    // Get just two new lines
    const newLines = completion.choices[0].message.content
      .split('\n')
      .filter(line => line.trim() !== '' && line.trim().startsWith('—'))
      .slice(0, 2);
    
    // Start typing effect
    currentTypingLines = newLines;
    isTyping = true;
    currentTypingIndex = 0;
    lastTypingTime = p.millis();
    isLoading = false;
  } catch (error) {
    console.error('Error generating text:', error);
    isLoading = false;
  }
}

// Store p5 instance reference
let p5Instance;

// Update language selection function to use p5 instance
function createLanguageMenu(p) {
  const select = document.createElement('select');
  select.style.position = 'fixed';
  select.style.top = '20px';
  select.style.right = '20px';
  select.style.padding = '8px';
  select.style.fontSize = '16px';
  select.style.backgroundColor = COLORS.theme.background;
  select.style.color = COLORS.theme.text.primary;
  select.style.border = `2px solid ${COLORS.theme.interactive.hover}`;
  select.style.borderRadius = '4px';
  select.style.cursor = 'pointer';
  
  // Add hover effects
  select.addEventListener('mouseover', () => {
    select.style.borderColor = COLORS.theme.interactive.hover;
    select.style.color = COLORS.theme.text.secondary;
  });
  
  select.addEventListener('mouseout', () => {
    select.style.borderColor = COLORS.theme.interactive.focus;
    select.style.color = COLORS.theme.text.primary;
  });
  
  Object.keys(LANGUAGES).forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.text = lang;
    if (lang === 'Español') {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  select.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    dialogueHistory = [];
    generateText(p);
    lastGenerationTime = p.millis();
  });
  
  document.body.appendChild(select);
}

// Add streaming-related variables
let currentStreamText = '';
let targetText = '';
let streamIndex = 0;
const STREAM_SPEED = 2; // Letters per frame

// Add animation variables
let fadeStartTime = 0;

const sketch = p => {
  p5Instance = p;  // Store the p5 instance

  p.preload = function() {
    sampleSound = p.loadSound('/sample.mp3');
  };

  p.setup = function() {
    p.createCanvas(p.windowWidth, 700);
    p.fill(p.color(COLORS.theme.text.primary)); // Default text color
    p.textSize(FONT_SIZE);
    dialogueHistory = [];
    createLanguageMenu(p);
    
    generateText(p);
    lastGenerationTime = p.millis();
  };

  p.keyPressed = function() {
    if (p.keyCode === 80) { // 'P' key
      if (!isSoundPlaying) {
        sampleSound.play();
        isSoundPlaying = true;
      } else {
        sampleSound.stop();
        isSoundPlaying = false;
      }
    } else if (p.keyCode === 32) { // Space bar
      generateText(p);
    }
  };

  p.draw = function() {
    p.background(p.color(COLORS.theme.background));

    if (isLoading) {
      displayLoader(p);
    } else {
      p.push();
      p.fill(p.color(COLORS.theme.text.primary));
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(FONT_SIZE);
      
      const dialogueY = TITLE_Y + LINE_HEIGHT;

      // Handle typing effect with natural rhythm
      if (isTyping && !isPaused && p.millis() - lastTypingTime > TYPING_BASE_SPEED + typingVariation) {
        currentTypingIndex++;
        lastTypingTime = p.millis();
        
        // Add random variation to typing speed
        typingVariation = p.random(-30, 50);
        
        // Check for line break to add pause
        const fullText = currentTypingLines.join('\n');
        if (currentTypingIndex === currentTypingLines[0].length) {
          isPaused = true;
          pauseStartTime = p.millis();
        }
        
        // Check if typing is complete
        if (currentTypingIndex >= fullText.length) {
          isTyping = false;
          isPaused = false;
          dialogueHistory = [...currentTypingLines, ...dialogueHistory];
          if (dialogueHistory.length > 12) {
            dialogueHistory = dialogueHistory.slice(0, 12);
          }
        }
      }

      // Handle pause between lines
      if (isPaused && p.millis() - pauseStartTime > PAUSE_BETWEEN_LINES) {
        isPaused = false;
        currentTypingIndex++; // Move past the newline character
      }

      // Display current typing text
      if (isTyping) {
        const fullText = currentTypingLines.join('\n');
        const currentText = fullText.substring(0, currentTypingIndex);
        const lines = currentText.split('\n');
        lines.forEach((line, i) => {
          // Smoother breathing animation
          const breathe = 1 + 0.02 * Math.sin(p.frameCount * 0.015);
          p.textSize(FONT_SIZE * breathe);
          
          // Smoother fade in
          const lineStart = i === 0 ? 0 : currentTypingLines[0].length + 1;
          const progress = (currentTypingIndex - lineStart) / line.length;
          const fadeAlpha = p.map(easeOutCubic(progress), 0, 1, 150, 255);
          const typingColor = p.color(COLORS.states.typing.color);
          typingColor.setAlpha(fadeAlpha);
          p.fill(typingColor);
          p.text(line, p.width/2, dialogueY + (i * LINE_HEIGHT));
        });
      }

      // Display existing dialogue lines
      const startY = dialogueY + (isTyping ? currentTypingLines.length * LINE_HEIGHT : 0);
      dialogueHistory.forEach((line, i) => {
        const fadeProgress = i / (dialogueHistory.length - 1);
        // Smoother fade out using easing
        const easeOutAlpha = p.map(
          easeInOutQuad(1 - fadeProgress), 
          0, 1, 80, 255
        );
        
        // Smoother color transition
        const historyColor = p.lerpColor(
          p.color(COLORS.states.fading.start),
          p.color(COLORS.states.fading.end),
          easeOutCubic(fadeProgress)
        );
        historyColor.setAlpha(easeOutAlpha);
        
        // Add subtle floating animation
        const floatY = Math.sin(p.frameCount * 0.01 + i * 0.5) * 2;
        p.fill(historyColor);
        p.text(line, p.width/2, startY + (i * LINE_HEIGHT) + floatY);
      });

      p.pop();

      // Generate new text with rhythm
      if (!isTyping && !isPaused && p.millis() - lastGenerationTime > GENERATION_INTERVAL) {
        generateText(p);
        lastGenerationTime = p.millis();
      }
    }
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// Update loader display with proper color handling
function displayLoader(p) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(FONT_SIZE);
  
  const dialogueY = TITLE_Y + LINE_HEIGHT;
  
  LANGUAGES[currentLanguage].title.forEach((line, i) => {
    const loaderColor = p.color(COLORS.states.loading.primary);
    const pulseColor = p.color(COLORS.states.loading.secondary);
    // Smoother pulse animation
    const pulseProgress = Math.sin(p.frameCount * 0.03 + i * 0.8) * 0.5 + 0.5;
    const currentColor = p.lerpColor(
      loaderColor, 
      pulseColor, 
      easeInOutQuad(pulseProgress)
    );
    currentColor.setAlpha(255);
    p.fill(currentColor);
    
    // Add floating animation
    const floatY = Math.sin(p.frameCount * 0.02 + i * 1.2) * 3;
    p.text(line, p.width/2, dialogueY + (i * LINE_HEIGHT) + floatY);
  });
  
  p.pop();
}

function onReady() {
  const mainElt = document.querySelector('main');
  new p5(sketch, mainElt);
}

if (document.readyState === 'complete') {
  onReady();
} else {
  document.addEventListener("DOMContentLoaded", onReady);
}



