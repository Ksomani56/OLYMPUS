#!/usr/bin/env python3
"""Generate the TrustFed PRD as a polished PDF using ReportLab."""

import os
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Flowable, Frame, HRFlowable, KeepTogether, NextPageTemplate,
    PageBreak, PageTemplate, Paragraph, Preformatted, Spacer, Table, TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "TrustFed_PRD.pdf")

# ---------------------------------------------------------------- fonts
FONT_DIR = r"C:\Windows\Fonts"
pdfmetrics.registerFontFamily(
    "TrustSans", normal="TrustSans", bold="TrustSans-Bold",
    italic="TrustSans-Italic", boldItalic="TrustSans-BoldItalic",
)
pdfmetrics.registerFont(TTFont("TrustSans", os.path.join(FONT_DIR, "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("TrustSans-Bold", os.path.join(FONT_DIR, "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("TrustSans-Italic", os.path.join(FONT_DIR, "segoeuii.ttf")))
pdfmetrics.registerFont(TTFont("TrustSans-BoldItalic", os.path.join(FONT_DIR, "segoeuiz.ttf")))
pdfmetrics.registerFont(TTFont("Mono", os.path.join(FONT_DIR, "consola.ttf")))
pdfmetrics.registerFont(TTFont("Mono-Bold", os.path.join(FONT_DIR, "consolab.ttf")))
pdfmetrics.registerFontFamily(
    "Mono", normal="Mono", bold="Mono-Bold", italic="Mono", boldItalic="Mono-Bold",
)

# ---------------------------------------------------------------- palette
INK = colors.HexColor("#10151f")
INK_SOFT = colors.HexColor("#3d4757")
INK_FAINT = colors.HexColor("#6b7688")
ACCENT = colors.HexColor("#1d4ed8")
ACCENT_DK = colors.HexColor("#12307f")
ACCENT_LT = colors.HexColor("#e8eeff")
TEAL = colors.HexColor("#0f766e")
AMBER = colors.HexColor("#b45309")
RULE = colors.HexColor("#d3dae6")
RULE_LT = colors.HexColor("#e8ecf3")
CODE_BG = colors.HexColor("#f4f6fa")
CODE_BORDER = colors.HexColor("#dde3ed")
CALLOUT_BG = colors.HexColor("#f0f5ff")

PAGE_W, PAGE_H = letter
LM = RM = 0.85 * inch
TM = 0.95 * inch
BM = 0.85 * inch
CONTENT_W = PAGE_W - LM - RM

# ---------------------------------------------------------------- styles
ss = getSampleStyleSheet()


def S(name, **kw):
    base = dict(name=name, fontName="TrustSans", fontSize=9.6, leading=14.2,
                textColor=INK, spaceBefore=0, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(**base)


st_title = S("title", fontName="TrustSans-Bold", fontSize=34, leading=38,
             textColor=ACCENT_DK, alignment=TA_LEFT)
st_subtitle = S("subtitle", fontName="TrustSans", fontSize=15, leading=21,
                textColor=INK_SOFT)
st_cover_meta = S("covermeta", fontSize=10, leading=15, textColor=INK_FAINT)
st_cover_kicker = S("coverkicker", fontName="TrustSans-Bold", fontSize=10.5, leading=14,
                    textColor=TEAL)

st_h1 = S("h1", fontName="TrustSans-Bold", fontSize=16.5, leading=21, textColor=ACCENT_DK,
          spaceBefore=0, spaceAfter=7, outlineLevel=0)
st_h2 = S("h2", fontName="TrustSans-Bold", fontSize=11.8, leading=16, textColor=INK,
          spaceBefore=12, spaceAfter=4, outlineLevel=1)
st_h3 = S("h3", fontName="TrustSans-Bold", fontSize=10.2, leading=14.5, textColor=TEAL,
          spaceBefore=9, spaceAfter=3, outlineLevel=2)
st_body = S("body", alignment=TA_JUSTIFY, spaceAfter=6)
st_bullet = S("bullet", alignment=TA_LEFT, spaceAfter=2.5)
st_num = S("num", alignment=TA_LEFT, spaceAfter=2.5)
st_th = S("th", fontName="TrustSans-Bold", fontSize=8.9, leading=12, textColor=colors.white)
st_td = S("td", fontSize=8.9, leading=12)
st_td_m = S("tdm", fontName="Mono", fontSize=8.2, leading=11.4)
st_cap = S("cap", fontSize=8.2, leading=11, textColor=INK_FAINT, spaceBefore=3)
st_code = S("code", fontName="Mono", fontSize=8.1, leading=11.2, textColor=colors.HexColor("#16233c"))
st_callout = S("callout", fontSize=9.4, leading=13.6, textColor=INK, alignment=TA_LEFT)
st_toc1 = S("toc1", fontName="TrustSans-Bold", fontSize=10, leading=16, textColor=INK,
            spaceBefore=5, firstLineIndent=0, leftIndent=0)
st_toc2 = S("toc2", fontSize=9.2, leading=13.5, leftIndent=17, textColor=INK_SOFT,
            firstLineIndent=0)
st_toc3 = S("toc3", fontSize=8.8, leading=12.5, leftIndent=34, textColor=INK_FAINT,
            firstLineIndent=0)

st_front_h = S("fronth", fontName="TrustSans-Bold", fontSize=15, leading=20,
               textColor=ACCENT_DK, spaceAfter=8)


# ---------------------------------------------------------------- inline markup
TOKEN = re.compile(r"(\*\*.+?\*\*|`[^`]+`|\*[^*]+\*)")


def rich(text, style=None):
    """Convert **bold**, *italic* and `code` into ReportLab inline markup."""
    out = []
    for part in TOKEN.split(str(text)):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            out.append("<b>%s</b>" % _esc(part[2:-2]))
        elif part.startswith("`") and part.endswith("`") and len(part) > 2:
            out.append('<font face="Mono" size="%.2f" color="%s">%s</font>'
                       % ((style.fontSize - 0.7) if style else 8.0, "#1d4ed8", _esc(part[1:-1])))
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            out.append("<i>%s</i>" % _esc(part[1:-1]))
        else:
            out.append(_esc(part))
    return "".join(out)


def _esc(t):
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# ---------------------------------------------------------------- doc template
class PRDDoc(BaseDocTemplate):
    def __init__(self, path, **kw):
        BaseDocTemplate.__init__(self, path, pagesize=letter,
                                 leftMargin=LM, rightMargin=RM,
                                 topMargin=TM, bottomMargin=BM, **kw)
        self.toc_entries = []
        frame_cover = Frame(LM, BM, CONTENT_W, PAGE_H - BM - 0.9 * inch, id="cover")
        frame_body = Frame(LM, BM, CONTENT_W, PAGE_H - BM - TM, id="body")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[frame_cover], onPage=self.cover_page),
            PageTemplate(id="body", frames=[frame_body], onPage=self.body_page),
        ])

    # -- chrome
    def cover_page(self, canv, doc):
        canv.saveState()
        canv.setFillColor(ACCENT_DK)
        canv.rect(0, PAGE_H - 0.34 * inch, PAGE_W, 0.34 * inch, stroke=0, fill=1)
        canv.setFillColor(TEAL)
        canv.rect(0, 0, PAGE_W, 0.18 * inch, stroke=0, fill=1)
        canv.restoreState()

    def body_page(self, canv, doc):
        canv.saveState()
        # header rule
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.6)
        y = PAGE_H - TM + 20
        canv.line(LM, y, PAGE_W - RM, y)
        canv.setFont("TrustSans-Bold", 7.8)
        canv.setFillColor(ACCENT_DK)
        canv.drawString(LM, y + 6, "TRUSTFED")
        canv.setFont("TrustSans", 7.8)
        canv.setFillColor(INK_FAINT)
        canv.drawRightString(PAGE_W - RM, y + 6, "Product Requirements Document")
        # footer
        canv.setStrokeColor(RULE)
        fy = BM - 20
        canv.line(LM, fy, PAGE_W - RM, fy)
        canv.setFont("TrustSans", 7.8)
        canv.setFillColor(INK_FAINT)
        canv.drawString(LM, fy - 11, "Version: Hackathon MVP")
        canv.drawRightString(PAGE_W - RM, fy - 11, "Page %d" % canv.getPageNumber())
        canv.restoreState()

    def afterFlowable(self, flowable):
        if not isinstance(flowable, Paragraph):
            return
        sn = flowable.style.name
        if sn not in ("h1", "h2", "h3"):
            return
        lvl = {"h1": 0, "h2": 1, "h3": 2}[sn]
        txt = re.sub(r"<[^>]+>", "", flowable.getPlainText())
        self.notify("TOCEntry", (lvl, txt, self.page))


