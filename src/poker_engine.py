from src.card import Card
from src.deck import Deck
from src.hand_evaluator import HandEvaluator
from src.monte_carlo import MonteCarloSimulation
from src.decision_engine import DecisionEngine
import random

class PokerEngine:
    """Main poker engine that processes game state and provides optimal decisions."""
    
    def __init__(self, num_simulations=5000):
        """Initialize the poker engine."""
        self.decision_engine = DecisionEngine(num_simulations)
    
    def process_game_state(self, player_cards, community_cards, player_stacks, 
                          player_positions, pot_size, facing_bet=0, min_raise=0):
        """Process the current game state and recommend an action."""
        # Convert string cards to Card objects if needed
        if isinstance(player_cards[0], str):
            player_cards = [Card(c) for c in player_cards]
        
        if community_cards and isinstance(community_cards[0], str):
            community_cards = [Card(c) for c in community_cards]
        
        # Get relevant game state information
        our_stack = player_stacks[4]  # Our player is the 5th player
        num_players_in_hand = sum(1 for stack in player_stacks if stack > 0)
        
        # Determine the effective stack (minimum of our stack and largest opponent stack)
        opponent_stacks = [stack for i, stack in enumerate(player_stacks) if i != 4 and stack > 0]
        effective_stack = min(our_stack, max(opponent_stacks)) if opponent_stacks else our_stack
        
        # Make a decision
        return self.decision_engine.make_decision(
            player_cards,
            community_cards,
            pot_size,
            effective_stack,
            player_positions[4],  # Our position
            num_players_in_hand,
            facing_bet,
            min_raise
        )