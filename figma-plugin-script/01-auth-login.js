// =============================================================
// SCRIPT 1/6 - ScaNetwork: Page Login (Desktop 1440x900)
// Exécuter dans: Figma > Plugins > Development > Open Console
// Page cible: "Auth Flow"
// =============================================================

(async () => {
  const page = figma.currentPage;

  // Load fonts
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  // ---- HELPERS ----
  function hex(r, g, b) { return { r: r/255, g: g/255, b: b/255 }; }
  function solid(r, g, b, o) { return [{ type: "SOLID", color: hex(r,g,b), opacity: o !== undefined ? o : 1 }]; }
  function txt(str, size, style, color, lh) {
    const t = figma.createText();
    t.characters = str;
    t.fontSize = size;
    t.fontName = { family: "Inter", style: style || "Regular" };
    t.fills = [{ type: "SOLID", color: color || hex(0,0,0) }];
    if (lh) t.lineHeight = { value: lh, unit: "PIXELS" };
    t.textAutoResize = "WIDTH_AND_HEIGHT";
    return t;
  }
  function autoFrame(name, dir, spacing) {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = dir || "VERTICAL";
    f.itemSpacing = spacing || 0;
    f.fills = [];
    f.layoutSizingHorizontal = "HUG";
    f.layoutSizingVertical = "HUG";
    return f;
  }
  function inputField(placeholder, iconChar, hasRightIcon) {
    const row = autoFrame("Input Field", "HORIZONTAL", 0);
    row.cornerRadius = 12;
    row.fills = solid(255,255,255);
    row.strokes = [{ type: "SOLID", color: hex(229,231,235) }];
    row.strokeWeight = 1;
    row.paddingLeft = 12; row.paddingRight = 12;
    row.paddingTop = 12; row.paddingBottom = 12;
    row.counterAxisAlignItems = "CENTER";
    row.layoutSizingHorizontal = "FILL";

    // Left icon placeholder
    const icon = figma.createFrame();
    icon.name = "Icon " + iconChar;
    icon.resize(20, 20);
    icon.cornerRadius = 4;
    icon.fills = solid(156,163,175, 0.3);
    icon.layoutSizingHorizontal = "FIXED";
    icon.layoutSizingVertical = "FIXED";
    row.appendChild(icon);

    // Spacer
    const sp1 = figma.createFrame();
    sp1.name = "spacer";
    sp1.resize(8, 1);
    sp1.fills = [];
    sp1.layoutSizingHorizontal = "FIXED";
    sp1.layoutSizingVertical = "FIXED";
    row.appendChild(sp1);

    const label = txt(placeholder, 15, "Regular", hex(156,163,175));
    row.appendChild(label);
    label.layoutSizingHorizontal = "FILL";

    if (hasRightIcon) {
      const sp2 = figma.createFrame();
      sp2.name = "spacer2";
      sp2.resize(8, 1);
      sp2.fills = [];
      sp2.layoutSizingHorizontal = "FIXED";
      sp2.layoutSizingVertical = "FIXED";
      row.appendChild(sp2);
      const ri = figma.createFrame();
      ri.name = "Eye Icon";
      ri.resize(20, 20);
      ri.cornerRadius = 4;
      ri.fills = solid(156,163,175, 0.3);
      ri.layoutSizingHorizontal = "FIXED";
      ri.layoutSizingVertical = "FIXED";
      row.appendChild(ri);
    }
    return row;
  }

  // =============================================================
  // LOGIN PAGE FRAME (1440x900)
  // =============================================================
  const loginFrame = figma.createFrame();
  loginFrame.name = "Login - Desktop";
  loginFrame.resize(1440, 900);
  loginFrame.layoutMode = "HORIZONTAL";
  loginFrame.fills = solid(248, 250, 252);

  // ===== LEFT PANEL (720x900) =====
  const left = figma.createFrame();
  left.name = "Left - Branding";
  left.layoutMode = "VERTICAL";
  left.resize(720, 900);
  left.layoutSizingVertical = "FIXED";
  left.primaryAxisAlignItems = "CENTER";
  left.counterAxisAlignItems = "MIN";
  left.paddingLeft = 48; left.paddingRight = 48;
  left.paddingTop = 60; left.paddingBottom = 48;
  left.itemSpacing = 28;
  left.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]]
  }];

  // Logo
  const logo = txt("ScaNetwork", 28, "Bold", hex(255,255,255));
  left.appendChild(logo);

  // Heading
  const heading = txt("Transformez vos rencontres\nen opportunités", 40, "Bold", hex(255,255,255), 50);
  left.appendChild(heading);

  // Subtext
  const sub = txt("La plateforme de networking qui centralise\nvos contacts professionnels et automatise\nvos suivis commerciaux.", 18, "Regular", hex(191,217,237), 28);
  left.appendChild(sub);

  // --- Stats Row ---
  const statsRow = autoFrame("Stats Row", "HORIZONTAL", 20);
  statsRow.counterAxisAlignItems = "CENTER";

  const statsData = [
    { v: "+150%", l: "Conversions" },
    { v: "10k+", l: "Utilisateurs" },
    { v: "98%", l: "Satisfaction" }
  ];
  for (const s of statsData) {
    const card = autoFrame("Stat " + s.l, "VERTICAL", 4);
    card.paddingLeft = 20; card.paddingRight = 20;
    card.paddingTop = 16; card.paddingBottom = 16;
    card.cornerRadius = 16;
    card.fills = solid(255, 255, 255, 0.1);
    card.appendChild(txt(s.v, 30, "Bold", hex(255,255,255)));
    card.appendChild(txt(s.l, 13, "Regular", hex(191,217,237)));
    statsRow.appendChild(card);
  }
  left.appendChild(statsRow);

  // --- Testimonial ---
  const testimonial = autoFrame("Testimonial", "VERTICAL", 16);
  testimonial.paddingLeft = 24; testimonial.paddingRight = 24;
  testimonial.paddingTop = 24; testimonial.paddingBottom = 24;
  testimonial.cornerRadius = 16;
  testimonial.fills = solid(255, 255, 255, 0.1);

  const quote = txt("\"Scanetwork a révolutionné ma façon de\ngérer mes contacts. Je n'oublie plus jamais\nde relancer un prospect !\"", 15, "Regular", hex(220,233,243), 24);
  testimonial.appendChild(quote);

  const authorRow = autoFrame("Author", "HORIZONTAL", 12);
  authorRow.counterAxisAlignItems = "CENTER";

  const avatar = figma.createFrame();
  avatar.name = "Avatar M";
  avatar.resize(40, 40);
  avatar.cornerRadius = 20;
  avatar.fills = solid(255, 255, 255, 0.2);
  avatar.layoutMode = "HORIZONTAL";
  avatar.primaryAxisAlignItems = "CENTER";
  avatar.counterAxisAlignItems = "CENTER";
  const mLetter = txt("M", 16, "Bold", hex(255,255,255));
  avatar.appendChild(mLetter);
  authorRow.appendChild(avatar);

  const authorInfo = autoFrame("AuthorInfo", "VERTICAL", 2);
  authorInfo.appendChild(txt("Marie Dupont", 14, "Semi Bold", hex(255,255,255)));
  authorInfo.appendChild(txt("Directrice Commerciale", 12, "Regular", hex(165,199,230)));
  authorRow.appendChild(authorInfo);

  testimonial.appendChild(authorRow);
  left.appendChild(testimonial);
  testimonial.layoutSizingHorizontal = "FILL";

  loginFrame.appendChild(left);

  // ===== RIGHT PANEL (720x900) =====
  const right = figma.createFrame();
  right.name = "Right - Form";
  right.layoutMode = "VERTICAL";
  right.resize(720, 900);
  right.layoutSizingVertical = "FIXED";
  right.primaryAxisAlignItems = "CENTER";
  right.counterAxisAlignItems = "CENTER";
  right.paddingLeft = 32; right.paddingRight = 32;
  right.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 248/255, g: 250/255, b: 252/255, a: 1 } },
      { position: 0.5, color: { r: 239/255, g: 246/255, b: 255/255, a: 1 } },
      { position: 1, color: { r: 240/255, g: 253/255, b: 250/255, a: 1 } }
    ],
    gradientTransform: [[0.7, 0.7, 0], [-0.7, 0.7, 0.3]]
  }];

  // White Card
  const card = autoFrame("Login Card", "VERTICAL", 0);
  card.resize(420, 10);
  card.cornerRadius = 24;
  card.fills = solid(255, 255, 255);
  card.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 8 }, radius: 32, spread: 0, visible: true },
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r: 0, g: 0, b: 0, a: 0.04 }, offset: { x: 0, y: 2 }, radius: 8, spread: 0, visible: true }
  ];
  card.paddingLeft = 32; card.paddingRight = 32;
  card.paddingTop = 32; card.paddingBottom = 32;
  card.itemSpacing = 8;
  card.layoutSizingVertical = "HUG";
  card.layoutSizingHorizontal = "FIXED";

  // Logo placeholder in card
  const logoBox = figma.createFrame();
  logoBox.name = "Card Logo";
  logoBox.resize(200, 56);
  logoBox.cornerRadius = 8;
  logoBox.fills = solid(14, 58, 93, 0.08);
  logoBox.layoutMode = "HORIZONTAL";
  logoBox.primaryAxisAlignItems = "CENTER";
  logoBox.counterAxisAlignItems = "CENTER";
  const logoTxt = txt("ScaNetwork", 22, "Bold", hex(14, 58, 93));
  logoBox.appendChild(logoTxt);

  // Center logo
  const logoRow = autoFrame("LogoRow", "HORIZONTAL", 0);
  logoRow.primaryAxisAlignItems = "CENTER";
  logoRow.counterAxisAlignItems = "CENTER";
  logoRow.layoutSizingHorizontal = "FILL";
  logoRow.appendChild(logoBox);
  card.appendChild(logoRow);

  // Spacer
  const sp = figma.createFrame(); sp.name = "sp"; sp.resize(1,12); sp.fills = [];
  sp.layoutSizingHorizontal = "FILL";
  card.appendChild(sp);

  // Title
  const titleRow = autoFrame("TitleRow", "VERTICAL", 8);
  titleRow.counterAxisAlignItems = "CENTER";
  titleRow.layoutSizingHorizontal = "FILL";
  const title = txt("Bienvenue", 28, "Bold", hex(31, 41, 55));
  titleRow.appendChild(title);
  const subtitle = txt("Connectez-vous pour accéder à vos contacts", 14, "Regular", hex(107, 114, 128));
  titleRow.appendChild(subtitle);
  card.appendChild(titleRow);

  // Spacer
  const sp2 = figma.createFrame(); sp2.name = "sp2"; sp2.resize(1,16); sp2.fills = [];
  sp2.layoutSizingHorizontal = "FILL";
  card.appendChild(sp2);

  // Form
  const form = autoFrame("Form", "VERTICAL", 16);
  form.layoutSizingHorizontal = "FILL";

  // Email label + input
  const emailSection = autoFrame("Email Section", "VERTICAL", 8);
  emailSection.layoutSizingHorizontal = "FILL";
  emailSection.appendChild(txt("Email", 14, "Medium", hex(55, 65, 81)));
  const emailInput = inputField("vous@exemple.com", "Mail", false);
  emailSection.appendChild(emailInput);
  form.appendChild(emailSection);

  // Password label + input
  const passSection = autoFrame("Password Section", "VERTICAL", 8);
  passSection.layoutSizingHorizontal = "FILL";
  passSection.appendChild(txt("Mot de passe", 14, "Medium", hex(55, 65, 81)));
  const passInput = inputField("••••••••", "Lock", true);
  passSection.appendChild(passInput);
  form.appendChild(passSection);

  // Forgot password link
  const forgotRow = autoFrame("ForgotRow", "HORIZONTAL", 0);
  forgotRow.layoutSizingHorizontal = "FILL";
  forgotRow.primaryAxisAlignItems = "MAX";
  forgotRow.appendChild(txt("Mot de passe oublié ?", 13, "Medium", hex(14, 58, 93)));
  form.appendChild(forgotRow);

  // Submit button
  const btn = autoFrame("Submit Button", "HORIZONTAL", 8);
  btn.layoutSizingHorizontal = "FILL";
  btn.primaryAxisAlignItems = "CENTER";
  btn.counterAxisAlignItems = "CENTER";
  btn.paddingTop = 14; btn.paddingBottom = 14;
  btn.cornerRadius = 12;
  btn.fills = [{
    type: "GRADIENT_LINEAR",
    gradientStops: [
      { position: 0, color: { r: 14/255, g: 58/255, b: 93/255, a: 1 } },
      { position: 1, color: { r: 30/255, g: 90/255, b: 142/255, a: 1 } }
    ],
    gradientTransform: [[1, 0, 0], [0, 1, 0]]
  }];
  btn.effects = [
    { type: "DROP_SHADOW", blendMode: "NORMAL", color: { r: 59/255, g: 130/255, b: 246/255, a: 0.2 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true }
  ];
  btn.appendChild(txt("Se connecter", 15, "Medium", hex(255,255,255)));
  form.appendChild(btn);

  card.appendChild(form);

  // Toggle text
  const sp3 = figma.createFrame(); sp3.name = "sp3"; sp3.resize(1, 12); sp3.fills = [];
  sp3.layoutSizingHorizontal = "FILL";
  card.appendChild(sp3);

  const toggleRow = autoFrame("ToggleRow", "HORIZONTAL", 0);
  toggleRow.layoutSizingHorizontal = "FILL";
  toggleRow.primaryAxisAlignItems = "CENTER";
  toggleRow.appendChild(txt("Pas encore de compte ? Inscrivez-vous", 14, "Medium", hex(14, 58, 93)));
  card.appendChild(toggleRow);

  // Terms
  const sp4 = figma.createFrame(); sp4.name = "sp4"; sp4.resize(1, 16); sp4.fills = [];
  sp4.layoutSizingHorizontal = "FILL";
  card.appendChild(sp4);

  const termsRow = autoFrame("TermsRow", "HORIZONTAL", 0);
  termsRow.layoutSizingHorizontal = "FILL";
  termsRow.primaryAxisAlignItems = "CENTER";
  const termsText = txt("En continuant, vous acceptez nos Conditions\nd'utilisation et notre Politique de confidentialité", 11, "Regular", hex(156, 163, 175), 16);
  termsText.textAlignHorizontal = "CENTER";
  termsRow.appendChild(termsText);
  card.appendChild(termsRow);

  right.appendChild(card);
  loginFrame.appendChild(right);

  page.appendChild(loginFrame);

  // Center viewport
  figma.viewport.scrollAndZoomIntoView([loginFrame]);
  figma.notify("✅ Login page created!");
})();