# ---------------------------------------------------------------- flow helpers
def H1(n, text):
    return Paragraph("%s&nbsp;&nbsp;%s" % (n, rich(text)), st_h1)


def H2(text):
    return Paragraph(rich(text), st_h2)


def H3(text):
    return Paragraph(rich(text), st_h3)


def P(text, style=st_body):
    return Paragraph(rich(text), style)


def RULE_SPC(after=6):
    return Spacer(1, after)


def bullets(items, indent=13, style=st_bullet, marker="\u2022"):
    flow = []
    for it in items:
        flow.append(Paragraph(
            '<font color="#1d4ed8">%s</font>&nbsp;&nbsp;%s' % (marker, rich(it)),
            ParagraphStyle("b", parent=style, leftIndent=indent + 8, firstLineIndent=-8,
                           bulletIndent=indent - 4),
        ))
    return flow


def numbered(items, indent=16, style=st_num, start=1):
    flow = []
    for i, it in enumerate(items, start):
        flow.append(Paragraph(
            '<font color="#1d4ed8" name="TrustSans-Bold">%d.</font>&nbsp;&nbsp;%s' % (i, rich(it)),
            ParagraphStyle("n", parent=style, leftIndent=indent + 12, firstLineIndent=-12,
                           bulletIndent=indent - 6),
        ))
    return flow


def code(text, caption=None):
    body = Preformatted(text.strip("\n"), st_code)
    t = Table([[body]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("BOX", (0, 0), (-1, -1), 0.7, CODE_BORDER),
        ("LINEBEFORE", (0, 0), (0, -1), 2.4, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    if caption:
        return [t, Paragraph(rich(caption), st_cap)]
    return [t]


def table(header, rows, widths=None, mono_cols=(), caption=None, zebra=True):
    data = []
    if header:
        data.append([Paragraph(rich(h), st_th) for h in header])
    for r in rows:
        cells = []
        for i, c in enumerate(r):
            if isinstance(c, Flowable):
                cells.append(c)
            elif i in mono_cols:
                cells.append(Paragraph(rich(c).replace(" ", "&nbsp;"), st_td_m))
            else:
                cells.append(Paragraph(rich(c), st_td))
        data.append(cells)

    if widths is None:
        n = len(data[0])
        raw = [max(len(str(dd)) for dd in col) for col in zip(*data)]
        tot = float(sum(raw))
        weights = [max(0.09, r / tot) for r in raw]
        widths = [CONTENT_W * w for w in weights]
    # normalise to exact content width
    scale = CONTENT_W / float(sum(widths))
    widths = [w * scale for w in widths]

    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, RULE_LT),
        ("BOX", (0, 0), (-1, -1), 0.7, RULE),
    ]
    if header:
        cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT_DK),
            ("LINEBELOW", (0, 0), (-1, 0), 0.9, ACCENT_DK),
            ("TOPPADDING", (0, 0), (-1, 0), 6),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ]
    if zebra:
        for i in range(1 if header else 0, len(data)):
            if i % 2 == (1 if header else 0):
                cmds.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f7f9fc")))
    t.setStyle(TableStyle(cmds))
    if caption:
        return [t, Paragraph(rich(caption), st_cap)]
    return [t]


def callout(label, text, tone="info"):
    palette = {
        "info": (CALLOUT_BG, ACCENT),
        "warn": (colors.HexColor("#fff7ed"), AMBER),
        "good": (colors.HexColor("#ecfdf5"), TEAL),
    }
    bg, bar = palette[tone]
    lab = {
        "info": "REQUIREMENT NOTE",
        "warn": "SAFETY / SCOPE NOTE",
        "good": "DESIGN PRINCIPLE",
    }[tone]
    inner = [
        Paragraph('<font name="TrustSans-Bold" size="8" color="#%s">%s</font>'
                  % (bar.hexval()[2:], lab), st_callout),
        Spacer(1, 3),
        Paragraph(rich(text), st_callout),
    ]
    t = Table([[inner]], colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 2.6, bar),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe3f0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def section_title_block(n, title, kicker=None):
    out = [Spacer(1, 4)]
    if kicker:
        out.append(Paragraph('<font color="#0f766e">%s</font>' % kicker.upper(), st_cover_kicker))
    out.append(H1(n, title))
    out.append(HRFlowable(width=CONTENT_W, thickness=1.6, color=ACCENT, spaceAfter=9))
    return out


