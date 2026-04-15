// =============================================================
// SCRIPT 6/6 - ScaNetwork: Modals (AddContact, AddEvent, ScanContact, EventQRCode)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Views & Modals"
// =============================================================

(async () => {
  const page = figma.root.children.find(p => p.name === "Views & Modals") || figma.root.children[2] || figma.currentPage;
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
  function txt(str, sz, style, color) {
    const t = figma.createText(); t.characters = str; t.fontSize = sz;
    t.fontName = { family: "Inter", style: style || "Regular" };
    t.fills = [{ type: "SOLID", color: color || hex(0,0,0) }];
    t.textAutoResize = "WIDTH_AND_HEIGHT"; return t;
  }
  function af(name, dir, sp) {
    const f = figma.createFrame(); f.name = name;
    f.layoutMode = dir || "VERTICAL"; f.itemSpacing = sp || 0;
    f.fills = []; f.layoutSizingHorizontal = "HUG"; f.layoutSizingVertical = "HUG"; return f;
  }
  function makeField(label, placeholder, required) {
    const g = af("F-"+label, "VERTICAL", 6); g.layoutSizingHorizontal = "FILL";
    const lbl = af("Lbl","HORIZONTAL",4); lbl.counterAxisAlignItems = "CENTER";
    lbl.appendChild(txt(label, 13, "Medium", hex(55,65,81)));
    if (required) lbl.appendChild(txt("*", 13, "Bold", hex(239,68,68)));
    g.appendChild(lbl);
    const inp = af("Inp","HORIZONTAL",0); inp.layoutSizingHorizontal = "FILL";
    inp.paddingLeft = 20; inp.paddingRight = 20; inp.paddingTop = 14; inp.paddingBottom = 14;
    inp.cornerRadius = 16; inp.fills = solid(229,231,235);
    inp.appendChild(txt(placeholder, 14, "Regular", hex(156,163,175)));
    g.appendChild(inp);
    return g;
  }

  // =============================================================
  //  A) ADD CONTACT MODAL
  // =============================================================
  const acOverlay = figma.createFrame();
  acOverlay.name = "AddContact Modal"; acOverlay.resize(1440, 900);
  acOverlay.x = 0;
  acOverlay.fills = solid(0,0,0,0.2);
  acOverlay.layoutMode = "HORIZONTAL";
  acOverlay.primaryAxisAlignItems = "CENTER"; acOverlay.counterAxisAlignItems = "CENTER";

  const acModal = af("Modal","VERTICAL",0);
  acModal.resize(960, 850); acModal.layoutSizingVertical = "FIXED";
  acModal.cornerRadius = 32; acModal.fills = solid(255,255,255);
  acModal.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:16}, radius:48, spread:0, visible:true }];
  acModal.clipsContent = true;

  // Header
  const acHeader = af("Header","HORIZONTAL",0);
  acHeader.layoutSizingHorizontal = "FILL"; acHeader.counterAxisAlignItems = "CENTER";
  acHeader.paddingLeft = 40; acHeader.paddingRight = 40; acHeader.paddingTop = 32; acHeader.paddingBottom = 24;
  const acHL = af("HL","VERTICAL",8); acHL.layoutSizingHorizontal = "FILL";
  acHL.appendChild(txt("Ajouter un contact", 28, "Bold", hex(17,24,39)));
  acHL.appendChild(txt("Renseignez les informations du nouveau contact", 14, "Regular", hex(107,114,128)));
  acHeader.appendChild(acHL);
  const closeBtn1 = figma.createFrame(); closeBtn1.name = "X"; closeBtn1.resize(36,36); closeBtn1.cornerRadius = 18;
  closeBtn1.fills = solid(243,244,246); closeBtn1.layoutMode = "HORIZONTAL";
  closeBtn1.primaryAxisAlignItems = "CENTER"; closeBtn1.counterAxisAlignItems = "CENTER";
  closeBtn1.appendChild(txt("✕", 16, "Regular", hex(107,114,128)));
  acHeader.appendChild(closeBtn1);
  acModal.appendChild(acHeader);

  // Avatar
  const avSection = af("AvatarSec","HORIZONTAL",0);
  avSection.layoutSizingHorizontal = "FILL"; avSection.primaryAxisAlignItems = "CENTER";
  avSection.paddingBottom = 16;
  const avCircle = figma.createFrame(); avCircle.name = "Avatar"; avCircle.resize(80,80); avCircle.cornerRadius = 40;
  avCircle.fills = grad(219,234,254,252,231,243); // blue-100 to pink-100
  avCircle.strokes = [{ type: "SOLID", color: hex(255,255,255) }]; avCircle.strokeWeight = 4; avCircle.strokeAlign = "OUTSIDE";
  avCircle.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.1}, offset:{x:0,y:4}, radius:16, spread:0, visible:true }];
  avCircle.layoutMode = "HORIZONTAL"; avCircle.primaryAxisAlignItems = "CENTER"; avCircle.counterAxisAlignItems = "CENTER";
  avCircle.appendChild(txt("📷", 24, "Regular", hex(107,114,128)));
  avSection.appendChild(avCircle);
  acModal.appendChild(avSection);

  // Form body (scrollable)
  const acForm = af("Form","VERTICAL",20);
  acForm.layoutSizingHorizontal = "FILL"; acForm.layoutSizingVertical = "FILL";
  acForm.paddingLeft = 40; acForm.paddingRight = 40; acForm.paddingTop = 8; acForm.paddingBottom = 24;

  // Row 1: Prénom / Nom
  const r1 = af("R","HORIZONTAL",16); r1.layoutSizingHorizontal = "FILL";
  r1.appendChild(makeField("Prénom", "Jean", true));
  r1.appendChild(makeField("Nom", "Dupont", true));
  acForm.appendChild(r1);

  // Row 2: Email / Phone
  const r2 = af("R","HORIZONTAL",16); r2.layoutSizingHorizontal = "FILL";
  r2.appendChild(makeField("Email", "jean@example.com", true));
  r2.appendChild(makeField("Téléphone", "+33 6 12 34 56 78", true));
  acForm.appendChild(r2);

  // Row 3: Entreprise / Poste
  const r3 = af("R","HORIZONTAL",16); r3.layoutSizingHorizontal = "FILL";
  r3.appendChild(makeField("Entreprise", "Mon Entreprise"));
  r3.appendChild(makeField("Poste", "Directeur"));
  acForm.appendChild(r3);

  // Row 4: LinkedIn / Tags
  const r4 = af("R","HORIZONTAL",16); r4.layoutSizingHorizontal = "FILL";
  r4.appendChild(makeField("LinkedIn", "https://linkedin.com/in/..."));
  // Tags field
  const tagField = af("F-Tags","VERTICAL",6); tagField.layoutSizingHorizontal = "FILL";
  tagField.appendChild(txt("Tags", 13, "Medium", hex(55,65,81)));
  const tagInp = af("TagInp","HORIZONTAL",8); tagInp.layoutSizingHorizontal = "FILL";
  tagInp.paddingLeft = 12; tagInp.paddingRight = 12; tagInp.paddingTop = 10; tagInp.paddingBottom = 10;
  tagInp.cornerRadius = 16; tagInp.fills = solid(229,231,235); tagInp.counterAxisAlignItems = "CENTER";
  // Sample tags
  const tag1 = af("Tag","HORIZONTAL",4); tag1.paddingLeft = 10; tag1.paddingRight = 10; tag1.paddingTop = 4; tag1.paddingBottom = 4;
  tag1.cornerRadius = 999; tag1.fills = solid(219,234,254); tag1.counterAxisAlignItems = "CENTER";
  tag1.appendChild(txt("Tech", 11, "Medium", hex(29,78,216)));
  tag1.appendChild(txt("✕", 9, "Regular", hex(29,78,216)));
  tagInp.appendChild(tag1);
  const tag2 = af("Tag","HORIZONTAL",4); tag2.paddingLeft = 10; tag2.paddingRight = 10; tag2.paddingTop = 4; tag2.paddingBottom = 4;
  tag2.cornerRadius = 999; tag2.fills = solid(219,234,254); tag2.counterAxisAlignItems = "CENTER";
  tag2.appendChild(txt("VIP", 11, "Medium", hex(29,78,216)));
  tag2.appendChild(txt("✕", 9, "Regular", hex(29,78,216)));
  tagInp.appendChild(tag2);
  tagInp.appendChild(txt("Ajouter un tag...", 13, "Regular", hex(156,163,175)));
  tagField.appendChild(tagInp);
  r4.appendChild(tagField);
  acForm.appendChild(r4);

  // Row 5: Status / Source
  const r5 = af("R","HORIZONTAL",16); r5.layoutSizingHorizontal = "FILL";
  // Status dropdown
  const statusField = af("F-Status","VERTICAL",6); statusField.layoutSizingHorizontal = "FILL";
  statusField.appendChild(txt("Statut", 13, "Medium", hex(55,65,81)));
  const statusInp = af("Sel","HORIZONTAL",0); statusInp.layoutSizingHorizontal = "FILL";
  statusInp.paddingLeft = 20; statusInp.paddingRight = 20; statusInp.paddingTop = 14; statusInp.paddingBottom = 14;
  statusInp.cornerRadius = 16; statusInp.fills = solid(229,231,235);
  statusInp.appendChild(txt("Lead", 14, "Regular", hex(75,85,99)));
  statusField.appendChild(statusInp);
  r5.appendChild(statusField);
  r5.appendChild(makeField("Source", "Événement"));
  acForm.appendChild(r5);

  // Row 6: Notes (full width)
  const notesField = af("F-Notes","VERTICAL",6); notesField.layoutSizingHorizontal = "FILL";
  notesField.appendChild(txt("Notes", 13, "Medium", hex(55,65,81)));
  const notesInp = af("Textarea","HORIZONTAL",0); notesInp.layoutSizingHorizontal = "FILL";
  notesInp.paddingLeft = 20; notesInp.paddingRight = 20; notesInp.paddingTop = 14; notesInp.paddingBottom = 48;
  notesInp.cornerRadius = 16; notesInp.fills = solid(229,231,235);
  notesInp.appendChild(txt("Notes sur le contact...", 14, "Regular", hex(156,163,175)));
  notesField.appendChild(notesInp);
  acForm.appendChild(notesField);

  acModal.appendChild(acForm);

  // Footer
  const acFooter = af("Footer","HORIZONTAL",12);
  acFooter.layoutSizingHorizontal = "FILL"; acFooter.counterAxisAlignItems = "CENTER";
  acFooter.paddingLeft = 40; acFooter.paddingRight = 40; acFooter.paddingTop = 16; acFooter.paddingBottom = 24;
  acFooter.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; acFooter.strokeWeight = 1; acFooter.strokeAlign = "INSIDE";
  const fSp = figma.createFrame(); fSp.name = "sp"; fSp.resize(1,1); fSp.fills = [];
  fSp.layoutSizingHorizontal = "FILL"; acFooter.appendChild(fSp);
  const can1 = af("Cancel","HORIZONTAL",0);
  can1.paddingLeft = 24; can1.paddingRight = 24; can1.paddingTop = 12; can1.paddingBottom = 12;
  can1.cornerRadius = 16; can1.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; can1.strokeWeight = 1;
  can1.fills = solid(255,255,255);
  can1.appendChild(txt("Annuler", 14, "Medium", hex(55,65,81)));
  acFooter.appendChild(can1);
  const sub1 = af("Submit","HORIZONTAL",8);
  sub1.paddingLeft = 32; sub1.paddingRight = 32; sub1.paddingTop = 12; sub1.paddingBottom = 12;
  sub1.cornerRadius = 16; sub1.counterAxisAlignItems = "CENTER";
  sub1.fills = grad(59,130,246,37,99,235);
  sub1.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:59/255,g:130/255,b:246/255,a:0.3}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  sub1.appendChild(txt("Ajouter le contact", 14, "Semi Bold", hex(255,255,255)));
  acFooter.appendChild(sub1);
  acModal.appendChild(acFooter);

  acOverlay.appendChild(acModal);
  page.appendChild(acOverlay);

  // =============================================================
  //  B) ADD EVENT MODAL
  // =============================================================
  const aeOverlay = figma.createFrame();
  aeOverlay.name = "AddEvent Modal"; aeOverlay.resize(1440, 900);
  aeOverlay.x = 1540;
  aeOverlay.fills = solid(0,0,0,0.5);
  aeOverlay.layoutMode = "HORIZONTAL";
  aeOverlay.primaryAxisAlignItems = "CENTER"; aeOverlay.counterAxisAlignItems = "CENTER";

  const aeModal = af("Modal","VERTICAL",0);
  aeModal.resize(860, 830); aeModal.layoutSizingVertical = "FIXED";
  aeModal.cornerRadius = 16; aeModal.fills = solid(255,255,255);
  aeModal.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:16}, radius:48, spread:0, visible:true }];
  aeModal.clipsContent = true;

  // Header
  const aeHeader = af("Header","HORIZONTAL",0);
  aeHeader.layoutSizingHorizontal = "FILL"; aeHeader.counterAxisAlignItems = "CENTER";
  aeHeader.paddingLeft = 24; aeHeader.paddingRight = 24; aeHeader.paddingTop = 24; aeHeader.paddingBottom = 20;
  aeHeader.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; aeHeader.strokeWeight = 1; aeHeader.strokeAlign = "INSIDE";
  const aeHL = af("HL","VERTICAL",4); aeHL.layoutSizingHorizontal = "FILL";
  aeHL.appendChild(txt("Créer un événement", 22, "Bold", hex(17,24,39)));
  aeHL.appendChild(txt("Remplissez les informations de votre événement", 13, "Regular", hex(107,114,128)));
  aeHeader.appendChild(aeHL);
  const closeBtn2 = figma.createFrame(); closeBtn2.name = "X"; closeBtn2.resize(36,36); closeBtn2.cornerRadius = 12;
  closeBtn2.fills = solid(243,244,246); closeBtn2.layoutMode = "HORIZONTAL";
  closeBtn2.primaryAxisAlignItems = "CENTER"; closeBtn2.counterAxisAlignItems = "CENTER";
  closeBtn2.appendChild(txt("✕", 16, "Regular", hex(107,114,128)));
  aeHeader.appendChild(closeBtn2);
  aeModal.appendChild(aeHeader);

  // Form
  const aeForm = af("Form","VERTICAL",20);
  aeForm.layoutSizingHorizontal = "FILL"; aeForm.layoutSizingVertical = "FILL";
  aeForm.paddingLeft = 24; aeForm.paddingRight = 24; aeForm.paddingTop = 24; aeForm.paddingBottom = 16;

  function makeField2(label, placeholder, req) {
    const g = af("F-"+label, "VERTICAL", 6); g.layoutSizingHorizontal = "FILL";
    const lbl = af("Lbl","HORIZONTAL",4); lbl.counterAxisAlignItems = "CENTER";
    lbl.appendChild(txt(label, 13, "Medium", hex(55,65,81)));
    if (req) lbl.appendChild(txt("*", 13, "Bold", hex(239,68,68)));
    g.appendChild(lbl);
    const inp = af("Inp","HORIZONTAL",0); inp.layoutSizingHorizontal = "FILL";
    inp.paddingLeft = 16; inp.paddingRight = 16; inp.paddingTop = 10; inp.paddingBottom = 10;
    inp.cornerRadius = 12; inp.fills = solid(255,255,255);
    inp.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; inp.strokeWeight = 2;
    inp.appendChild(txt(placeholder, 14, "Regular", hex(156,163,175)));
    g.appendChild(inp);
    return g;
  }

  // Section title
  aeForm.appendChild(txt("Informations générales", 16, "Semi Bold", hex(17,24,39)));
  aeForm.appendChild(makeField2("Nom de l'événement", "Nom de l'événement", true));

  // Description
  const descF = af("F-Desc","VERTICAL",6); descF.layoutSizingHorizontal = "FILL";
  descF.appendChild(txt("Description", 13, "Medium", hex(55,65,81)));
  const descInp = af("TA","HORIZONTAL",0); descInp.layoutSizingHorizontal = "FILL";
  descInp.paddingLeft = 16; descInp.paddingRight = 16; descInp.paddingTop = 10; descInp.paddingBottom = 40;
  descInp.cornerRadius = 12; descInp.fills = solid(255,255,255);
  descInp.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; descInp.strokeWeight = 2;
  descInp.appendChild(txt("Description de l'événement...", 14, "Regular", hex(156,163,175)));
  descF.appendChild(descInp);
  aeForm.appendChild(descF);

  // Row: Category + Type
  const er1 = af("R","HORIZONTAL",16); er1.layoutSizingHorizontal = "FILL";
  er1.appendChild(makeField2("Catégorie", "Conférence"));
  er1.appendChild(makeField2("Type", "Présentiel"));
  aeForm.appendChild(er1);

  // Row: Dates
  const er2 = af("R","HORIZONTAL",16); er2.layoutSizingHorizontal = "FILL";
  er2.appendChild(makeField2("Date de début", "15/06/2025 09:00"));
  er2.appendChild(makeField2("Date de fin", "15/06/2025 18:00"));
  aeForm.appendChild(er2);

  // Lieu
  aeForm.appendChild(makeField2("Lieu", "Paris, France"));

  // Image upload zone
  const uploadZone = af("Upload","VERTICAL",8);
  uploadZone.layoutSizingHorizontal = "FILL";
  uploadZone.paddingLeft = 24; uploadZone.paddingRight = 24; uploadZone.paddingTop = 24; uploadZone.paddingBottom = 24;
  uploadZone.counterAxisAlignItems = "CENTER"; uploadZone.primaryAxisAlignItems = "CENTER";
  uploadZone.cornerRadius = 12;
  uploadZone.strokes = [{ type: "SOLID", color: hex(209,213,219) }]; uploadZone.strokeWeight = 2;
  uploadZone.dashPattern = [8, 4];
  uploadZone.fills = solid(249,250,251);
  const upIc = figma.createFrame(); upIc.name = "UpIc"; upIc.resize(32,32); upIc.cornerRadius = 8;
  upIc.fills = solid(209,213,219,0.5); upIc.layoutSizingHorizontal = "FIXED"; upIc.layoutSizingVertical = "FIXED";
  uploadZone.appendChild(upIc);
  uploadZone.appendChild(txt("Glissez une image ou cliquez", 13, "Medium", hex(107,114,128)));
  uploadZone.appendChild(txt("PNG, JPG jusqu'à 5MB", 11, "Regular", hex(156,163,175)));
  aeForm.appendChild(uploadZone);

  // Section: Objectifs
  aeForm.appendChild(txt("Objectifs et public", 16, "Semi Bold", hex(17,24,39)));

  // Target participants
  aeForm.appendChild(makeField2("Nombre cible de participants", "200"));

  // Objective toggles
  const objLabel = af("ObjL","VERTICAL",8); objLabel.layoutSizingHorizontal = "FILL";
  objLabel.appendChild(txt("Objectifs secondaires", 13, "Medium", hex(55,65,81)));
  const objGrid = af("ObjGrid","HORIZONTAL",8);
  objGrid.layoutSizingHorizontal = "FILL";
  const objs = ["Leads","Partenaires","Ventes","Visibilité","Networking","Formation"];
  for (let i = 0; i < objs.length; i++) {
    const ob = af("Obj","HORIZONTAL",0);
    ob.paddingLeft = 14; ob.paddingRight = 14; ob.paddingTop = 8; ob.paddingBottom = 8;
    ob.cornerRadius = 12;
    if (i < 2) { ob.fills = solid(37,99,235); ob.appendChild(txt(objs[i], 12, "Semi Bold", hex(255,255,255))); }
    else { ob.fills = solid(243,244,246); ob.appendChild(txt(objs[i], 12, "Semi Bold", hex(75,85,99))); }
    objGrid.appendChild(ob);
  }
  objLabel.appendChild(objGrid);
  aeForm.appendChild(objLabel);

  aeModal.appendChild(aeForm);

  // Footer
  const aeFooter = af("Footer","HORIZONTAL",12);
  aeFooter.layoutSizingHorizontal = "FILL"; aeFooter.counterAxisAlignItems = "CENTER";
  aeFooter.paddingLeft = 24; aeFooter.paddingRight = 24; aeFooter.paddingTop = 16; aeFooter.paddingBottom = 16;
  aeFooter.fills = solid(249,250,251);
  aeFooter.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; aeFooter.strokeWeight = 1; aeFooter.strokeAlign = "INSIDE";
  const efSp = figma.createFrame(); efSp.name = "sp"; efSp.resize(1,1); efSp.fills = [];
  efSp.layoutSizingHorizontal = "FILL"; aeFooter.appendChild(efSp);
  const can2 = af("Cancel","HORIZONTAL",0);
  can2.paddingLeft = 24; can2.paddingRight = 24; can2.paddingTop = 12; can2.paddingBottom = 12;
  can2.cornerRadius = 12; can2.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; can2.strokeWeight = 2;
  can2.fills = solid(255,255,255);
  can2.appendChild(txt("Annuler", 14, "Medium", hex(55,65,81)));
  aeFooter.appendChild(can2);
  const sub2 = af("Submit","HORIZONTAL",8);
  sub2.paddingLeft = 24; sub2.paddingRight = 24; sub2.paddingTop = 12; sub2.paddingBottom = 12;
  sub2.cornerRadius = 12; sub2.counterAxisAlignItems = "CENTER";
  sub2.fills = solid(37,99,235);
  sub2.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:37/255,g:99/255,b:235/255,a:0.3}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }];
  const sIc = figma.createFrame(); sIc.name = "Ic"; sIc.resize(16,16); sIc.cornerRadius = 3;
  sIc.fills = solid(255,255,255,0.5); sIc.layoutSizingHorizontal = "FIXED"; sIc.layoutSizingVertical = "FIXED";
  sub2.appendChild(sIc);
  sub2.appendChild(txt("Créer l'événement", 14, "Semi Bold", hex(255,255,255)));
  aeFooter.appendChild(sub2);
  aeModal.appendChild(aeFooter);

  aeOverlay.appendChild(aeModal);
  page.appendChild(aeOverlay);

  // =============================================================
  //  C) SCAN CONTACT MODAL
  // =============================================================
  const scOverlay = figma.createFrame();
  scOverlay.name = "ScanContact Modal"; scOverlay.resize(1440, 900);
  scOverlay.x = 3080;
  scOverlay.fills = solid(0,0,0,0.5);
  scOverlay.layoutMode = "HORIZONTAL";
  scOverlay.primaryAxisAlignItems = "CENTER"; scOverlay.counterAxisAlignItems = "CENTER";

  const scModal = af("Modal","VERTICAL",0);
  scModal.resize(640, 780); scModal.layoutSizingVertical = "FIXED";
  scModal.cornerRadius = 24; scModal.fills = solid(255,255,255);
  scModal.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:16}, radius:48, spread:0, visible:true }];
  scModal.clipsContent = true;

  // Header
  const scHeader = af("Header","HORIZONTAL",0);
  scHeader.layoutSizingHorizontal = "FILL"; scHeader.counterAxisAlignItems = "CENTER";
  scHeader.paddingLeft = 24; scHeader.paddingRight = 24; scHeader.paddingTop = 20; scHeader.paddingBottom = 16;
  scHeader.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; scHeader.strokeWeight = 1; scHeader.strokeAlign = "INSIDE";
  const scHL = af("HL","VERTICAL",4); scHL.layoutSizingHorizontal = "FILL";
  scHL.appendChild(txt("Scanner une carte de visite", 18, "Bold", hex(17,24,39)));
  scHL.appendChild(txt("Face avant", 13, "Regular", hex(107,114,128)));
  scHeader.appendChild(scHL);
  const closeBtn3 = figma.createFrame(); closeBtn3.name = "X"; closeBtn3.resize(36,36); closeBtn3.cornerRadius = 18;
  closeBtn3.fills = solid(243,244,246); closeBtn3.layoutMode = "HORIZONTAL";
  closeBtn3.primaryAxisAlignItems = "CENTER"; closeBtn3.counterAxisAlignItems = "CENTER";
  closeBtn3.appendChild(txt("✕", 16, "Regular", hex(107,114,128)));
  scHeader.appendChild(closeBtn3);
  scModal.appendChild(scHeader);

  // Camera preview area
  const camArea = figma.createFrame();
  camArea.name = "CamPreview"; camArea.resize(592, 280);
  camArea.layoutSizingHorizontal = "FILL";
  camArea.fills = solid(17,24,39); camArea.cornerRadius = 16;
  // Guide box overlay
  const guideBox = figma.createFrame(); guideBox.name = "Guide"; guideBox.resize(340, 200);
  guideBox.cornerRadius = 12;
  guideBox.strokes = [{ type: "SOLID", color: hex(255,255,255) }]; guideBox.strokeWeight = 2; guideBox.strokeAlign = "INSIDE";
  guideBox.fills = solid(255,255,255,0.05);
  guideBox.x = 126; guideBox.y = 40;
  camArea.appendChild(guideBox);
  // Center the camera frame
  const camFrame = af("CamF","HORIZONTAL",0);
  camFrame.layoutSizingHorizontal = "FILL";
  camFrame.paddingLeft = 24; camFrame.paddingRight = 24; camFrame.paddingTop = 16; camFrame.paddingBottom = 16;
  camFrame.appendChild(camArea);
  scModal.appendChild(camFrame);

  // Action buttons
  const scActions = af("Actions","HORIZONTAL",12);
  scActions.layoutSizingHorizontal = "FILL"; scActions.primaryAxisAlignItems = "CENTER";
  scActions.paddingLeft = 24; scActions.paddingRight = 24; scActions.paddingBottom = 20;

  const uploadBtn = af("Upload","HORIZONTAL",6);
  uploadBtn.paddingLeft = 16; uploadBtn.paddingRight = 16; uploadBtn.paddingTop = 10; uploadBtn.paddingBottom = 10;
  uploadBtn.cornerRadius = 12; uploadBtn.counterAxisAlignItems = "CENTER";
  uploadBtn.strokes = [{ type: "SOLID", color: hex(209,213,219) }]; uploadBtn.strokeWeight = 1;
  uploadBtn.fills = solid(255,255,255);
  const upIc2 = figma.createFrame(); upIc2.name = "Ic"; upIc2.resize(16,16); upIc2.cornerRadius = 3;
  upIc2.fills = solid(107,114,128,0.4); upIc2.layoutSizingHorizontal = "FIXED"; upIc2.layoutSizingVertical = "FIXED";
  uploadBtn.appendChild(upIc2);
  uploadBtn.appendChild(txt("Importer", 13, "Medium", hex(55,65,81)));
  scActions.appendChild(uploadBtn);

  const captureBtn = af("Capture","HORIZONTAL",6);
  captureBtn.paddingLeft = 24; captureBtn.paddingRight = 24; captureBtn.paddingTop = 12; captureBtn.paddingBottom = 12;
  captureBtn.cornerRadius = 12; captureBtn.counterAxisAlignItems = "CENTER";
  captureBtn.fills = solid(14,58,93);
  const camIc = figma.createFrame(); camIc.name = "Ic"; camIc.resize(16,16); camIc.cornerRadius = 3;
  camIc.fills = solid(255,255,255,0.5); camIc.layoutSizingHorizontal = "FIXED"; camIc.layoutSizingVertical = "FIXED";
  captureBtn.appendChild(camIc);
  captureBtn.appendChild(txt("Capturer", 14, "Semi Bold", hex(255,255,255)));
  scActions.appendChild(captureBtn);

  scModal.appendChild(scActions);

  // Divider + instructions
  const instrArea = af("Instr","VERTICAL",8);
  instrArea.layoutSizingHorizontal = "FILL"; instrArea.counterAxisAlignItems = "CENTER";
  instrArea.paddingLeft = 24; instrArea.paddingRight = 24; instrArea.paddingTop = 16; instrArea.paddingBottom = 16;
  instrArea.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; instrArea.strokeWeight = 1; instrArea.strokeAlign = "INSIDE";
  instrArea.appendChild(txt("Placez la carte de visite dans le cadre", 14, "Medium", hex(107,114,128)));
  instrArea.appendChild(txt("L'IA extraira automatiquement les informations", 12, "Regular", hex(156,163,175)));
  scModal.appendChild(instrArea);

  scOverlay.appendChild(scModal);
  page.appendChild(scOverlay);

  // =============================================================
  //  D) EVENT QR CODE MODAL
  // =============================================================
  const qrOverlay = figma.createFrame();
  qrOverlay.name = "EventQRCode Modal"; qrOverlay.resize(1440, 900);
  qrOverlay.x = 4620;
  qrOverlay.fills = solid(0,0,0,0.5);
  qrOverlay.layoutMode = "HORIZONTAL";
  qrOverlay.primaryAxisAlignItems = "CENTER"; qrOverlay.counterAxisAlignItems = "CENTER";

  const qrModal = af("Modal","VERTICAL",0);
  qrModal.resize(448, 620);
  qrModal.cornerRadius = 24; qrModal.fills = solid(255,255,255);
  qrModal.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color:{r:0,g:0,b:0,a:0.2}, offset:{x:0,y:16}, radius:48, spread:0, visible:true }];
  qrModal.paddingLeft = 32; qrModal.paddingRight = 32; qrModal.paddingTop = 28; qrModal.paddingBottom = 28;
  qrModal.itemSpacing = 16;

  // Header row
  const qrHeader = af("Header","HORIZONTAL",12);
  qrHeader.layoutSizingHorizontal = "FILL"; qrHeader.counterAxisAlignItems = "CENTER";
  const qrIconBg = figma.createFrame(); qrIconBg.name = "QRIc"; qrIconBg.resize(40,40); qrIconBg.cornerRadius = 12;
  qrIconBg.fills = solid(243,232,255); // purple-100
  qrIconBg.layoutMode = "HORIZONTAL"; qrIconBg.primaryAxisAlignItems = "CENTER"; qrIconBg.counterAxisAlignItems = "CENTER";
  const qrIcInner = figma.createFrame(); qrIcInner.name = "Ic"; qrIcInner.resize(20,20); qrIcInner.cornerRadius = 4;
  qrIcInner.fills = solid(147,51,234); // purple-600
  qrIcInner.layoutSizingHorizontal = "FIXED"; qrIcInner.layoutSizingVertical = "FIXED";
  qrIconBg.appendChild(qrIcInner);
  qrHeader.appendChild(qrIconBg);
  qrHeader.appendChild(txt("QR Code", 18, "Bold", hex(17,24,39)));
  const qrSp = figma.createFrame(); qrSp.name = "sp"; qrSp.resize(1,1); qrSp.fills = [];
  qrSp.layoutSizingHorizontal = "FILL"; qrHeader.appendChild(qrSp);
  const closeBtn4 = figma.createFrame(); closeBtn4.name = "X"; closeBtn4.resize(36,36); closeBtn4.cornerRadius = 18;
  closeBtn4.fills = solid(243,244,246); closeBtn4.layoutMode = "HORIZONTAL";
  closeBtn4.primaryAxisAlignItems = "CENTER"; closeBtn4.counterAxisAlignItems = "CENTER";
  closeBtn4.appendChild(txt("✕", 16, "Regular", hex(107,114,128)));
  qrHeader.appendChild(closeBtn4);
  qrModal.appendChild(qrHeader);

  // Description
  qrModal.appendChild(txt("Partagez ce QR code pour permettre\naux participants de s'inscrire.", 14, "Regular", hex(107,114,128)));

  // QR Code area
  const qrArea = figma.createFrame();
  qrArea.name = "QR Area"; qrArea.resize(384, 280);
  qrArea.layoutSizingHorizontal = "FILL"; qrArea.cornerRadius = 16;
  qrArea.fills = solid(255,255,255);
  qrArea.strokes = [{ type: "SOLID", color: hex(243,244,246) }]; qrArea.strokeWeight = 1;
  qrArea.layoutMode = "HORIZONTAL"; qrArea.primaryAxisAlignItems = "CENTER"; qrArea.counterAxisAlignItems = "CENTER";
  // QR placeholder
  const qrPlaceholder = figma.createFrame();
  qrPlaceholder.name = "QRCode"; qrPlaceholder.resize(200, 200); qrPlaceholder.cornerRadius = 8;
  qrPlaceholder.fills = solid(17,24,39);
  // QR pattern (simplified grid)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 3 !== 0) {
        const px = figma.createFrame(); px.name = "px"; px.resize(20,20);
        px.fills = solid(255,255,255); px.x = 10 + x * 22; px.y = 10 + y * 22;
        qrPlaceholder.appendChild(px);
      }
    }
  }
  qrArea.appendChild(qrPlaceholder);
  qrModal.appendChild(qrArea);

  // URL copy
  const urlRow = af("URL","HORIZONTAL",8);
  urlRow.layoutSizingHorizontal = "FILL"; urlRow.counterAxisAlignItems = "CENTER";
  urlRow.paddingLeft = 12; urlRow.paddingRight = 12; urlRow.paddingTop = 12; urlRow.paddingBottom = 12;
  urlRow.cornerRadius = 12; urlRow.fills = solid(249,250,251);
  const urlTxt = txt("https://scanetwork.app/join/abc123", 12, "Regular", hex(107,114,128));
  urlTxt.layoutSizingHorizontal = "FILL"; urlTxt.textTruncation = "ENDING";
  urlRow.appendChild(urlTxt);
  const copyBtn = af("Copy","HORIZONTAL",4);
  copyBtn.paddingLeft = 12; copyBtn.paddingRight = 12; copyBtn.paddingTop = 6; copyBtn.paddingBottom = 6;
  copyBtn.cornerRadius = 8; copyBtn.counterAxisAlignItems = "CENTER";
  copyBtn.fills = solid(255,255,255);
  copyBtn.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; copyBtn.strokeWeight = 1;
  const cpIc = figma.createFrame(); cpIc.name = "Ic"; cpIc.resize(14,14); cpIc.cornerRadius = 3;
  cpIc.fills = solid(107,114,128,0.4); cpIc.layoutSizingHorizontal = "FIXED"; cpIc.layoutSizingVertical = "FIXED";
  copyBtn.appendChild(cpIc);
  copyBtn.appendChild(txt("Copier", 12, "Medium", hex(55,65,81)));
  urlRow.appendChild(copyBtn);
  qrModal.appendChild(urlRow);

  // Download button
  const dlBtn = af("Download","HORIZONTAL",8);
  dlBtn.layoutSizingHorizontal = "FILL"; dlBtn.primaryAxisAlignItems = "CENTER"; dlBtn.counterAxisAlignItems = "CENTER";
  dlBtn.paddingTop = 12; dlBtn.paddingBottom = 12;
  dlBtn.cornerRadius = 12;
  dlBtn.fills = solid(14,58,93);
  const dlIc = figma.createFrame(); dlIc.name = "Ic"; dlIc.resize(16,16); dlIc.cornerRadius = 3;
  dlIc.fills = solid(255,255,255,0.5); dlIc.layoutSizingHorizontal = "FIXED"; dlIc.layoutSizingVertical = "FIXED";
  dlBtn.appendChild(dlIc);
  dlBtn.appendChild(txt("Télécharger le QR Code", 14, "Semi Bold", hex(255,255,255)));
  qrModal.appendChild(dlBtn);

  qrOverlay.appendChild(qrModal);
  page.appendChild(qrOverlay);

  figma.viewport.scrollAndZoomIntoView([acOverlay, aeOverlay, scOverlay, qrOverlay]);
  figma.notify("✅ 4 Modals created!");
})();
