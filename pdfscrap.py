import tabula
import sys

# print('First param:'+sys.argv[1]+'#')
# if(sys.argv[1] == 'city_union_bank'):
#     # print(sys.argv[1])
dfs = tabula.read_pdf(sys.argv[1], pages='all', output_format="json")
# dfs = tabula.read_pdf(sys.argv[1], 
#                      guess=False, pages='all', stream=True , encoding="utf-8",  output_format="json",
#                      area=[[1,1,2000,2000]])
                    #  columns = (65.3,196.86,294.96,351.81,388.21,429.77))
print(dfs)


# pdf_path = "foo.pdf"

# print(dfs[0])

# convert PDF into CSV file
# tabula.convert_into("test.pdf", "output.csv", output_format="csv", pages='all')

# convert all PDFs in a directory
# tabula.convert_into_by_batch("./", output_format='json', pages='all')


# To remove dublicate rows from file
# with open('MCRM0987_-_Canara_Bank_-_Sept_-_2022.csv', 'r') as in_file, open('2.csv', 'w') as out_file:
#     seen = set() # set for fast O(1) amortized lookup
#     for line in in_file:
#         if line in seen: continue # skip duplicate

#         seen.add(line)
#         out_file.write(line)
# print(dfs[0])