def architecture_diagram():
    """Coordinator / client architecture diagram, laid out on an exact column grid.

    Column plan (0-indexed):
      * client nodes are 11 columns wide, centred on 8, 20, 32 and 44
      * the coordinator box spans columns 0..33; its trunk drops from column 20,
        which is the second fan-out point on the bus
    """
    H, V = "\u2500", "\u2502"
    TL, TR, BL, BR = "\u250c", "\u2510", "\u2514", "\u2518"
    TDOWN, TUP, CROSS, ARROW = "\u252c", "\u2534", "\u253c", "\u25bc"

    NODE_IN = 9                                     # interior width of a client node
    HALF = (NODE_IN + 1) // 2                       # 5 -> node spans centre +/- 5
    nodes = [("Bank", 8), ("Wallet", 20), ("Lender", 32), ("Insurer", 44)]
    centres = [c for _, c in nodes]
    width = centres[-1] + HALF + 1                  # canvas width

    def put(*pairs):
        """One line built from (column, glyph) pairs, space-padded to `width`."""
        cells = dict(pairs)
        return "".join(cells.get(i, " ") for i in range(width))

    def run(a, b, glyph=H):
        """Horizontal run of `glyph`, columns a..b inclusive."""
        return [(i, glyph) for i in range(a, b + 1)]

    def centred(text, span):
        pad = max(0, span - len(text))
        left = pad // 2
        return " " * left + text + " " * (pad - left)

    def bar(joins):
        """A horizontal bus: `joins` is [(column, glyph), ...] left to right."""
        cells = list(joins)
        for (a, _), (b, _) in zip(joins, joins[1:]):
            cells += run(a + 1, b - 1)
        return put(*cells)

    # ---------------------------------------------------------------- coordinator
    BOX_W, BOX_IN, TRUNK = 34, 32, 20
    out = [put((0, TL), (BOX_W - 1, TR), *run(1, BOX_W - 2))]
    for label in ("Coordinator Server", "", "Flower strategy", "Secure aggregation",
                  "DP accounting", "Model registry", "Metrics and audit metadata"):
        out.append(V + centred(label, BOX_IN) + V)
    out.append(put((0, BL), (BOX_W - 1, BR), (TRUNK, TDOWN),
                   *run(1, TRUNK - 1), *run(TRUNK + 1, BOX_W - 2)))
    out.append(" " * TRUNK + V + " Protected updates only")

    # ---------------------------------------------------------------- fan-out bus
    out.append(bar([(centres[0], TL), (centres[1], CROSS),
                    (centres[2], TDOWN), (centres[-1], TR)]))
    out.append(put(*[(c, V) for c in centres]))

    # ---------------------------------------------------------------- client nodes
    tops = []
    for _, c in nodes:
        left, right = c - HALF, c + HALF
        tops += [(left, TL), (c, ARROW), (right, TR),
                 *run(left + 1, c - 1), *run(c + 1, right - 1)]
    out.append(put(*tops))

    pad = " " * (centres[0] - HALF)
    for labels in ([n for n, _ in nodes], ["client"] * len(nodes)):
        out.append(pad + " ".join(V + centred(lbl, NODE_IN) + V for lbl in labels))
    out.append(pad + " ".join(BL + H * NODE_IN + BR for _ in nodes))

    # ---------------------------------------------------------------- collect bus
    out.append(put(*[(c, V) for c in centres]))
    out.append(bar([(centres[0], BL), (centres[1], TUP),
                    (centres[2], TUP), (centres[-1], BR)]))
    out.append(" " * (centres[0] - HALF) + "Raw data remains local")
    return "\n".join(out)


# ---------------------------------------------------------------- content
F = []          # main story


def add(*items):
    """Append flowables; nested lists are spliced in place."""
    for it in items:
        if isinstance(it, (list, tuple)):
            F.extend(it)
        else:
            F.append(it)

COVER_META = [
    ("Product", "TrustFed"),
    ("Document", "Product Requirements Document"),
    ("Version", "Hackathon MVP"),
    ("Primary use case", "Cross-institution fraud detection"),
    ("Core message", "Institutions collaborate on intelligence, not customer data."),
]

add(Spacer(1, 0.5 * inch))
add(Paragraph('<font color="#0f766e">PRIVACY-PRESERVING FEDERATED FRAUD INTELLIGENCE</font>',
              st_cover_kicker))
add(Spacer(1, 6))
add(Paragraph("TrustFed", st_title))
add(Paragraph("Product Requirements Document", st_subtitle))
add(Spacer(1, 12))
add(HRFlowable(width=2.1 * inch, thickness=2.4, color=ACCENT, spaceAfter=14, hAlign="LEFT"))
add(Paragraph(
    "TrustFed is a privacy-preserving federated learning platform that enables "
    "simulated financial institutions — a bank, a digital wallet, a lender and an "
    "insurer — to jointly train a fraud-risk model without ever exchanging raw "
    "customer or transaction data.", st_body))
add(Spacer(1, 16))
add(*table(None, [[Paragraph(rich("**%s**" % k), st_td), Paragraph(rich(v), st_td)]
                  for k, v in COVER_META], widths=[1.7 * inch, CONTENT_W - 1.7 * inch]))
add(Spacer(1, 22))
add(callout("info",
            "This document specifies a hackathon MVP. All institutions, datasets, privacy "
            "budgets and results described are simulated and are intended to demonstrate "
            "technical feasibility and measurable value, not production fraud prevention or "
            "regulatory certification."))
add(NextPageTemplate("body"))
add(PageBreak())

# ---- contents
add(Paragraph("Contents", st_front_h))
add(HRFlowable(width=CONTENT_W, thickness=1.6, color=ACCENT, spaceAfter=8, hAlign="LEFT"))
TOC = TableOfContents()
TOC.levelStyles = [st_toc1, st_toc2, st_toc3]
TOC.dotsMinLevel = 0
add(TOC)
add(PageBreak())

# ================================================================ 1
add(*section_title_block("1.", "Product Overview"))
add(P("TrustFed is a privacy-preserving federated learning platform that enables simulated "
      "financial institutions—including a bank, digital wallet, lender and "
      "insurer—to jointly train a fraud-risk model without exchanging raw customer or "
      "transaction data."))
