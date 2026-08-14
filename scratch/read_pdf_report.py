import sys

try:
    import pypdf
    reader = pypdf.PdfReader(r"C:\Users\rezie\Downloads\2 - Ficha de Inspeções.docx.pdf")
    print(f"Total pages: {len(reader.pages)}")
    for i, page in enumerate(reader.pages):
        print(f"--- PAGE {i+1} ---")
        print(page.extract_text())
except Exception as e:
    print(f"pypdf error: {e}")
    try:
        import pdfplumber
        with pdfplumber.open(r"C:\Users\rezie\Downloads\2 - Ficha de Inspeções.docx.pdf") as pdf:
            for i, page in enumerate(pdf.pages):
                print(f"--- PAGE {i+1} ---")
                print(page.extract_text())
    except Exception as e2:
        print(f"pdfplumber error: {e2}")
