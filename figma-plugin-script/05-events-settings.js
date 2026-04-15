// =============================================================
// SCRIPT 5/6 - ScaNetwork: Events List + Settings (Desktop 1440)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Main App"
// =============================================================

(async () => {
  const page = figma.root.children.find(p => p.name === "Main App") || figma.root.children[1] || figma.currentPage;
  await figma.setCurrentPageAsync(page);

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  function hex(r,g,b) { return { r: r/255, g: g/255, b: b/255 }; }
  function solid(r,g,b,o) { return [{ type: "SOLID", color: hex(r,g,b), opacity: o !== undefined ? o : 1 }]; }
  function grad(r1,g1,b1,r2,g2,b2) {
    return [{ type: "GRADIENT_LINEAR", gradientStops: [
      { position: 0, color: { r: r1/255, g: g1/255, b: b1/255, a: 1 } },
      { position: 1, color: { r: r2/255, g: g2/255, b: b2/255, a: 1 } }
    ], gradientTransform: [[1,0,0],[0,1,0]] }];
  }
  function txt(str, size, style, color, lh) {
    const t = figma.createText(); t.characters = str; t.fontSize = size;
    t.fontName = { family: "Inter", style: style || "Regular" };
    t.fills = [{ type: "SOLID", color: color || hex(0,0,0) }];
    if (lh) t.lineHeight = { value: lh, unit: "PIXELS" };
    t.textAutoResize = "WIDTH_AND_HEIGHT"; return t;
  }
  function af(name, dir, sp) {
    const f = figma.createFrame(); f.name = name;
    f.layoutMode = dir || "VERTICAL"; f.itemSpacing = sp || 0;
    f.fills = []; f.layoutSizingHorizontal = "HUG"; f.layoutSizingVertical = "HUG"; return f;
  }

  // =============================================================
  //  A) EVENTS LIST VIEW — 1440×1600
  // =============================================================
  const evFrame = figma.createFrame();
  evFrame.name = "Events List - Desktop";
  evFrame.resize(1440, 1700);
  evFrame.x = 3100;
  evFrame.layoutMode = "HORIZONTAL"; evFrame.fills = solid(255,255,255);

  // Sidebar
  const sb = figma.createFrame();
  sb.name = "Sidebar"; sb.layoutMode = "VERTICAL"; sb.resize(288, 1700);
  sb.layoutSizingVertical = "FIXED"; sb.layoutSizingHorizontal = "FIXED";
  sb.paddingTop = 24; sb.paddingBottom = 24; sb.paddingLeft = 16; sb.paddingRight = 16;
  sb.itemSpacing = 4; sb.fills = solid(255,255,255);
  sb.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; sb.strokeWeight = 1; sb.strokeAlign = "INSIDE";

  const sLogo = af("Logo", "HORIZONTAL", 10);
  sLogo.layoutSizingHorizontal = "FILL"; sLogo.counterAxisAlignItems = "CENTER";
  sLogo.paddingLeft = 8; sLogo.paddingRight = 8; sLogo.paddingTop = 8; sLogo.paddingBottom = 16;
  const li = figma.createFrame(); li.name = "LI"; li.resize(36,36); li.cornerRadius = 8;
  li.fills = grad(14,58,93,30,90,142);
  li.layoutMode = "HORIZONTAL"; li.primaryAxisAlignItems = "CENTER"; li.counterAxisAlignItems = "CENTER";
  li.appendChild(txt("S", 16, "Bold", hex(255,255,255)));
  sLogo.appendChild(li);
  sLogo.appendChild(txt("ScaNetwork", 18, "Bold", hex(14,58,93)));
  sb.appendChild(sLogo);

  const navs = ["Tableau de bord","Contacts","Événements","Relances","Opportunités","Offres","Entreprise","Paramètres"];
  for (const n of navs) {
    const nr = af("N "+n, "HORIZONTAL", 12);
    nr.layoutSizingHorizontal = "FILL"; nr.counterAxisAlignItems = "CENTER";
    nr.paddingLeft = 12; nr.paddingRight = 12; nr.paddingTop = 10; nr.paddingBottom = 10;
    nr.cornerRadius = 12;
    const isActive = n === "Événements";
    if (isActive) nr.fills = solid(14,58,93);
    const ic = figma.createFrame(); ic.name = "Ic"; ic.resize(20,20); ic.cornerRadius = 4;
    ic.fills = isActive ? solid(255,255,255,0.3) : solid(156,163,175,0.3);
    ic.layoutSizingHorizontal = "FIXED"; ic.layoutSizingVertical = "FIXED";
    nr.appendChild(ic);
    nr.appendChild(txt(n, 14, isActive ? "Semi Bold" : "Medium", isActive ? hex(255,255,255) : hex(75,85,99)));
    sb.appendChild(nr);
  }
  evFrame.appendChild(sb);

  // Content
  const ct = figma.createFrame();
  ct.name = "Content"; ct.layoutMode = "VERTICAL";
  ct.resize(1152, 1700); ct.layoutSizingVertical = "FIXED"; ct.layoutSizingHorizontal = "FILL";
  ct.fills = solid(255,255,255);

  // Header
  const hdr = af("Header", "HORIZONTAL", 0);
  hdr.layoutSizingHorizontal = "FILL"; hdr.counterAxisAlignItems = "CENTER";
  hdr.paddingLeft = 32; hdr.paddingRight = 32; hdr.paddingTop = 16; hdr.paddingBottom = 16;
  hdr.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; hdr.strokeWeight = 1; hdr.strokeAlign = "INSIDE";
  hdr.fills = solid(255,255,255);
  const hl = af("HL", "VERTICAL", 4); hl.layoutSizingHorizontal = "FILL";
  hl.appendChild(txt("Événements", 22, "Bold", hex(17,24,39)));
  hl.appendChild(txt("Gérez vos événements", 13, "Regular", hex(107,114,128)));
  hdr.appendChild(hl);
  ct.appendChild(hdr);

  const sc = af("Body", "VERTICAL", 24);
  sc.layoutSizingHorizontal = "FILL";
  sc.paddingLeft = 32; sc.paddingRight = 32; sc.paddingTop = 24; sc.paddingBottom = 32;

  // Hero
  const hero = figma.createFrame();
  hero.name = "Hero Events"; hero.resize(1088, 280);
  hero.layoutSizingHorizontal = "FILL"; hero.cornerRadius = 24;
  hero.fills = grad(14,58,93,50,120,170);
  hero.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.15}, offset:{x:0,y:8}, radius:32, spread:0, visible:true }];
  hero.layoutMode = "VERTICAL"; hero.primaryAxisAlignItems = "CENTER"; hero.counterAxisAlignItems = "MIN";
  hero.paddingLeft = 48; hero.paddingRight = 48; hero.itemSpacing = 8;
  const evLbl = af("Lbl","HORIZONTAL",0);
  evLbl.paddingLeft = 12; evLbl.paddingRight=12; evLbl.paddingTop=6; evLbl.paddingBottom=6;
  evLbl.cornerRadius = 6; evLbl.fills = solid(255,255,255,0.95);
  evLbl.appendChild(txt("ÉVÉNEMENTS", 10, "Bold", hex(17,24,39)));
  hero.appendChild(evLbl);
  hero.appendChild(txt("Organisez et suivez", 36, "Bold", hex(255,255,255)));
  hero.appendChild(txt("vos événements", 36, "Bold", hex(255,255,255)));
  sc.appendChild(hero);

  // Action row: count + button
  const actionRow = af("Actions", "HORIZONTAL", 0);
  actionRow.layoutSizingHorizontal = "FILL"; actionRow.counterAxisAlignItems = "CENTER";
  actionRow.appendChild(txt("4 événements", 16, "Semi Bold", hex(107,114,128)));
  const arSp = figma.createFrame(); arSp.name = "sp"; arSp.resize(1,1); arSp.fills = [];
  arSp.layoutSizingHorizontal = "FILL"; actionRow.appendChild(arSp);
  const createBtn = af("CreateBtn", "HORIZONTAL", 8);
  createBtn.paddingLeft = 24; createBtn.paddingRight = 24; createBtn.paddingTop = 14; createBtn.paddingBottom = 14;
  createBtn.cornerRadius = 999; createBtn.counterAxisAlignItems = "CENTER";
  createBtn.fills = grad(14,58,93,30,90,142);
  createBtn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:14/255,g:58/255,b:93/255,a:0.4}, offset:{x:0,y:8}, radius:24, spread:0, visible:true }];
  const pIc = figma.createFrame(); pIc.name = "+"; pIc.resize(16,16); pIc.cornerRadius = 3;
  pIc.fills = solid(255,255,255,0.6); pIc.layoutSizingHorizontal = "FIXED"; pIc.layoutSizingVertical = "FIXED";
  createBtn.appendChild(pIc);
  createBtn.appendChild(txt("Créer un événement", 14, "Semi Bold", hex(255,255,255)));
  actionRow.appendChild(createBtn);
  sc.appendChild(actionRow);

  // Stat cards 2×2
  const statsGrid = af("Stats", "HORIZONTAL", 12);
  statsGrid.layoutSizingHorizontal = "FILL";

  const evStats = [
    { title: "4", sub: "ÉVÉNEMENTS", dark: true },
    { title: "12", sub: "LEADS GÉNÉRÉS", color: [59,130,246], bg: [239,246,255] },
    { title: "38", sub: "CONTACTS AJOUTÉS", color: [16,185,129], bg: [236,253,245] },
    { title: "85%", sub: "SCORE PERF.", color: [139,92,246], bg: [245,243,255] },
  ];
  for (const es of evStats) {
    const sc2 = af("S " + es.sub, "VERTICAL", 8);
    sc2.layoutSizingHorizontal = "FILL";
    sc2.paddingLeft = 16; sc2.paddingRight = 16; sc2.paddingTop = 20; sc2.paddingBottom = 20;
    sc2.cornerRadius = 16;
    if (es.dark) {
      sc2.fills = grad(17,24,39,31,41,55);
      sc2.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.3}, offset:{x:0,y:4}, radius:16, spread:0, visible:true }];
      const ic2 = figma.createFrame(); ic2.name = "Ic"; ic2.resize(32,32); ic2.cornerRadius = 8;
      ic2.fills = solid(255,255,255,0.15); ic2.layoutSizingHorizontal = "FIXED"; ic2.layoutSizingVertical = "FIXED";
      sc2.appendChild(ic2);
      sc2.appendChild(txt(es.title, 28, "Bold", hex(255,255,255)));
      sc2.appendChild(txt(es.sub, 10, "Bold", hex(255,255,255)));
    } else {
      sc2.fills = solid(255,255,255);
      sc2.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; sc2.strokeWeight = 1;
      sc2.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.06}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];
      const ig = figma.createFrame(); ig.name = "Ic"; ig.resize(32,32); ig.cornerRadius = 8;
      ig.fills = [{ type: "SOLID", color: { r: es.bg[0]/255, g: es.bg[1]/255, b: es.bg[2]/255 } }];
      ig.layoutSizingHorizontal = "FIXED"; ig.layoutSizingVertical = "FIXED";
      sc2.appendChild(ig);
      sc2.appendChild(txt(es.title, 28, "Bold", hex(17,24,39)));
      sc2.appendChild(txt(es.sub, 10, "Bold", hex(107,114,128)));
    }
    statsGrid.appendChild(sc2);
  }
  sc.appendChild(statsGrid);

  // Search + Filter bar
  const searchBar = af("SearchBar", "HORIZONTAL", 12);
  searchBar.layoutSizingHorizontal = "FILL"; searchBar.counterAxisAlignItems = "CENTER";
  searchBar.paddingLeft = 24; searchBar.paddingRight = 24; searchBar.paddingTop = 20; searchBar.paddingBottom = 20;
  searchBar.cornerRadius = 24; searchBar.fills = solid(255,255,255);
  searchBar.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; searchBar.strokeWeight = 1;

  const sInp = af("Input", "HORIZONTAL", 8);
  sInp.layoutSizingHorizontal = "FILL"; sInp.counterAxisAlignItems = "CENTER";
  sInp.paddingLeft = 16; sInp.paddingRight = 16; sInp.paddingTop = 12; sInp.paddingBottom = 12;
  sInp.cornerRadius = 16; sInp.fills = solid(249,250,251);
  const sIcon = figma.createFrame(); sIcon.name = "SIc"; sIcon.resize(20,20); sIcon.cornerRadius = 4;
  sIcon.fills = solid(156,163,175,0.4); sIcon.layoutSizingHorizontal = "FIXED"; sIcon.layoutSizingVertical = "FIXED";
  sInp.appendChild(sIcon);
  sInp.appendChild(txt("Rechercher...", 14, "Regular", hex(156,163,175)));
  searchBar.appendChild(sInp);

  const fBtn = af("FilterBtn","HORIZONTAL",6);
  fBtn.paddingLeft = 24; fBtn.paddingRight = 24; fBtn.paddingTop = 12; fBtn.paddingBottom = 12;
  fBtn.cornerRadius = 16; fBtn.counterAxisAlignItems = "CENTER";
  fBtn.fills = solid(243,244,246);
  const fIc = figma.createFrame(); fIc.name = "FIc"; fIc.resize(16,16); fIc.cornerRadius = 3;
  fIc.fills = solid(107,114,128,0.4); fIc.layoutSizingHorizontal = "FIXED"; fIc.layoutSizingVertical = "FIXED";
  fBtn.appendChild(fIc);
  fBtn.appendChild(txt("Filtres", 14, "Semi Bold", hex(75,85,99)));
  searchBar.appendChild(fBtn);

  sc.appendChild(searchBar);

  // Event Cards grid (3 cols)
  const evGrid = af("Events Grid", "VERTICAL", 20);
  evGrid.layoutSizingHorizontal = "FILL";

  const events = [
    { title: "Salon du Digital 2025", cat: "CONFÉRENCE", desc: "Le plus grand événement digital de l'année en France.", date: "15", month: "Juin", status: "À venir", statusGrad: [59,130,246,37,99,235], loc: "Paris, France", participants: "120/200", pct: 60 },
    { title: "Workshop Innovation", cat: "ATELIER", desc: "Atelier pratique sur les dernières innovations en IA.", date: "22", month: "Juin", status: "En cours", statusGrad: [16,185,129,5,150,105], loc: "Lyon, France", participants: "35/40", pct: 88 },
    { title: "Networking Afterwork", cat: "NETWORKING", desc: "Rencontre informelle entre professionnels du secteur tech.", date: "28", month: "Juin", status: "À venir", statusGrad: [59,130,246,37,99,235], loc: "Marseille, France", participants: "45/80", pct: 56 },
    { title: "Webinaire SEO 2025", cat: "WEBINAIRE", desc: "Stratégies SEO avancées pour booster votre visibilité.", date: "05", month: "Juil", status: "Terminé", statusGrad: [156,163,175,107,114,128], loc: "En ligne", participants: "250/300", pct: 83 },
    { title: "Forum Startup", cat: "CONFÉRENCE", desc: "Pitchs et rencontres avec investisseurs et mentors.", date: "12", month: "Juil", status: "À venir", statusGrad: [59,130,246,37,99,235], loc: "Bordeaux, France", participants: "80/150", pct: 53 },
    { title: "Hackathon Green Tech", cat: "HACKATHON", desc: "48h pour créer des solutions technologiques durables.", date: "20", month: "Juil", status: "Annulé", statusGrad: [239,68,68,220,38,38], loc: "Nantes, France", participants: "0/60", pct: 0 },
  ];

  for (let row = 0; row < 2; row++) {
    const evRow = af("Row"+row, "HORIZONTAL", 20);
    evRow.layoutSizingHorizontal = "FILL";

    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col;
      const ev = events[i];

      const card = figma.createFrame();
      card.name = "Event " + ev.title;
      card.layoutMode = "VERTICAL"; card.layoutSizingHorizontal = "FILL";
      card.cornerRadius = 24; card.fills = solid(255,255,255);
      card.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; card.strokeWeight = 1;
      card.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];
      card.clipsContent = true;

      // Image placeholder
      const imgArea = figma.createFrame();
      imgArea.name = "ImgArea"; imgArea.resize(340, 192);
      imgArea.layoutSizingHorizontal = "FILL";
      imgArea.fills = grad(31,41,55,55,65,81);

      // Date badge
      const dateBadge = figma.createFrame();
      dateBadge.name = "DateBadge"; dateBadge.resize(64,72);
      dateBadge.layoutMode = "VERTICAL"; dateBadge.primaryAxisAlignItems = "CENTER"; dateBadge.counterAxisAlignItems = "CENTER";
      dateBadge.cornerRadius = 16; dateBadge.x = 16; dateBadge.y = 16;
      dateBadge.fills = solid(255,255,255);
      dateBadge.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.1}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
      dateBadge.paddingTop = 8; dateBadge.paddingBottom = 8; dateBadge.paddingLeft = 12; dateBadge.paddingRight = 12;
      dateBadge.appendChild(txt(ev.date, 28, "Bold", hex(17,24,39)));
      dateBadge.appendChild(txt(ev.month, 11, "Medium", hex(107,114,128)));
      imgArea.appendChild(dateBadge);

      // Status badge
      const sBadge = af("Status","HORIZONTAL",0);
      sBadge.paddingLeft = 10; sBadge.paddingRight = 10; sBadge.paddingTop = 5; sBadge.paddingBottom = 5;
      sBadge.cornerRadius = 999;
      sBadge.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
        { position: 0, color: { r: ev.statusGrad[0]/255, g: ev.statusGrad[1]/255, b: ev.statusGrad[2]/255, a: 1 } },
        { position: 1, color: { r: ev.statusGrad[3]/255, g: ev.statusGrad[4]/255, b: ev.statusGrad[5]/255, a: 1 } }
      ], gradientTransform: [[1,0,0],[0,1,0]] }];
      sBadge.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.15}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];
      sBadge.appendChild(txt(ev.status, 11, "Semi Bold", hex(255,255,255)));
      sBadge.x = 200; sBadge.y = 16;
      imgArea.appendChild(sBadge);

      card.appendChild(imgArea);

      // Body
      const body = af("Body","VERTICAL",8);
      body.layoutSizingHorizontal = "FILL";
      body.paddingLeft = 24; body.paddingRight = 24; body.paddingTop = 20; body.paddingBottom = 20;

      body.appendChild(txt(ev.title, 18, "Bold", hex(17,24,39)));
      body.appendChild(txt(ev.cat, 11, "Semi Bold", hex(107,114,128)));
      body.appendChild(txt(ev.desc, 13, "Regular", hex(107,114,128), 20));

      // Location
      const locRow = af("Loc","HORIZONTAL",6);
      locRow.counterAxisAlignItems = "CENTER";
      const locIc = figma.createFrame(); locIc.name = "MapIc"; locIc.resize(14,14); locIc.cornerRadius = 3;
      locIc.fills = solid(107,114,128,0.4); locIc.layoutSizingHorizontal = "FIXED"; locIc.layoutSizingVertical = "FIXED";
      locRow.appendChild(locIc);
      locRow.appendChild(txt(ev.loc, 12, "Regular", hex(107,114,128)));
      body.appendChild(locRow);

      // Participants progress
      const partRow = af("Part","VERTICAL",6);
      partRow.layoutSizingHorizontal = "FILL";
      const partInfo = af("PI","HORIZONTAL",0);
      partInfo.layoutSizingHorizontal = "FILL"; partInfo.counterAxisAlignItems = "CENTER";
      partInfo.appendChild(txt("Participants", 12, "Semi Bold", hex(107,114,128)));
      const piSp = figma.createFrame(); piSp.name = "sp"; piSp.resize(1,1); piSp.fills = [];
      piSp.layoutSizingHorizontal = "FILL"; partInfo.appendChild(piSp);
      partInfo.appendChild(txt(ev.participants, 13, "Bold", hex(17,24,39)));
      partRow.appendChild(partInfo);

      // Progress bar
      const barBg = figma.createFrame();
      barBg.name = "BarBg"; barBg.resize(280, 6);
      barBg.layoutSizingHorizontal = "FILL"; barBg.cornerRadius = 999;
      barBg.fills = solid(243,244,246);
      const barFill = figma.createFrame();
      barFill.name = "BarFill"; barFill.resize(Math.max(2, 280 * ev.pct / 100), 6);
      barFill.cornerRadius = 999;
      barFill.fills = grad(17,24,39,55,65,81);
      barBg.appendChild(barFill);
      partRow.appendChild(barBg);

      body.appendChild(partRow);

      // Stats footer
      const statsF = af("Stats","HORIZONTAL",0);
      statsF.layoutSizingHorizontal = "FILL"; statsF.paddingTop = 12;
      statsF.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; statsF.strokeWeight = 1; statsF.strokeAlign = "INSIDE";
      const s1 = af("S1","VERTICAL",2); s1.layoutSizingHorizontal = "FILL"; s1.counterAxisAlignItems = "CENTER";
      s1.appendChild(txt("3", 16, "Bold", hex(17,24,39)));
      s1.appendChild(txt("Leads", 10, "Regular", hex(107,114,128)));
      const s2 = af("S2","VERTICAL",2); s2.layoutSizingHorizontal = "FILL"; s2.counterAxisAlignItems = "CENTER";
      s2.appendChild(txt("8", 16, "Bold", hex(17,24,39)));
      s2.appendChild(txt("Contacts", 10, "Regular", hex(107,114,128)));
      const s3 = af("S3","VERTICAL",2); s3.layoutSizingHorizontal = "FILL"; s3.counterAxisAlignItems = "CENTER";
      s3.appendChild(txt("72%", 16, "Bold", hex(17,24,39)));
      s3.appendChild(txt("Score", 10, "Regular", hex(107,114,128)));
      statsF.appendChild(s1); statsF.appendChild(s2); statsF.appendChild(s3);
      body.appendChild(statsF);

      card.appendChild(body);
      evRow.appendChild(card);
    }
    evGrid.appendChild(evRow);
  }
  sc.appendChild(evGrid);

  ct.appendChild(sc);
  evFrame.appendChild(ct);
  page.appendChild(evFrame);

  // =============================================================
  //  B) SETTINGS PAGE — 1440×1400
  // =============================================================
  const stFrame = figma.createFrame();
  stFrame.name = "Settings - Desktop";
  stFrame.resize(1440, 1600);
  stFrame.x = 4640;
  stFrame.layoutMode = "HORIZONTAL"; stFrame.fills = solid(249,250,251);

  // Sidebar (Settings active)
  const sb2 = figma.createFrame();
  sb2.name = "Sidebar"; sb2.layoutMode = "VERTICAL"; sb2.resize(288, 1600);
  sb2.layoutSizingVertical = "FIXED"; sb2.layoutSizingHorizontal = "FIXED";
  sb2.paddingTop = 24; sb2.paddingBottom = 24; sb2.paddingLeft = 16; sb2.paddingRight = 16;
  sb2.itemSpacing = 4; sb2.fills = solid(255,255,255);
  sb2.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; sb2.strokeWeight = 1; sb2.strokeAlign = "INSIDE";
  const sl2 = af("Logo","HORIZONTAL",10);
  sl2.layoutSizingHorizontal = "FILL"; sl2.counterAxisAlignItems = "CENTER";
  sl2.paddingLeft = 8; sl2.paddingRight = 8; sl2.paddingTop = 8; sl2.paddingBottom = 16;
  const li2 = figma.createFrame(); li2.name = "LI"; li2.resize(36,36); li2.cornerRadius = 8;
  li2.fills = grad(14,58,93,30,90,142);
  li2.layoutMode = "HORIZONTAL"; li2.primaryAxisAlignItems = "CENTER"; li2.counterAxisAlignItems = "CENTER";
  li2.appendChild(txt("S", 16, "Bold", hex(255,255,255)));
  sl2.appendChild(li2);
  sl2.appendChild(txt("ScaNetwork", 18, "Bold", hex(14,58,93)));
  sb2.appendChild(sl2);
  for (const n of navs) {
    const nr = af("N "+n, "HORIZONTAL", 12);
    nr.layoutSizingHorizontal = "FILL"; nr.counterAxisAlignItems = "CENTER";
    nr.paddingLeft = 12; nr.paddingRight = 12; nr.paddingTop = 10; nr.paddingBottom = 10;
    nr.cornerRadius = 12;
    const isA = n === "Paramètres";
    if (isA) nr.fills = solid(14,58,93);
    const ic = figma.createFrame(); ic.name = "Ic"; ic.resize(20,20); ic.cornerRadius = 4;
    ic.fills = isA ? solid(255,255,255,0.3) : solid(156,163,175,0.3);
    ic.layoutSizingHorizontal = "FIXED"; ic.layoutSizingVertical = "FIXED";
    nr.appendChild(ic);
    nr.appendChild(txt(n, 14, isA ? "Semi Bold" : "Medium", isA ? hex(255,255,255) : hex(75,85,99)));
    sb2.appendChild(nr);
  }
  stFrame.appendChild(sb2);

  // Content
  const ct2 = figma.createFrame();
  ct2.name = "Content"; ct2.layoutMode = "VERTICAL";
  ct2.resize(1152, 1600); ct2.layoutSizingVertical = "FIXED"; ct2.layoutSizingHorizontal = "FILL";
  ct2.fills = solid(249,250,251);

  // Header
  const hdr2 = af("Header","HORIZONTAL",0);
  hdr2.layoutSizingHorizontal = "FILL"; hdr2.counterAxisAlignItems = "CENTER";
  hdr2.paddingLeft = 32; hdr2.paddingRight = 32; hdr2.paddingTop = 16; hdr2.paddingBottom = 16;
  hdr2.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; hdr2.strokeWeight = 1; hdr2.strokeAlign = "INSIDE";
  hdr2.fills = solid(255,255,255);
  const hl2 = af("HL","VERTICAL",4); hl2.layoutSizingHorizontal = "FILL";
  hl2.appendChild(txt("Paramètres", 22, "Bold", hex(17,24,39)));
  hl2.appendChild(txt("Configurez votre compte", 13, "Regular", hex(107,114,128)));
  hdr2.appendChild(hl2);
  ct2.appendChild(hdr2);

  const sc2body = af("Body","VERTICAL",0);
  sc2body.layoutSizingHorizontal = "FILL"; sc2body.counterAxisAlignItems = "CENTER";
  sc2body.paddingLeft = 32; sc2body.paddingRight = 32; sc2body.paddingTop = 32; sc2body.paddingBottom = 32;

  // Settings card
  const sCard = af("SettingsCard","VERTICAL",0);
  sCard.resize(860, 10); sCard.layoutSizingVertical = "HUG";
  sCard.cornerRadius = 16; sCard.fills = solid(255,255,255);
  sCard.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.04}, offset:{x:0,y:1}, radius:4, spread:0, visible:true }];
  sCard.clipsContent = true;

  // Card header with gradient
  const cardHeader = figma.createFrame();
  cardHeader.name = "CardHeader"; cardHeader.layoutMode = "HORIZONTAL";
  cardHeader.resize(860, 120); cardHeader.layoutSizingHorizontal = "FILL";
  cardHeader.paddingLeft = 32; cardHeader.paddingRight = 32;
  cardHeader.counterAxisAlignItems = "CENTER"; cardHeader.itemSpacing = 24;
  cardHeader.fills = grad(14,58,93,30,90,142);

  const av = figma.createFrame(); av.name = "Avatar"; av.resize(80,80); av.cornerRadius = 40;
  av.strokes = [{ type: "SOLID", color: hex(255,255,255) }]; av.strokeWeight = 4; av.strokeAlign = "OUTSIDE";
  av.fills = solid(255,255,255,0.2);
  av.layoutMode = "HORIZONTAL"; av.primaryAxisAlignItems = "CENTER"; av.counterAxisAlignItems = "CENTER";
  av.appendChild(txt("JD", 24, "Bold", hex(255,255,255)));
  cardHeader.appendChild(av);

  const userInfo = af("UserInfo","VERTICAL",4);
  userInfo.appendChild(txt("Jean Dupont", 22, "Bold", hex(255,255,255)));
  userInfo.appendChild(txt("jean.dupont@example.com", 14, "Regular", hex(255,255,255)));
  cardHeader.appendChild(userInfo);
  sCard.appendChild(cardHeader);

  // Form body
  const formBody = af("Form","VERTICAL",32);
  formBody.layoutSizingHorizontal = "FILL";
  formBody.paddingLeft = 32; formBody.paddingRight = 32; formBody.paddingTop = 32; formBody.paddingBottom = 32;

  function makeInput(label, placeholder, fullW, disabled) {
    const g = af("F-"+label, "VERTICAL", 6);
    if (fullW) g.layoutSizingHorizontal = "FILL";
    else g.layoutSizingHorizontal = "FILL";
    g.appendChild(txt(label, 13, "Medium", hex(55,65,81)));
    const inp = af("Input","HORIZONTAL",0);
    inp.layoutSizingHorizontal = "FILL"; inp.counterAxisAlignItems = "CENTER";
    inp.paddingLeft = 16; inp.paddingRight = 16; inp.paddingTop = 12; inp.paddingBottom = 12;
    inp.cornerRadius = 12;
    inp.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; inp.strokeWeight = 1;
    inp.fills = disabled ? solid(249,250,251) : solid(255,255,255);
    inp.appendChild(txt(placeholder, 14, "Regular", disabled ? hex(107,114,128) : hex(156,163,175)));
    g.appendChild(inp);
    return g;
  }

  // Section 1: Personal info
  const sec1Title = af("Sec1Title","HORIZONTAL",8);
  sec1Title.counterAxisAlignItems = "CENTER";
  const sec1Ic = figma.createFrame(); sec1Ic.name = "Ic"; sec1Ic.resize(20,20); sec1Ic.cornerRadius = 4;
  sec1Ic.fills = solid(14,58,93,0.2); sec1Ic.layoutSizingHorizontal = "FIXED"; sec1Ic.layoutSizingVertical = "FIXED";
  sec1Title.appendChild(sec1Ic);
  sec1Title.appendChild(txt("Informations personnelles", 16, "Semi Bold", hex(17,24,39)));
  formBody.appendChild(sec1Title);

  const row1 = af("Row","HORIZONTAL",16); row1.layoutSizingHorizontal = "FILL";
  row1.appendChild(makeInput("Nom complet", "Jean Dupont"));
  row1.appendChild(makeInput("Email", "jean.dupont@example.com", false, true));
  formBody.appendChild(row1);
  const row2 = af("Row","HORIZONTAL",16); row2.layoutSizingHorizontal = "FILL";
  row2.appendChild(makeInput("Téléphone", "+33 6 12 34 56 78"));
  row2.appendChild(makeInput("LinkedIn", "https://linkedin.com/in/jeandupont"));
  formBody.appendChild(row2);

  // Section 2: Professional
  const sec2Title = af("Sec2Title","HORIZONTAL",8);
  sec2Title.counterAxisAlignItems = "CENTER";
  const sec2Ic = figma.createFrame(); sec2Ic.name = "Ic"; sec2Ic.resize(20,20); sec2Ic.cornerRadius = 4;
  sec2Ic.fills = solid(14,58,93,0.2); sec2Ic.layoutSizingHorizontal = "FIXED"; sec2Ic.layoutSizingVertical = "FIXED";
  sec2Title.appendChild(sec2Ic);
  sec2Title.appendChild(txt("Informations professionnelles", 16, "Semi Bold", hex(17,24,39)));
  formBody.appendChild(sec2Title);

  const row3 = af("Row","HORIZONTAL",16); row3.layoutSizingHorizontal = "FILL";
  row3.appendChild(makeInput("Entreprise", "Mon Entreprise"));
  row3.appendChild(makeInput("Poste", "Directeur Commercial"));
  formBody.appendChild(row3);
  const row4 = af("Row","HORIZONTAL",16); row4.layoutSizingHorizontal = "FILL";
  row4.appendChild(makeInput("Site web", "https://monentreprise.com"));
  row4.appendChild(makeInput("Ville", "Paris"));
  formBody.appendChild(row4);

  // Bio textarea
  const bioG = af("F-Bio","VERTICAL",6);
  bioG.layoutSizingHorizontal = "FILL";
  bioG.appendChild(txt("Bio", 13, "Medium", hex(55,65,81)));
  const bioInp = af("Textarea","HORIZONTAL",0);
  bioInp.layoutSizingHorizontal = "FILL";
  bioInp.paddingLeft = 16; bioInp.paddingRight = 16; bioInp.paddingTop = 12; bioInp.paddingBottom = 40;
  bioInp.cornerRadius = 12;
  bioInp.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; bioInp.strokeWeight = 1;
  bioInp.fills = solid(255,255,255);
  bioInp.appendChild(txt("Passionné par le networking et les nouvelles technologies...", 14, "Regular", hex(156,163,175)));
  bioG.appendChild(bioInp);
  formBody.appendChild(bioG);

  // Section 3: Notifications
  const sec3Title = af("Sec3Title","HORIZONTAL",8);
  sec3Title.counterAxisAlignItems = "CENTER";
  const sec3Ic = figma.createFrame(); sec3Ic.name = "Ic"; sec3Ic.resize(20,20); sec3Ic.cornerRadius = 4;
  sec3Ic.fills = solid(14,58,93,0.2); sec3Ic.layoutSizingHorizontal = "FIXED"; sec3Ic.layoutSizingVertical = "FIXED";
  sec3Title.appendChild(sec3Ic);
  sec3Title.appendChild(txt("Notifications", 16, "Semi Bold", hex(17,24,39)));
  formBody.appendChild(sec3Title);

  const toggles = [
    { label: "Contacts", desc: "Notifications pour les nouveaux contacts", on: true },
    { label: "Opportunités", desc: "Alertes pour les nouvelles opportunités", on: true },
    { label: "Rappels", desc: "Rappels de relances et suivis", on: false },
    { label: "Activité équipe", desc: "Mises à jour de l'activité de l'équipe", on: false },
  ];

  for (const tg of toggles) {
    const tRow = af("Toggle-"+tg.label, "HORIZONTAL", 12);
    tRow.layoutSizingHorizontal = "FILL"; tRow.counterAxisAlignItems = "CENTER";
    tRow.paddingLeft = 16; tRow.paddingRight = 16; tRow.paddingTop = 12; tRow.paddingBottom = 12;
    tRow.cornerRadius = 12; tRow.fills = solid(249,250,251);

    const tInfo = af("Info","VERTICAL",2); tInfo.layoutSizingHorizontal = "FILL";
    tInfo.appendChild(txt(tg.label, 14, "Medium", hex(17,24,39)));
    tInfo.appendChild(txt(tg.desc, 12, "Regular", hex(107,114,128)));
    tRow.appendChild(tInfo);

    // Toggle switch
    const sw = figma.createFrame(); sw.name = "Switch"; sw.resize(44,24); sw.cornerRadius = 12;
    sw.fills = tg.on ? solid(14,58,93) : solid(209,213,219);
    sw.layoutSizingHorizontal = "FIXED"; sw.layoutSizingVertical = "FIXED";
    const dot = figma.createFrame(); dot.name = "Dot"; dot.resize(16,16); dot.cornerRadius = 8;
    dot.fills = solid(255,255,255);
    dot.x = tg.on ? 24 : 4; dot.y = 4;
    sw.appendChild(dot);
    tRow.appendChild(sw);
    formBody.appendChild(tRow);
  }

  // Footer buttons
  const btnRow = af("Buttons","HORIZONTAL",12);
  btnRow.layoutSizingHorizontal = "FILL"; btnRow.counterAxisAlignItems = "CENTER";
  btnRow.paddingTop = 16;
  btnRow.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; btnRow.strokeWeight = 1; btnRow.strokeAlign = "INSIDE";

  const bSp = figma.createFrame(); bSp.name = "sp"; bSp.resize(1,1); bSp.fills = [];
  bSp.layoutSizingHorizontal = "FILL"; btnRow.appendChild(bSp);

  const cancelBtn = af("Cancel","HORIZONTAL",0);
  cancelBtn.paddingLeft = 24; cancelBtn.paddingRight = 24; cancelBtn.paddingTop = 12; cancelBtn.paddingBottom = 12;
  cancelBtn.cornerRadius = 12;
  cancelBtn.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; cancelBtn.strokeWeight = 1;
  cancelBtn.fills = solid(255,255,255);
  cancelBtn.appendChild(txt("Annuler", 14, "Medium", hex(55,65,81)));
  btnRow.appendChild(cancelBtn);

  const saveBtn = af("Save","HORIZONTAL",8);
  saveBtn.paddingLeft = 32; saveBtn.paddingRight = 32; saveBtn.paddingTop = 12; saveBtn.paddingBottom = 12;
  saveBtn.cornerRadius = 12; saveBtn.counterAxisAlignItems = "CENTER";
  saveBtn.fills = solid(14,58,93);
  const svIc = figma.createFrame(); svIc.name = "Ic"; svIc.resize(16,16); svIc.cornerRadius = 3;
  svIc.fills = solid(255,255,255,0.5); svIc.layoutSizingHorizontal = "FIXED"; svIc.layoutSizingVertical = "FIXED";
  saveBtn.appendChild(svIc);
  saveBtn.appendChild(txt("Enregistrer", 14, "Semi Bold", hex(255,255,255)));
  btnRow.appendChild(saveBtn);

  formBody.appendChild(btnRow);
  sCard.appendChild(formBody);
  sc2body.appendChild(sCard);
  ct2.appendChild(sc2body);
  stFrame.appendChild(ct2);
  page.appendChild(stFrame);

  figma.viewport.scrollAndZoomIntoView([evFrame, stFrame]);
  figma.notify("✅ Events List + Settings created!");
})();