add(P("Each institution keeps its dataset locally, trains a model on its own data, protects "
      "its model update through clipping, differential privacy and secure aggregation, and "
      "contributes only the protected update to a shared global model."))
add(P("The platform provides:"))
add(*bullets([
    "Cross-institution federated model training.",
    "Secure aggregation of model updates.",
    "Differential privacy controls and accounting.",
    "Explainable transaction-level risk decisions.",
    "Fairness and model-drift monitoring.",
    "A dashboard comparing local-only and federated performance.",
]))
add(callout("info",
            "Flower provides the relevant federated-learning, secure-aggregation and "
            "differential-privacy workflows for the implementation."))

# ================================================================ 2
add(*section_title_block("2.", "Problem Statement"))
add(P("Financial institutions often possess complementary signals about the same fraud "
      "ecosystem:"))
add(*table(None, [
    ["Banks observe", "account activity, transfers and balances."],
    ["Wallets observe", "mobile-money transactions and device behaviour."],
    ["Lenders observe", "repayment and borrowing patterns."],
    ["Insurers observe", "claims and unusual behavioural patterns."],
], widths=[1.55 * inch, CONTENT_W - 1.55 * inch]))
add(Spacer(1, 7))
add(P("However, institutions cannot normally centralize raw customer data because of "
      "privacy, security, commercial and regulatory constraints."))
add(P("As a result, each institution trains a siloed model with an incomplete view of fraud. "
      "**TrustFed tests whether institutions can improve fraud detection collaboratively while "
      "keeping raw data inside institutional boundaries.**"))

# ================================================================ 3
add(*section_title_block("3.", "Goals and Non-Goals"))
add(H2("Goals"))
add(*numbered([
    "Demonstrate that federated training can outperform silo-only models.",
    "Ensure raw customer records never leave simulated institution clients.",
    "Prevent the coordinator from inspecting individual client updates through secure "
    "aggregation.",
    "Quantify privacy and utility trade-offs using differential privacy.",
    "Provide explainable risk scores and recommended actions.",
    "Monitor fairness across selected evaluation groups.",
    "Detect model or feature drift over time.",
    "Deliver a polished three-minute judge-facing demo.",
]))
add(H2("Non-goals"))
add(*bullets([
    "Production-grade fraud prevention.",
    "Legal certification or automatic regulatory compliance.",
    "Real customer data processing.",
    "Fully malicious-client detection.",
    "Production identity resolution across institutions.",
    "Automatic rejection of customers without human review.",
    "Solving fraud detection and credit default prediction simultaneously.",
]))
add(callout("warn",
            "Credit-risk modelling may be presented as a future extension, but fraud "
            "detection remains the sole MVP use case."))

# ================================================================ 4
add(*section_title_block("4.", "Target Users"))
add(*table(["User", "Needs", "Key actions"], [
    ["Institution administrator",
     "Control over local participation and privacy settings",
     "Configure data, join rounds, inspect local metrics"],
    ["Risk analyst",
     "Understand and act on transaction risk",
     "Score transactions, review explanations, escalate cases"],
    ["Compliance or governance user",
     "Verify privacy, fairness and auditability",
     "Inspect privacy scorecards, fairness metrics and logs"],
    ["Hackathon judge",
     "See measurable value and technical credibility",
     "Compare model variants and observe the live demo"],
], widths=[1.5 * inch, 2.3 * inch, CONTENT_W - 3.8 * inch]))

# ================================================================ 5
add(*section_title_block("5.", "User Stories"))
for role, items in [
    ("Institution administrator", [
        "As an institution administrator, I want to map my local dataset to a shared schema "
        "without uploading raw records.",
        "As an institution administrator, I want to set privacy parameters before joining a "
        "training round.",
        "As an institution administrator, I want to see my local model's performance versus "
        "the global model.",
        "As an institution administrator, I want to know exactly what information leaves my "
        "institution.",
        "As an institution administrator, I want to reject a training round if privacy or "
        "governance requirements are not met.",
    ]),
    ("Risk analyst", [
        "As a risk analyst, I want to submit a transaction for scoring.",
        "As a risk analyst, I want to see a fraud probability, risk category and recommended "
        "action.",
        "As a risk analyst, I want to understand the main factors contributing to a risk score.",
        "As a risk analyst, I want to compare local and federated predictions.",
        "As a risk analyst, I want high-risk transactions routed to manual review rather than "
        "automatically rejected.",
    ]),
    ("Governance user", [
        "As a governance user, I want to verify that no raw rows were shared.",
        "As a governance user, I want to inspect the configured privacy budget and minimum "
        "client threshold.",
        "As a governance user, I want to compare fairness metrics across customer groups.",
        "As a governance user, I want a complete audit trail for training and scoring actions.",
    ]),
]:
    add(H2(role))
    add(*bullets(items, marker="\u2013"))

# ================================================================ 6
add(*section_title_block("6.", "MVP Scope"))
add(H2("Included"))
add(*bullets([
    "PaySim-based synthetic transaction dataset.",
    "Three simulated institutions: bank, wallet and lending app.",
    "Optional fourth institution: insurer.",
    "Non-IID data partitions.",
    "PyTorch fraud-classification model.",
    "Flower-based FedAvg training.",
    "Local-only, centralized, standard federated and privacy-enhanced federated baselines.",
    "Secure aggregation.",
    "Basic differential privacy.",
    "SHAP or equivalent local / per-transaction explanations.",
    "PR-AUC, recall, precision, F1, false-positive rate and ROC-AUC.",
    "Fairness metrics by selected evaluation groups.",
    "Basic feature / model drift monitoring.",
    "Streamlit or React dashboard.",
    "Audit log and privacy scorecard.",
    "Live training-round visualization.",
    "Human-review recommendations.",
]))
add(H2("Deferred"))
add(*bullets([
    "FedProx optimization.",
    "Private set intersection.",
    "Real multi-party identity matching.",
    "Production authentication and key management.",
    "Malicious-client defense.",
    "Blockchain.",
    "Full case-management workflow.",
    "Credit-default modelling.",
    "Production deployment across independent organizations.",
]))

# ================================================================ 7
add(*section_title_block("7.", "Functional Requirements"))

