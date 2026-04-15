// =============================================================
// SCRIPT 3/6 - ScaNetwork: Dashboard + Sidebar (Desktop 1440x900)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Main App"
// =============================================================

(async () => {
  // Go to page "Main App"
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
    const s = figma.createFrame(); s.name = "spacer"; s.resize(1,h); s.fills = [];
    s.layoutSizingHorizontal = "FILL"; return s;
  }
  function gradientBtn(text, w) {
    const b = autoFrame("Button", "HORIZONTAL", 0);
    b.primaryAxisAlignItems = "CENTER"; b.counterAxisAlignItems = "CENTER";
    if (w) { b.resize(w, 10); b.layoutSizingHorizontal = "FIXED"; }
    b.paddingTop = 10; b.paddingBottom = 10; b.paddingLeft = 16; b.paddingRight = 16;
    b.cornerRadius = 12;
    b.fills = [{
      type: "GRADIENT_LINEAR",
      gradientStops: [
        { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
        { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
      ],
      gradientTransform: [[1,0,0],[0,1,0]]
    }];
    b.appendChild(txt(text, 13, "Medium", hex(255,255,255)));
    return b;
  }

  // =============================================================
  // MAIN FRAME
  // =============================================================
  const mainFrame = figma.createFrame();
  mainFrame.name = "Dashboard - Desktop";
  mainFrame.resize(1440, 1400);
  mainFrame.layoutMode = "HORIZONTAL";
  mainFrame.fills = solid(255, 255, 255);

  // ===== SIDEBAR (288px) =====
  const sidebar = figma.createFrame();
  sidebar.name = "Sidebar";
  sidebar.layoutMode = "VERTICAL";
  sidebar.resize(288, 1400);
  sidebar.layoutSizingVertical = "FIXED";
  sidebar.layoutSizingHorizontal = "FIXED";
  sidebar.paddingTop = 24; sidebar.paddingBottom = 24;
  sidebar.paddingLeft = 16; sidebar.paddingRight = 16;
  sidebar.itemSpacing = 4;
  sidebar.fills = solid(255, 255, 255);
  sidebar.strokes = [{ type: "SOLID", color: hex(229, 231, 235) }];
  sidebar.strokeWeight = 1;
  sidebar.strokeAlign = "INSIDE";

  // Sidebar Logo
  const sLogo = autoFrame("SidebarLogo", "HORIZONTAL", 10);
  sLogo.layoutSizingHorizontal = "FILL";
  sLogo.counterAxisAlignItems = "CENTER";
  sLogo.paddingLeft = 8; sLogo.paddingRight = 8;
  sLogo.paddingTop = 8; sLogo.paddingBottom = 16;
  const logoImg = figma.createFrame(); logoImg.name = "LogoIcon"; logoImg.resize(36,36);
  logoImg.cornerRadius = 8;
  logoImg.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  logoImg.layoutMode = "HORIZONTAL"; logoImg.primaryAxisAlignItems = "CENTER"; logoImg.counterAxisAlignItems = "CENTER";
  logoImg.appendChild(txt("S", 16, "Bold", hex(255,255,255)));
  sLogo.appendChild(logoImg);
  sLogo.appendChild(txt("ScaNetwork", 18, "Bold", hex(14,58,93)));
  sidebar.appendChild(sLogo);

  // Navigation items
  const navItems = [
    { label: "Tableau de bord", active: true },
    { label: "Contacts" },
    { label: "Événements" },
    { label: "Relances" },
    { label: "Opportunités" },
    { label: "Offres" },
    { label: "Entreprise" },
    { label: "Paramètres" },
  ];

  for (const item of navItems) {
    const navRow = autoFrame("Nav - " + item.label, "HORIZONTAL", 12);
    navRow.layoutSizingHorizontal = "FILL";
    navRow.counterAxisAlignItems = "CENTER";
    navRow.paddingLeft = 12; navRow.paddingRight = 12;
    navRow.paddingTop = 10; navRow.paddingBottom = 10;
    navRow.cornerRadius = 12;

    if (item.active) {
      navRow.fills = solid(14, 58, 93);
    }

    // Icon placeholder
    const icon = figma.createFrame(); icon.name = "Icon";
    icon.resize(20, 20); icon.cornerRadius = 4;
    icon.fills = item.active ? solid(255,255,255,0.3) : solid(156,163,175,0.3);
    icon.layoutSizingHorizontal = "FIXED"; icon.layoutSizingVertical = "FIXED";
    navRow.appendChild(icon);

    navRow.appendChild(txt(item.label, 14, item.active ? "Semi Bold" : "Medium",
      item.active ? hex(255,255,255) : hex(75,85,99)));
    sidebar.appendChild(navRow);
  }

  // Spacer to push user section to bottom
  const navSpacer = figma.createFrame(); navSpacer.name = "NavSpacer";
  navSpacer.resize(1, 10); navSpacer.fills = [];
  navSpacer.layoutSizingHorizontal = "FILL"; navSpacer.layoutSizingVertical = "FILL";
  sidebar.appendChild(navSpacer);

  // User section at bottom
  const userSection = autoFrame("User", "HORIZONTAL", 12);
  userSection.layoutSizingHorizontal = "FILL";
  userSection.counterAxisAlignItems = "CENTER";
  userSection.paddingLeft = 12; userSection.paddingRight = 12;
  userSection.paddingTop = 12; userSection.paddingBottom = 12;
  userSection.cornerRadius = 12;
  userSection.fills = solid(248, 250, 252);

  const userAvatar = figma.createFrame(); userAvatar.name = "UserAvatar";
  userAvatar.resize(36, 36); userAvatar.cornerRadius = 18;
  userAvatar.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  userAvatar.layoutMode = "HORIZONTAL"; userAvatar.primaryAxisAlignItems = "CENTER"; userAvatar.counterAxisAlignItems = "CENTER";
  userAvatar.appendChild(txt("JD", 12, "Bold", hex(255,255,255)));
  userSection.appendChild(userAvatar);

  const userInfo = autoFrame("UserInfo", "VERTICAL", 2);
  userInfo.appendChild(txt("Jean Dupont", 13, "Semi Bold", hex(31,41,55)));
  userInfo.appendChild(txt("jean@example.com", 11, "Regular", hex(107,114,128)));
  userSection.appendChild(userInfo);
  userInfo.layoutSizingHorizontal = "FILL";

  // Logout icon
  const logoutIcon = figma.createFrame(); logoutIcon.name = "Logout";
  logoutIcon.resize(20, 20); logoutIcon.cornerRadius = 4;
  logoutIcon.fills = solid(239, 68, 68, 0.3);
  logoutIcon.layoutSizingHorizontal = "FIXED"; logoutIcon.layoutSizingVertical = "FIXED";
  userSection.appendChild(logoutIcon);

  sidebar.appendChild(userSection);
  mainFrame.appendChild(sidebar);

  // ===== MAIN CONTENT AREA =====
  const content = figma.createFrame();
  content.name = "Content Area";
  content.layoutMode = "VERTICAL";
  content.resize(1152, 1400);
  content.layoutSizingVertical = "FIXED";
  content.layoutSizingHorizontal = "FILL";
  content.fills = solid(255, 255, 255);

  // ---- HEADER BAR ----
  const header = autoFrame("Header", "HORIZONTAL", 0);
  header.layoutSizingHorizontal = "FILL";
  header.counterAxisAlignItems = "CENTER";
  header.paddingLeft = 32; header.paddingRight = 32;
  header.paddingTop = 16; header.paddingBottom = 16;
  header.strokes = [{ type: "SOLID", color: hex(229,231,235) }];
  header.strokeWeight = 1; header.strokeAlign = "INSIDE";
  header.fills = solid(255, 255, 255);

  const headerLeft = autoFrame("HeaderLeft", "VERTICAL", 4);
  headerLeft.appendChild(txt("Tableau de bord", 22, "Bold", hex(17,24,39)));
  headerLeft.appendChild(txt("Bienvenue, Jean Dupont", 13, "Regular", hex(107,114,128)));
  header.appendChild(headerLeft);
  headerLeft.layoutSizingHorizontal = "FILL";

  content.appendChild(header);

  // ---- SCROLLABLE CONTENT ----
  const scrollContent = autoFrame("ScrollContent", "VERTICAL", 24);
  scrollContent.layoutSizingHorizontal = "FILL";
  scrollContent.paddingLeft = 32; scrollContent.paddingRight = 32;
  scrollContent.paddingTop = 24; scrollContent.paddingBottom = 32;

  // ---- HERO SECTION ----
  const hero = figma.createFrame();
  hero.name = "Hero Banner";
  hero.resize(1088, 280);
  hero.layoutSizingHorizontal = "FILL";
  hero.cornerRadius = 24;
  hero.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 0.4, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } },
      { position: 1, color: { r: 50/255, g: 120/255, b: 170/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  hero.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r:0,g:0,b:0,a:0.15 }, offset:{x:0,y:8}, radius:32, spread:0, visible:true }
  ];
  hero.layoutMode = "VERTICAL";
  hero.primaryAxisAlignItems = "CENTER";
  hero.counterAxisAlignItems = "MIN";
  hero.paddingLeft = 48; hero.paddingRight = 48;
  hero.itemSpacing = 8;

  // Label badge
  const labelBadge = autoFrame("Label", "HORIZONTAL", 0);
  labelBadge.paddingLeft = 12; labelBadge.paddingRight = 12; labelBadge.paddingTop = 6; labelBadge.paddingBottom = 6;
  labelBadge.cornerRadius = 6; labelBadge.fills = solid(255,255,255, 0.95);
  labelBadge.appendChild(txt("BIENVENUE", 10, "Bold", hex(17,24,39)));
  hero.appendChild(labelBadge);

  hero.appendChild(txt("Pilotez votre", 36, "Bold", hex(255,255,255)));

  const hlBadge = autoFrame("Highlight", "HORIZONTAL", 0);
  hlBadge.paddingLeft = 12; hlBadge.paddingRight = 12; hlBadge.paddingTop = 6; hlBadge.paddingBottom = 6;
  hlBadge.cornerRadius = 6; hlBadge.fills = solid(96, 165, 250, 0.95);
  hlBadge.appendChild(txt("ACTIVITÉ COMMERCIALE", 36, "Bold", hex(17,24,39)));
  hero.appendChild(hlBadge);

  hero.appendChild(txt("en temps réel", 36, "Bold", hex(255,255,255)));
  scrollContent.appendChild(hero);

  // ---- KPI SECTION ----
  const kpiSection = autoFrame("KPI Section", "VERTICAL", 24);
  kpiSection.layoutSizingHorizontal = "FILL";
  kpiSection.paddingLeft = 20; kpiSection.paddingRight = 20;
  kpiSection.paddingTop = 20; kpiSection.paddingBottom = 20;
  kpiSection.cornerRadius = 20;
  kpiSection.fills = solid(255,255,255, 0.9);
  kpiSection.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; kpiSection.strokeWeight = 1;

  const kpiRow = autoFrame("KPI Cards + Actions", "HORIZONTAL", 24);
  kpiRow.layoutSizingHorizontal = "FILL";

  // KPI Grid (2x2)
  const kpiGrid = autoFrame("KPI Grid", "VERTICAL", 12);
  kpiGrid.layoutSizingHorizontal = "FILL";

  const kpiRow1 = autoFrame("KPI Row 1", "HORIZONTAL", 12);
  kpiRow1.layoutSizingHorizontal = "FILL";

  function kpiCard(title, value, iconColor, isDark) {
    const card = autoFrame("KPI " + title, "VERTICAL", 8);
    card.layoutSizingHorizontal = "FILL";
    card.paddingLeft = 16; card.paddingRight = 16; card.paddingTop = 16; card.paddingBottom = 16;
    card.cornerRadius = 16;
    if (isDark) {
      card.fills = [{
        type: "GRADIENT_LINEAR",
        gradientStops: [
          { position: 0, color: { r: 17/255, g: 24/255, b: 39/255, a: 1 } },
          { position: 1, color: { r: 31/255, g: 41/255, b: 55/255, a: 1 } }
        ],
        gradientTransform: [[1,0,0],[0,1,0]]
      }];
      card.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.3}, offset:{x:0,y:4}, radius:16, spread:0, visible:true }];
    } else {
      card.fills = solid(255,255,255);
      card.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; card.strokeWeight = 1;
      card.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.08}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];
    }

    // Icon + label row
    const labelRow = autoFrame("Label", "HORIZONTAL", 8);
    labelRow.counterAxisAlignItems = "CENTER";
    const iconBox = figma.createFrame(); iconBox.name = "Icon"; iconBox.resize(28,28); iconBox.cornerRadius = 8;
    if (isDark) {
      iconBox.fills = solid(255,255,255,0.1);
    } else {
      const rgb = iconColor;
      iconBox.fills = [{ type: "SOLID", color: { r: rgb[0]/255, g: rgb[1]/255, b: rgb[2]/255 }, opacity: 0.08 }];
    }
    iconBox.layoutSizingHorizontal = "FIXED"; iconBox.layoutSizingVertical = "FIXED";
    labelRow.appendChild(iconBox);
    labelRow.appendChild(txt(title.toUpperCase(), 10, "Medium", isDark ? hex(255,255,255,0.7) : hex(107,114,128)));
    card.appendChild(labelRow);

    card.appendChild(txt(value, isDark ? 28 : 24, "Bold", isDark ? hex(255,255,255) : hex(17,24,39)));
    return card;
  }

  kpiRow1.appendChild(kpiCard("Total Contacts", "47", [59,130,246], true));
  kpiRow1.appendChild(kpiCard("CA Gagné", "24 500 €", [16,185,129], false));
  kpiGrid.appendChild(kpiRow1);

  const kpiRow2 = autoFrame("KPI Row 2", "HORIZONTAL", 12);
  kpiRow2.layoutSizingHorizontal = "FILL";
  kpiRow2.appendChild(kpiCard("Opportunités", "12", [139,92,246], false));
  kpiRow2.appendChild(kpiCard("Pipeline", "65 800 €", [245,158,11], false));
  kpiGrid.appendChild(kpiRow2);

  kpiRow.appendChild(kpiGrid);

  // Quick Actions Panel
  const actionsPanel = autoFrame("Quick Actions", "VERTICAL", 12);
  actionsPanel.layoutSizingHorizontal = "FILL";
  actionsPanel.paddingLeft = 20; actionsPanel.paddingRight = 20;
  actionsPanel.paddingTop = 20; actionsPanel.paddingBottom = 20;
  actionsPanel.cornerRadius = 16;
  actionsPanel.fills = solid(249, 250, 251);
  actionsPanel.strokes = [{ type: "SOLID", color: hex(243, 244, 246) }]; actionsPanel.strokeWeight = 1;

  const actTitle = autoFrame("ActTitle", "VERTICAL", 4);
  actTitle.appendChild(txt("Actions rapides", 14, "Semi Bold", hex(55,65,81)));
  actTitle.appendChild(txt("Gérez rapidement vos contacts et opportunités", 12, "Regular", hex(107,114,128)));
  actionsPanel.appendChild(actTitle);

  const actions = [
    { title: "Nouveau contact", desc: "Ajouter un contact à votre réseau", color: [59,130,246] },
    { title: "Nouvel événement", desc: "Créer un événement de networking", color: [139,92,246] },
    { title: "Opportunités", desc: "Gérer vos opportunités commerciales", color: [16,185,129] },
    { title: "Offres", desc: "Consulter vos offres commerciales", color: [249,115,22] },
  ];

  for (const a of actions) {
    const actionRow = autoFrame("Action " + a.title, "HORIZONTAL", 12);
    actionRow.layoutSizingHorizontal = "FILL";
    actionRow.counterAxisAlignItems = "CENTER";
    actionRow.paddingLeft = 12; actionRow.paddingRight = 12;
    actionRow.paddingTop = 12; actionRow.paddingBottom = 12;
    actionRow.cornerRadius = 12;
    actionRow.fills = solid(255, 255, 255);
    actionRow.strokes = [{ type: "SOLID", color: hex(229, 231, 235) }]; actionRow.strokeWeight = 1;

    const aIcon = figma.createFrame(); aIcon.name = "Icon"; aIcon.resize(40, 40); aIcon.cornerRadius = 8;
    aIcon.fills = [{ type: "SOLID", color: { r: a.color[0]/255, g: a.color[1]/255, b: a.color[2]/255 }, opacity: 0.08 }];
    aIcon.layoutSizingHorizontal = "FIXED"; aIcon.layoutSizingVertical = "FIXED";
    actionRow.appendChild(aIcon);

    const aInfo = autoFrame("Info", "VERTICAL", 2); aInfo.layoutSizingHorizontal = "FILL";
    aInfo.appendChild(txt(a.title, 13, "Semi Bold", hex(17,24,39)));
    aInfo.appendChild(txt(a.desc, 11, "Regular", hex(107,114,128)));
    actionRow.appendChild(aInfo);

    // Arrow
    const arrow = figma.createFrame(); arrow.name = "Arrow"; arrow.resize(16, 16);
    arrow.fills = solid(156,163,175, 0.3); arrow.cornerRadius = 4;
    arrow.layoutSizingHorizontal = "FIXED"; arrow.layoutSizingVertical = "FIXED";
    actionRow.appendChild(arrow);

    actionsPanel.appendChild(actionRow);
  }

  kpiRow.appendChild(actionsPanel);
  kpiSection.appendChild(kpiRow);
  scrollContent.appendChild(kpiSection);

  // ---- RECENT CONTACTS SECTION ----
  const recentContacts = autoFrame("Recent Contacts", "VERTICAL", 16);
  recentContacts.layoutSizingHorizontal = "FILL";
  recentContacts.paddingLeft = 20; recentContacts.paddingRight = 20;
  recentContacts.paddingTop = 20; recentContacts.paddingBottom = 20;
  recentContacts.cornerRadius = 20;
  recentContacts.fills = solid(255,255,255, 0.9);
  recentContacts.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; recentContacts.strokeWeight = 1;
  recentContacts.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:12, spread:0, visible:true }];

  const rcHeader = autoFrame("RC Header", "HORIZONTAL", 0);
  rcHeader.layoutSizingHorizontal = "FILL"; rcHeader.counterAxisAlignItems = "CENTER";
  rcHeader.appendChild(txt("Derniers contacts ajoutés", 18, "Bold", hex(17,24,39)));
  const rcLink = txt("Voir tous →", 13, "Semi Bold", hex(14,58,93));
  rcHeader.appendChild(rcLink);
  // Push link to right
  const rcSpacer = figma.createFrame(); rcSpacer.name = "sp"; rcSpacer.resize(1,1); rcSpacer.fills = [];
  rcSpacer.layoutSizingHorizontal = "FILL";
  rcHeader.insertChild(1, rcSpacer);
  recentContacts.appendChild(rcHeader);

  // Contact cards row
  const contactsRow = autoFrame("Contacts Row", "HORIZONTAL", 16);
  contactsRow.layoutSizingHorizontal = "FILL";

  const contactNames = [
    { name: "Sophie Martin", company: "Tech Corp", initials: "SM" },
    { name: "Pierre Durand", company: "Startup Lab", initials: "PD" },
    { name: "Marie Claire", company: "Finance +", initials: "MC" },
    { name: "Luc Bernard", company: "Digital Agency", initials: "LB" },
    { name: "Emma Petit", company: "Consulting Pro", initials: "EP" },
  ];

  for (const c of contactNames) {
    const contactCard = autoFrame("Contact " + c.name, "VERTICAL", 8);
    contactCard.layoutSizingHorizontal = "FILL";
    contactCard.counterAxisAlignItems = "CENTER";
    contactCard.paddingLeft = 16; contactCard.paddingRight = 16;
    contactCard.paddingTop = 16; contactCard.paddingBottom = 16;
    contactCard.cornerRadius = 16;
    contactCard.fills = solid(255,255,255, 0.9);
    contactCard.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; contactCard.strokeWeight = 1;

    const cAvatar = figma.createFrame(); cAvatar.name = "Avatar"; cAvatar.resize(56, 56); cAvatar.cornerRadius = 28;
    cAvatar.fills = [{
      type: "GRADIENT_LINEAR",
      gradientStops: [
        { position: 0, color: { r: 96/255, g: 165/255, b: 250/255, a: 1 } },
        { position: 1, color: { r: 59/255, g: 130/255, b: 246/255, a: 1 } }
      ],
      gradientTransform: [[1,0,0],[0,1,0]]
    }];
    cAvatar.layoutMode = "HORIZONTAL"; cAvatar.primaryAxisAlignItems = "CENTER"; cAvatar.counterAxisAlignItems = "CENTER";
    cAvatar.appendChild(txt(c.initials, 18, "Semi Bold", hex(255,255,255)));
    contactCard.appendChild(cAvatar);

    contactCard.appendChild(txt(c.name, 13, "Bold", hex(17,24,39)));
    contactCard.appendChild(txt(c.company, 11, "Regular", hex(107,114,128)));

    // Stars
    const stars = autoFrame("Stars", "HORIZONTAL", 2);
    for (let i = 0; i < 5; i++) {
      const star = figma.createFrame(); star.name = "Star"; star.resize(12, 12);
      star.cornerRadius = 2;
      star.fills = i < 3 ? solid(251, 191, 36) : solid(209, 213, 219);
      star.layoutSizingHorizontal = "FIXED"; star.layoutSizingVertical = "FIXED";
      stars.appendChild(star);
    }
    contactCard.appendChild(stars);

    contactsRow.appendChild(contactCard);
  }
  recentContacts.appendChild(contactsRow);
  scrollContent.appendChild(recentContacts);

  // ---- RECENT EVENTS SECTION ----
  const recentEvents = autoFrame("Recent Events", "VERTICAL", 16);
  recentEvents.layoutSizingHorizontal = "FILL";
  recentEvents.paddingLeft = 20; recentEvents.paddingRight = 20;
  recentEvents.paddingTop = 20; recentEvents.paddingBottom = 20;
  recentEvents.cornerRadius = 20;
  recentEvents.fills = solid(255,255,255, 0.9);
  recentEvents.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; recentEvents.strokeWeight = 1;
  recentEvents.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:12, spread:0, visible:true }];

  const reHeader = autoFrame("RE Header", "HORIZONTAL", 0);
  reHeader.layoutSizingHorizontal = "FILL"; reHeader.counterAxisAlignItems = "CENTER";
  reHeader.appendChild(txt("Derniers événements", 18, "Bold", hex(17,24,39)));
  const reSpacer = figma.createFrame(); reSpacer.name = "sp"; reSpacer.resize(1,1); reSpacer.fills = [];
  reSpacer.layoutSizingHorizontal = "FILL";
  reHeader.appendChild(reSpacer);
  reHeader.appendChild(txt("Voir tous →", 13, "Semi Bold", hex(14,58,93)));
  recentEvents.appendChild(reHeader);

  // Event cards row
  const eventsRow = autoFrame("Events Row", "HORIZONTAL", 16);
  eventsRow.layoutSizingHorizontal = "FILL";

  const eventData = [
    { name: "Salon Networking Paris", date: "15 Avr 2026", loc: "Paris", count: "24", status: "À venir", statusColor: [59,130,246] },
    { name: "Tech Meetup Lyon", date: "20 Avr 2026", loc: "Lyon", count: "12", status: "À venir", statusColor: [59,130,246] },
    { name: "Conférence E-commerce", date: "10 Avr 2026", loc: "Marseille", count: "36", status: "Terminé", statusColor: [156,163,175] },
    { name: "Gala Entreprises", date: "5 Avr 2026", loc: "Bordeaux", count: "18", status: "Terminé", statusColor: [156,163,175] },
  ];

  for (const e of eventData) {
    const evCard = autoFrame("Event " + e.name, "VERTICAL", 8);
    evCard.layoutSizingHorizontal = "FILL";
    evCard.paddingLeft = 16; evCard.paddingRight = 16;
    evCard.paddingTop = 16; evCard.paddingBottom = 16;
    evCard.cornerRadius = 16;
    evCard.fills = solid(255,255,255);
    evCard.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; evCard.strokeWeight = 1;

    // Status badge
    const badge = autoFrame("Badge", "HORIZONTAL", 0);
    badge.paddingLeft = 8; badge.paddingRight = 8; badge.paddingTop = 4; badge.paddingBottom = 4;
    badge.cornerRadius = 20;
    badge.fills = [{ type: "SOLID", color: { r: e.statusColor[0]/255, g: e.statusColor[1]/255, b: e.statusColor[2]/255 }, opacity: 0.1 }];
    badge.appendChild(txt(e.status, 10, "Semi Bold", { r: e.statusColor[0]/255, g: e.statusColor[1]/255, b: e.statusColor[2]/255 }));
    evCard.appendChild(badge);

    evCard.appendChild(txt(e.name, 14, "Semi Bold", hex(17,24,39)));
    evCard.appendChild(txt("📅 " + e.date, 12, "Regular", hex(107,114,128)));
    evCard.appendChild(txt("📍 " + e.loc, 12, "Regular", hex(107,114,128)));

    const partRow = autoFrame("Participants", "HORIZONTAL", 4);
    partRow.counterAxisAlignItems = "CENTER";
    const pIcon = figma.createFrame(); pIcon.name = "UserIcon"; pIcon.resize(14,14); pIcon.cornerRadius = 3;
    pIcon.fills = solid(107,114,128,0.3); pIcon.layoutSizingHorizontal = "FIXED"; pIcon.layoutSizingVertical = "FIXED";
    partRow.appendChild(pIcon);
    partRow.appendChild(txt(e.count + " participants", 11, "Regular", hex(107,114,128)));
    evCard.appendChild(partRow);

    eventsRow.appendChild(evCard);
  }
  recentEvents.appendChild(eventsRow);
  scrollContent.appendChild(recentEvents);

  content.appendChild(scrollContent);
  mainFrame.appendChild(content);
  page.appendChild(mainFrame);

  figma.viewport.scrollAndZoomIntoView([mainFrame]);
  figma.notify("✅ Dashboard + Sidebar created!");
})();
