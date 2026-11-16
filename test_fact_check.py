
from services.fact_check_service import fact_check_content
import json

sample_text = """
The human heart has four chambers.
The Sun revolves around the Earth.
"""

try:
    result = fact_check_content(sample_text)

    print("\nFACT CHECK RESULTS")
    print("=" * 50)

    print(json.dumps(result, indent=4, ensure_ascii=False))

except Exception as error:
    print("Fact-check test failed:", error)
