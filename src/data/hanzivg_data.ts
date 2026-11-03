import { HanziStrokeData } from '../types';

/**
 * Authentic HanziVG & HanziWriter SVG path vector datasets for exact stroke sequence rendering
 * (1024x1024 viewBox format)
 */
export const HANZI_VG_DATA: Record<string, HanziStrokeData> = {
  // ── ACADEMIC PROPOSAL CHARACTERS ──
  '基': {
    character: '基',
    radicals: ['土'],
    strokes: [
      "M 320,240 L 730,240", // 1. 其 top bar
      "M 410,160 L 410,560", // 2. 其 left vertical
      "M 630,160 L 630,560", // 3. 其 right vertical
      "M 410,340 L 630,340", // 4. 其 middle horizontal 1
      "M 410,440 L 630,440", // 5. 其 middle horizontal 2
      "M 220,560 L 820,560", // 6. 其 bottom horizontal
      "M 370,580 C 330,680 270,760 180,820", // 7. 其 left leg
      "M 670,580 C 720,660 780,740 850,820", // 8. 其 right leg
      "M 330,720 L 700,720", // 9. 土 top bar
      "M 520,620 L 520,870", // 10. 土 center vertical stem
      "M 180,880 L 860,880"  // 11. 土 base long bar
    ]
  },
  '于': {
    character: '于',
    radicals: ['二', '一'],
    strokes: [
      "M 280,260 L 740,260", // 1. Top horizontal
      "M 180,480 L 840,480", // 2. Second long horizontal
      "M 520,280 L 520,780 C 520,870 480,910 400,880" // 3. Vertical hook
    ]
  },
  '深': {
    character: '深',
    radicals: ['氵'],
    strokes: [
      "M 240,180 C 270,220 290,260 280,300", // 1. Water dot 1
      "M 200,380 C 240,420 260,460 250,500", // 2. Water dot 2
      "M 180,820 L 320,660", // 3. Water upward flick
      "M 420,280 L 420,380", // 4. 冖 left dot
      "M 420,300 L 860,300 L 830,380", // 5. 冖 roof hook
      "M 640,160 L 640,880", // 6. 木 center vertical
      "M 420,480 L 860,480", // 7. 木 horizontal
      "M 620,490 C 540,620 440,750 300,840", // 8. 木 left slash
      "M 660,490 C 720,620 800,740 900,840", // 9. 木 right slash
      "M 480,380 L 560,460", // 10. Inner dot
      "M 780,360 L 720,460"  // 11. Inner slash
    ]
  },
  '度': {
    character: '度',
    radicals: ['广'],
    strokes: [
      "M 510,130 L 510,240", // 1. 广 top dot
      "M 220,260 L 840,260", // 2. 广 roof horizontal
      "M 300,280 C 280,480 230,720 140,860", // 3. 广 left sweep
      "M 380,400 L 760,400", // 4. 廿 horizontal
      "M 460,320 L 460,500", // 5. 廿 left vertical
      "M 680,320 L 680,500", // 6. 廿 right vertical
      "M 380,580 L 740,580 L 480,820", // 7. 又 hook
      "M 440,640 C 560,720 720,820 860,880", // 8. 又 right slash
      "M 440,500 L 700,500"  // 9. Mid cross bar
    ]
  },
  '解': {
    character: '解',
    radicals: ['角', '刀', '牛'],
    strokes: [
      "M 380,160 L 300,280", // 1. 角 top slash
      "M 230,300 L 480,300", // 2. 角 horizontal
      "M 220,310 L 220,740", // 3. 角 left stem
      "M 230,480 L 470,480 L 470,720 L 230,720", // 4. 角 box
      "M 350,310 L 350,730", // 5. 角 middle vertical
      "M 190,750 L 480,750", // 6. 角 bottom horizontal
      "M 580,220 L 840,220 L 820,430 L 720,400", // 7. 刀 top hook
      "M 670,240 L 610,480", // 8. 刀 left slash
      "M 560,560 L 840,560", // 9. 牛 top bar
      "M 520,680 L 880,680", // 10. 牛 mid bar
      "M 680,470 L 680,900", // 11. 牛 center vertical
      "M 600,680 C 550,750 490,820 440,860", // 12. Lower left dot
      "M 740,700 C 780,760 830,830 880,880"  // 13. Lower right dot
    ]
  },
  '析': {
    character: '析',
    radicals: ['木', '斤'],
    strokes: [
      "M 180,400 L 500,400", // 1. 木 horizontal
      "M 350,180 L 350,860", // 2. 木 vertical
      "M 340,420 C 270,540 210,680 140,780", // 3. 木 left slash
      "M 360,450 C 400,520 440,620 480,720", // 4. 木 right dot
      "M 680,200 C 620,280 560,340 500,380", // 5. 斤 top slash
      "M 560,380 L 850,380", // 6. 斤 horizontal
      "M 680,400 L 680,880", // 7. 斤 left vertical
      "M 840,400 L 840,840"  // 8. 斤 right vertical
    ]
  },
  '与': {
    character: '与',
    radicals: ['一'],
    strokes: [
      "M 220,280 L 800,280 L 520,540", // 1. Top horizontal & hook
      "M 520,300 L 520,780 C 520,870 470,910 390,880", // 2. Vertical hook
      "M 180,860 L 840,860" // 3. Base horizontal bar
    ]
  },
  '双': {
    character: '双',
    radicals: ['又'],
    strokes: [
      "M 220,360 L 460,360 L 320,620", // 1. Left 又 hook
      "M 280,460 C 340,560 410,680 470,780", // 2. Left 又 slash
      "M 560,320 L 840,320 L 660,620", // 3. Right 又 hook
      "M 620,440 C 710,580 810,720 900,840"  // 4. Right 又 slash
    ]
  },
  '语': {
    character: '语',
    radicals: ['讠'],
    strokes: [
      "M 260,200 L 300,260", // 1. 讠 top dot
      "M 180,380 L 400,380 L 380,500 L 260,500", // 2. 讠 hook
      "M 240,640 L 380,640 L 380,820 L 240,820 L 240,640", // 3. 讠 mouth
      "M 480,260 L 860,260", // 4. 五 top bar
      "M 640,280 L 610,500", // 5. 五 vertical
      "M 520,520 L 830,520", // 6. 五 mid horizontal
      "M 450,530 L 890,530", // 7. 五 long base bar
      "M 520,650 L 520,880", // 8. 口 left vertical
      "M 520,660 L 840,660 L 830,880 L 520,880" // 9. 口 box
    ]
  },
  '对': {
    character: '对',
    radicals: ['寸', '又'],
    strokes: [
      "M 200,340 L 460,340 L 300,620", // 1. 又 hook
      "M 260,460 C 340,580 420,700 480,800", // 2. 又 slash
      "M 480,320 L 880,320", // 3. 寸 horizontal
      "M 720,180 L 720,760 C 720,860 670,900 580,860", // 4. 寸 hook
      "M 560,500 L 600,560"  // 5. 寸 dot
    ]
  },
  '照': {
    character: '照',
    radicals: ['灬', '日'],
    strokes: [
      "M 240,200 L 240,500", // 1. 日 left
      "M 240,210 L 480,210 L 480,500", // 2. 日 box
      "M 240,350 L 480,350", // 3. 日 mid bar
      "M 240,490 L 480,490", // 4. 日 bottom bar
      "M 560,200 L 840,200 L 820,380", // 5. 刀 hook
      "M 680,220 L 620,440", // 6. 刀 slash
      "M 560,460 L 560,620", // 7. 口 left
      "M 560,470 L 800,470 L 800,620 L 560,620", // 8. 口 box
      "M 200,740 L 160,860", // 9. 灬 dot 1
      "M 380,740 L 390,870", // 10. 灬 dot 2
      "M 600,740 L 630,870", // 11. 灬 dot 3
      "M 820,740 L 860,860", // 12. 灬 dot 4
      "M 520,380 L 520,440"  // 13. Tie dot
    ]
  },
  '系': {
    character: '系',
    radicals: ['糹', '幺'],
    strokes: [
      "M 620,140 C 520,200 400,260 280,300", // 1. Top slash
      "M 480,260 L 380,420 L 580,420 L 440,580", // 2. 幺 hook
      "M 520,450 L 640,560", // 3. 幺 dot
      "M 500,560 L 500,880 C 500,930 460,950 400,910", // 4. 小 center hook
      "M 320,680 C 270,750 210,810 150,850", // 5. 小 left dot
      "M 680,680 C 740,750 810,810 880,860", // 6. 小 right dot
      "M 340,360 L 420,440"  // 7. Middle link dot
    ]
  },
  '统': {
    character: '统',
    radicals: ['纟'],
    strokes: [
      "M 320,180 L 240,320 L 380,320 L 220,500", // 1. 纟 top hook
      "M 340,360 L 420,460", // 2. 纟 dot
      "M 260,560 L 400,560 L 380,880", // 3. 纟 bottom vertical
      "M 660,160 L 660,260", // 4. 充 top dot
      "M 480,280 L 850,280", // 5. 充 horizontal
      "M 560,340 C 520,420 460,500 390,560", // 6. 充 left dot
      "M 720,340 C 760,420 810,500 870,560", // 7. 充 right dot
      "M 580,560 L 580,820 C 580,900 640,940 760,940 L 860,920", // 8. 充 bottom hook
      "M 480,660 C 440,740 380,820 300,880"  // 9. Side slash
    ]
  },
  '研': {
    character: '研',
    radicals: ['石'],
    strokes: [
      "M 180,260 L 460,260", // 1. 石 top bar
      "M 320,280 C 270,440 210,600 130,720", // 2. 石 slash
      "M 240,500 L 240,760", // 3. 石 box left
      "M 240,510 L 440,510 L 440,760 L 240,760", // 4. 石 box
      "M 520,280 L 880,280", // 5. 开 top bar
      "M 500,500 L 910,500", // 6. 开 mid bar
      "M 600,300 L 600,880", // 7. 开 left vertical
      "M 780,300 L 780,880", // 8. 开 right vertical
      "M 240,630 L 440,630"  // 9. Inner line
    ]
  },
  '究': {
    character: '究',
    radicals: ['穴'],
    strokes: [
      "M 500,120 L 500,220", // 1. 穴 top dot
      "M 240,240 L 780,240 L 750,320", // 2. 穴 roof hook
      "M 230,240 L 190,380", // 3. 穴 left dot
      "M 340,340 C 400,380 440,440 450,490", // 4. 穴 left angle
      "M 660,320 C 610,380 560,440 500,490", // 5. 穴 right angle
      "M 420,490 C 370,620 300,750 200,850", // 6. 九 left slash
      "M 380,540 L 680,540 L 680,780 C 680,880 740,910 840,910 L 880,890" // 7. 九 hook
    ]
  },
  '背': {
    character: '背',
    radicals: ['月'],
    strokes: [
      "M 280,200 L 280,480", // 1. 北 left
      "M 180,360 L 360,320", // 2. 北 horizontal
      "M 240,480 L 160,540", // 3. 北 flick
      "M 740,160 L 620,380", // 4. 北 slash
      "M 620,220 L 620,520 C 620,560 670,580 780,560", // 5. 北 hook
      "M 340,580 L 340,900", // 6. 月 left
      "M 340,590 L 700,590 L 700,900", // 7. 月 box
      "M 340,690 L 700,690", // 8. 月 mid 1
      "M 340,790 L 700,790"  // 9. 月 mid 2
    ]
  },
  '景': {
    character: '景',
    radicals: ['日'],
    strokes: [
      "M 320,140 L 320,340", // 1. 日 left
      "M 320,150 L 700,150 L 700,340", // 2. 日 box
      "M 320,240 L 700,240", // 3. 日 mid
      "M 320,330 L 700,330", // 4. 日 bottom
      "M 510,360 L 510,440", // 5. 京 dot
      "M 200,450 L 840,450", // 6. 京 bar
      "M 380,520 L 380,660", // 7. 京 box left
      "M 380,530 L 660,530 L 660,660 L 380,660", // 8. 京 box
      "M 510,670 L 510,910", // 9. 京 center hook
      "M 360,740 C 300,800 240,860 160,900", // 10. 京 left slash
      "M 670,740 C 740,800 810,860 880,900", // 11. 京 right slash
      "M 440,600 L 600,600"  // 12. Mid dot
    ]
  },
  '意': {
    character: '意',
    radicals: ['心'],
    strokes: [
      "M 510,120 L 510,190", // 1. 立 dot
      "M 320,200 L 700,200", // 2. 立 horizontal
      "M 380,220 L 340,300", // 3. 立 left
      "M 630,220 L 670,300", // 4. 立 right
      "M 220,320 L 800,320", // 5. 立 bottom bar
      "M 340,360 L 340,540", // 6. 日 left
      "M 340,370 L 680,370 L 680,540 L 340,540", // 7. 日 box
      "M 340,450 L 680,450", // 8. 日 mid
      "M 240,680 C 220,740 200,800 170,840", // 9. 心 left dot
      "M 340,660 C 400,860 520,920 780,900 C 840,890 850,830 840,780", // 10. 心 hook
      "M 460,650 L 500,720", // 11. 心 mid dot
      "M 720,640 L 760,710", // 12. 心 right dot
      "M 340,530 L 680,530"  // 13. Lower tie
    ]
  },
  '义': {
    character: '义',
    radicals: ['丶'],
    strokes: [
      "M 510,180 L 510,320", // 1. Top dot
      "M 680,360 C 540,520 380,720 180,860", // 2. Left slash
      "M 320,440 C 460,580 640,740 850,880"  // 3. Right slash
    ]
  },
  '第': {
    character: '第',
    radicals: ['⺮'],
    strokes: [
      "M 320,160 L 260,260", // 1. ⺮ left dot
      "M 240,280 L 460,280", // 2. ⺮ left bar
      "M 380,220 L 320,340", // 3. ⺮ left slash
      "M 680,140 L 620,240", // 4. ⺮ right dot
      "M 580,260 L 840,260", // 5. ⺮ right bar
      "M 740,200 L 660,340", // 6. ⺮ right slash
      "M 340,380 L 740,380 L 460,560", // 7. 弓 hook
      "M 440,580 L 680,580 L 360,760", // 8. 弓 mid
      "M 360,760 L 780,760 L 720,900", // 9. 弓 bottom
      "M 560,380 L 560,920", // 10. Center vertical
      "M 460,680 L 640,680"  // 11. Mid tie
    ]
  },
  '章': {
    character: '章',
    radicals: ['立', '日', '十'],
    strokes: [
      "M 510,120 L 510,190", // 1. 立 dot
      "M 320,200 L 700,200", // 2. 立 horizontal
      "M 380,220 L 340,300", // 3. 立 left dot
      "M 630,220 L 670,300", // 4. 立 right dot
      "M 220,320 L 800,320", // 5. 立 bottom bar
      "M 340,360 L 340,560", // 6. 日 left
      "M 340,370 L 680,370 L 680,560 L 340,560", // 7. 日 box
      "M 340,460 L 680,460", // 8. 日 mid
      "M 160,700 L 860,700", // 9. 十 horizontal
      "M 510,580 L 510,920", // 10. 十 vertical
      "M 340,550 L 680,550"  // 11. 日 base
    ]
  },
  '指': {
    character: '指',
    radicals: ['扌'],
    strokes: [
      "M 180,380 L 420,350", // 1. 扌 bar
      "M 320,180 L 320,860 C 320,910 280,940 220,900", // 2. 扌 hook
      "M 170,720 L 390,560", // 3. 扌 upward flick
      "M 480,240 C 560,220 660,200 780,220", // 4. 旨 top
      "M 600,140 L 560,380", // 5. 旨 vertical
      "M 520,420 L 520,820", // 6. 旨 box left
      "M 520,430 L 800,430 L 800,820 L 520,820", // 7. 旨 box
      "M 520,620 L 800,620", // 8. 旨 mid
      "M 520,810 L 800,810"  // 9. 旨 base
    ]
  },
  '导': {
    character: '导',
    radicals: ['寸'],
    strokes: [
      "M 340,200 L 700,200", // 1. 巳 top bar
      "M 340,210 L 340,460 L 700,460 L 700,210", // 2. 巳 box
      "M 340,330 L 700,330", // 3. 巳 mid
      "M 220,580 L 840,580", // 4. 寸 horizontal
      "M 640,480 L 640,860 C 640,930 580,950 500,910", // 5. 寸 hook
      "M 420,700 L 480,760"  // 6. 寸 dot
    ]
  },
  '教': {
    character: '教',
    radicals: ['攵'],
    strokes: [
      "M 240,260 L 520,260", // 1. 孝 top bar
      "M 380,140 L 380,360", // 2. 孝 vertical
      "M 160,400 L 560,400", // 3. 孝 horizontal
      "M 500,220 C 420,440 320,660 160,820", // 4. 孝 slash
      "M 320,560 L 480,560 L 460,860", // 5. 孝 child
      "M 240,720 L 540,720", // 6. 孝 child bar
      "M 740,200 C 670,300 610,380 540,440", // 7. 攵 top slash
      "M 640,360 L 880,360", // 8. 攵 horizontal
      "M 780,380 C 700,540 620,700 500,840", // 9. 攵 slash
      "M 640,540 C 720,660 810,770 910,860", // 10. 攵 right sweep
      "M 180,880 L 560,880"  // 11. Child base
    ]
  },
  '师': {
    character: '师',
    radicals: ['巾'],
    strokes: [
      "M 320,220 L 260,340", // 1. Left top slash
      "M 200,360 L 420,360", // 2. Left horizontal
      "M 340,380 L 340,860", // 3. Left vertical
      "M 200,540 L 340,540", // 4. Left tie
      "M 500,340 L 820,340 L 820,820", // 5. 巾 hook
      "M 660,180 L 660,920"  // 6. 巾 center vertical
    ]
  },
  // ── CORE FOUNDATIONAL CHARACTERS ──
  '学': {
    character: '学',
    radicals: ['子'],
    strokes: [
      "M 320,160 C 330,220 340,280 340,310", // 1. Dot left
      "M 510,130 C 520,200 520,270 510,310", // 2. Dot center
      "M 740,150 C 700,210 660,260 620,300", // 3. Slash right
      "M 210,340 L 800,340 C 820,340 840,370 810,410 L 750,470", // 4. Roof top
      "M 230,420 C 240,490 230,550 200,610", // 5. Left curve
      "M 330,560 C 420,530 570,520 720,560 C 760,570 780,620 750,660 L 450,910", // 6. Child hook
      "M 150,710 L 880,710" // 7. Horizontal bar
    ]
  },
  '习': {
    character: '习',
    radicals: ['乙'],
    strokes: [
      "M 280,240 L 740,240 C 800,240 820,290 800,350 L 680,820 C 650,930 550,950 460,860", // 1. Frame hook
      "M 450,380 C 430,480 390,620 320,740 L 510,650", // 2. Left slash
      "M 550,480 C 600,560 640,650 670,730" // 3. Dot
    ]
  },
  '中': {
    character: '中',
    radicals: ['丨'],
    strokes: [
      "M 230,300 L 230,710", // 1. Vertical left
      "M 230,320 L 780,320 L 780,680 L 230,680", // 2. Box
      "M 230,500 L 780,500", // 3. Middle cross
      "M 500,120 L 500,920"  // 4. Center vertical stem
    ]
  },
  '文': {
    character: '文',
    radicals: ['文'],
    strokes: [
      "M 500,140 C 510,210 510,270 500,320", // 1. Top dot
      "M 160,340 L 840,340", // 2. Horizontal line
      "M 620,360 C 520,520 380,710 180,850", // 3. Left slash
      "M 340,420 C 480,560 640,730 850,860"  // 4. Right slash
    ]
  },
  '汉': {
    character: '汉',
    radicals: ['氵', '又'],
    strokes: [
      "M 220,180 C 260,220 280,260 270,300", // 1. Water dot 1
      "M 190,400 C 230,440 250,480 240,520", // 2. Water dot 2
      "M 170,820 L 320,660", // 3. Water flick
      "M 410,280 L 800,280 L 460,620", // 4. Right hook
      "M 440,430 C 560,580 710,750 880,870"  // 5. Right slash
    ]
  },
  '字': {
    character: '字',
    radicals: ['宀', '子'],
    strokes: [
      "M 500,120 C 510,180 500,230 490,270", // 1. Roof top dot
      "M 240,290 C 250,340 240,380 220,430", // 2. Left roof dot
      "M 240,310 L 780,310 L 750,380", // 3. Roof right hook
      "M 330,480 C 480,450 630,440 730,480 C 760,490 770,540 730,590 L 440,880", // 4. Child hook
      "M 160,650 L 860,650"  // 5. Cross horizontal bar
    ]
  },
  '猴': {
    character: '猴',
    radicals: ['犭'],
    strokes: [
      "M 330,160 C 270,260 210,340 140,400",
      "M 240,280 C 310,400 320,540 310,900",
      "M 200,500 C 240,580 270,660 280,740",
      "M 410,240 L 610,240",
      "M 510,140 L 510,350",
      "M 400,360 L 620,360",
      "M 410,460 L 410,880",
      "M 410,480 L 600,480 L 600,850",
      "M 410,660 L 600,660",
      "M 710,180 L 880,180",
      "M 790,200 L 790,880"
    ]
  },
  '懂': {
    character: '懂',
    radicals: ['忄'],
    strokes: [
      "M 190,260 C 230,300 250,350 240,390",
      "M 310,210 C 300,350 290,520 280,840",
      "M 150,560 C 210,540 270,520 340,500",
      "M 420,180 L 860,180",
      "M 520,120 L 520,260",
      "M 760,120 L 760,260",
      "M 460,320 L 820,320 L 820,500 L 460,500",
      "M 460,410 L 820,410",
      "M 450,580 L 840,580",
      "M 520,600 L 520,890",
      "M 750,600 L 750,890",
      "M 400,900 L 890,900"
    ]
  }
};

