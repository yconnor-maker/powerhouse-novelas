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
        print(f"Failed to parse: {filepath}")
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
    
    files = sorted([f for f in os.listdir(md_dir) if f.endswith('.md')])
    for f in files:
        filepath = os.path.join(md_dir, f)
        parsed = parse_md_file(filepath)
        if not parsed: continue
        meta, body = parsed
        
        num = meta.get('number', '0')
        title = meta.get('title', 'Untitled')
        
        # 1. Prepare for JSON (Website Pipe)
        # Replacing double newlines with single for the existing manifesto.js parser format
        site_body = body.replace('\n\n', '\n') 
        full_title = f"{title}"
        site_data.append({
            "title": full_title,
            "num": str(num),
            "content": site_body
        })
        
        # 2. Build for Substack (Substack Pipe)
        html_body = markdown_to_html(body)
        substack_html = f"<h2>{title}</h2>\n{html_body}"
        
        out_filename = f.replace('.md', '.html')
        out_path = os.path.join(substack_dir, out_filename)
        with open(out_path, 'w', encoding='utf-8') as sf:
            sf.write(substack_html)
            
    # Sort JSON by num
    site_data.sort(key=lambda x: int(x['num']))
    
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(site_data, jf, indent=2)
        
    print(f"Successfully processed {len(files)} markdown files.")
    print(f"- Updated {json_path}")
    print(f"- Exported {len(files)} Substack HTML files to {substack_dir}")

if __name__ == '__main__':
    build_all()
