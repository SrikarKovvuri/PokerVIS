import React, { useState, useEffect } from 'react';

const Home = () => {
  // Player data structure
  const initialPlayers = [
    { id: 1, name: 'Player 1', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false },
    { id: 2, name: 'Player 2', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false },
    { id: 3, name: 'Player 3', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false },
    { id: 4, name: 'Player 4', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false },
    { id: 5, name: 'Player 5', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false }
  ];

  // Community cards
  const [communityCards, setCommunityCards] = useState(['🂠', '🂠', '🂠', '🂠', '🂠']);
  
  // Game state
  const [players, setPlayers] = useState(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [potAmount, setPotAmount] = useState(0);
  const [gameStage, setGameStage] = useState('pre-flop'); // pre-flop, flop, turn, river, showdown
  const [betAmount, setBetAmount] = useState('');
  const [gameMessage, setGameMessage] = useState('Game starting, place your bets!');
  const [maxBet, setMaxBet] = useState(0);
  const [dealerPosition, setDealerPosition] = useState(0);
  const [smallBlindPosition, setSmallBlindPosition] = useState(1);
  const [bigBlindPosition, setBigBlindPosition] = useState(2);
  const [blindAmount, setBlindAmount] = useState(10); // Small blind amount (big blind is double)
  const [roundEnded, setRoundEnded] = useState(false);
  const [lastRaisePosition, setLastRaisePosition] = useState(-1);
  const [activePlayers, setActivePlayers] = useState(5);

  // Deck of cards
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  // Generate and shuffle deck
  const generateDeck = () => {
    let deck = [];
    for (let suit of suits) {
      for (let value of values) {
        deck.push(`${value}${suit}`);
      }
    }
    return shuffleDeck(deck);
  };

  const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const dealCards = () => {
    const deck = generateDeck();
    let index = 0;
    
    const newPlayers = players.map(player => {
      const cards = [deck[index], deck[index + 1]];
      index += 2;
      return { 
        ...player, 
        cards,
        isActive: true,
        hasFolded: false,
        hasActed: false,
        bet: 0
      };
    });
    
    setMaxBet(0);
    setLastRaisePosition(-1);
    setActivePlayers(players.length);
    
    setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
    setPlayers(newPlayers);
    
    setRoundEnded(false);
    
    postBlinds(newPlayers);
    
    return { remainingDeck: deck.slice(index), dealtPlayers: newPlayers };
  };

  const postBlinds = (newPlayers) => {
    const updatedPlayers = [...newPlayers];
    
    updatedPlayers[smallBlindPosition].bet = blindAmount;
    updatedPlayers[smallBlindPosition].balance -= blindAmount;
    
    updatedPlayers[bigBlindPosition].bet = blindAmount * 2;
    updatedPlayers[bigBlindPosition].balance -= blindAmount * 2;
    
  
    setMaxBet(blindAmount * 2);
    
 
    const nextPlayer = findNextActivePlayer(updatedPlayers, (bigBlindPosition + 1) % players.length);
    setCurrentPlayer(nextPlayer);
    
    
    setPotAmount(blindAmount * 3);
    
    setGameMessage(`Blinds posted. Small blind: $${blindAmount} from ${updatedPlayers[smallBlindPosition].name}, Big blind: $${blindAmount * 2} from ${updatedPlayers[bigBlindPosition].name}. ${updatedPlayers[nextPlayer].name}'s turn.`);
    
    setPlayers(updatedPlayers);
  };

  
  const findNextActivePlayer = (playerList, startIndex) => {
    let count = 0;
    let currentIndex = startIndex;
    
    
    while (count < playerList.length) {
      if (!playerList[currentIndex].hasFolded) {
        return currentIndex;
      }
      currentIndex = (currentIndex + 1) % playerList.length;
      count++;
    }
    
    return -1;
  };

  const placeBet = () => {
    if (!betAmount || isNaN(betAmount) || parseInt(betAmount) <= 0) {
      setGameMessage('Please enter a valid bet amount');
      return;
    }
    
    const bet = parseInt(betAmount);
    const currentBet = players[currentPlayer].bet;
    const amountToCall = maxBet - currentBet;
    
    if (bet > players[currentPlayer].balance) {
      setGameMessage(`You can't bet more than your balance ($${players[currentPlayer].balance})`);
      return;
    }
    
    if (bet < amountToCall) {
      setGameMessage(`You need at least $${amountToCall} to call the current bet`);
      return;
    }
    
    const updatedPlayers = [...players];

    if (bet > amountToCall) {
      setLastRaisePosition(currentPlayer);
      setMaxBet(currentBet + bet);
      
      updatedPlayers.forEach((player, i) => {
        if (i !== currentPlayer && !player.hasFolded) {
          player.hasActed = false;
        }
      });
    }
    
    updatedPlayers[currentPlayer].bet += bet;
    updatedPlayers[currentPlayer].balance -= bet;
    updatedPlayers[currentPlayer].hasActed = true;
    
    setPotAmount(potAmount + bet);
    
    setBetAmount('');
    
    const actionType = bet === amountToCall ? "called" : "raised to";
    
    const nextPlayerIndex = findNextActivePlayerInBettingRound(updatedPlayers);
    
    setGameMessage(`${updatedPlayers[currentPlayer].name} ${actionType} $${updatedPlayers[currentPlayer].bet}. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`);
    
    setPlayers(updatedPlayers);
    
    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);
    }
  };
  const findNextActivePlayerInBettingRound = (playerList) => {
    let nextIndex = (currentPlayer + 1) % playerList.length;
    let count = 0;
    
    while (count < playerList.length) {
      if (!playerList[nextIndex].hasFolded && !playerList[nextIndex].hasActed) {
        return nextIndex;
      }
      nextIndex = (nextIndex + 1) % playerList.length;
      count++;
    }
    
    return -1;
  };

  const check = () => {
    if (maxBet > 0 && players[currentPlayer].bet < maxBet) {
      setGameMessage(`You can't check when there's a bet to call. You need to call $${maxBet - players[currentPlayer].bet}`);
      return;
    }
    
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer].hasActed = true;
   
    const nextPlayerIndex = findNextActivePlayerInBettingRound(updatedPlayers);
    
    setGameMessage(`${updatedPlayers[currentPlayer].name} checked. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`);
    
    setPlayers(updatedPlayers);
    
    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);
    }
  };


  const call = () => {
    const currentBet = players[currentPlayer].bet;
    const amountToCall = maxBet - currentBet;
    

    if (amountToCall > players[currentPlayer].balance) {
      setGameMessage(`You don't have enough money to call. You can go all-in or fold.`);
      return;
    }
    
    const updatedPlayers = [...players];
    
    updatedPlayers[currentPlayer].bet += amountToCall;
    updatedPlayers[currentPlayer].balance -= amountToCall;
    updatedPlayers[currentPlayer].hasActed = true;
    
    setPotAmount(potAmount + amountToCall);
    
    const nextPlayerIndex = findNextActivePlayerInBettingRound(updatedPlayers);
    
    setGameMessage(`${updatedPlayers[currentPlayer].name} called $${maxBet}. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`);
    
    setPlayers(updatedPlayers);
    
    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);
    }
  };

  const fold = () => {
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer].hasFolded = true;
    updatedPlayers[currentPlayer].cards = ['🂠', '🂠'];
    
    setActivePlayers(prev => prev - 1);
    
    const remainingPlayers = updatedPlayers.filter(p => !p.hasFolded);
    if (remainingPlayers.length === 1) {
      const winner = remainingPlayers[0];
      winner.balance += potAmount;
      
      setGameMessage(`${updatedPlayers[currentPlayer].name} folded. ${winner.name} wins the pot of $${potAmount}!`);
      setRoundEnded(true);
      
      setTimeout(() => {
        resetGame();
      }, 3000);
      
      setPlayers(updatedPlayers);
      return;
    }
    
    const nextPlayerIndex = findNextActivePlayerInBettingRound(updatedPlayers);

    setGameMessage(`${updatedPlayers[currentPlayer].name} folded. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`);
    
    setPlayers(updatedPlayers);
    
    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);
    }
  };

  const resetBettingRound = () => {
    const updatedPlayers = [...players];
    updatedPlayers.forEach(player => {
      player.hasActed = false;
    });
    
    setPlayers(updatedPlayers);
    setLastRaisePosition(-1);
    
    const nextPlayer = findNextActivePlayer(updatedPlayers, (dealerPosition + 1) % players.length);
    setCurrentPlayer(nextPlayer);
  };

  const advanceStage = () => {
    const deck = generateDeck();
    
    resetBettingRound();
    
    switch (gameStage) {
      case 'pre-flop':
        setCommunityCards([deck[0], deck[1], deck[2], '🂠', '🂠']);
        setGameStage('flop');
        setGameMessage('Flop revealed. Betting starts.');
        break;
        
      case 'flop':
        setCommunityCards(prevCards => [prevCards[0], prevCards[1], prevCards[2], deck[3], '🂠']);
        setGameStage('turn');
        setGameMessage('Turn card revealed. Betting starts.');
        break;
        
      case 'turn':
        setCommunityCards(prevCards => [prevCards[0], prevCards[1], prevCards[2], prevCards[3], deck[4]]);
        setGameStage('river');
        setGameMessage('River card revealed. Final betting round.');
        break;
        
      case 'river':
        const updatedPlayers = players.map(player => {
          if (player.hasFolded) {
            return player;
          }
          return {
            ...player,
            cards: [deck[5 + 2 * player.id - 2], deck[5 + 2 * player.id - 1]],
          };
        });
        
        const activePlayers = updatedPlayers.filter(p => !p.hasFolded);
        const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        
        winner.balance += potAmount;
        
        setPlayers(updatedPlayers);
        setGameStage('showdown');
        setGameMessage(`Showdown! ${winner.name} wins the pot of $${potAmount}!`);
        setRoundEnded(true);
        
        setTimeout(() => {
          resetGame();
        }, 5000);
        break;
        
      case 'showdown':
        resetGame();
        break;
        
      default:
        break;
    }
  };

  const resetGame = () => {
    const newDealerPosition = (dealerPosition + 1) % players.length;
    setDealerPosition(newDealerPosition);
    
    const newSmallBlindPosition = (newDealerPosition + 1) % players.length;
    const newBigBlindPosition = (newDealerPosition + 2) % players.length;
    
    setSmallBlindPosition(newSmallBlindPosition);
    setBigBlindPosition(newBigBlindPosition);
    
    setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
    setPotAmount(0);
    setGameStage('pre-flop');
    setBetAmount('');
    setMaxBet(0);
    setRoundEnded(false);
    
    dealCards();
  };

  useEffect(() => {
    dealCards();
  }, []);

  return (
    <div className="min-h-screen bg-green-800 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Texas Hold'em Poker</h1>
      

      <div className="bg-green-900 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xl">Stage: {gameStage}</p>
            <p className="text-lg">Current Player: {players[currentPlayer]?.name}</p>
            <p className="text-sm">Dealer: {players[dealerPosition]?.name} | SB: {players[smallBlindPosition]?.name} | BB: {players[bigBlindPosition]?.name}</p>
          </div>
          <div>
            <p className="text-xl">Pot: ${potAmount}</p>
            <p className="text-lg">Current bet: ${maxBet}</p>
          </div>
        </div>
        <p className="bg-green-700 p-2 rounded">{gameMessage}</p>
      </div>
      
      <div className="bg-green-700 p-4 mb-6 rounded-lg">
        <h2 className="text-xl mb-2 text-center">Community Cards</h2>
        <div className="flex justify-center gap-2">
          {communityCards.map((card, index) => (
            <div 
              key={index} 
              className={`bg-white text-black h-20 w-14 rounded-md flex items-center justify-center text-2xl
                ${card.includes('♥') || card.includes('♦') ? 'text-red-600' : 'text-black'}`}
            >
              {card}
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {players.map((player, index) => (
          <div 
            key={player.id} 
            className={`bg-green-900 p-4 rounded-lg ${player.hasFolded ? 'opacity-60' : ''} 
              ${currentPlayer === index && !roundEnded ? 'ring-2 ring-yellow-400' : ''}
              ${index === dealerPosition ? 'border-b-4 border-white' : ''}
              ${index === smallBlindPosition ? 'border-l-4 border-yellow-300' : ''}
              ${index === bigBlindPosition ? 'border-r-4 border-yellow-500' : ''}`}
          >
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-bold">
                {player.name}
                {index === dealerPosition && <span className="ml-2 text-sm">(D)</span>}
                {index === smallBlindPosition && <span className="ml-2 text-sm">(SB)</span>}
                {index === bigBlindPosition && <span className="ml-2 text-sm">(BB)</span>}
              </h3>
              <p>Balance: ${player.balance}</p>
            </div>
            
            <div className="flex justify-between mb-3">
              <p>Bet: ${player.bet}</p>
              {currentPlayer === index && !roundEnded ? (
                <div className="bg-yellow-500 text-xs text-black px-2 py-1 rounded">
                  ACTIVE
                </div>
              ) : player.hasFolded ? (
                <div className="bg-red-500 text-xs text-white px-2 py-1 rounded">
                  FOLDED
                </div>
              ) : null}
            </div>
            
            <div className="flex justify-center gap-2">
              {player.cards.map((card, cardIndex) => (
                <div 
                  key={cardIndex} 
                  className={`bg-white h-16 w-12 rounded-md flex items-center justify-center text-xl
                    ${card.includes('♥') || card.includes('♦') ? 'text-red-600' : 'text-black'}`}
                >
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-green-900 p-4 rounded-lg">
        <h2 className="text-xl mb-4">Actions</h2>
        
        {!roundEnded ? (
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={check}
              disabled={maxBet > 0 && players[currentPlayer].bet < maxBet}
              className={`${maxBet > 0 && players[currentPlayer].bet < maxBet ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'} px-4 py-2 rounded`}
            >
              Check
            </button>
            
            {maxBet > 0 && players[currentPlayer].bet < maxBet && (
              <button 
                onClick={call}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Call ${maxBet}
              </button>
            )}
            
       
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder={maxBet > 0 ? "Raise amount" : "Bet amount"}
                className="px-3 py-2 rounded text-black w-32"
              />
              <button 
                onClick={placeBet}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                {maxBet > 0 ? "Raise" : "Bet"}
              </button>
            </div>
            
            <button 
              onClick={fold}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Fold
            </button>
            
            <button 
              onClick={advanceStage}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded ml-auto"
            >
              Next Stage ({gameStage === 'pre-flop' ? 'Flop' : 
                          gameStage === 'flop' ? 'Turn' : 
                          gameStage === 'turn' ? 'River' : 'Showdown'})
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={resetGame}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-lg"
            >
              New Hand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;