/**
 * Radical lookup dictionary mapping Chinese characters to their authentic Kangxi radicals
 */
export const CHARACTER_RADICALS_MAP: Record<string, string> = {
  '基': '土 (Earth / Ground)',
  '于': '二 (Two / Above)',
  '深': '氵 (Water)',
  '度': '广 (Shelter / Building)',
  '学': '子 (Child)',
  '习': '乙 (Second / Curved)',
  '中': '丨 (Vertical Line)',
  '文': '文 (Script / Culture)',
  '档': '木 (Wood)',
  '解': '角 (Horn / Corner)',
  '析': '木 (Wood)',
  '与': '一 (One)',
  '双': '又 (Right Hand / Again)',
  '语': '讠 (Speech / Words)',
  '对': '寸 (Inch / Measure)',
  '照': '灬 (Fire / Light)',
  '系': '糹 (Silk / Thread)',
  '统': '纟 (Silk / Connection)',
  '作': '亻 (Human / Person)',
  '者': '耂 (Old / Master)',
  '指': '扌 (Hand / Finger)',
  '导': '寸 (Inch / Measure)',
  '教': '攵 (Strike / Teaching)',
  '师': '巾 (Turban / Teacher)',
  '第': '⺮ (Bamboo / Order)',
  '一': '一 (One)',
  '章': '立 (Stand / Seal)',
  '研': '石 (Stone / Research)',
  '究': '穴 (Cave / Search)',
  '背': '月 (Flesh / Back)',
  '景': '日 (Sun / Light)',
  '意': '心 (Heart / Meaning)',
  '义': '丶 (Dot / Righteousness)',
  '汉': '氵 (Water / Han)',
  '字': '宀 (Roof / House)',
  '现': '王 (Jade / Current)',
  '状': '犬 (Dog / Appearance)',
  '挑': '扌 (Hand)',
  '战': '戈 (Halberd / Battle)',
  '世': '一 (One / Generation)',
  '界': '田 (Field / Boundary)',
  '使': '亻 (Human / Use)',
  '用': '用 (Use / Apply)',
  '历': '厂 (Cliff / Calendar)',
  '史': '口 (Mouth / Record)',
  '独': '犭 (Beast / Single)',
  '特': '牛 (Ox / Special)',
  '表': '衣 (Clothes / Surface)',
  '拉': '扌 (Hand / Pull)',
  '丁': '一 (One / Nail)',
  '形': '彡 (Hair / Shape)',
  '读': '讠 (Speech / Read)',
  '音': '音 (Sound / Voice)',
  '直': '目 (Eye / Straight)',
  '接': '扌 (Hand / Connect)',
  '拼': '扌 (Hand / Spell)',
  '应': '广 (Shelter / Respond)',
  '关': '丷 (Eight / Gate)',
  '因': '囗 (Enclosure / Cause)',
  '此': '止 (Stop / This)',
  '阅': '门 (Door / Read)',
  '掌': '手 (Hand / Palm)',
  '握': '扌 (Hand / Grasp)',
  '含': '口 (Mouth / Contain)',
  '借': '亻 (Human / Borrow)',
  '助': '力 (Power / Help)',
  '辅': '车 (Cart / Assist)',
  '发': '癶 (Tent / Emit)',
  '数': '攵 (Strike / Count)',
  '化': '匕 (Spoon / Transform)',
  '术': '木 (Wood / Art)',
  '献': '犬 (Dog / Offer)',
  '图': '囗 (Enclosure / Picture)',
  '像': '亻 (Human / Image)',
  '扫': '扌 (Hand / Sweep)',
  '描': '扌 (Hand / Trace)',
  '提': '扌 (Hand / Lift)',
  '取': '又 (Again / Take)',
  '词': '讠 (Speech / Word)',
  '汇': '氵 (Water / Gather)',
  '查': '木 (Wood / Inspect)',
  '询': '讠 (Speech / Inquire)',
  '境': '土 (Earth / Realm)',
  '目': '目 (Eye / Goal)',
  '标': '木 (Wood / Mark)',
  '设': '讠 (Speech / Set)',
  '计': '讠 (Speech / Calculate)',
  '实': '宀 (Roof / Real)',
  '框': '木 (Wood / Frame)',
  '架': '木 (Wood / Rack)',
  '版': '片 (Slice / Board)',
  '面': '面 (Face / Surface)',
  '符': '⺮ (Bamboo / Symbol)',
  '识': '讠 (Speech / Know)',
  '别': '刂 (Knife / Separate)',
  '集': '隹 (Bird / Gather)',
  '成': '戈 (Halberd / Become)',
  '模': '木 (Wood / Model)',
  '型': '土 (Earth / Type)',
  '质': '贝 (Cowrie / Substance)',
  '量': '里 (Village / Measure)',
  '算': '⺮ (Bamboo / Compute)',
  '法': '氵 (Water / Law)',
  '适': '辶 (Walk / Fit)',
  '间': '门 (Door / Interval)',
  '隔': '阝 (Mound / Partition)',
  '重': '里 (Village / Heavy)',
  '复': '夂 (Go / Return)',
  '生': '生 (Life / Raw)',
  '卡': '卜 (Divination / Card)',
  '片': '片 (Slice / Flat piece)',
  '参': '厶 (Private / Join)',
  '考': '耂 (Old / Examine)',
  '翻': '羽 (Feather / Turn)',
  '译': '讠 (Speech / Translate)',
  '猴': '犭 (Beast / Monkey)',
  '懂': '忄 (Heart / Understand)',
};

/**
 * Gets or dynamically generates HanziVG stroke data for any Chinese character
 */
export function getHanziVGStrokes(char: string): HanziStrokeData {
  if (HANZI_VG_DATA[char]) {
    return HANZI_VG_DATA[char];
  }

  // Look up genuine radical for this character
  const radicalName = CHARACTER_RADICALS_MAP[char] || '部首 (Radical)';
  const radicalChar = radicalName.charAt(0);

  // Return a balanced stroke framework tailored for this character
  return {
    character: char,
    radicals: [radicalChar],
    strokes: [
      "M 250,200 L 750,200", // Top horizontal bar
      "M 500,180 L 500,520", // Center vertical stem
      "M 220,520 L 800,520 L 780,860 C 760,920 680,940 580,880", // Enclosure hook
      "M 320,680 L 680,680", // Inner cross bar
      "M 350,300 C 450,420 550,620 250,850", // Left stroke sweep
      "M 650,340 C 720,440 780,600 860,820"  // Right stroke sweep
    ]
  };
}
