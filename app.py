from flask import Flask, render_template, request, jsonify
import json
from src.card import Card
from src.poker_engine import PokerEngine
from arduino_msg import send_to_arduino
import os
from flask_cors import CORS
app = Flask(__name__)

CORS(app)
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        
        # Parse the hole cards
        hole_cards = [Card(card.strip()) for card in data['holeCards'].split()]
        if len(hole_cards) != 2:
            return jsonify({"error": "You must provide exactly 2 hole cards."}), 400
            
        # Parse the community cards
        community_cards = []
        if data['communityCards']:
            community_cards = [Card(card.strip()) for card in data['communityCards'].split()]
            if len(community_cards) > 5:
                return jsonify({"error": "There can be at most 5 community cards."}), 400
                
        # Parse the stacks
        stacks = [int(stack) for stack in data['stacks'].split()]
        if len(stacks) != 5:
            return jsonify({"error": "You must provide exactly 5 stack sizes."}), 400
            
        # Parse the positions
        positions = data['positions'].split()
        valid_positions = ['utg', 'utg+1', 'mp', 'mp+1', 'hj', 'co', 'btn', 'sb', 'bb']
        for pos in positions:
            if pos.lower() not in valid_positions:
                return jsonify({"error": f"Invalid position: {pos}. Valid positions are: {', '.join(valid_positions)}"}), 400
        if len(positions) != 5:
            return jsonify({"error": "You must provide exactly 5 positions."}), 400
            
        # Parse other inputs
        pot_size = int(data['potSize'])
        facing_bet = int(data['facingBet']) if data['facingBet'] else 0
        min_raise = int(data['minRaise']) if data['minRaise'] else 0
        simulations = int(data['simulations']) if data['simulations'] else 5000
        
        # Create and run the poker engine
        engine = PokerEngine(simulations)
        recommendation = engine.process_game_state(
            hole_cards,
            community_cards,
            stacks,
            positions,
            pot_size,
            facing_bet,
            min_raise
        )
        
        # Get the current game stage
        if len(community_cards) == 0:
            stage = "Pre-flop"
        elif len(community_cards) == 3:
            stage = "Flop"
        elif len(community_cards) == 4:
            stage = "Turn"
        elif len(community_cards) == 5:
            stage = "River"
        else:
            stage = "Unknown"

        # SEND TO ARDUINO, which will print to LCD board
        send_to_arduino(recommendation, "/dev/ttyACM0", 9600)
        
        
        return jsonify({
            "recommendation": recommendation,
            "stage": stage,
            "simulations": simulations
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)