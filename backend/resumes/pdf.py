from io import BytesIO
from pathlib import Path

from django.utils.text import slugify
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from xml.sax.saxutils import escape


UNICODE_FONT_AVAILABLE = False


TEMPLATE_COLORS = {
    "classic": "#17365D",
    "modern-blue": "#155EEF",
    "minimalist": "#334155",
    "executive": "#142B4A",
    "technical": "#0F766E",
    "academic": "#76543B",
    "creative": "#7045B8",
    "compact": "#475569",
}


def _register_fonts():
    global UNICODE_FONT_AVAILABLE
    candidates = (
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("/usr/share/fonts/truetype/noto/NotoSansEthiopic-Regular.ttf", "/usr/share/fonts/truetype/noto/NotoSansEthiopic-Bold.ttf"),
    )
    for regular, bold in candidates:
        if Path(regular).is_file() and Path(bold).is_file():
            try:
                if "ProspiraSans" not in pdfmetrics.getRegisteredFontNames():
                    pdfmetrics.registerFont(TTFont("ProspiraSans", regular))
                    pdfmetrics.registerFont(TTFont("ProspiraSans-Bold", bold))
                UNICODE_FONT_AVAILABLE = True
                return "ProspiraSans", "ProspiraSans-Bold"
            except (OSError, ValueError):
                continue
    return "Helvetica", "Helvetica-Bold"


def _text(value):
    text = str(value or "").strip()
    if not UNICODE_FONT_AVAILABLE:
        text = text.encode("cp1252", "replace").decode("cp1252")
    return escape(text).replace("\n", "<br/>")

def _paragraph(value, style):
    value = _text(value)
    return Paragraph(value, style) if value else None


def _date_range(entry):
    return " – ".join(str(entry.get(key, "")).strip() for key in ("start_date", "end_date") if entry.get(key))


def _build_styles(primary, regular_font, bold_font):
    base = getSampleStyleSheet()
    return {
        "name": ParagraphStyle(
            "ResumeName", parent=base["Title"], fontName=bold_font, fontSize=21,
            leading=25, textColor=colors.HexColor(primary), alignment=TA_LEFT,
            spaceAfter=3,
        ),
        "title": ParagraphStyle(
            "ResumeTitle", parent=base["Normal"], fontName=regular_font,
            fontSize=10, leading=13, textColor=colors.HexColor("#475569"), spaceAfter=5,
        ),
        "contact": ParagraphStyle(
            "ResumeContact", parent=base["Normal"], fontName=regular_font,
            fontSize=8, leading=11, textColor=colors.HexColor("#64748B"),
        ),
        "section": ParagraphStyle(
            "ResumeSection", parent=base["Heading2"], fontName=bold_font,
            fontSize=10, leading=13, textColor=colors.HexColor(primary),
            spaceBefore=10, spaceAfter=5, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "ResumeBody", parent=base["BodyText"], fontName=regular_font,
            fontSize=8.6, leading=12, textColor=colors.HexColor("#263449"),
            spaceAfter=4,
        ),
        "entry": ParagraphStyle(
            "ResumeEntry", parent=base["BodyText"], fontName=bold_font,
            fontSize=9, leading=12, textColor=colors.HexColor("#17243A"),
            spaceAfter=2,
        ),
        "muted": ParagraphStyle(
            "ResumeMuted", parent=base["BodyText"], fontName=regular_font,
            fontSize=7.5, leading=10, textColor=colors.HexColor("#64748B"),
            alignment=TA_LEFT,
        ),
        "skill": ParagraphStyle(
            "ResumeSkill", parent=base["BodyText"], fontName=regular_font,
            fontSize=8, leading=11, textColor=colors.HexColor("#263449"),
        ),
    }


def _photo_flowable(resume):
    try:
        if resume.profile_photo and resume.profile_photo.name:
            resume.profile_photo.open("rb")
            try:
                image_data = BytesIO(resume.profile_photo.read())
            finally:
                resume.profile_photo.close()
            photo = Image(image_data, width=23 * mm, height=23 * mm)
            photo.hAlign = "RIGHT"
            return photo
    except (OSError, ValueError, NotImplementedError):
        return None
    return None


def _add_section(story, title, styles, primary):
    story.append(Paragraph(escape(title.upper()), styles["section"]))
    rule = Table([[""]], colWidths=[174 * mm], rowHeights=[0.6])
    rule.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(primary)), ("LINEBELOW", (0, 0), (-1, -1), 0, colors.white)]))
    story.append(rule)
    story.append(Spacer(1, 4))


