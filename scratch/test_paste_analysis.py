import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.firewall.engine import FirewallEngine

def test_paste_analysis():
    engine = FirewallEngine()
    
    # 1. Test a known factual statement
    factual_text = "The Great Wall of China is a series of fortifications that were built across the historical northern borders of ancient Chinese states and Imperial China as protection against various nomadic groups from the Eurasian Steppe."
    print("\n--- Testing Factual Statement ---")
    result_fact = engine.evaluate_paste(factual_text)
    print(f"Score: {result_fact['final_risk_score']} | Zone: {result_fact['zone']}")
    print(f"Signals: {result_fact['signals']}")
    print(f"Reasoning: {result_fact['reasoning']}")
    
    # 2. Test a known hallucination (Confident)
    hallucination_text = "The 1987 Nobel Prize for the internet was awarded to Leonard Kleinrock for his work on packet switching. He received the award in Stockholm alongside other winners."
    print("\n--- Testing Confident Hallucination ---")
    result_hal = engine.evaluate_paste(hallucination_text)
    print(f"Score: {result_hal['final_risk_score']} | Zone: {result_hal['zone']}")
    print(f"Signals: {result_hal['signals']}")
    print(f"Reasoning: {result_hal['reasoning']}")
    # print(f"Heatmap: {result_hal['heatmap']}")

    # 3. Test a vague/hedged statement
    hedged_text = "I believe that there might have been some kind of award related to networking in the late 80s, but I'm not entirely sure if it was a Nobel Prize or something else."
    print("\n--- Testing Hedged Statement ---")
    result_hedge = engine.evaluate_paste(hedged_text)
    print(f"Score: {result_hedge['final_risk_score']} | Zone: {result_hedge['zone']}")
    print(f"Signals: {result_hedge['signals']}")
    print(f"Reasoning: {result_hedge['reasoning']}")

if __name__ == "__main__":
    test_paste_analysis()
