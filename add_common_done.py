
import json
import os

# Translations for "Done"
translations = {
    "en": "Done",
    "es": "Hecho",
    "fr": "Terminé",
    "de": "Fertig",
    "pt-BR": "Concluído",
    "zh-CN": "完成",
    "ja": "完了",
    "hi": "हो गया",
    "ru": "Готово",
    "ar": "تم"
}

base_dir = "/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/src/locales"

for lang, text in translations.items():
    file_path = os.path.join(base_dir, lang, "common.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if "common" not in data:
                data["common"] = {}
                
            # Add key
            data["common"]["done"] = text
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"Updated {lang}")
        except Exception as e:
            print(f"Error updating {lang}: {e}")
    else:
        print(f"File not found: {file_path}")
