// =============================================================
// SCRIPT 2/6 - ScaNetwork: Page Inscription (Desktop 1440x900)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Auth Flow" (même page que login, décalé à droite)
// =============================================================

(async () => {
  const page = figma.currentPage;

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  function hex(r, g, b) { return { r: r/255, g: g/255, b: b/255 }; }
  function solid(r, g, b, o) { return [{ type: "SOLID", color: hex(r,g,b), opacity: o !== undefined ? o : 1 }]; }
  function txt(str, size, style, color, lh) {
    const t = figma.createText();
    t.characters = str; t.fontSize = size;
    t.fontName = { family: "Inter", style: style || "Regular" };
    t.fills = [{ type: "SOLID", color: color || hex(0,0,0) }];
    if (lh) t.lineHeight = { value: lh, unit: "PIXELS" };
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    return t;
  }
  function autoFrame(name, dir, spacing) {
    const f = figma.createFrame(); f.name = name;
    f.layoutMode = dir || "VERTICAL"; f.itemSpacing = spacing || 0;
    f.fills = []; f.layoutSizingHorizontal = "HUG"; f.layoutSizingVertical = "HUG";
    return f;
  }
  function inputField(placeholder, iconChar, hasRightIcon) {
    const row = autoFrame("Input " + placeholder, "HORIZONTAL", 0);
    row.cornerRadius = 12; row.fills = solid(255,255,255);
    row.strokes = [{ type: "SOLID", color: hex(229,231,235) }]; row.strokeWeight = 1;
    row.paddingLeft = 12; row.paddingRight = 12; row.paddingTop = 12; row.paddingBottom = 12;
    row.counterAxisAlignItems = "CENTER"; row.layoutSizingHorizontal = "FILL";
    const icon = figma.createFrame(); icon.name = "Icon"; icon.resize(20,20); icon.cornerRadius = 4;
    icon.fills = solid(156,163,175,0.3); icon.layoutSizingHorizontal = "FIXED"; icon.layoutSizingVertical = "FIXED";
    row.appendChild(icon);
    const sp = figma.createFrame(); sp.name = "sp"; sp.resize(8,1); sp.fills = [];
    sp.layoutSizingHorizontal = "FIXED"; sp.layoutSizingVertical = "FIXED"; row.appendChild(sp);
    const label = txt(placeholder, 15, "Regular", hex(156,163,175));
    row.appendChild(label); label.layoutSizingHorizontal = "FILL";
    if (hasRightIcon) {
      const sp2 = figma.createFrame(); sp2.name = "sp2"; sp2.resize(8,1); sp2.fills = [];
      sp2.layoutSizingHorizontal = "FIXED"; sp2.layoutSizingVertical = "FIXED"; row.appendChild(sp2);
      const ri = figma.createFrame(); ri.name = "Eye"; ri.resize(20,20); ri.cornerRadius = 4;
      ri.fills = solid(156,163,175,0.3); ri.layoutSizingHorizontal = "FIXED"; ri.layoutSizingVertical = "FIXED";
      row.appendChild(ri);
    }
    return row;
  }
  function spacer(h) {
    const s = figma.createFrame(); s.name = "spacer"; s.resize(1,h); s.fills = [];
    s.layoutSizingHorizontal = "FILL"; return s;
  }

  // =============================================================
  // SIGNUP PAGE
  // =============================================================
  const frame = figma.createFrame();
  frame.name = "Signup - Desktop";
  frame.resize(1440, 900);
  frame.x = 1540; // next to login page
  frame.layoutMode = "HORIZONTAL";
  frame.fills = solid(248,250,252);

  // LEFT PANEL (same as login)
  const left = figma.createFrame();
  left.name = "Left - Branding";
  left.layoutMode = "VERTICAL"; left.resize(720, 900); left.layoutSizingVertical = "FIXED";
  left.primaryAxisAlignItems = "CENTER"; left.counterAxisAlignItems = "MIN";
  left.paddingLeft = 48; left.paddingRight = 48; left.paddingTop = 60; left.paddingBottom = 48;
  left.itemSpacing = 28;
  left.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]]
  }];

  left.appendChild(txt("ScaNetwork", 28, "Bold", hex(255,255,255)));
  left.appendChild(txt("Transformez vos rencontres\nen opportunités", 40, "Bold", hex(255,255,255), 50));
  left.appendChild(txt("La plateforme de networking qui centralise\nvos contacts professionnels et automatise\nvos suivis commerciaux.", 18, "Regular", hex(191,217,237), 28));

  const statsRow = autoFrame("Stats", "HORIZONTAL", 20);
  statsRow.counterAxisAlignItems = "CENTER";
  for (const s of [{v:"+150%",l:"Conversions"},{v:"10k+",l:"Utilisateurs"},{v:"98%",l:"Satisfaction"}]) {
    const c = autoFrame("Stat " + s.l, "VERTICAL", 4);
    c.paddingLeft = 20; c.paddingRight = 20; c.paddingTop = 16; c.paddingBottom = 16;
    c.cornerRadius = 16; c.fills = solid(255,255,255,0.1);
    c.appendChild(txt(s.v, 30, "Bold", hex(255,255,255)));
    c.appendChild(txt(s.l, 13, "Regular", hex(191,217,237)));
    statsRow.appendChild(c);
  }
  left.appendChild(statsRow);

  const testimonial = autoFrame("Testimonial", "VERTICAL", 16);
  testimonial.paddingLeft = 24; testimonial.paddingRight = 24; testimonial.paddingTop = 24; testimonial.paddingBottom = 24;
  testimonial.cornerRadius = 16; testimonial.fills = solid(255,255,255,0.1);
  testimonial.appendChild(txt("\"Scanetwork a révolutionné ma façon de\ngérer mes contacts. Je n'oublie plus jamais\nde relancer un prospect !\"", 15, "Regular", hex(220,233,243), 24));
  const ar = autoFrame("Author", "HORIZONTAL", 12); ar.counterAxisAlignItems = "CENTER";
  const av = figma.createFrame(); av.name = "Avatar"; av.resize(40,40); av.cornerRadius = 20;
  av.fills = solid(255,255,255,0.2); av.layoutMode = "HORIZONTAL";
  av.primaryAxisAlignItems = "CENTER"; av.counterAxisAlignItems = "CENTER";
  av.appendChild(txt("M", 16, "Bold", hex(255,255,255))); ar.appendChild(av);
  const ai = autoFrame("Info", "VERTICAL", 2);
  ai.appendChild(txt("Marie Dupont", 14, "Semi Bold", hex(255,255,255)));
  ai.appendChild(txt("Directrice Commerciale", 12, "Regular", hex(165,199,230)));
  ar.appendChild(ai); testimonial.appendChild(ar);
  left.appendChild(testimonial); testimonial.layoutSizingHorizontal = "FILL";
  frame.appendChild(left);

  // RIGHT PANEL - Signup Form
  const right = figma.createFrame();
  right.name = "Right - Signup Form";
  right.layoutMode = "VERTICAL"; right.resize(720, 900); right.layoutSizingVertical = "FIXED";
  right.primaryAxisAlignItems = "CENTER"; right.counterAxisAlignItems = "CENTER";
  right.paddingLeft = 32; right.paddingRight = 32;
  right.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 248/255, g: 250/255, b: 252/255, a: 1 } },
      { position: 0.5, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } },
      { position: 1, color: { r: 240/255, g: 253/255, b: 250/255, a: 1 } }
    ],
    gradientTransform: [[0.7,0.7,0],[-0.7,0.7,0.3]]
  }];

  const card = autoFrame("Signup Card", "VERTICAL", 0);
  card.resize(420, 10); card.cornerRadius = 24; card.fills = solid(255,255,255);
  card.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r:0,g:0,b:0,a:0.08 }, offset:{x:0,y:8}, radius:32, spread:0, visible:true },
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r:0,g:0,b:0,a:0.04 }, offset:{x:0,y:2}, radius:8, spread:0, visible:true }
  ];
  card.paddingLeft = 32; card.paddingRight = 32; card.paddingTop = 32; card.paddingBottom = 32;
  card.itemSpacing = 8; card.layoutSizingVertical = "HUG"; card.layoutSizingHorizontal = "FIXED";

  // Logo
  const logoBox = figma.createFrame(); logoBox.name = "Logo"; logoBox.resize(200,56);
  logoBox.cornerRadius = 8; logoBox.fills = solid(14,58,93,0.08);
  logoBox.layoutMode = "HORIZONTAL"; logoBox.primaryAxisAlignItems = "CENTER"; logoBox.counterAxisAlignItems = "CENTER";
  logoBox.appendChild(txt("ScaNetwork", 22, "Bold", hex(14,58,93)));
  const lr = autoFrame("LogoRow", "HORIZONTAL", 0);
  lr.primaryAxisAlignItems = "CENTER"; lr.counterAxisAlignItems = "CENTER"; lr.layoutSizingHorizontal = "FILL";
  lr.appendChild(logoBox); card.appendChild(lr);

  card.appendChild(spacer(12));

  // Title
  const tr = autoFrame("Title", "VERTICAL", 8);
  tr.counterAxisAlignItems = "CENTER"; tr.layoutSizingHorizontal = "FILL";
  tr.appendChild(txt("Créer un compte", 28, "Bold", hex(31,41,55)));
  tr.appendChild(txt("Commencez à gérer votre réseau professionnel", 14, "Regular", hex(107,114,128)));
  card.appendChild(tr);

  card.appendChild(spacer(16));

  // Form
  const form = autoFrame("Form", "VERTICAL", 14);
  form.layoutSizingHorizontal = "FILL";

  // Name
  const nameSection = autoFrame("Name Section", "VERTICAL", 8);
  nameSection.layoutSizingHorizontal = "FILL";
  nameSection.appendChild(txt("Nom complet", 14, "Medium", hex(55,65,81)));
  nameSection.appendChild(inputField("Jean Dupont", "User", false));
  form.appendChild(nameSection);

  // Email
  const emailSection = autoFrame("Email Section", "VERTICAL", 8);
  emailSection.layoutSizingHorizontal = "FILL";
  emailSection.appendChild(txt("Email", 14, "Medium", hex(55,65,81)));
  emailSection.appendChild(inputField("vous@exemple.com", "Mail", false));
  form.appendChild(emailSection);

  // Password
  const passSection = autoFrame("Password Section", "VERTICAL", 8);
  passSection.layoutSizingHorizontal = "FILL";
  passSection.appendChild(txt("Mot de passe", 14, "Medium", hex(55,65,81)));
  passSection.appendChild(inputField("••••••••", "Lock", true));
  form.appendChild(passSection);

  // Password Strength Bar
  const strengthRow = autoFrame("Strength", "HORIZONTAL", 8);
  strengthRow.layoutSizingHorizontal = "FILL"; strengthRow.counterAxisAlignItems = "CENTER";
  const bar = figma.createFrame(); bar.name = "StrengthBar"; bar.resize(300,6); bar.cornerRadius = 3;
  bar.fills = solid(229,231,235);
  const barFill = figma.createFrame(); barFill.name = "Fill"; barFill.resize(180,6);
  barFill.cornerRadius = 3; barFill.fills = solid(59,130,246);
  barFill.x = 0; barFill.y = 0;
  bar.appendChild(barFill);
  strengthRow.appendChild(bar); bar.layoutSizingHorizontal = "FILL";
  strengthRow.appendChild(txt("Bon", 12, "Medium", hex(59,130,246)));
  form.appendChild(strengthRow);

  // Password criteria
  const criteria = autoFrame("Criteria", "HORIZONTAL", 12);
  criteria.layoutSizingHorizontal = "FILL";
  criteria.appendChild(txt("✓ 8+ caractères", 11, "Regular", hex(34,197,94)));
  criteria.appendChild(txt("✓ Majuscule", 11, "Regular", hex(34,197,94)));
  criteria.appendChild(txt("○ Chiffre", 11, "Regular", hex(107,114,128)));
  form.appendChild(criteria);

  // Submit button
  const btn = autoFrame("Submit", "HORIZONTAL", 8);
  btn.layoutSizingHorizontal = "FILL"; btn.primaryAxisAlignItems = "CENTER"; btn.counterAxisAlignItems = "CENTER";
  btn.paddingTop = 14; btn.paddingBottom = 14; btn.cornerRadius = 12;
  btn.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  btn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: { r:59/255,g:130/255,b:246/255,a:0.2 }, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  btn.appendChild(txt("S'inscrire", 15, "Medium", hex(255,255,255)));
  form.appendChild(btn);

  card.appendChild(form);
  card.appendChild(spacer(12));

  const toggleRow = autoFrame("Toggle", "HORIZONTAL", 0);
  toggleRow.layoutSizingHorizontal = "FILL"; toggleRow.primaryAxisAlignItems = "CENTER";
  toggleRow.appendChild(txt("Déjà un compte ? Connectez-vous", 14, "Medium", hex(14,58,93)));
  card.appendChild(toggleRow);

  card.appendChild(spacer(16));
  const termsRow = autoFrame("Terms", "HORIZONTAL", 0);
  termsRow.layoutSizingHorizontal = "FILL"; termsRow.primaryAxisAlignItems = "CENTER";
  const t = txt("En continuant, vous acceptez nos Conditions\nd'utilisation et notre Politique de confidentialité", 11, "Regular", hex(156,163,175), 16);
  t.textAlignHorizontal = "CENTER"; termsRow.appendChild(t);
  card.appendChild(termsRow);

  right.appendChild(card);
  frame.appendChild(right);
  page.appendChild(frame);

  // =============================================================
  // FORGOT PASSWORD PAGE
  // =============================================================
  const forgotFrame = figma.createFrame();
  forgotFrame.name = "Forgot Password - Desktop";
  forgotFrame.resize(1440, 900);
  forgotFrame.x = 3080;
  forgotFrame.layoutMode = "HORIZONTAL";
  forgotFrame.primaryAxisAlignItems = "CENTER";
  forgotFrame.counterAxisAlignItems = "CENTER";
  forgotFrame.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 248/255, g: 250/255, b: 252/255, a: 1 } },
      { position: 0.5, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } },
      { position: 1, color: { r: 240/255, g: 253/255, b: 250/255, a: 1 } }
    ],
    gradientTransform: [[0.7,0.7,0],[-0.7,0.7,0.3]]
  }];

  const forgotCard = autoFrame("Forgot Card", "VERTICAL", 0);
  forgotCard.resize(448, 10); forgotCard.cornerRadius = 24; forgotCard.fills = solid(255,255,255);
  forgotCard.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.08}, offset:{x:0,y:8}, radius:32, spread:0, visible:true },
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }
  ];
  forgotCard.paddingLeft = 32; forgotCard.paddingRight = 32; forgotCard.paddingTop = 32; forgotCard.paddingBottom = 32;
  forgotCard.itemSpacing = 8; forgotCard.layoutSizingVertical = "HUG"; forgotCard.layoutSizingHorizontal = "FIXED";

  // Logo
  const fLogo = figma.createFrame(); fLogo.name = "Logo"; fLogo.resize(200,56); fLogo.cornerRadius = 8;
  fLogo.fills = solid(14,58,93,0.08); fLogo.layoutMode = "HORIZONTAL";
  fLogo.primaryAxisAlignItems = "CENTER"; fLogo.counterAxisAlignItems = "CENTER";
  fLogo.appendChild(txt("ScaNetwork", 22, "Bold", hex(14,58,93)));
  const flr = autoFrame("LogoRow", "HORIZONTAL", 0); flr.primaryAxisAlignItems = "CENTER";
  flr.counterAxisAlignItems = "CENTER"; flr.layoutSizingHorizontal = "FILL";
  flr.appendChild(fLogo); forgotCard.appendChild(flr);

  forgotCard.appendChild(spacer(12));

  const fTitle = autoFrame("Title", "VERTICAL", 8);
  fTitle.counterAxisAlignItems = "CENTER"; fTitle.layoutSizingHorizontal = "FILL";
  fTitle.appendChild(txt("Mot de passe oublié ?", 28, "Bold", hex(31,41,55)));
  const fSub = txt("Entrez votre adresse email et nous vous\nenverrons un lien pour réinitialiser\nvotre mot de passe.", 14, "Regular", hex(107,114,128), 20);
  fSub.textAlignHorizontal = "CENTER"; fTitle.appendChild(fSub);
  forgotCard.appendChild(fTitle);

  forgotCard.appendChild(spacer(16));

  const fForm = autoFrame("Form", "VERTICAL", 16);
  fForm.layoutSizingHorizontal = "FILL";
  const fEmail = autoFrame("Email", "VERTICAL", 8); fEmail.layoutSizingHorizontal = "FILL";
  fEmail.appendChild(txt("Email", 14, "Medium", hex(55,65,81)));
  fEmail.appendChild(inputField("vous@exemple.com", "Mail", false));
  fForm.appendChild(fEmail);

  const fBtn = autoFrame("Submit", "HORIZONTAL", 8);
  fBtn.layoutSizingHorizontal = "FILL"; fBtn.primaryAxisAlignItems = "CENTER"; fBtn.counterAxisAlignItems = "CENTER";
  fBtn.paddingTop = 14; fBtn.paddingBottom = 14; fBtn.cornerRadius = 12;
  fBtn.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  fBtn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:59/255,g:130/255,b:246/255,a:0.2}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  fBtn.appendChild(txt("Envoyer le lien de réinitialisation", 15, "Medium", hex(255,255,255)));
  fForm.appendChild(fBtn);
  forgotCard.appendChild(fForm);

  forgotCard.appendChild(spacer(16));
  const backRow = autoFrame("Back", "HORIZONTAL", 8);
  backRow.layoutSizingHorizontal = "FILL"; backRow.primaryAxisAlignItems = "CENTER";
  backRow.counterAxisAlignItems = "CENTER";
  backRow.appendChild(txt("← Retour à la connexion", 14, "Medium", hex(14,58,93)));
  forgotCard.appendChild(backRow);

  forgotFrame.appendChild(forgotCard);
  page.appendChild(forgotFrame);

  // =============================================================
  // RESET PASSWORD PAGE
  // =============================================================
  const resetFrame = figma.createFrame();
  resetFrame.name = "Reset Password - Desktop";
  resetFrame.resize(1440, 900);
  resetFrame.x = 4620;
  resetFrame.layoutMode = "HORIZONTAL";
  resetFrame.primaryAxisAlignItems = "CENTER"; resetFrame.counterAxisAlignItems = "CENTER";
  resetFrame.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 248/255, g: 250/255, b: 252/255, a: 1 } },
      { position: 0.5, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } },
      { position: 1, color: { r: 240/255, g: 253/255, b: 250/255, a: 1 } }
    ],
    gradientTransform: [[0.7,0.7,0],[-0.7,0.7,0.3]]
  }];

  const resetCard = autoFrame("Reset Card", "VERTICAL", 0);
  resetCard.resize(448, 10); resetCard.cornerRadius = 24; resetCard.fills = solid(255,255,255);
  resetCard.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.08}, offset:{x:0,y:8}, radius:32, spread:0, visible:true },
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.04}, offset:{x:0,y:2}, radius:8, spread:0, visible:true }
  ];
  resetCard.paddingLeft = 32; resetCard.paddingRight = 32; resetCard.paddingTop = 32; resetCard.paddingBottom = 32;
  resetCard.itemSpacing = 8; resetCard.layoutSizingVertical = "HUG"; resetCard.layoutSizingHorizontal = "FIXED";

  const rLogo = figma.createFrame(); rLogo.name = "Logo"; rLogo.resize(200,56); rLogo.cornerRadius = 8;
  rLogo.fills = solid(14,58,93,0.08); rLogo.layoutMode = "HORIZONTAL";
  rLogo.primaryAxisAlignItems = "CENTER"; rLogo.counterAxisAlignItems = "CENTER";
  rLogo.appendChild(txt("ScaNetwork", 22, "Bold", hex(14,58,93)));
  const rlr = autoFrame("LogoRow", "HORIZONTAL", 0); rlr.primaryAxisAlignItems = "CENTER";
  rlr.counterAxisAlignItems = "CENTER"; rlr.layoutSizingHorizontal = "FILL";
  rlr.appendChild(rLogo); resetCard.appendChild(rlr);

  resetCard.appendChild(spacer(12));

  const rTitle = autoFrame("Title", "VERTICAL", 8);
  rTitle.counterAxisAlignItems = "CENTER"; rTitle.layoutSizingHorizontal = "FILL";
  rTitle.appendChild(txt("Nouveau mot de passe", 28, "Bold", hex(31,41,55)));
  const rSub = txt("Choisissez un nouveau mot de passe\nsécurisé pour votre compte.", 14, "Regular", hex(107,114,128), 20);
  rSub.textAlignHorizontal = "CENTER"; rTitle.appendChild(rSub);
  resetCard.appendChild(rTitle);

  resetCard.appendChild(spacer(16));

  const rForm = autoFrame("Form", "VERTICAL", 14);
  rForm.layoutSizingHorizontal = "FILL";

  const rPass = autoFrame("Password", "VERTICAL", 8); rPass.layoutSizingHorizontal = "FILL";
  rPass.appendChild(txt("Nouveau mot de passe", 14, "Medium", hex(55,65,81)));
  rPass.appendChild(inputField("••••••••", "Lock", true));
  rForm.appendChild(rPass);

  // Strength bar
  const rStr = autoFrame("Strength", "HORIZONTAL", 8);
  rStr.layoutSizingHorizontal = "FILL"; rStr.counterAxisAlignItems = "CENTER";
  const rBar = figma.createFrame(); rBar.name = "Bar"; rBar.resize(300,6); rBar.cornerRadius = 3;
  rBar.fills = solid(229,231,235);
  const rFill = figma.createFrame(); rFill.name = "Fill"; rFill.resize(240,6); rFill.cornerRadius = 3;
  rFill.fills = solid(34,197,94); rBar.appendChild(rFill);
  rStr.appendChild(rBar); rBar.layoutSizingHorizontal = "FILL";
  rStr.appendChild(txt("Excellent", 12, "Medium", hex(34,197,94)));
  rForm.appendChild(rStr);

  const rCriteria = autoFrame("Criteria", "HORIZONTAL", 12);
  rCriteria.layoutSizingHorizontal = "FILL";
  rCriteria.appendChild(txt("✓ 8+ caractères", 11, "Regular", hex(34,197,94)));
  rCriteria.appendChild(txt("✓ Majuscule", 11, "Regular", hex(34,197,94)));
  rCriteria.appendChild(txt("✓ Chiffre", 11, "Regular", hex(34,197,94)));
  rForm.appendChild(rCriteria);

  const rConfirm = autoFrame("Confirm", "VERTICAL", 8); rConfirm.layoutSizingHorizontal = "FILL";
  rConfirm.appendChild(txt("Confirmer le mot de passe", 14, "Medium", hex(55,65,81)));
  rConfirm.appendChild(inputField("••••••••", "Lock", true));
  rForm.appendChild(rConfirm);

  const rBtn = autoFrame("Submit", "HORIZONTAL", 8);
  rBtn.layoutSizingHorizontal = "FILL"; rBtn.primaryAxisAlignItems = "CENTER"; rBtn.counterAxisAlignItems = "CENTER";
  rBtn.paddingTop = 14; rBtn.paddingBottom = 14; rBtn.cornerRadius = 12;
  rBtn.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  rBtn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:59/255,g:130/255,b:246/255,a:0.2}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  rBtn.appendChild(txt("Réinitialiser le mot de passe", 15, "Medium", hex(255,255,255)));
  rForm.appendChild(rBtn);

  resetCard.appendChild(rForm);
  resetFrame.appendChild(resetCard);
  page.appendChild(resetFrame);

  // =============================================================
  // JOIN EVENT PAGE
  // =============================================================
  const joinFrame = figma.createFrame();
  joinFrame.name = "Join Event - Desktop";
  joinFrame.resize(1440, 900);
  joinFrame.x = 6160;
  joinFrame.layoutMode = "HORIZONTAL";
  joinFrame.primaryAxisAlignItems = "CENTER"; joinFrame.counterAxisAlignItems = "CENTER";
  joinFrame.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 248/255, g: 250/255, b: 252/255, a: 1 } },
      { position: 0.5, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } },
      { position: 1, color: { r: 240/255, g: 253/255, b: 250/255, a: 1 } }
    ],
    gradientTransform: [[0.7,0.7,0],[-0.7,0.7,0.3]]
  }];

  const joinCard = autoFrame("Join Event Card", "VERTICAL", 0);
  joinCard.resize(520, 10); joinCard.cornerRadius = 24; joinCard.fills = solid(255,255,255);
  joinCard.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:0,g:0,b:0,a:0.08}, offset:{x:0,y:8}, radius:32, spread:0, visible:true }
  ];
  joinCard.layoutSizingVertical = "HUG"; joinCard.layoutSizingHorizontal = "FIXED";
  joinCard.clipsContent = true;

  // Event Header (blue gradient)
  const evHeader = figma.createFrame();
  evHeader.name = "Event Header";
  evHeader.layoutMode = "VERTICAL";
  evHeader.resize(520, 10);
  evHeader.layoutSizingHorizontal = "FILL"; evHeader.layoutSizingVertical = "HUG";
  evHeader.paddingLeft = 24; evHeader.paddingRight = 24; evHeader.paddingTop = 24; evHeader.paddingBottom = 24;
  evHeader.itemSpacing = 8;
  evHeader.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  evHeader.appendChild(txt("Salon du Networking Paris 2026", 22, "Bold", hex(255,255,255)));
  evHeader.appendChild(txt("Rencontrez les meilleurs professionnels du secteur", 14, "Regular", hex(191,217,237)));

  const evMeta = autoFrame("Meta", "HORIZONTAL", 16);
  evMeta.appendChild(txt("📅 15 Avril 2026", 13, "Regular", hex(255,255,255)));
  evMeta.appendChild(txt("📍 Paris, France", 13, "Regular", hex(255,255,255)));
  evHeader.appendChild(evMeta);
  joinCard.appendChild(evHeader);

  // Form body
  const evBody = autoFrame("Form Body", "VERTICAL", 14);
  evBody.layoutSizingHorizontal = "FILL";
  evBody.paddingLeft = 24; evBody.paddingRight = 24; evBody.paddingTop = 24; evBody.paddingBottom = 24;

  evBody.appendChild(txt("Inscrivez-vous à cet événement", 18, "Semi Bold", hex(31,41,55)));
  evBody.appendChild(spacer(4));

  // 2 column name
  const nameRow = autoFrame("Names", "HORIZONTAL", 12);
  nameRow.layoutSizingHorizontal = "FILL";
  const fnSection = autoFrame("FirstName", "VERTICAL", 6); fnSection.layoutSizingHorizontal = "FILL";
  fnSection.appendChild(txt("Prénom *", 13, "Medium", hex(55,65,81)));
  fnSection.appendChild(inputField("Jean", "User", false));
  const lnSection = autoFrame("LastName", "VERTICAL", 6); lnSection.layoutSizingHorizontal = "FILL";
  lnSection.appendChild(txt("Nom *", 13, "Medium", hex(55,65,81)));
  lnSection.appendChild(inputField("Dupont", "User", false));
  nameRow.appendChild(fnSection); nameRow.appendChild(lnSection);
  evBody.appendChild(nameRow);

  const evEmail = autoFrame("Email", "VERTICAL", 6); evEmail.layoutSizingHorizontal = "FILL";
  evEmail.appendChild(txt("Email *", 13, "Medium", hex(55,65,81)));
  evEmail.appendChild(inputField("vous@exemple.com", "Mail", false));
  evBody.appendChild(evEmail);

  const evPhone = autoFrame("Phone", "VERTICAL", 6); evPhone.layoutSizingHorizontal = "FILL";
  evPhone.appendChild(txt("Téléphone", 13, "Medium", hex(55,65,81)));
  evPhone.appendChild(inputField("+33 6 12 34 56 78", "Phone", false));
  evBody.appendChild(evPhone);

  const evCompany = autoFrame("Company", "VERTICAL", 6); evCompany.layoutSizingHorizontal = "FILL";
  evCompany.appendChild(txt("Entreprise", 13, "Medium", hex(55,65,81)));
  evCompany.appendChild(inputField("Nom de l'entreprise", "Building", false));
  evBody.appendChild(evCompany);

  const evJob = autoFrame("Job", "VERTICAL", 6); evJob.layoutSizingHorizontal = "FILL";
  evJob.appendChild(txt("Poste", 13, "Medium", hex(55,65,81)));
  evJob.appendChild(inputField("Votre poste", "Briefcase", false));
  evBody.appendChild(evJob);

  const evBtn = autoFrame("Submit", "HORIZONTAL", 8);
  evBtn.layoutSizingHorizontal = "FILL"; evBtn.primaryAxisAlignItems = "CENTER"; evBtn.counterAxisAlignItems = "CENTER";
  evBtn.paddingTop = 14; evBtn.paddingBottom = 14; evBtn.cornerRadius = 12;
  evBtn.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1,0,0],[0,1,0]]
  }];
  evBtn.effects = [{ type: "DROP_SHADOW", blendMode: "NORMAL", color: {r:59/255,g:130/255,b:246/255,a:0.2}, offset:{x:0,y:4}, radius:12, spread:0, visible:true }];
  evBtn.appendChild(txt("S'inscrire à l'événement", 15, "Medium", hex(255,255,255)));
  evBody.appendChild(evBtn);

  joinCard.appendChild(evBody);
  joinFrame.appendChild(joinCard);
  page.appendChild(joinFrame);

  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify("✅ Signup, Forgot Password, Reset Password & Join Event pages created!");
})();
