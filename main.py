#!/usr/bin/env python3

import argparse
import sys
import random
from src.card import Card
from src.poker_engine import PokerEngine

def parse_cards(card_str):
    """Parse a string of cards like 'Ah Ks' into a list of Card objects."""
    if not card_str:
        return []
    return [Card(card.strip()) for card in card_str.split()]

def parse_stacks(stacks_str):
    """Parse a string of chip stacks like '1000 800 1200 900 1100'."""
    return [int(stack) for stack in stacks_str.split()]

def parse_positions(positions_str):
    """Parse a string of positions like 'utg mp co btn sb'."""
    valid_positions = ['utg', 'utg+1', 'mp', 'mp+1', 'hj', 'co', 'btn', 'sb', 'bb']
    positions = positions_str.split()
    for pos in positions:
        if pos.lower() not in valid_positions:
            raise ValueError(f"Invalid position: {pos}. Valid positions are: {', '.join(valid_positions)}")
    return positions

def main():
    parser = argparse.ArgumentParser(description='GTO Poker Decision Engine')
    parser.add_argument('--hole-cards', type=str, required=True, help='Your two hole cards, e.g., "Ah Ks"')
    parser.add_argument('--community-cards', type=str, default='', help='Community cards, e.g., "Jd Td 2c" for flop')
    parser.add_argument('--stacks', type=str, required=True, help='Chip stacks for all 5 players, e.g., "1000 1200 800 1500 1300"')
    parser.add_argument('--positions', type=str, required=True, help='Positions for all 5 players, e.g., "utg mp co btn sb"')
    parser.add_argument('--pot-size', type=int, required=True, help='Current pot size')
    parser.add_argument('--facing-bet', type=int, default=0, help='Size of bet you are facing')
    parser.add_argument('--min-raise', type=int, default=0, help='Minimum raise size if applicable')
    parser.add_argument('--simulations', type=int, default=5000, help='Number of Monte Carlo simulations to run')
    
    args = parser.parse_args()
    
    try:
        hole_cards = parse_cards(args.hole_cards)
        if len(hole_cards) != 2:
            raise ValueError("You must provide exactly 2 hole cards.")
            
        community_cards = parse_cards(args.community_cards)
        if len(community_cards) > 5:
            raise ValueError("There can be at most 5 community cards.")
            
        stacks = parse_stacks(args.stacks)
        if len(stacks) != 5:
            raise ValueError("You must provide exactly 5 stack sizes.")
            
        positions = parse_positions(args.positions)
        if len(positions) != 5:
            raise ValueError("You must provide exactly 5 positions.")
            
        # Create and run the poker engine
        engine = PokerEngine(args.simulations)
        recommendation = engine.process_game_state(
            hole_cards,
            community_cards,
            stacks,
            positions,
            args.pot_size,
            args.facing_bet,
            args.min_raise
        )
        
        print(f"Recommendation: {recommendation}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()