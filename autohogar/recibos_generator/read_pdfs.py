import os
import PyPDF2

directory = '../'
files = [
  '% BANCO (1).pdf',
  '% MEDIO ELECTRONICO.pdf',
  '% OFICINA (1).pdf',
  '% TOTAL COBRANZA (2).pdf',
  'BANCO GALICIA (1).pdf',
  'COBRANZA ULTIMOS 3 MESES (1).pdf',
  'GASTOS OFICINA (1).pdf',
  'MERCADO PAGO (2).pdf',
  'MERCADO PAGO COTEJO (2).pdf',
  'RETIRO (2).pdf',
  'RETIROS MERCADO PAGO (1).pdf',
  'TOTAL FABIO (2).pdf'
]

for filename in files:
    filepath = os.path.join(directory, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for i in range(min(2, len(reader.pages))):
                    text += reader.pages[i].extract_text() + " "
                print(f"\n--- File: {filename} ---")
                print(text[:500].replace('\n', ' '))
        except Exception as e:
            print(f"Error reading {filename}: {e}")
