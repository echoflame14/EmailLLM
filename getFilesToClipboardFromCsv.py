import csv
import pyperclip

# Path to the CSV file containing the list of files
csv_file_path = 'files_to_extract.csv'

# Function to read the CSV and extract file paths
def read_csv(file_path):
    file_paths = []
    with open(file_path, mode='r') as csv_file:
        csv_reader = csv.reader(csv_file)
        for row in csv_reader:
            file_paths.append(row[0])
    return file_paths

# Function to extract text from files and format it
def extract_and_format_text(file_paths):
    formatted_text = ""
    for file_path in file_paths:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read()
                formatted_text += f"=== File: {file_path} ===\n{content}\n\n"
        except Exception as e:
            formatted_text += f"=== Error reading {file_path}: {str(e)} ===\n\n"
    return formatted_text

# Main function
def main():
    # Read file paths from CSV
    file_paths = read_csv(csv_file_path)
    
    # Extract and format text
    formatted_text = extract_and_format_text(file_paths)
    
    # Copy to clipboard
    pyperclip.copy(formatted_text)
    print("Text copied to clipboard!")

if __name__ == "__main__":
    main()