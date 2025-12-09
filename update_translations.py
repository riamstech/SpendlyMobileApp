
import json
import os

translations = {
    "en": {"spendingRatio": "Spending Ratio", "ofIncome": "of income"},
    "es": {"spendingRatio": "Ratio de Gastos", "ofIncome": "de ingresos"},
    "fr": {"spendingRatio": "Ratio de Dépenses", "ofIncome": "du revenu"},
    "de": {"spendingRatio": "Ausgabenverhältnis", "ofIncome": "des Einkommens"},
    "pt-BR": {"spendingRatio": "Taxa de Gastos", "ofIncome": "da renda"},
    "zh-CN": {"spendingRatio": "支出比例", "ofIncome": "占收入"},
    "ja": {"spendingRatio": "支出比率", "ofIncome": "収入の"},
    "hi": {"spendingRatio": "खर्च अनुपात", "ofIncome": "आय का"},
    "ru": {"spendingRatio": "Коэффициент расходов", "ofIncome": "от дохода"},
    "ar": {"spendingRatio": "نسبة الإنفاق", "ofIncome": "من الدخل"}
}

base_dir = "/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/src/locales"

for lang, texts in translations.items():
    file_path = os.path.join(base_dir, lang, "common.json")
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if "dashboard" not in data:
                data["dashboard"] = {}
                
            # Add keys if missing (or update them to ensure they exist)
            data["dashboard"]["spendingRatio"] = texts["spendingRatio"]
            data["dashboard"]["ofIncome"] = texts["ofIncome"]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"Updated {lang}")
        except Exception as e:
            print(f"Error updating {lang}: {e}")
    else:
        print(f"File not found: {file_path}")
