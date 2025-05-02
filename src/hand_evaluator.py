from itertools import combinations
from src.card import Card

class HandEvaluator:
    
    # Hand rankings from highest to lowest
    HAND_RANKINGS = [
        "straight_flush",
        "four_of_a_kind",
        "full_house",
        "flush",
        "straight",
        "three_of_a_kind",
        "two_pair",
        "one_pair",
        "high_card"
    ]
    
    @staticmethod
    def evaluate_hand(hole_cards, community_cards):
        """Evaluate the best 5-card hand from hole cards and community cards."""
        all_cards = hole_cards + community_cards
        best_hand = None
        best_hand_value = float('-inf')
        
        for hand in combinations(all_cards, 5):
            hand_value = HandEvaluator._evaluate_five_card_hand(hand)
            if hand_value > best_hand_value:
                best_hand = hand
                best_hand_value = hand_value
        
        return best_hand, best_hand_value
    
    
    @staticmethod
    def _evaluate_five_card_hand(hand):
        """Evaluate a 5-card poker hand."""
        ranks = [card.rank for card in hand]
        suits = [card.suit for card in hand]
        rank_values = [card.rank_value for card in hand]
        rank_counts = {}
        
        for rank in ranks:
            rank_counts[rank] = rank_counts.get(rank, 0) + 1
        
        # Sort rank values descending for straight checks
        sorted_values = sorted(rank_values, reverse=True)
        is_flush = len(set(suits)) == 1
        
        # Check for straight (including ace-low)
        is_straight = False
        if len(set(sorted_values)) == 5:
            if sorted_values[0] - sorted_values[4] == 4:
                is_straight = True
            elif sorted_values == [12, 3, 2, 1, 0]:  # Ace-low straight (5-4-3-2-A)
                is_straight = True
                sorted_values = [3, 2, 1, 0, -1]  # Treat ace as low for scoring
        
        # Straight flush (including royal flush)
        if is_straight and is_flush:
            return 8000000 + sorted_values[0] * 10000
        
        # Four of a kind
        if 4 in rank_counts.values():
            four_rank_value = next(card.rank_value for card in hand 
                                if ranks.count(card.rank) == 4)
            kicker_value = next(card.rank_value for card in hand 
                            if ranks.count(card.rank) != 4)
            return 7000000 + four_rank_value * 10000 + kicker_value
        
        # Full house
        if sorted(rank_counts.values()) == [2, 3]:
            three_rank_value = next(card.rank_value for card in hand 
                                if ranks.count(card.rank) == 3)
            two_rank_value = next(card.rank_value for card in hand 
                                if ranks.count(card.rank) == 2)
            return 6000000 + three_rank_value * 10000 + two_rank_value * 100
        
        # Flush
        if is_flush:
            return 5000000 + sum(v * (10 ** (4 - i)) 
                                for i, v in enumerate(sorted_values))
        
        # Straight
        if is_straight:
            return 4000000 + sorted_values[0] * 10000
        
        # Three of a kind
        if 3 in rank_counts.values():
            three_rank_value = next(card.rank_value for card in hand 
                                if ranks.count(card.rank) == 3)
            kickers = sorted([v for v in sorted_values if v != three_rank_value], reverse=True)
            return 3000000 + three_rank_value * 10000 + kickers[0] * 100 + kickers[1]
        
        # Two pair
        if list(rank_counts.values()).count(2) == 2:
            pairs = sorted([v for v in set(rank_values) 
                        if rank_values.count(v) == 2], reverse=True)
            kicker = next(v for v in sorted_values if v not in pairs)
            return 2000000 + pairs[0] * 10000 + pairs[1] * 100 + kicker
        
        # One pair
        if 2 in rank_counts.values():
            pair_value = next(v for v in set(rank_values) 
                            if rank_values.count(v) == 2)
            kickers = sorted([v for v in sorted_values if v != pair_value], reverse=True)
            return 1000000 + pair_value * 10000 + kickers[0] * 100 + kickers[1] * 10 + kickers[2]
        
        # High card
        return sum(v * (10 ** (4 - i)) for i, v in enumerate(sorted_values))