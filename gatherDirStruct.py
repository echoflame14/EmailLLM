import os
import json
import pyperclip
from typing import Dict, Any

def create_directory_structure(root_dir: str) -> Dict[str, Any]:
    # Common directories and files to ignore
    IGNORE_PATTERNS = {
        'node_modules',
        'dist',
        'build',
        'coverage',
        '.git',
        '.cache',
        '.next',
        '__pycache__',
        '.DS_Store'
    }
    
    # File extensions to include
    INCLUDE_EXTENSIONS = {
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
        '.json',
        '.d.ts'
    }
    
    def should_ignore(path: str) -> bool:
        return any(ignore in path for ignore in IGNORE_PATTERNS)
    
    def add_to_tree(tree: Dict[str, Any], path_parts: list, is_file: bool) -> None:
        current = tree
        for i, part in enumerate(path_parts):
            if i == len(path_parts) - 1 and is_file:
                if 'files' not in current:
                    current['files'] = []
                current['files'].append(part)
            else:
                if 'dirs' not in current:
                    current['dirs'] = {}
                if part not in current['dirs']:
                    current['dirs'][part] = {}
                current = current['dirs'][part]
    
    tree: Dict[str, Any] = {}
    
    for root, dirs, files in os.walk(root_dir, topdown=True):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if not should_ignore(d)]
        
        for file in files:
            if any(file.endswith(ext) for ext in INCLUDE_EXTENSIONS) and not should_ignore(file):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, root_dir)
                path_parts = rel_path.split(os.sep)
                
                # Handle root-level files
                if len(path_parts) == 1:
                    if 'files' not in tree:
                        tree['files'] = []
                    tree['files'].append(file)
                else:
                    add_to_tree(tree, path_parts, True)
    
    # Sort files in each directory
    def sort_tree(node: Dict[str, Any]) -> None:
        if 'files' in node:
            node['files'].sort()
        if 'dirs' in node:
            for dir_node in node['dirs'].values():
                sort_tree(dir_node)
    
    sort_tree(tree)
    return tree

def main():
    try:
        # Get current directory
        current_dir = os.getcwd()
        
        # Create directory structure
        dir_structure = create_directory_structure(current_dir)
        
        # Convert to pretty-printed JSON
        json_output = json.dumps(dir_structure, indent=2)
        
        # Copy to clipboard
        pyperclip.copy(json_output)
        
        print("Successfully copied directory structure to clipboard!")
        print("\nStructure:")
        print(json_output)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()