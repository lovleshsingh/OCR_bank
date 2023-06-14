from pdf2docx import Converter
import os
import sys
import json
from docx.api import Document
import json
f = open('./config.json')
config = json.load(f)

# # # dir_path for input reading and output files & a for loop # # #

# path_input = './bank_pdfs/'  # Create folder named input & move pdfs in there
# path_output = './bank_docx/'
path_input = config['BANK_PDF_DIRECTORY']  # Create folder named input & move pdfs in there
path_output = config['BANK_DOCX_DIRECTORY']

# json_output = './json_output/'
file = sys.argv[1]

# for file in os.listdir(path_input):
cv = Converter(path_input+file)
cv.convert(path_output+file+'.docx', start=0, end=None)
cv.close()


# for file in os.listdir(path_output):
    # MCRM0987_-_Canara_Bank_-_Sept_-_2022.pdf.docx
    # MCRM1209_-_The_Kaira_District_Central_Co-Op_Bank_Ltd_-_Sept_-_2022.pdf.docx
    # MCRM1446_-_Bandhan_Bank_-_Sept_-_2022.pdf.docx
    # MCRM1474_-_RBL__Ratnakar__Bank_-_Sept_-_2022.pdf.docx
# print('-'*50)
# print(file+' \n')
statement = Document(path_output+file+".docx")
big_data = []

tableNumber = 0
keys = None
columns = []
for table in statement.tables:
    data = []
    for i, column in enumerate(table.rows):
        text = (cell.text for cell in column.cells)
        # print('tuple text start')
        # print(tuple(text))
        # print('Balance' in tuple(text))
        # print('tuple text end')
        if i == 0 and tableNumber == 0:
            keys = tuple(text)
            # tableNumber += 1
            # print(keys)
            has_balance = False
            
            for item in ((keys)):
                # print(item, len(item))
                columns.append(item)
                if item.strip().lower() == 'balance':
                    tableNumber += 1


            # print('tuple text start')
            # print(tuple(text))
            # print('BALANCE' in tuple(text))
            # print('tuple text end')
            # print(columns)
            # print(columns, len(columns), 'BALANCE' in columns)
            continue
        row_data = dict(zip(keys, text))
        data.append(row_data)
        #print (data)
        big_data.append(data)

json_object = json.dumps(big_data, indent=4)
# print(json_object)
f.close();
print(json.loads(json_object)[0])
# Writing to sample.json
# with open(json_output+file+'.json', "w") as outfile:
    # outfile.write(json_object)

# print("WRITE TO JSON SUCCESSFUL for file: " + file + '\n'+'-'*50)
