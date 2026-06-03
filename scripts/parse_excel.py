import zipfile
import xml.etree.ElementTree as ET
import os

def parse_xlsx(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
        
    print(f"Parsing Excel file: {path}")
    with zipfile.ZipFile(path, 'r') as zip_ref:
        # Load shared strings
        shared_strings = []
        try:
            ss_data = zip_ref.read('xl/sharedStrings.xml')
            root = ET.fromstring(ss_data)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in root.findall('ns:si', ns):
                text_elems = si.findall('.//ns:t', ns)
                text = "".join([t.text for t in text_elems if t.text])
                shared_strings.append(text)
        except KeyError:
            print("No shared strings found.")
            
        # Load workbook structure to get sheet names
        sheets = []
        try:
            wb_data = zip_ref.read('xl/workbook.xml')
            root = ET.fromstring(wb_data)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for sheet in root.findall('.//ns:sheet', ns):
                sheets.append({
                    'name': sheet.attrib.get('name'),
                    'id': sheet.attrib.get('sheetId'),
                    'rid': sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                })
        except Exception as e:
            print("Error parsing workbook.xml:", e)
            
        print(f"Sheets found: {[s['name'] for s in sheets]}")
        
        # Read worksheet 1
        try:
            sheet_data = zip_ref.read('xl/worksheets/sheet1.xml')
            root = ET.fromstring(sheet_data)
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            
            rows = {}
            for row_elem in root.findall('.//ns:row', ns):
                row_idx = int(row_elem.attrib.get('r'))
                row_cells = []
                for c in row_elem.findall('ns:c', ns):
                    r_ref = c.attrib.get('r')
                    val_elem = c.find('ns:v', ns)
                    val = val_elem.text if val_elem is not None else ""
                    t_type = c.attrib.get('t')
                    
                    if t_type == 's' and val:
                        val = shared_strings[int(val)]
                    row_cells.append((r_ref, val))
                rows[row_idx] = row_cells
                
            # Print all rows
            for r in sorted(rows.keys()):
                print(f"Row {r}: {rows[r]}")
        except Exception as e:
            print("Error parsing sheet1.xml:", e)

if __name__ == '__main__':
    parse_xlsx('data/Semester Wise Subject breakdown (CSE) (1).xlsx')
