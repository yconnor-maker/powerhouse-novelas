import os
import re
import json

repo_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
md_dir = os.path.join(repo_dir, "content", "markdown")
substack_dir = os.path.join(repo_dir, "substack_exports")
json_path = os.path.join(repo_dir, "manifesto_data.json")

os.makedirs(substack_dir, exist_ok=True)

def parse_md_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = f.read()
    
    # Extract frontmatter
    match = re.search(r'---\n(.*?)\n---\n(.*)', raw, flags=re.DOTALL)
    if not match:
        print(f"Failed to parse frontmatter for: {filepath}")
        return None
        
    frontmatter, body = match.groups()
    body = body.strip()
    
    meta = {}
    for line in frontmatter.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            meta[key.strip()] = val.strip().strip('"').strip("'")
            
    return meta, body

def markdown_to_html(body):
    # Extremely simple markdown converter for substack
    paragraphs = body.split('\n\n')
    html_out = ""
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        # Handling blockquotes
        if p.startswith('> '):
            # remove '> ' from lines
            p_content = p.replace('> ', '').replace('\n> ', '\n')
            html_out += f"<blockquote><p>{p_content}</p></blockquote>\n"
        else:
            html_out += f"<p>{p}</p>\n"
            
    # Very basic bold/italics regex
    html_out = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html_out)
    html_out = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html_out)
    return html_out

def build_all():
    site_data = []
    
    files = []
    for root, _, filenames in os.walk(md_dir):
        for f in filenames:
            if f.endswith('.md'):
                files.append(os.path.join(root, f))
    
    files = sorted(files)
    
    for filepath in files:
        parsed = parse_md_file(filepath)
        if not parsed: continue
        meta, body = parsed
        
        # Path details for deep traversal
        rel_path = os.path.relpath(filepath, md_dir)
        parts = rel_path.split(os.sep)
        category = parts[0] if len(parts) > 1 else 'general'
        series = parts[1] if len(parts) > 2 else category
        book = parts[2] if len(parts) > 3 else ''
        filename = parts[-1]
        
        num = meta.get('number', '0')
        # fallback to number parsing from filename if not in frontmatter
        if num == '0' and filename[0].isdigit():
            m = re.match(r'(\d+)', filename)
            if m:
                num = m.group(1)
                
        title = meta.get('title', 'Untitled')
        
        # 1. Prepare for JSON (Website Pipe)
        site_body = body.replace('\n\n', '\n') 
        site_data.append({
            "title": title,
            "num": str(num),
            "category": category,
            "series": series,
            "book": book,
            "content": site_body,
            "filename": filename
        })
        
        # 2. Build for Substack (Substack Pipe)
        html_body = markdown_to_html(body)
        substack_html = f"<h2>{title}</h2>\n{html_body}"
        
        out_filename = filename.replace('.md', '.html')
        out_folder = os.path.join(substack_dir, category, series) if series != category else os.path.join(substack_dir, category)
        os.makedirs(out_folder, exist_ok=True)
        
        out_path = os.path.join(out_folder, out_filename)
        with open(out_path, 'w', encoding='utf-8') as sf:
            sf.write(substack_html)
            
    # Sort JSON by category, then series, then num
    site_data.sort(key=lambda x: (x['category'], x['series'], int(x['num']) if x['num'].isdigit() else 999))
    
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(site_data, jf, indent=2)
        
    print(f"Successfully processed {len(files)} markdown files.")
    print(f"- Updated {json_path}")
    print(f"- Exported {len(files)} Substack HTML files to {substack_dir}")

if __name__ == '__main__':
    build_all()