add(H2("FR-1: Institution onboarding"))
add(P("The system shall allow an institution administrator to:"))
add(*bullets([
    "Select or upload a local dataset.",
    "Map local columns to the shared feature schema.",
    "View row count, fraud rate, missing values and feature statistics.",
    "Configure institution name and client identifier.",
    "Keep raw records within the local client environment.",
]))
add(callout("info",
            "The coordinator shall receive only metadata explicitly approved for display, "
            "such as dataset size and aggregate fraud rate."))

add(H2("FR-2: Local preprocessing"))
add(P("Each client shall perform preprocessing locally, including:"))
add(*bullets([
    "Missing-value handling.",
    "Categorical encoding.",
    "Numerical scaling where required.",
    "Identifier removal.",
    "Feature validation.",
    "Class-imbalance handling.",
    "Train, validation and time-based test splitting.",
]))
add(P("The system should prefer **temporal splits** over purely random row splits to better "
      "represent financial risk deployment."))

add(H2("FR-3: Local model training"))
add(P("Each institution shall train a local fraud model using its own data. The MVP model "
      "should be a small PyTorch multilayer perceptron:"))
add(*code("Input features\n"
          "    \u2193\n"
          "Dense layer: 64 units, ReLU\n"
          "    \u2193\n"
          "Dropout\n"
          "    \u2193\n"
          "Dense layer: 32 units, ReLU\n"
          "    \u2193\n"
          "Fraud probability output"))
add(Spacer(1, 7))
add(P("The training process shall support:"))
add(*bullets([
    "Weighted binary cross-entropy or focal loss.",
    "Configurable local epochs.",
    "Configurable batch size.",
    "Reproducible random seeds.",
    "Local validation metrics.",
    "Model checkpointing.",
]))

add(H2("FR-4: Federated training"))
add(P("The coordinator shall:"))
add(*numbered([
    "Initialize the global model.",
    "Select participating clients.",
    "Send the current global model to clients.",
    "Receive protected client contributions.",
    "Aggregate contributions.",
    "Produce a new global model version.",
    "Evaluate the model on federated or approved evaluation data.",
    "Publish round-level metrics.",
]))
add(P("The MVP shall support **FedAvg**. FedProx may be added if non-IID data causes "
      "unstable convergence."))

add(H2("FR-5: Secure aggregation"))
add(P("The system shall use secure aggregation so that the coordinator cannot inspect any "
      "individual client update. The dashboard shall show:"))
add(*bullets([
    "Number of participating clients.",
    "Number of updates received.",
    "Whether individual updates are visible to the coordinator.",
    "Whether an aggregate update was reconstructed.",
    "Minimum participation threshold.",
    "Client dropout status.",
]))
add(P("The system **shall not finalize an aggregation round** when the number of participating "
      "clients is below the configured threshold. This prevents a single client's contribution "
      "from becoming inferable."))
add(callout("good",
            "Flower provides SecAgg and SecAgg+ workflows designed to keep individual updates "
            "private while allowing aggregate updates to be computed."))

add(H2("FR-6: Differential privacy"))
add(P("The system shall support differential privacy through:"))
add(*bullets([
    "Update or gradient clipping.",
    "Configurable clipping norm.",
    "Configurable noise multiplier.",
    "Privacy accounting.",
    "Cumulative privacy budget display.",
    "Configurable failure probability \u03b4.",
]))
add(P("The dashboard shall display:"))
add(*bullets([
    "DP status.",
    "Clipping norm.",
    "Noise multiplier.",
    "Number of rounds included in the privacy calculation.",
    "Privacy budget \u03b5, when calculated by the selected accounting method.",
    "A clear indication when a value is a configured simulation parameter rather than a "
    "measured guarantee.",
]))
add(P("The system must distinguish between **local DP** and **central DP**. In local DP, "
      "protection is applied before an update leaves the client; in central DP, noise is "
      "applied to the aggregated result."))

add(H2("FR-7: Risk scoring"))
add(P("The risk analyst shall be able to submit a transaction manually or through a demo "
      "form. The system shall return:"))
add(*bullets([
    "Fraud probability.",
    "Risk score from 0 to 100.",
    "Risk category: low, medium or high.",
    "Recommended action: approve, review or block.",
    "Model version.",
    "Model type: local or global.",
    "Explanation status.",
]))
add(P("Recommended MVP policy:"))
add(*table(["Risk score", "Category", "Recommended action"], [
    ["0–39", "Low", "Approve"],
    ["40–69", "Medium", "Additional verification"],
    ["70–100", "High", "Manual review"],
], widths=[1.2 * inch, 1.6 * inch, CONTENT_W - 2.8 * inch]))
add(Spacer(1, 7))
add(P("Thresholds must be configurable and tuned against validation results. **The system "
      "shall not automatically deny a person in the demo.**"))

add(H2("FR-8: Explainability"))
add(P("For each scored transaction, the system shall show:"))
add(*bullets([
    "Top contributing features.",
    "Direction of contribution.",
    "Feature value.",
    "Plain-language reason code.",
    "Model version.",
    "Explanation timestamp.",
]))
add(*code("Risk score: 87/100\n"
          "Decision: Review required\n"
          "\n"
          "Main factors:\n"
          "- Amount is substantially above the customer baseline.\n"
          "- Destination account is new.\n"
          "- Device has not been seen previously.\n"
          "- Multiple transfers occurred within a short interval."))
add(Spacer(1, 7))
add(P("The MVP may use global feature importance plus SHAP-style per-transaction explanations."))

add(H2("FR-9: Fairness monitoring"))
add(P("The system shall evaluate model behaviour across available evaluation groups, such as:"))
add(*bullets([
    "New versus existing customers.",
    "Thin-file versus thick-file customers.",
    "Customer tenure bands.",
    "Region.",
    "Income band, where available.",
]))
add(callout("info",
            "Protected or sensitive attributes shall be isolated for evaluation and monitoring "
            "unless their use is explicitly justified."))
add(P("The dashboard shall show:"))
add(*bullets([
    "Recall by group.",
    "False-positive rate by group.",
    "False-negative rate by group.",
    "Precision by group.",
    "Equal opportunity difference.",
    "Demographic parity difference where appropriate.",
    "Sample size for every group.",
]))
add(P("The system shall warn users when a metric is unreliable because a group has too few "
      "examples."))
add(callout("info",
            "NIST identifies privacy, explainability, fairness, transparency, accountability "
            "and reliability as important characteristics of trustworthy AI."))

