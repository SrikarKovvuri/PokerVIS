import math
import random
from src.card import Card
from src.monte_carlo import MonteCarloSimulation

class DecisionEngine:
    """Makes GTO-based poker decisions."""
    
    def __init__(self, num_simulations=10000):
        """Initialize the decision engine."""
        self.monte_carlo = MonteCarloSimulation(num_simulations)
    
    def make_decision(self, hole_cards, community_cards, pot_size, effective_stack, 
                     player_position, num_players_in_hand, facing_bet=0, min_raise=0):
        """Make a GTO-based decision."""
        # Calculate pot odds
        pot_odds = facing_bet / (pot_size + facing_bet) if facing_bet > 0 else 0
        
        # Run Monte Carlo simulation to get equity
        sim_results = self.monte_carlo.simulate(hole_cards, community_cards, num_players_in_hand - 1)
        equity = sim_results['equity']
        
        # Calculate EV of calling
        ev_call = (equity * (pot_size + facing_bet)) - ((1 - equity) * facing_bet)
        
        # Basic GTO decision logic
        if facing_bet == 0:  # No bet to call, should we bet/raise?
            if equity > 0.7:  # Very strong hand
                bet_size = self._calculate_value_bet(pot_size, effective_stack, equity)
                return f"raise {bet_size}"
            elif equity > 0.5:  # Decent hand
                bet_size = self._calculate_value_bet(pot_size, effective_stack, equity, smaller=True)
                return f"raise {bet_size}"
            elif equity > 0.35:  # Marginal hand
                if player_position in ['cutoff', 'button', 'small_blind']:  # Late position
                    return "raise {}".format(pot_size // 2)
                else:
                    return "check"
            else:  # Weak hand
                if random.random() < 0.2:  # Bluff occasionally
                    return "raise {}".format(pot_size // 2)
                else:
                    return "check"
        else:  # Facing a bet
            if equity > pot_odds + 0.1:  # Significantly better than pot odds
                # Calculate optimal raise size
                if equity > 0.7:  # Very strong hand
                    raise_size = self._calculate_value_raise(pot_size, facing_bet, effective_stack, equity)
                    return f"raise {raise_size}"
                elif equity > 0.55:  # Good hand
                    return "call"
                else:  # Marginal hand with slight edge
                    return "call"
            elif equity > pot_odds:  # Slightly better than pot odds
                return "call"
            else:  # Worse than pot odds
                # Calculate implied odds and decide whether to call
                implied_odds_factor = self._calculate_implied_odds(community_cards, equity)
                if equity > pot_odds - implied_odds_factor:  # Good implied odds
                    return "call"
                elif equity > pot_odds - 0.1 and random.random() < 0.3:  # Occasional call with slightly bad odds
                    return "call"
                else:
                    return "fold"
    
    def _calculate_value_bet(self, pot_size, effective_stack, equity, smaller=False):
        """Calculate optimal bet size for value."""
        multiplier = 0.5 if smaller else 0.75
        bet_size = int(pot_size * multiplier)
        return min(bet_size, effective_stack)
    
    def _calculate_value_raise(self, pot_size, facing_bet, effective_stack, equity):
        """Calculate optimal raise size."""
        if equity > 0.85:  # Very strong hand - raise bigger
            target_size = pot_size * 2 + facing_bet
        else:  # Strong hand - standard raise
            target_size = pot_size + facing_bet * 2.5
        
        return min(int(target_size), effective_stack)
    
    def _calculate_implied_odds(self, community_cards, equity):
        """Calculate the implied odds factor based on board texture and hand strength."""
        draw_potential = 0
        
        # More implied odds on draw-heavy boards
        if len(community_cards) >= 3:  # Flop or later
            ranks = [card.rank for card in community_cards]
            suits = [card.suit for card in community_cards]
            
            # Check for flush draw potential
            if len(set(suits)) <= 3:  # At least 3 cards of same suit
                draw_potential += 0.05
            
            # Check for straight draw potential
            rank_values = sorted([card.rank_value for card in community_cards])
            if max(rank_values) - min(rank_values) <= 4:  # Connected board
                draw_potential += 0.05
        
        # Less implied odds for marginal hands
        if 0.25 < equity < 0.45:  # Medium strength hands have better implied odds
            return 0.1 + draw_potential
        else:  # Very weak or very strong hands have worse implied odds
            return 0.05 + draw_potential