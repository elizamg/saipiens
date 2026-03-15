"""
file_converter.py — Convert uploaded documents to PDF for the curriculum pipeline.

Supported input formats:
  .pdf  — returned as-is (no conversion needed)
  .txt  — plain text rendered into a PDF
  .md   — markdown treated as plain text, rendered into a PDF
  .rtf  — RTF control words stripped, remaining text rendered into a PDF
  .docx — paragraphs extracted via python-docx, rendered into a PDF

All conversions produce a PDF in /tmp/ suitable for upload to the Gemini Files API.
The caller is responsible for cleaning up temporary files.
"""

import os
import re
import tempfile

from fpdf import FPDF


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def convert_to_pdf(input_path: str) -> str:
    """Convert *input_path* to PDF and return the path to the resulting file.

    If the input is already a PDF the original path is returned unchanged.
    Otherwise a new PDF is written to ``/tmp/`` and its path is returned.
    """
    ext = os.path.splitext(input_path)[1].lower()

    if ext == ".pdf":
        return input_path

    if ext in (".txt", ".md"):
        text = _read_text_file(input_path)
        return _text_to_pdf(text)

    if ext == ".rtf":
        raw = _read_text_file(input_path)
        text = _strip_rtf(raw)
        return _text_to_pdf(text)

    if ext in (".docx", ".doc"):
        text = _extract_docx_text(input_path)
        return _text_to_pdf(text)

    # Unsupported extension — attempt to read as plain text
    try:
        text = _read_text_file(input_path)
        return _text_to_pdf(text)
    except Exception:
        raise ValueError(f"Unsupported file format: {ext}")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _read_text_file(path: str) -> str:
    """Read a file as UTF-8 text, falling back to latin-1 on decode errors."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(path, "r", encoding="latin-1") as f:
            return f.read()


def _strip_rtf(raw: str) -> str:
    """Remove RTF control words and groups, returning plain text content."""
    # Remove {\*\...} groups (e.g. {\*\generator ...})
    text = re.sub(r"\{\\\*[^}]*\}", "", raw)
    # Remove RTF header/footer braces
    text = re.sub(r"[{}]", "", text)
    # Remove control words like \rtf1, \ansi, \par, etc.
    text = re.sub(r"\\[a-z]+\d*\s?", " ", text)
    # Remove escaped special chars like \' hex sequences
    text = re.sub(r"\\'[0-9a-fA-F]{2}", "", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _extract_docx_text(path: str) -> str:
    """Extract paragraph text from a .docx file using python-docx."""
    try:
        from docx import Document
    except ImportError:
        raise ImportError(
            "python-docx is required for .docx conversion. "
            "Install it with: pip install python-docx"
        )
    doc = Document(path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


def _text_to_pdf(text: str) -> str:
    """Render plain text into a PDF file in /tmp/ and return the file path."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)

    for line in text.split("\n"):
        # multi_cell wraps long lines automatically
        pdf.multi_cell(0, 6, line)

    fd, out_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    pdf.output(out_path)
    return out_path