add(H2("FR-10: Drift monitoring"))
add(P("The system shall compare current data or prediction distributions against a reference "
      "period. The MVP shall support at least one of:"))
add(*bullets([
    "Population Stability Index.",
    "Kolmogorov–Smirnov test.",
    "Chi-squared test for categorical features.",
]))
add(P("The system shall display:"))
add(*bullets([
    "Feature drift status.",
    "Prediction drift status.",
    "Drift score.",
    "Reference period.",
    "Current period.",
    "Alert severity.",
    "Recommended investigation action.",
]))

add(H2("FR-11: Audit logging"))
add(P("The system shall log:"))
add(*bullets([
    "Institution registration.",
    "Dataset schema mapping.",
    "Training-round start and completion.",
    "Client participation.",
    "Privacy configuration.",
    "Model-version creation.",
    "Risk-score requests.",
    "Explanation generation.",
    "Fairness and drift evaluations.",
    "Configuration changes.",
    "Failed or abandoned rounds.",
]))
add(P("Audit entries shall include timestamp, actor or service, action, object, status and "
      "relevant model version."))

add(H2("FR-12: Privacy scorecard"))
add(P("The privacy centre shall present:"))
add(*code("Raw records exchanged: 0\n"
          "Raw columns exchanged: 0\n"
          "Individual updates visible to coordinator: No\n"
          "Secure aggregation: Enabled\n"
          "Differential privacy: Enabled\n"
          "Minimum clients required: 3\n"
          "Current participating clients: 3\n"
          "Privacy budget: Calculated or clearly labeled as configured\n"
          "Data retention: Configured policy"))
add(Spacer(1, 7))
add(callout("good",
            "The system must not claim that federated learning alone guarantees privacy. "
            "Federated learning should be presented as one component combined with secure "
            "aggregation and differential privacy."))

# ================================================================ 8
add(*section_title_block("8.", "Dashboard Requirements"))
add(H2("8.1  Overview"))
add(P("Show:"))
add(*bullets([
    "Global model version.",
    "Current training round.",
    "Participating institutions.",
    "Global PR-AUC and recall.",
    "Improvement over silo-only baseline.",
    "Privacy status.",
    "Fairness status.",
    "Drift status.",
    "Recent alerts.",
]))
add(H2("8.2  Institution network"))
add(P("Show each institution as a client node: **bank, wallet, lender** and optional "
      "**insurer**. For each institution show:"))
add(*bullets([
    "Local row count.",
    "Local fraud rate.",
    "Local PR-AUC.",
    "Participation status.",
    "Latest update timestamp.",
    "Raw-data sharing status.",
]))
add(H2("8.3  Live training"))
add(P("Show:"))
add(*bullets([
    "Current round.",
    "Client training progress.",
    "Local model metrics.",
    "Protected-update transmission.",
    "Secure aggregation status.",
    "Global model metrics by round.",
    "Client dropout events.",
    "Training duration.",
]))
add(H2("8.4  Model comparison"))
add(P("The dashboard shall compare:"))
add(*table(["Model", "Purpose"], [
    ["Local-only", "Demonstrates silo limitations"],
    ["Centralized", "Research upper bound only"],
    ["Federated", "Measures collaboration benefit"],
    ["Federated + secure aggregation", "Measures privacy architecture"],
    ["Federated + secure aggregation + DP", "Final proposed configuration"],
], widths=[2.5 * inch, CONTENT_W - 2.5 * inch]))
add(Spacer(1, 7))
add(callout("warn",
            "The dashboard shall use metrics generated from actual experiments. It must not "
            "hard-code illustrative values."))
add(H2("8.5  Risk scoring"))
add(P("Show:"))
add(*bullets([
    "Transaction input form.",
    "Risk score.",
    "Category.",
    "Recommended action.",
    "Explanation.",
    "Local-versus-global comparison.",
    "Privacy note.",
    "Model version.",
]))
add(H2("8.6  Responsible AI centre"))
add(P("Show:"))
add(*bullets([
    "Fairness metrics.",
    "Drift metrics.",
    "Data-quality alerts.",
    "Explanation availability.",
    "Human-review policy.",
    "Governance metadata.",
]))

# ================================================================ 9
add(*section_title_block("9.", "Data Requirements"))
add(H2("Dataset"))
add(P("The preferred MVP dataset is **PaySim**, a synthetic mobile-money transaction dataset "
      "created for fraud-detection research."))
add(H2("Shared schema"))
add(P("The shared schema may include:"))
add(*table(["Field", "Field", "Field"], [
    ["Transaction type", "Time step", "Device familiarity"],
    ["Amount", "Origin balance before transaction", "New-recipient indicator"],
    ["Origin balance after transaction", "Destination balance before transaction",
     "Historical transaction aggregates"],
    ["Destination balance after transaction", "Transaction velocity", "Fraud label"],
    ["Account-age proxy", "", ""],
], widths=[CONTENT_W / 3.0] * 3))
add(Spacer(1, 7))
add(H2("Data-silo strategy"))
add(P("The MVP shall use non-IID partitions to simulate institution differences. Example:"))
add(*table(["Institution", "Feature view"], [
    ["Bank", "Account and balance-heavy features."],
    ["Wallet", "Transaction, device and velocity features."],
    ["Lender", "Customer-history and repayment-style features."],
    ["Insurer", "Optional behavioural or claims-style features."],
], widths=[1.35 * inch, CONTENT_W - 1.35 * inch]))
add(Spacer(1, 7))
add(P("If feature-view construction is too expensive, the team may use institution-specific "
      "non-IID partitions while **clearly labeling them as a simulation**."))
add(H2("Data quality rules"))
add(P("The pipeline shall:"))
add(*bullets([
    "Remove leakage-prone identifiers.",
    "Preserve class-ratio metadata.",
    "Track missingness locally.",
    "Validate schema compatibility.",
    "Keep test data isolated.",
    "Record partition characteristics.",
    "Avoid representing ordinary hashes as complete anonymization.",
]))

