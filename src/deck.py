import random
from src.card import Card

class Deck:
    """Represents a deck of cards."""
    
    def __init__(self):
        """Initialize a standard 52-card deck."""
        self.cards = [Card(r + s) for r in Card.RANKS for s in Card.SUITS]
        self.reset()
    
    def reset(self):
        """Reset the deck to its initial state."""
        self.cards = [Card(r + s) for r in Card.RANKS for s in Card.SUITS]
        self.shuffle()
    
    def shuffle(self):
        """Shuffle the deck."""
        random.shuffle(self.cards)
    
    def deal(self, n=1):
        """Deal n cards from the deck."""
        if n > len(self.cards):
            raise ValueError(f"Cannot deal {n} cards, only {len(self.cards)} remaining")
        return [self.cards.pop() for _ in range(n)]
    
    def remove_cards(self, cards):
        """Remove specific cards from the deck."""
        for card in cards:
            if isinstance(card, str):
                card = Card(card)
            if card in self.cards:
                self.cards.remove(card)
            else:
                raise ValueError(f"Card {card} not in deck")
    
    def __len__(self):
        return len(self.cards)
    
    def __str__(self):
        return f"Deck with {len(self.cards)} cards remaining"