def _add_entry(story, heading, date_text, description, styles):
    pieces = []
    if heading:
        pieces.append(Paragraph(_text(heading), styles["entry"]))
    if date_text:
        pieces.append(Paragraph(_text(date_text), styles["muted"]))
    if description:
        pieces.append(Paragraph(_text(description), styles["body"]))
    if pieces:
        story.append(KeepTogether(pieces))


def build_resume_pdf(resume):
    regular_font, bold_font = _register_fonts()
    primary = TEMPLATE_COLORS.get(resume.template_identifier, TEMPLATE_COLORS["classic"])
    styles = _build_styles(primary, regular_font, bold_font)
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=17 * mm,
        title=resume.resume_title or f"{resume.full_name} Resume",
        author=resume.full_name,
    )
    story = []

    name = Paragraph(_text(resume.full_name or "Your Name"), styles["name"])
    title = Paragraph(_text(resume.professional_title), styles["title"]) if resume.professional_title else Spacer(1, 2)
    contact_items = [resume.email, resume.phone, resume.location]
    contact_items.extend(link.get("url", "") for link in (resume.links or []) if isinstance(link, dict))
    contact = Paragraph("  |  ".join(_text(item) for item in contact_items if item), styles["contact"])
    header_content = [name, title, contact]
    photo = _photo_flowable(resume)
    if photo:
        header = Table([[header_content, photo]], colWidths=[145 * mm, 25 * mm])
        header.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
    else:
        header = Table([[header_content]], colWidths=[170 * mm])
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 1.2, colors.HexColor(primary)),
    ]))
    story.extend([header, Spacer(1, 8)])

    if resume.professional_summary:
        _add_section(story, "Professional summary", styles, primary)
        story.append(Paragraph(_text(resume.professional_summary), styles["body"]))

    experience = [entry for entry in (resume.experience_entries or []) if isinstance(entry, dict)]
    if not experience and resume.experience:
        experience = [{"description": resume.experience}]
    if experience:
        _add_section(story, "Professional experience", styles, primary)
        for entry in experience:
            heading = " · ".join(value for value in (entry.get("role", ""), entry.get("employer", "")) if value)
            _add_entry(story, heading, _date_range(entry), entry.get("description", ""), styles)

    education = [entry for entry in (resume.education_entries or []) if isinstance(entry, dict)]
    if not education and resume.education:
        education = [{"description": resume.education}]
    if education:
        _add_section(story, "Education", styles, primary)
        for entry in education:
            heading = " · ".join(value for value in (entry.get("degree", ""), entry.get("institution", "")) if value)
            _add_entry(story, heading, _date_range(entry), entry.get("description", ""), styles)

    skills = resume.skills_list or [item.strip() for item in (resume.skills or "").replace("\n", ",").split(",") if item.strip()]
    if skills:
        _add_section(story, "Skills and expertise", styles, primary)
        story.append(Paragraph(_text("  •  ".join(skills)), styles["skill"]))

    projects = [item for item in (resume.projects or []) if isinstance(item, dict) and (item.get("name") or item.get("description"))]
    if projects:
        _add_section(story, "Selected projects", styles, primary)
        for project in projects:
            _add_entry(story, project.get("name", ""), project.get("url", ""), project.get("description", ""), styles)

    for field, heading in (("certifications", "Certifications"), ("languages", "Languages")):
        values = [str(item).strip() for item in (getattr(resume, field, []) or []) if str(item).strip()]
        if values:
            _add_section(story, heading, styles, primary)
            story.append(Paragraph(_text("  •  ".join(values)), styles["body"]))

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
        canvas.setLineWidth(0.5)
        canvas.line(18 * mm, 12 * mm, A4[0] - 18 * mm, 12 * mm)
        canvas.setFont(regular_font, 7)
        canvas.setFillColor(colors.HexColor("#94A3B8"))
        canvas.drawString(18 * mm, 8 * mm, "Created with Prospira")
        canvas.drawRightString(A4[0] - 18 * mm, 8 * mm, f"{doc.page}")
        canvas.restoreState()

    document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    filename = slugify(resume.resume_title or resume.full_name or "resume")[:72] or "resume"
    return buffer.getvalue(), f"{filename}.pdf"
