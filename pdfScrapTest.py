import tabula
import sys


dfs = tabula.read_pdf(sys.argv[1], pages='all', output_format="json", lattice=True, multiple_tables=True, pandas_options={'header': None})
# df = read_pdf("MPZ03194_-_Baroda_Uttar_Pradesh_Gramin_Bank_-_Nov_22.pdf", lattice=True, pandas_options={'header': None, 'names': ['Column 1', 'Column 2', 'Column 3']})

print(dfs)



########################
# Open the PDF document
# pdf_file = open("MPZ03194_-_Baroda_Uttar_Pradesh_Gramin_Bank_-_Nov_22.pdf", "rb")
# pdf_reader = PyPDF2.PdfReader(pdf_file)

# # Get the number of pages in the PDF document
# num_pages = len(pdf_reader.pages)

# # Iterate through each page and extract the text
# for page_num in range(num_pages):
#     page = pdf_reader.pages[page_num]
#     print(page.extract_text())

# # Close the PDF file
# pdf_file.close()
