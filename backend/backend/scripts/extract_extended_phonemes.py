import os
import json
import re
from bs4 import BeautifulSoup
import sys

# Path to the HTML file
html_file_path = "../my_extended_ipa_symbols/Extend the IPA!.html"

def extract_extended_phonemes():
    """Extract extended IPA symbols from the HTML file."""
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract consonants
    consonant_table = soup.select_one("#consonants table")
    extended_consonants = []
    
    if consonant_table:
        rows = consonant_table.select("tr")
        headers = [th.text.strip() for th in rows[0].select("th")]
        places = []
        for i, th in enumerate(rows[0].select("th")):
            colspan = int(th.get("colspan", 1))
            places.extend([th.text.strip()] * colspan)
        
        for row_idx, row in enumerate(rows[1:]):
            manner = row.select_one("td.label-cell").text.strip()
            cells = row.select("td:not(.label-cell)")
            
            for col_idx, cell in enumerate(cells):
                if cell.text.strip() and "background-color: #d1d4da" not in str(cell):
                    symbol = cell.text.strip()
                    
                    # Check for audio
                    audio_file = None
                    audio_element = cell.select_one(".clickable-text")
                    if audio_element and "data-audio-url" in audio_element.attrs:
                        audio_file = audio_element["data-audio-url"]
                    
                    # Determine place from column
                    place = places[col_idx] if col_idx < len(places) else None
                    
                    extended_consonants.append({
                        "symbol": symbol,
                        "ipa": symbol,
                        "description": f"{manner} {place}".strip(),
                        "example": f"{manner} {place}".strip().lower(),
                        "audio_file": audio_file,
                        "is_extended": True,
                        "articulation_type": manner.lower(),
                        "articulation_place": place.lower() if place else None,
                        "row_position": row_idx,
                        "column_position": col_idx
                    })
    
    # Extract vowels
    vowel_table = soup.select_one("#vowels table")
    extended_vowels = []
    
    if vowel_table:
        rows = vowel_table.select("tr")
        heights = [th.text.strip() for th in rows[0].select("th")]
        positions = []
        for i, th in enumerate(rows[1].select("th")):
            positions.append(th.text.strip())
        
        for row_idx, row in enumerate(rows[2:]):
            height = row.select_one("td.label-cell").text.strip()
            cells = row.select("td:not(.label-cell)")
            
            for col_idx, cell in enumerate(cells):
                if cell.text.strip():
                    symbol = cell.text.strip()
                    
                    # Check for audio
                    audio_file = None
                    audio_element = cell.select_one(".clickable-text")
                    if audio_element and "data-audio-url" in audio_element.attrs:
                        audio_file = audio_element["data-audio-url"]
                    
                    # Determine position
                    position = positions[col_idx] if col_idx < len(positions) else None
                    
                    extended_vowels.append({
                        "symbol": symbol,
                        "ipa": symbol,
                        "description": f"{height} {position} vowel".strip(),
                        "example": f"{height} {position} vowel".strip().lower(),
                        "audio_file": audio_file,
                        "is_extended": True,
                        "row_position": row_idx,
                        "column_position": col_idx
                    })
    
    # Extract impossible phonemes
    impossible_table = soup.select("h2:-soup-contains('Impossible ones') + table")
    impossible_phonemes = []
    
    if impossible_table:
        rows = impossible_table[0].select("tr")
        places = []
        for i, th in enumerate(rows[0].select("th")):
            colspan = int(th.get("colspan", 1))
            places.extend([th.text.strip()] * colspan)
        
        for row_idx, row in enumerate(rows[1:]):
            manner = row.select_one("td.label-cell").text.strip()
            cells = row.select("td:not(.label-cell)")
            
            for col_idx, cell in enumerate(cells):
                if cell.text.strip() and "background-color: #d1d4da" in str(cell):
                    symbol = cell.text.strip()
                    
                    # Check for audio
                    audio_file = None
                    audio_element = cell.select_one(".clickable-text")
                    if audio_element and "data-audio-url" in audio_element.attrs:
                        audio_file = audio_element["data-audio-url"]
                    
                    # Determine place from column
                    place = places[col_idx] if col_idx < len(places) else None
                    
                    impossible_phonemes.append({
                        "symbol": symbol,
                        "ipa": symbol,
                        "description": f"{manner} {place}".strip(),
                        "example": f"{manner} {place}".strip().lower(),
                        "audio_file": audio_file,
                        "is_extended": True,
                        "articulation_type": manner.lower(),
                        "articulation_place": place.lower() if place else None,
                        "impossibility_reason": "Anatomically impossible due to articulatory constraints",
                        "row_position": row_idx,
                        "column_position": col_idx
                    })
    
    # Save extracted data to JSON
    data = {
        "consonants": extended_consonants,
        "vowels": extended_vowels,
        "impossible": impossible_phonemes
    }
    
    with open("extended_phonemes.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Extracted {len(extended_consonants)} consonants, {len(extended_vowels)} vowels, and {len(impossible_phonemes)} impossible phonemes")
    
    return data

if __name__ == "__main__":
    extract_extended_phonemes()
