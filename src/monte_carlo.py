import random
from itertools import combinations
from src.card import Card
from src.deck import Deck
from src.hand_evaluator import HandEvaluator

class MonteCarloSimulation:
    """Runs Monte Carlo simulations to estimate the equity of a poker hand."""
    
    def __init__(self, num_simulations=10000):
        """Initialize the simulation."""
        self.num_simulations = num_simulations
    
    def simulate(self, hole_cards, community_cards, num_opponents=4):
        """Run simulations to determine the equity of the given hand."""
        # Convert string representations to Card objects if needed
        hole_cards = [Card(c) if isinstance(c, str) else c for c in hole_cards]
        community_cards = [Card(c) if isinstance(c, str) else c for c in community_cards]
        
        known_cards = hole_cards + community_cards
        remaining_cards_needed = 5 - len(community_cards)  # cards needed to complete the board
        
        wins = 0
        ties = 0
        
        for _ in range(self.num_simulations):
            # Create a new deck and remove known cards
            deck = Deck()
            try:
                deck.remove_cards(known_cards)
            except ValueError:
                # If there's an error removing cards, there might be duplicates
                continue
            
            # Deal cards to opponents
            opponent_holes = []
            for _ in range(num_opponents):
                opponent_hole = deck.deal(2)
                opponent_holes.append(opponent_hole)
            
            # Deal remaining community cards
            simulated_community = community_cards.copy()
            if remaining_cards_needed > 0:
                simulated_community.extend(deck.deal(remaining_cards_needed))
            
            # Evaluate hero's hand
            hero_hand, hero_value = HandEvaluator.evaluate_hand(hole_cards, simulated_community)
            
            # Evaluate opponents' hands
            opponent_results = []
            for opp_hole in opponent_holes:
                opp_hand, opp_value = HandEvaluator.evaluate_hand(opp_hole, simulated_community)
                opponent_results.append(opp_value)
            
            # Compare results
            best_opponent = max(opponent_results)
            if hero_value > best_opponent:
                wins += 1
            elif hero_value == best_opponent:
                ties += 1
        
        equity = (wins + ties / 2) / self.num_simulations
        return {
            'equity': equity,
            'win_rate': wins / self.num_simulations,
            'tie_rate': ties / self.num_simulations,
            'loss_rate': (self.num_simulations - wins - ties) / self.num_simulations
        }