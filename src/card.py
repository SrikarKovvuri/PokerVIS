class Card:
    """Represents a playing card."""
    
    SUITS = ['h', 'd', 'c', 's']  # hearts, diamonds, clubs, spades
    RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
    
    def __init__(self, card_str):
        """Initialize a card from a 2-character string like 'Ah' for Ace of hearts."""
        if len(card_str) != 2:
            raise ValueError(f"Invalid card string: {card_str}")
        
        rank, suit = card_str[0].upper(), card_str[1].lower()
        
        if rank not in self.RANKS:
            raise ValueError(f"Invalid rank: {rank}")
        if suit not in self.SUITS:
            raise ValueError(f"Invalid suit: {suit}")
            
        self.rank = rank
        self.suit = suit
        self.rank_value = self.RANKS.index(rank)
    
    def __str__(self):
        return f"{self.rank}{self.suit}"
    
    def __repr__(self):
        return self.__str__()
    
    def __eq__(self, other):
        if not isinstance(other, Card):
            return False
        return self.rank == other.rank and self.suit == other.suit
    
    def __hash__(self):
        return hash((self.rank, self.suit))