# ================================================================ 10
add(*section_title_block("10.", "Evaluation Plan"))
add(H2("Primary success criteria"))
add(P("The MVP is successful if it demonstrates:"))
add(*bullets([
    "Raw transaction rows shared with the coordinator: **zero**.",
    "A working multi-client federated training flow.",
    "Secure aggregation enabled for the final demo.",
    "Differential privacy enabled and visibly configured.",
    "Federated PR-AUC or recall improvement over the median silo-only model.",
    "Per-transaction explanation for a scored example.",
    "Fairness and drift panels populated with real experiment results.",
    "A complete demo runnable locally.",
]))
add(H2("Model metrics"))
add(P("Track:"))
add(*bullets([
    "PR-AUC.",
    "ROC-AUC.",
    "Recall.",
    "Precision.",
    "F1 score.",
    "False-positive rate.",
    "False-negative rate.",
    "Recall at a fixed review capacity.",
    "Expected fraud-control cost.",
]))
add(P("Expected cost may be represented as:"))
add(*code("Expected cost = C_FN \u00d7 FN + C_FP \u00d7 FP + C_review \u00d7 Reviews",
          caption="FN and FP are the false-negative and false-positive counts for the "
                  "evaluation period; C_FN, C_FP and C_review are the configurable cost "
                  "weights agreed with the fraud-control owner."))
add(H2("Federated metrics"))
add(P("Track:"))
add(*bullets([
    "Global performance per round.",
    "Client-level performance per round.",
    "Convergence speed.",
    "Training duration.",
    "Communication volume.",
    "Client participation.",
    "Client dropout tolerance.",
    "Performance variation across institutions.",
]))
add(H2("Required experiments"))
add(*table(["Experiment", "Design"], [
    ["A — Utility",
     "Compare local-only models, the federated model, the centralized research upper bound, "
     "and the federated model with privacy enhancements."],
    ["B — Privacy / utility trade-off",
     "Compare no differential privacy, lower-noise DP and higher-noise DP. Display the "
     "impact on PR-AUC, recall, false-positive rate, privacy budget and training stability."],
    ["C — Robustness",
     "Simulate one client dropping out, unequal client sizes, different fraud rates, a "
     "low-quality client, a delayed client and non-IID feature distributions."],
], widths=[1.85 * inch, CONTENT_W - 1.85 * inch]))

# ================================================================ 11
add(*section_title_block("11.", "Technical Architecture"))
add(*code(architecture_diagram(),
          caption="Figure 1 — TrustFed reference architecture: raw data remains inside "
                  "each institution; only protected updates reach the coordinator."))
add(Spacer(1, 8))
add(H2("Suggested stack"))
add(*table(["Layer", "Technology"], [
    ["Federated learning", "Flower"],
    ["Model training", "PyTorch"],
    ["Differential privacy", "Flower workflow and/or Opacus"],
    ["Explanations", "SHAP"],
    ["Backend", "FastAPI"],
    ["Dashboard", "Streamlit for MVP; React and TypeScript for polished build"],
    ["Charts", "Plotly, Recharts or Streamlit charts"],
    ["Metadata", "SQLite or PostgreSQL"],
    ["Experiment tracking", "MLflow"],
    ["Deployment", "Docker Compose"],
    ["Live updates", "WebSockets or polling"],
], widths=[1.9 * inch, CONTENT_W - 1.9 * inch]))
add(Spacer(1, 7))
add(callout("info",
            "Flower documents federated evaluation, secure aggregation and differential "
            "privacy examples that can accelerate the prototype."))

# ================================================================ 12
add(*section_title_block("12.", "API Requirements"))
add(H2("Start training"))
add(Paragraph('<font color="#3d4757">POST /training/start</font>',
              S("apipath", fontName="Mono", fontSize=9.2, leading=13, textColor=INK_SOFT,
                spaceAfter=3)))
add(P("Request:", S("lbl", fontName="TrustSans-Bold", fontSize=8.6, leading=12, textColor=INK_FAINT,
                    spaceAfter=3)))
add(*code('{\n'
          '  "selected_clients": ["bank", "wallet", "lender"],\n'
          '  "rounds": 10,\n'
          '  "local_epochs": 2,\n'
          '  "privacy_mode": "secure_aggregation_dp",\n'
          '  "minimum_clients": 3\n'
          '}'))
add(Spacer(1, 6))
add(P("Response:", S("lbl2", fontName="TrustSans-Bold", fontSize=8.6, leading=12,
                     textColor=INK_FAINT, spaceAfter=3)))
add(*code('{\n'
          '  "job_id": "job_001",\n'
          '  "status": "started"\n'
          '}'))
add(Spacer(1, 6))
add(H2("Training status"))
add(Paragraph('<font color="#3d4757">GET /training/{job_id}</font>',
              S("apipath2", fontName="Mono", fontSize=9.2, leading=13, textColor=INK_SOFT,
                spaceAfter=3)))
add(P("Response:", S("lbl3", fontName="TrustSans-Bold", fontSize=8.6, leading=12, textColor=INK_FAINT,
                    spaceAfter=3)))
add(*code('{\n'
          '  "job_id": "job_001",\n'
          '  "round": 4,\n'
          '  "total_rounds": 10,\n'
          '  "status": "running",\n'
          '  "participating_clients": 3,\n'
          '  "global_pr_auc": 0.53,\n'
          '  "secure_aggregation": true,\n'
          '  "differential_privacy": true\n'
          '}'))
add(Spacer(1, 6))
add(H2("Score transaction"))
add(Paragraph('<font color="#3d4757">POST /risk/score</font>',
              S("apipath3", fontName="Mono", fontSize=9.2, leading=13, textColor=INK_SOFT,
                spaceAfter=3)))
add(P("Request:", S("lbl4", fontName="TrustSans-Bold", fontSize=8.6, leading=12, textColor=INK_FAINT,
                    spaceAfter=3)))
add(*code('{\n'
          '  "transaction": {\n'
          '    "amount": 12500,\n'
          '    "transaction_type": "TRANSFER",\n'
          '    "new_recipient": true,\n'
          '    "device_seen_before": false,\n'
          '    "transfers_last_90_seconds": 4\n'
          '  },\n'
          '  "model_version": "global_v10"\n'
          '}'))
add(Spacer(1, 6))
add(P("Response:", S("lbl5", fontName="TrustSans-Bold", fontSize=8.6, leading=12, textColor=INK_FAINT,
                    spaceAfter=3)))
add(*code('{\n'
          '  "risk_score": 87,\n'
          '  "fraud_probability": 0.91,\n'
          '  "risk_category": "high",\n'
          '  "recommended_action": "manual_review",\n'
          '  "model_version": "global_v10",\n'
          '  "reasons": [\n'
          '    "Amount is above the customer baseline",\n'
          '    "Destination account is new",\n'
          '    "Device has not been seen previously",\n'
          '    "Rapid repeated transfers"\n'
          '  ]\n'
          '}'))
