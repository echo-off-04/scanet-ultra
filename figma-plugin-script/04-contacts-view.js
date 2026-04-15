// =============================================================
// SCRIPT 4/6 - ScaNetwork: Vue Contacts (Desktop 1440x1200)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Main App" (à côté du Dashboard)
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
  function txt(str, size, style, color, lh) {
    const t = figma.createText(); t.characters = str; t.fontSize = size;
    t.fontName = { family: "Inter", style: style || "Regular" };
    t.fills = [{ type: "SOLID", color: color || hex(0,0,0) }];
    if (lh) t.lineHeight = { value: lh, unit: "PIXELS" };
    t.textAutoResize = "WIDTH_AND_HEIGHT"; return t;
  }
  function autoFrame(name, dir, spacing) {
    const f = figma.createFrame(); f.name = name;
    f.layoutMode = dir || "VERTICAL"; f.itemSpacing = spacing || 0;
    f.fills = []; f.layoutSizingHorizontal = "HUG"; f.layoutSizingVertical = "HUG"; return f;
  }
  function spacer(h) {
    const s = figma.createFrame(); s.name = "sp"; s.resize(1,h); s.fills = [];
    s.layoutSizingHorizontal = "FILL"; return s;
  }

  // =============================================================
  // CONTACTS VIEW FRAME
  // =============================================================
  const frame = figma.createFrame();
  frame.name = "Contacts View - Desktop";
  frame.resize(1440, 1600);
  frame.x = 1540; // offset from dashboard
  frame.layoutMode = "HORIZONTAL";
  frame.fills = solid(255,255,255);

  // ---- SIDEBAR (collapsed version for context) ----
  const sidebar = figma.createFrame();
  sidebar.name = "Sidebar";
  sidebar.layoutMode = "VERTICAL"; sidebar.resize(288, 1600);
  sidebar.layoutSizingVertical = "FIXED"; sidebar.layoutSizingHorizontal = "FIXED";
  sidebar.paddingTop = 24; sidebar.paddingBottom = 24; sidebar.paddingLeft = 16; sidebar.paddingRight = 16;
  sidebar.itemSpacing = 4; sidebar.fills = solid(255,255,255);
  sidebar.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; sidebar.strokeWeight = 1; sidebar.strokeAlign = "INSIDE";

  // Logo
  const sLogo = autoFrame("Logo", "HORIZONTAL", 10);
  sLogo.layoutSizingHorizontal = "FILL"; sLogo.counterAxisAlignItems = "CENTER";
  sLogo.paddingLeft = 8; sLogo.paddingRight = 8; sLogo.paddingTop = 8; sLogo.paddingBottom = 16;
  const logoIcon = figma.createFrame(); logoIcon.name = "LogoIcon"; logoIcon.resize(36,36); logoIcon.cornerRadius = 8;
  logoIcon.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
    { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
    { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
  ], gradientTransform: [[1,0,0],[0,1,0]] }];
  logoIcon.layoutMode = "HORIZONTAL"; logoIcon.primaryAxisAlignItems = "CENTER"; logoIcon.counterAxisAlignItems = "CENTER";
  logoIcon.appendChild(txt("S", 16, "Bold", hex(255,255,255)));
  sLogo.appendChild(logoIcon);
  sLogo.appendChild(txt("ScaNetwork", 18, "Bold", hex(14,58,93)));
  sidebar.appendChild(sLogo);

  // Nav items - Contacts is active
  const navItems = [
    { label: "Tableau de bord", active: false },
    { label: "Contacts", active: true },
    { label: "Événements", active: false },
    { label: "Relances", active: false },
    { label: "Opportunités", active: false },
    { label: "Offres", active: false },
    { label: "Entreprise", active: false },
    { label: "Paramètres", active: false },
  ];
  for (const item of navItems) {
    const nr = autoFrame("Nav " + item.label, "HORIZONTAL", 12);
    nr.layoutSizingHorizontal = "FILL"; nr.counterAxisAlignItems = "CENTER";
    nr.paddingLeft = 12; nr.paddingRight = 12; nr.paddingTop = 10; nr.paddingBottom = 10;
    nr.cornerRadius = 12;
    if (item.active) nr.fills = solid(14,58,93);
    const icon = figma.createFrame(); icon.name = "Ic"; icon.resize(20,20); icon.cornerRadius = 4;
    icon.fills = item.active ? solid(255,255,255,0.3) : solid(156,163,175,0.3);
    icon.layoutSizingHorizontal = "FIXED"; icon.layoutSizingVertical = "FIXED";
    nr.appendChild(icon);
    nr.appendChild(txt(item.label, 14, item.active ? "Semi Bold" : "Medium", item.active ? hex(255,255,255) : hex(75,85,99)));
    sidebar.appendChild(nr);
  }
  frame.appendChild(sidebar);

  // ---- CONTENT AREA ----
  const content = figma.createFrame();
  content.name = "Content"; content.layoutMode = "VERTICAL";
  content.resize(1152, 1600); content.layoutSizingVertical = "FIXED";
  content.layoutSizingHorizontal = "FILL"; content.fills = solid(255,255,255);

  // Header
  const header = autoFrame("Header", "HORIZONTAL", 0);
  header.layoutSizingHorizontal = "FILL"; header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 32; header.paddingRight = 32; header.paddingTop = 16; header.paddingBottom = 16;
  header.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; header.strokeWeight = 1; header.strokeAlign = "INSIDE";
  header.fills = solid(255,255,255);
  const hl = autoFrame("HL", "VERTICAL", 4);
  hl.appendChild(txt("Mes Contacts", 22, "Bold", hex(17,24,39)));
  hl.appendChild(txt("Bienvenue, Jean Dupont", 13, "Regular", hex(107,114,128)));
  header.appendChild(hl); hl.layoutSizingHorizontal = "FILL";
  content.appendChild(header);

  const sc = autoFrame("ScrollContent", "VERTICAL", 20);
  sc.layoutSizingHorizontal = "FILL";
  sc.paddingLeft = 32; sc.paddingRight = 32; sc.paddingTop = 24; sc.paddingBottom = 32;

  // ---- HERO ----
  const hero = figma.createFrame();
  hero.name = "Hero Contacts"; hero.resize(1088, 280);
  hero.layoutSizingHorizontal = "FILL"; hero.cornerRadius = 24;
  hero.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
    { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
    { position: 1, color: { r: 50/255, g: 120/255, b: 170/255, a: 1 } }
  ], gradientTransform: [[1,0,0],[0,1,0]] }];
  hero.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.15}, offset:{x:0,y:8}, radius:32, spread:0, visible:true }];
  hero.layoutMode = "VERTICAL"; hero.primaryAxisAlignItems = "CENTER"; hero.counterAxisAlignItems = "MIN";
  hero.paddingLeft = 48; hero.paddingRight = 48; hero.itemSpacing = 8;

  const lb = autoFrame("Label", "HORIZONTAL", 0);
  lb.paddingLeft = 12; lb.paddingRight = 12; lb.paddingTop = 6; lb.paddingBottom = 6;
  lb.cornerRadius = 6; lb.fills = solid(255,255,255,0.95);
  lb.appendChild(txt("NETWORKING", 10, "Bold", hex(17,24,39)));
  hero.appendChild(lb);
  hero.appendChild(txt("Gérez et développez", 36, "Bold", hex(255,255,255)));
  const hlBadge = autoFrame("HL", "HORIZONTAL", 0);
  hlBadge.paddingLeft = 12; hlBadge.paddingRight = 12; hlBadge.paddingTop = 6; hlBadge.paddingBottom = 6;
  hlBadge.cornerRadius = 6; hlBadge.fills = solid(192,132,252,0.95);
  hlBadge.appendChild(txt("VOTRE RÉSEAU", 36, "Bold", hex(17,24,39)));
  hero.appendChild(hlBadge);
  hero.appendChild(txt("professionnel", 36, "Bold", hex(255,255,255)));
  sc.appendChild(hero);

  // ---- STATS CARDS ----
  const statsSection = autoFrame("Stats Cards", "HORIZONTAL", 12);
  statsSection.layoutSizingHorizontal = "FILL";

  const stats = [
    { title: "Tous les contacts", value: "47", color: [59,130,246], bg: [239,246,255] },
    { title: "Leads", value: "15", color: [249,115,22], bg: [255,247,237] },
    { title: "Prospects", value: "8", color: [245,158,11], bg: [255,251,235] },
    { title: "Clients", value: "18", color: [16,185,129], bg: [236,253,245] },
    { title: "Partenaires", value: "6", color: [139,92,246], bg: [245,243,255] },
  ];

  for (const s of stats) {
    const sc2 = autoFrame("Stat " + s.title, "VERTICAL", 8);
    sc2.layoutSizingHorizontal = "FILL";
    sc2.paddingLeft = 16; sc2.paddingRight = 16; sc2.paddingTop = 16; sc2.paddingBottom = 16;
    sc2.cornerRadius = 16;
    sc2.fills = solid(255,255,255,0.9);
    sc2.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; sc2.strokeWeight = 1;
    sc2.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];

    const iconBox = figma.createFrame(); iconBox.name = "Ic"; iconBox.resize(36,36); iconBox.cornerRadius = 10;
    iconBox.fills = [{ type: "SOLID", color: { r: s.bg[0]/255, g: s.bg[1]/255, b: s.bg[2]/255 } }];
    iconBox.layoutSizingHorizontal = "FIXED"; iconBox.layoutSizingVertical = "FIXED";
    sc2.appendChild(iconBox);
    sc2.appendChild(txt(s.value, 28, "Bold", hex(17,24,39)));
    sc2.appendChild(txt(s.title, 12, "Medium", hex(107,114,128)));
    statsSection.appendChild(sc2);
  }
  sc.appendChild(statsSection);

  // ---- STATUS TABS ----
  const tabsSection = autoFrame("Status Tabs", "HORIZONTAL", 8);
  tabsSection.layoutSizingHorizontal = "FILL";

  const tabs = [
    { label: "Tous 47", active: true, gradient: [71,85,105,100,116,139] },
    { label: "Lead 15", gradient: [251,146,60, 249,115,22] },
    { label: "Prospect 8", gradient: [96,165,250, 59,130,246] },
    { label: "Client 18", gradient: [52,211,153, 16,185,129] },
    { label: "Partenaire 6", gradient: [167,139,250, 139,92,246] },
    { label: "Collaborateur 3", gradient: [34,211,238, 6,182,212] },
    { label: "Ami 2", gradient: [244,114,182, 236,72,153] },
  ];

  for (const tab of tabs) {
    const tb = autoFrame("Tab " + tab.label, "HORIZONTAL", 0);
    tb.paddingLeft = 16; tb.paddingRight = 16; tb.paddingTop = 8; tb.paddingBottom = 8;
    tb.cornerRadius = 20;
    if (tab.active) {
      tb.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
        { position: 0, color: { r: tab.gradient[0]/255, g: tab.gradient[1]/255, b: tab.gradient[2]/255, a: 1 } },
        { position: 1, color: { r: tab.gradient[3]/255, g: tab.gradient[4]/255, b: tab.gradient[5]/255, a: 1 } }
      ], gradientTransform: [[1,0,0],[0,1,0]] }];
      tb.appendChild(txt(tab.label, 13, "Semi Bold", hex(255,255,255)));
    } else {
      tb.fills = solid(249,250,251);
      tb.appendChild(txt(tab.label, 13, "Semi Bold", hex(75,85,99)));
    }
    tabsSection.appendChild(tb);
  }
  sc.appendChild(tabsSection);

  // ---- TOOLBAR ----
  const toolbar = autoFrame("Toolbar", "VERTICAL", 12);
  toolbar.layoutSizingHorizontal = "FILL";
  toolbar.paddingLeft = 20; toolbar.paddingRight = 20; toolbar.paddingTop = 20; toolbar.paddingBottom = 20;
  toolbar.cornerRadius = 20;
  toolbar.fills = solid(255,255,255, 0.9);
  toolbar.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; toolbar.strokeWeight = 1;

  // Search bar
  const searchRow = autoFrame("Search", "HORIZONTAL", 0);
  searchRow.layoutSizingHorizontal = "FILL"; searchRow.counterAxisAlignItems = "CENTER";
  searchRow.cornerRadius = 16; searchRow.paddingLeft = 16; searchRow.paddingRight = 16;
  searchRow.paddingTop = 12; searchRow.paddingBottom = 12;
  searchRow.fills = solid(255,255,255, 0.5);
  searchRow.strokes = [{ type: "SOLID", color: hex(255,255,255, 0.6) }]; searchRow.strokeWeight = 1;
  searchRow.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:1}, radius:4, spread:0, visible:true }];

  const searchIcon = figma.createFrame(); searchIcon.name = "SearchIcon"; searchIcon.resize(20,20);
  searchIcon.cornerRadius = 4; searchIcon.fills = solid(156,163,175,0.3);
  searchIcon.layoutSizingHorizontal = "FIXED"; searchIcon.layoutSizingVertical = "FIXED";
  searchRow.appendChild(searchIcon);
  const sSp = figma.createFrame(); sSp.name = "sp"; sSp.resize(12,1); sSp.fills = [];
  sSp.layoutSizingHorizontal = "FIXED"; sSp.layoutSizingVertical = "FIXED"; searchRow.appendChild(sSp);
  searchRow.appendChild(txt("Rechercher un contact...", 14, "Regular", hex(156,163,175)));
  toolbar.appendChild(searchRow);

  // Controls row
  const controlsRow = autoFrame("Controls", "HORIZONTAL", 8);
  controlsRow.layoutSizingHorizontal = "FILL"; controlsRow.counterAxisAlignItems = "CENTER";

  // View toggle
  const viewToggle = autoFrame("ViewToggle", "HORIZONTAL", 4);
  viewToggle.paddingLeft = 6; viewToggle.paddingRight = 6; viewToggle.paddingTop = 6; viewToggle.paddingBottom = 6;
  viewToggle.cornerRadius = 16; viewToggle.fills = solid(255,255,255,0.4);
  viewToggle.strokes = [{ type: "SOLID", color: hex(255,255,255,0.6) }]; viewToggle.strokeWeight = 1;

  const vtBtns = [
    { label: "Grid", active: true },
    { label: "List", active: false },
    { label: "Photo", active: false }
  ];
  for (const vb of vtBtns) {
    const btn = figma.createFrame(); btn.name = vb.label; btn.resize(32,32); btn.cornerRadius = 10;
    btn.layoutMode = "HORIZONTAL"; btn.primaryAxisAlignItems = "CENTER"; btn.counterAxisAlignItems = "CENTER";
    if (vb.active) {
      btn.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
        { position: 0, color: { r: 1, g: 1, b: 1, a: 1 } },
        { position: 1, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } }
      ], gradientTransform: [[1,0,0],[0,1,0]] }];
      btn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.1}, offset:{x:0,y:2}, radius:4, spread:0, visible:true }];
    } else {
      btn.fills = [];
    }
    const ic = figma.createFrame(); ic.name = "Ic"; ic.resize(16,16); ic.cornerRadius = 3;
    ic.fills = vb.active ? solid(59,130,246) : solid(156,163,175,0.5);
    ic.layoutSizingHorizontal = "FIXED"; ic.layoutSizingVertical = "FIXED";
    btn.appendChild(ic);
    viewToggle.appendChild(btn);
  }
  controlsRow.appendChild(viewToggle);

  // Sort dropdown
  const sortDD = autoFrame("Sort", "HORIZONTAL", 4);
  sortDD.paddingLeft = 12; sortDD.paddingRight = 12; sortDD.paddingTop = 8; sortDD.paddingBottom = 8;
  sortDD.cornerRadius = 16; sortDD.fills = solid(255,255,255,0.6);
  sortDD.strokes = [{ type: "SOLID", color: hex(255,255,255,0.6) }]; sortDD.strokeWeight = 1;
  sortDD.counterAxisAlignItems = "CENTER";
  sortDD.appendChild(txt("Plus récent", 13, "Regular", hex(75,85,99)));
  const ddIc = figma.createFrame(); ddIc.name = "ChevDown"; ddIc.resize(12,12); ddIc.cornerRadius = 2;
  ddIc.fills = solid(156,163,175, 0.4); ddIc.layoutSizingHorizontal = "FIXED"; ddIc.layoutSizingVertical = "FIXED";
  sortDD.appendChild(ddIc);
  controlsRow.appendChild(sortDD);

  // Filter button
  const filterBtn = autoFrame("Filter", "HORIZONTAL", 6);
  filterBtn.paddingLeft = 16; filterBtn.paddingRight = 16; filterBtn.paddingTop = 8; filterBtn.paddingBottom = 8;
  filterBtn.cornerRadius = 16; filterBtn.counterAxisAlignItems = "CENTER";
  filterBtn.fills = solid(249,250,251);
  filterBtn.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; filterBtn.strokeWeight = 1;
  const fIc = figma.createFrame(); fIc.name = "FilterIc"; fIc.resize(16,16); fIc.cornerRadius = 3;
  fIc.fills = solid(107,114,128,0.4); fIc.layoutSizingHorizontal = "FIXED"; fIc.layoutSizingVertical = "FIXED";
  filterBtn.appendChild(fIc);
  filterBtn.appendChild(txt("Filtres", 13, "Semi Bold", hex(75,85,99)));
  controlsRow.appendChild(filterBtn);

  // Spacer
  const ctrlSpacer = figma.createFrame(); ctrlSpacer.name = "sp"; ctrlSpacer.resize(1,1); ctrlSpacer.fills = [];
  ctrlSpacer.layoutSizingHorizontal = "FILL"; controlsRow.appendChild(ctrlSpacer);

  // Add contact button
  const addBtn = autoFrame("AddContact", "HORIZONTAL", 6);
  addBtn.paddingLeft = 16; addBtn.paddingRight = 16; addBtn.paddingTop = 10; addBtn.paddingBottom = 10;
  addBtn.cornerRadius = 16; addBtn.counterAxisAlignItems = "CENTER";
  addBtn.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
    { position: 0, color: { r: 59/255, g: 130/255, b: 246/255, a: 1 } },
    { position: 1, color: { r: 37/255, g: 99/255, b: 235/255, a: 1 } }
  ], gradientTransform: [[1,0,0],[0,1,0]] }];
  addBtn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:59/255,g:130/255,b:246/255,a:0.3}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  const plusIc = figma.createFrame(); plusIc.name = "+"; plusIc.resize(16,16); plusIc.cornerRadius = 3;
  plusIc.fills = solid(255,255,255,0.5); plusIc.layoutSizingHorizontal = "FIXED"; plusIc.layoutSizingVertical = "FIXED";
  addBtn.appendChild(plusIc);
  addBtn.appendChild(txt("Ajouter un contact", 13, "Semi Bold", hex(255,255,255)));
  controlsRow.appendChild(addBtn);

  toolbar.appendChild(controlsRow);
  sc.appendChild(toolbar);

  // ---- CONTACT CARDS GRID ----
  const grid = autoFrame("Contact Grid", "VERTICAL", 16);
  grid.layoutSizingHorizontal = "FILL";

  const contacts = [
    { name: "Sophie Martin", company: "Tech Solutions", job: "CEO", status: "Client", statusBg: [236,253,245], statusColor: [5,150,105], rating: 4, city: "Paris" },
    { name: "Pierre Durand", company: "Startup Lab", job: "CTO", status: "Lead", statusBg: [255,247,237], statusColor: [234,88,12], rating: 3, city: "Lyon" },
    { name: "Marie Claire", company: "Finance Plus", job: "Directrice", status: "Prospect", statusBg: [255,251,235], statusColor: [217,119,6], rating: 5, city: "Marseille" },
    { name: "Luc Bernard", company: "Digital Agency", job: "Manager", status: "Partenaire", statusBg: [245,243,255], statusColor: [124,58,237], rating: 4, city: "Bordeaux" },
    { name: "Emma Petit", company: "Consulting Pro", job: "Consultante", status: "Client", statusBg: [236,253,245], statusColor: [5,150,105], rating: 3, city: "Nantes" },
    { name: "Thomas Leroy", company: "Data Works", job: "Data Analyst", status: "Lead", statusBg: [255,247,237], statusColor: [234,88,12], rating: 2, city: "Toulouse" },
  ];

  // 3 columns, 2 rows
  for (let row = 0; row < 2; row++) {
    const gridRow = autoFrame("Row " + row, "HORIZONTAL", 16);
    gridRow.layoutSizingHorizontal = "FILL";

    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      if (idx >= contacts.length) break;
      const c = contacts[idx];

      const card = autoFrame("Contact " + c.name, "VERTICAL", 8);
      card.layoutSizingHorizontal = "FILL";
      card.paddingLeft = 20; card.paddingRight = 20; card.paddingTop = 20; card.paddingBottom = 20;
      card.cornerRadius = 16;
      card.fills = solid(255,255,255, 0.9);
      card.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; card.strokeWeight = 1;
      card.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];

      // Header: avatar + info
      const cardHeader = autoFrame("CardHeader", "HORIZONTAL", 12);
      cardHeader.layoutSizingHorizontal = "FILL"; cardHeader.counterAxisAlignItems = "CENTER";

      const avatar = figma.createFrame(); avatar.name = "Av"; avatar.resize(56,56); avatar.cornerRadius = 28;
      avatar.fills = [{ type: "GRADIENT_LINEAR", gradientStops: [
        { position: 0, color: { r: 96/255, g: 165/255, b: 250/255, a: 1 } },
        { position: 1, color: { r: 59/255, g: 130/255, b: 246/255, a: 1 } }
      ], gradientTransform: [[1,0,0],[0,1,0]] }];
      avatar.layoutMode = "HORIZONTAL"; avatar.primaryAxisAlignItems = "CENTER"; avatar.counterAxisAlignItems = "CENTER";
      avatar.appendChild(txt(c.name.split(' ').map(n=>n[0]).join(''), 18, "Semi Bold", hex(255,255,255)));
      cardHeader.appendChild(avatar);

      const cardInfo = autoFrame("Info", "VERTICAL", 4); cardInfo.layoutSizingHorizontal = "FILL";
      cardInfo.appendChild(txt(c.name, 16, "Bold", hex(17,24,39)));
      cardInfo.appendChild(txt(c.job + " • " + c.company, 12, "Regular", hex(107,114,128)));

      // Stars
      const stars = autoFrame("Stars", "HORIZONTAL", 2);
      for (let i = 0; i < 5; i++) {
        const star = figma.createFrame(); star.name = "★"; star.resize(12,12); star.cornerRadius = 2;
        star.fills = i < c.rating ? solid(251,191,36) : solid(209,213,219);
        star.layoutSizingHorizontal = "FIXED"; star.layoutSizingVertical = "FIXED";
        stars.appendChild(star);
      }
      cardInfo.appendChild(stars);
      cardHeader.appendChild(cardInfo);
      card.appendChild(cardHeader);

      // Status badge
      const badge = autoFrame("Badge", "HORIZONTAL", 0);
      badge.paddingLeft = 12; badge.paddingRight = 12; badge.paddingTop = 4; badge.paddingBottom = 4;
      badge.cornerRadius = 20;
      badge.fills = [{ type: "SOLID", color: { r: c.statusBg[0]/255, g: c.statusBg[1]/255, b: c.statusBg[2]/255 } }];
      badge.appendChild(txt(c.status, 12, "Semi Bold", { r: c.statusColor[0]/255, g: c.statusColor[1]/255, b: c.statusColor[2]/255 }));
      card.appendChild(badge);

      // City
      card.appendChild(txt("📍 " + c.city, 12, "Regular", hex(107,114,128)));

      // Footer
      const footer = autoFrame("Footer", "HORIZONTAL", 12);
      footer.layoutSizingHorizontal = "FILL";
      footer.paddingTop = 8;
      footer.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; footer.strokeWeight = 1; footer.strokeAlign = "INSIDE";

      const mailIc = figma.createFrame(); mailIc.name = "MailIc"; mailIc.resize(14,14); mailIc.cornerRadius = 3;
      mailIc.fills = solid(107,114,128,0.3); mailIc.layoutSizingHorizontal = "FIXED"; mailIc.layoutSizingVertical = "FIXED";
      footer.appendChild(mailIc);
      footer.appendChild(txt("Email", 11, "Regular", hex(107,114,128)));

      const phoneIc = figma.createFrame(); phoneIc.name = "PhoneIc"; phoneIc.resize(14,14); phoneIc.cornerRadius = 3;
      phoneIc.fills = solid(107,114,128,0.3); phoneIc.layoutSizingHorizontal = "FIXED"; phoneIc.layoutSizingVertical = "FIXED";
      footer.appendChild(phoneIc);
      footer.appendChild(txt("Téléphone", 11, "Regular", hex(107,114,128)));

      card.appendChild(footer);
      gridRow.appendChild(card);
    }
    grid.appendChild(gridRow);
  }
  sc.appendChild(grid);

  content.appendChild(sc);
  frame.appendChild(content);
  page.appendChild(frame);

  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify("✅ Contacts view created!");
})();