add(Spacer(1, 6))

# ================================================================ 13
add(*section_title_block("13.", "Threat Model and Safety Requirements"))
add(H2("Assumptions"))
add(*bullets([
    "The coordinator may be honest-but-curious.",
    "Institutions do not share raw records.",
    "Clients are simulated and generally cooperative.",
    "Secure aggregation protects individual updates from the coordinator.",
    "Differential privacy limits information leakage from model contributions.",
]))
add(H2("Out of scope for MVP"))
add(*bullets([
    "Colluding clients.",
    "Poisoning attacks.",
    "Sybil clients.",
    "Backdoor attacks.",
    "Full secure hardware deployment.",
    "Formal cryptographic security review.",
]))
add(H2("Safety requirements"))
add(*numbered([
    "Never expose raw client records in coordinator logs.",
    "Do not display individual client updates.",
    "Enforce a minimum participation threshold.",
    "Label simulated privacy values clearly.",
    "Do not claim legal compliance automatically.",
    "Provide human review for high-risk decisions.",
    "Log model version and explanation for every risk score.",
    "Display uncertainty or insufficient-data warnings where appropriate.",
]))

# ================================================================ 14
add(*section_title_block("14.", "Governance Requirements"))
add(P("The governance screen shall include:"))
add(*bullets([
    "Processing purpose.",
    "Data categories used.",
    "Institution policy.",
    "Consent or lawful-basis metadata for simulation.",
    "Retention period.",
    "Model version.",
    "Explanation availability.",
    "Opt-out or deletion workflow status.",
    "Audit-log access.",
]))
add(callout("warn",
            "The product should state that privacy-preserving architecture does not by itself "
            "establish compliance with any particular law. Compliance depends on the complete "
            "processing design, contracts, notices, security controls, retention practices and "
            "deployment context."))

# ================================================================ 15
add(*section_title_block("15.", "Demo Flow"))
add(*table(["Time", "Step", "Content"], [
    ["Minute 1", "Problem",
     "Show three institutional silos: bank (local transaction records), wallet (device and "
     "mobile-money records), lender (repayment and customer-history records). Explain that raw "
     "records remain at each institution."],
    ["Minute 2", "Federated training",
     "Click Start training and show: clients train locally, raw data remains inside each "
     "silo, updates are clipped and protected, secure aggregation combines updates, the global "
     "model improves by round, and privacy and participation status update live."],
    ["Minute 3", "Risk decision",
     "Submit a suspicious transaction and show: fraud probability, risk score, manual-review "
     "recommendation, four explanation factors, local-versus-global comparison, fairness "
     "status, drift status and the privacy scorecard."],
], widths=[0.85 * inch, 1.15 * inch, CONTENT_W - 2.0 * inch]))
add(Spacer(1, 8))
add(callout("good",
            "\u201cTrustFed enables institutions to share model intelligence without sharing "
            "customer records.\u201d"))

# ================================================================ 16
add(*section_title_block("16.", "Delivery Plan"))
add(*table(["Phase", "Focus", "Deliverables"], [
    ["Phase 1", "Baseline",
     "Load and clean PaySim; build time-aware splits; train a local model; implement metrics; "
     "add basic risk-scoring API; add explanations."],
    ["Phase 2", "Federated learning",
     "Create three simulated clients; implement Flower simulation; add FedAvg; compare local "
     "and federated models; record metrics per round."],
    ["Phase 3", "Privacy",
     "Add secure aggregation; add minimum-client threshold; add differential privacy; add "
     "privacy accounting and dashboard state; validate that raw records never reach the "
     "coordinator."],
    ["Phase 4", "Responsible AI",
     "Add fairness metrics; add drift monitoring; add human-review policy; add governance and "
     "audit screens."],
    ["Phase 5", "Product polish",
     "Add live training progress; add model-comparison charts; add privacy flow "
     "visualization; add demo transaction; package with Docker Compose; prepare reproducible "
     "demo data and results."],
], widths=[0.85 * inch, 1.3 * inch, CONTENT_W - 2.15 * inch]))

# ================================================================ 17
add(*section_title_block("17.", "Acceptance Criteria"))
add(P("The MVP is accepted when:"))
add(*numbered([
    "Three simulated institutions can join a training round.",
    "Each client preprocesses and trains locally.",
    "Raw records are not transmitted to the coordinator.",
    "The coordinator cannot inspect an individual update in the final configured flow.",
    "The system blocks aggregation below the minimum client threshold.",
    "Differential-privacy settings are visible and logged.",
    "Local and federated metrics are generated from real experiments.",
    "A global model can score a transaction.",
    "The score includes an explanation and recommended human-review action.",
    "Fairness metrics are visible for at least two groups.",
    "Drift monitoring displays a real or simulated comparison.",
    "Audit logs capture training and scoring events.",
    "The complete demonstration runs end to end on one machine.",
]))

# ================================================================ 18
add(*section_title_block("18.", "Final Product Positioning"))
add(P("TrustFed is a federated financial-risk intelligence platform for institutions that need "
      "better fraud detection without centralizing customer data."))
add(P("Its differentiation is **not federated learning alone**. The product combines:"))
add(*table(["Capability", "What it delivers"], [
    ["Collaborative model training", "Joint fraud-risk model across bank, wallet and lender silos."],
    ["Secure aggregation", "Coordinator cannot inspect individual client updates."],
    ["Differential privacy", "Quantified privacy budget with clipping, noise and accounting."],
    ["Explainable risk decisions", "Per-transaction reason codes and recommended actions."],
    ["Fairness monitoring", "Group-level recall, FPR and equal-opportunity reporting."],
    ["Drift monitoring", "Feature and prediction drift against a reference period."],
    ["Governance and auditability", "Audit log, privacy scorecard and governance metadata."],
    ["Measurable comparison", "A local-versus-global performance comparison from real runs."],
], widths=[2.3 * inch, CONTENT_W - 2.3 * inch]))
add(Spacer(1, 10))
add(callout("good",
            "Institutions collaborate on intelligence, not customer data."))


# ---------------------------------------------------------------- build
def main():
    doc = PRDDoc(OUT, title="TrustFed - Product Requirements Document",
                 author="TrustFed", subject="Privacy-preserving federated fraud detection",
                 creator="TrustFed")
    doc.multiBuild(F)
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
