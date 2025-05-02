import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const MAIN_PLAYER_INDEX = 0;

  const initialPlayers = [
    { id: 1, name: 'You', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false, position: 'btn' },
    { id: 2, name: 'Player 2', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false, position: 'sb' },
    { id: 3, name: 'Player 3', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false, position: 'bb' },
    { id: 4, name: 'Player 4', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false, position: 'utg' },
    { id: 5, name: 'Player 5', balance: 1000, bet: 0, cards: ['🂠', '🂠'], isActive: true, hasFolded: false, hasActed: false, position: 'utg+1' }
  ];

  const [communityCards, setCommunityCards] = useState(['🂠', '🂠', '🂠', '🂠', '🂠']);
  const [communityCardsApi, setCommunityCardsApi] = useState(['', '', '', '', '']);
  const [players, setPlayers] = useState(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [potAmount, setPotAmount] = useState(0);
  const [gameStage, setGameStage] = useState('pre-flop');
  const [betAmount, setBetAmount] = useState('');
  const [gameMessage, setGameMessage] = useState('Game starting, place your bets!');
  const [maxBet, setMaxBet] = useState(0);
  const [dealerPosition, setDealerPosition] = useState(0);
  const [smallBlindPosition, setSmallBlindPosition] = useState(1);
  const [bigBlindPosition, setBigBlindPosition] = useState(2);
  const [blindAmount, setBlindAmount] = useState(10);
  const [roundEnded, setRoundEnded] = useState(false);
  const [lastRaisePosition, setLastRaisePosition] = useState(-1);
  const [activePlayers, setActivePlayers] = useState(5);
  const [recommendation, setRecommendation] = useState('');

  // Card input states
  const [card1Input, setCard1Input] = useState('');
  const [card2Input, setCard2Input] = useState('');
  const [showCardInput, setShowCardInput] = useState(false);
  const [communityCardInputs, setCommunityCardInputs] = useState(['', '', '', '', '']);
  const [showCommunityCardInput, setShowCommunityCardInput] = useState(false);

  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const displayToApiSuit = {
    '♠': 's',
    '♥': 'h',
    '♦': 'd',
    '♣': 'c'
  };

  const apiToDisplaySuit = {
    's': '♠',
    'h': '♥',
    'd': '♦',
    'c': '♣'
  };

  // Parse card input (e.g., "Ad" -> "Ad" for API, "A♦" for display)
  const parseCardInput = (input) => {
    if (!input || input.length < 2) return null;

    // Extract value and suit
    let value = input.slice(0, -1).toUpperCase();
    let suit = input.slice(-1).toLowerCase();

    // Validate the suit
    if (!['s', 'h', 'd', 'c'].includes(suit)) return null;

    // Validate the value
    if (!values.includes(value)) return null;

    // Return in the format expected by the API (e.g., "As")
    return `${value}${suit}`;
  };

  const getCardSymbol = (card) => {
    if (card === '🂠' || card === '') return '🂠';

    // Parse the card (format: "As", "Kh", etc.)
    const value = card.slice(0, -1); // Get value (A, K, etc.)
    const suit = card.slice(-1); // Get suit (s, h, etc.)

    // Convert the suit to a symbol
    const suitSymbol = apiToDisplaySuit[suit] || suit;

    // Return the formatted card
    return `${value}${suitSymbol}`;
  };

  // Update player's cards based on manual input
  const updatePlayerCards = () => {
    const card1 = parseCardInput(card1Input);
    const card2 = parseCardInput(card2Input);

    if (!card1 || !card2) {
      setGameMessage('Invalid card format. Use format like "As" for Ace of spades, "Kh" for King of hearts, etc.');
      return;
    }

    const updatedPlayers = [...players];
    updatedPlayers[MAIN_PLAYER_INDEX].cards = [card1, card2];

    setPlayers(updatedPlayers);
    setShowCardInput(false);

    // Trigger analysis with new cards
    analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
  };

  // Update community cards based on manual input
  const updateCommunityCards = () => {
    const parsedCards = communityCardInputs.map(input => parseCardInput(input));
    
    // Check if any entered card is invalid
    if (parsedCards.some((card, index) => {
      // Only validate cards that have input (not empty)
      if (communityCardInputs[index] && !card) return true;
      return false;
    })) {
      setGameMessage('Invalid card format in community cards. Use format like "As" for Ace of spades, "Kh" for King of hearts, etc.');
      return;
    }
  
    // Update display cards
    const newDisplayCards = parsedCards.map((card, index) => 
      card ? getCardSymbol(card) : '🂠'
    );
  
    // Update API format cards (empty string for unset cards)
    const newApiCards = parsedCards.map(card => card || '');
  
    setCommunityCards(newDisplayCards);
    setCommunityCardsApi(newApiCards);
    setShowCommunityCardInput(false);
  
    // Show appropriate message based on game stage
    switch (gameStage) {
      case 'flop':
        setGameMessage('Flop cards set. Betting starts.');
        break;
      case 'turn':
        setGameMessage('Turn card set. Betting starts.');
        break;
      case 'river':
        setGameMessage('River card set. Final betting round.');
        break;
    }
  
    // Trigger analysis if it's the main player's turn
    if (currentPlayer === MAIN_PLAYER_INDEX) {
      analyzeGameState(players, maxBet, potAmount, newApiCards);
    }
  };

  const generateDeck = () => {
    let deck = [];
    for (let suit of Object.values(apiToDisplaySuit)) {
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

    const newPlayers = players.map((player, playerIndex) => {
      // Only deal random cards to non-main players
      if (playerIndex !== MAIN_PLAYER_INDEX) {
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
      } else {
        // Main player gets placeholder cards
        return {
          ...player,
          cards: ['🂠', '🂠'],
          isActive: true,
          hasFolded: false,
          hasActed: false,
          bet: 0
        };
      }
    });

    setMaxBet(0);
    setLastRaisePosition(-1);
    setActivePlayers(players.length);
    setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
    setCommunityCardsApi(['', '', '', '', '']);
    setCommunityCardInputs(['', '', '', '', '']);
    setPlayers(newPlayers);
    setRoundEnded(false);
    setRecommendation('');
    setShowCardInput(true);
    setShowCommunityCardInput(true);

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

    setGameMessage(
      `Blinds posted. Small blind: $${blindAmount} from ${updatedPlayers[smallBlindPosition].name}, Big blind: $${blindAmount * 2} from ${updatedPlayers[bigBlindPosition].name}. ${updatedPlayers[nextPlayer].name}'s turn.`
    );

    setPlayers(updatedPlayers);

    // If it's the main player's turn and cards have been manually entered, analyze
    if (nextPlayer === MAIN_PLAYER_INDEX &&
      updatedPlayers[MAIN_PLAYER_INDEX].cards[0] !== '🂠' &&
      updatedPlayers[MAIN_PLAYER_INDEX].cards[0] !== '') {
        analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
    }
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

  const analyzeGameState = (playerList, currentMaxBet, pot, commCards) => {
    // Only analyze if the main player has actual cards set
    if (playerList[MAIN_PLAYER_INDEX].cards[0] === '🂠' || playerList[MAIN_PLAYER_INDEX].cards[0] === '') {
      setRecommendation("Please enter your cards first");
      setShowCardInput(true);
      return;
    }

    // Filter out placeholder cards from community cards
    const visibleCommCards = commCards.filter(card => card !== '🂠' && card !== '').join(' ');

    // Get hole cards
    const holeCards = playerList[MAIN_PLAYER_INDEX].cards.join(' ');

    // Get stack sizes and positions
    const stacks = playerList.map(player => player.balance).join(' ');
    const positions = playerList.map(player => player.position).join(' ');

    // Calculate minimum raise
    const minRaise = Math.max(blindAmount * 2, currentMaxBet * 2);

    // Prepare data for analysis
    const analysisData = {
      holeCards: String(holeCards),
      communityCards: String(visibleCommCards),
      stacks: String(stacks),
      positions: String(positions),
      potSize: String(pot),
      facingBet: String(currentMaxBet),
      minRaise: String(minRaise),
      simulations: String(5000)
    };

    // Log the data being sent for debugging
    console.log("Sending to API:", analysisData);

    const backendUrl = 'http://localhost:5000/analyze';
    setRecommendation("Analyzing hand...");

    axios.post(backendUrl, analysisData)
    .then(response => {
      console.log("API Response:", response.data);
      setRecommendation("The table has been analyzed. Check the display screen!");
    })
    .catch(error => {
      const errorMsg = error.response?.data?.error || "Please try again.";
      console.error("Backend error:", errorMsg);
      setRecommendation(`Error: ${errorMsg}`);
    });
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

    setGameMessage(
      `${updatedPlayers[currentPlayer].name} ${actionType} $${updatedPlayers[currentPlayer].bet}. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`
    );

    setPlayers(updatedPlayers);

    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);

      if (nextPlayerIndex === MAIN_PLAYER_INDEX) {
        setTimeout(() => {
          analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
        }, 500);
      }
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

    setGameMessage(
      `${updatedPlayers[currentPlayer].name} checked. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`
    );

    setPlayers(updatedPlayers);

    if (nextPlayerIndex === -1) {
      setTimeout(() => {
      advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);

      if (nextPlayerIndex === MAIN_PLAYER_INDEX) {
        setTimeout(() => {
        analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
        }, 500);
      }
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

    setGameMessage(
      `${updatedPlayers[currentPlayer].name} called $${maxBet}. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`
    );

    setPlayers(updatedPlayers);

    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);

      if (nextPlayerIndex === MAIN_PLAYER_INDEX) {
        setTimeout(() => {
          analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
        }, 500);
      }
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

    setGameMessage(
      `${updatedPlayers[currentPlayer].name} folded. ${nextPlayerIndex !== -1 ? `${updatedPlayers[nextPlayerIndex].name}'s turn.` : "Betting round complete."}`
    );

    setPlayers(updatedPlayers);

    if (nextPlayerIndex === -1) {
      setTimeout(() => {
        advanceStage();
      }, 1500);
    } else {
      setCurrentPlayer(nextPlayerIndex);

      if (nextPlayerIndex === MAIN_PLAYER_INDEX) {
        setTimeout(() => {
          analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
        }, 500);
      }
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

    if (nextPlayer === MAIN_PLAYER_INDEX) {
      setTimeout(() => {
        analyzeGameState(updatedPlayers, maxBet, potAmount, communityCardsApi);
      }, 500);
    }
  };

  const advanceStage = () => {
    resetBettingRound();
  
    switch (gameStage) {
      case 'pre-flop':
        // For flop - show input for 3 cards
        setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
        setCommunityCardsApi(['', '', '', '', '']);
        setCommunityCardInputs(['', '', '', '', '']);
        setShowCommunityCardInput(true);
        setGameStage('flop');
        setGameMessage('Please enter the flop cards (first 3 community cards)');
        break;
  
      case 'flop':
        // For turn - show input for 4th card
        // Only allow input if we have at least 3 valid cards
        if (communityCardsApi.filter(card => card !== '').length < 3) {
          setGameMessage('Please set all flop cards before proceeding to turn');
          return;
        }
        setShowCommunityCardInput(true);
        setGameStage('turn');
        setGameMessage('Please enter the turn card (4th community card)');
        break;
  
      case 'turn':
        // For river - show input for 5th card
        // Only allow input if we have 4 valid cards
        if (communityCardsApi.filter(card => card !== '').length < 4) {
          setGameMessage('Please set the turn card before proceeding to river');
          return;
        }
        setShowCommunityCardInput(true);
        setGameStage('river');
        setGameMessage('Please enter the river card (5th community card)');
        break;
  
      case 'river':
        // For showdown - check we have all 5 cards
        if (communityCardsApi.filter(card => card !== '').length < 5) {
          setGameMessage('Please set all community cards before showdown');
          return;
        }
  
        const updatedPlayers = players.map((player, index) => {
          if (player.hasFolded) return player;
          if (index === MAIN_PLAYER_INDEX) {
            return player; // Keep main player's cards as manually entered
          }
          // Generate random cards for other players (for display only)
          const deck = generateDeck();
          return {
            ...player,
            cards: [deck[0], deck[1]]
          };
        });
  
        const active = updatedPlayers.filter(p => !p.hasFolded);
        const winner = active.find(p => p.id === players[MAIN_PLAYER_INDEX].id) ||
                      active[Math.floor(Math.random() * active.length)];
  
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
    setCommunityCardsApi(['', '', '', '', '']);
    setPotAmount(0);
    setGameStage('pre-flop');
    setBetAmount('');
    setMaxBet(0);
    setRoundEnded(false);
    setRecommendation('');
    setCard1Input('');
    setCard2Input('');

    dealCards();
  };

  useEffect(() => {
    dealCards();
  }, []);

  return (
    <div className="min-h-screen bg-green-800 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Poker Assistant</h1>
  
      <div className="bg-green-900 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xl">Stage: {gameStage}</p>
            <p className="text-lg">Current Player: {players[currentPlayer]?.name}</p>
            <p className="text-sm">
              Dealer: {players[dealerPosition]?.name} | SB: {players[smallBlindPosition]?.name} | BB: {players[bigBlindPosition]?.name}
            </p>
          </div>
          <div>
            <p className="text-xl">Pot: ${potAmount}</p>
            <p className="text-lg">Current bet: ${maxBet}</p>
          </div>
        </div>
        <p className="bg-green-700 p-2 rounded">{gameMessage}</p>
      </div>
  
      {currentPlayer === MAIN_PLAYER_INDEX && recommendation && (
        <div className="bg-blue-900 p-4 rounded-lg mb-6 border-2 border-yellow-400">
          <h2 className="text-xl mb-2 text-center font-bold">Assistant Recommendation</h2>
          <p className="text-lg text-center">{recommendation}</p>
        </div>
      )}
  
      <div className="bg-green-700 p-4 mb-6 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl">Community Cards</h2>
          {!showCommunityCardInput && (
            <button
              onClick={() => setShowCommunityCardInput(true)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Edit Cards
            </button>
          )}
        </div>
  
        {showCommunityCardInput ? (
          <div className="bg-blue-800 p-3 rounded-lg mb-3">
            <h4 className="text-center mb-2">
              Enter community cards (e.g. As for Ace of spades, Kh for King of hearts)
            </h4>
            <div className="flex justify-center gap-2 mb-3 flex-wrap">
              {communityCardInputs.map((card, index) => (
                <input
                  key={index}
                  type="text"
                  value={card}
                  onChange={(e) => {
                    const newInputs = [...communityCardInputs];
                    newInputs[index] = e.target.value;
                    setCommunityCardInputs(newInputs);
                  }}
                  placeholder={`Card ${index + 1}`}
                  maxLength="3"
                  className="px-2 py-1 rounded text-black w-20 text-center"
                />
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={updateCommunityCards}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Set Cards
              </button>
              <button
                onClick={() => setShowCommunityCardInput(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
  
      <div className={`bg-green-900 p-4 rounded-lg mb-6 border-4 ${currentPlayer === MAIN_PLAYER_INDEX && !roundEnded ? 'border-yellow-400' : 'border-blue-800'}`}>
        <div className="flex justify-between mb-2">
          <h3 className="text-xl font-bold">
            {players[MAIN_PLAYER_INDEX].name} ({players[MAIN_PLAYER_INDEX].position.toUpperCase()})
            {MAIN_PLAYER_INDEX === dealerPosition && <span className="ml-2 text-sm">(D)</span>}
            {MAIN_PLAYER_INDEX === smallBlindPosition && <span className="ml-2 text-sm">(SB)</span>}
            {MAIN_PLAYER_INDEX === bigBlindPosition && <span className="ml-2 text-sm">(BB)</span>}
          </h3>
          <p className="text-lg">Balance: ${players[MAIN_PLAYER_INDEX].balance}</p>
        </div>
  
        <div className="flex justify-between mb-3">
          <p className="text-lg">Bet: ${players[MAIN_PLAYER_INDEX].bet}</p>
          {currentPlayer === MAIN_PLAYER_INDEX && !roundEnded ? (
            <div className="bg-yellow-500 text-black px-2 py-1 rounded">YOUR TURN</div>
          ) : players[MAIN_PLAYER_INDEX].hasFolded ? (
            <div className="bg-red-500 text-white px-2 py-1 rounded">FOLDED</div>
          ) : null}
        </div>
  
        {showCardInput && (
          <div className="bg-blue-800 p-3 rounded-lg mb-3">
            <h4 className="text-center mb-2">
              Enter your cards (e.g. As for Ace of spades, Kh for King of hearts)
            </h4>
            <div className="flex justify-center gap-3 mb-3">
              <input
                type="text"
                value={card1Input}
                onChange={(e) => setCard1Input(e.target.value)}
                placeholder="First card (e.g. As)"
                maxLength="3"
                className="px-3 py-2 rounded text-black w-24 text-center"
              />
              <input
                type="text"
                value={card2Input}
                onChange={(e) => setCard2Input(e.target.value)}
                placeholder="Second card (e.g. Kh)"
                maxLength="3"
                className="px-3 py-2 rounded text-black w-24 text-center"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={updatePlayerCards}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Set Cards
              </button>
            </div>
          </div>
        )}
  
        <div className="flex justify-center gap-4">
          {players[MAIN_PLAYER_INDEX].cards.map((card, cardIndex) => {
            const displayCard = getCardSymbol(card);
            return (
              <div
                key={cardIndex}
                className={`bg-white h-24 w-16 rounded-md flex items-center justify-center text-3xl
                  ${displayCard.includes('♥') || displayCard.includes('♦') ? 'text-red-600' : 'text-black'}`}
              >
                {displayCard}
              </div>
            );
          })}
        </div>
  
        {!showCardInput && (players[MAIN_PLAYER_INDEX].cards[0] === '🂠' || players[MAIN_PLAYER_INDEX].cards[0] === '') && (
          <div className="text-center mt-3">
            <button
              onClick={() => setShowCardInput(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm"
            >
              Change Cards
            </button>
          </div>
        )}
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {players.slice(1).map((player, index) => {
          const playerIndex = index + 1;
  
          return (
            <div
              key={player.id}
              className={`bg-green-900 p-3 rounded-lg ${player.hasFolded ? 'opacity-60' : ''}
                ${currentPlayer === playerIndex && !roundEnded ? 'ring-2 ring-yellow-400' : ''}
                ${playerIndex === dealerPosition ? 'border-b-2 border-white' : ''}
                ${playerIndex === smallBlindPosition ? 'border-l-2 border-yellow-300' : ''}
                ${playerIndex === bigBlindPosition ? 'border-r-2 border-yellow-500' : ''}`}
            >
              <div className="flex justify-between mb-2">
                <h3 className="text-md font-bold">
                  {player.name} ({player.position.toUpperCase()})
                  {playerIndex === dealerPosition && <span className="ml-1 text-xs">(D)</span>}
                  {playerIndex === smallBlindPosition && <span className="ml-1 text-xs">(SB)</span>}
                  {playerIndex === bigBlindPosition && <span className="ml-1 text-xs">(BB)</span>}
                </h3>
                <p className="text-sm">Balance: ${player.balance}</p>
              </div>
  
              <div className="flex justify-between mb-2">
                <p className="text-sm">Bet: ${player.bet}</p>
                {currentPlayer === playerIndex && !roundEnded ? (
                  <div className="bg-yellow-500 text-xs text-black px-2 py-1 rounded">ACTIVE</div>
                ) : player.hasFolded ? (
                  <div className="bg-red-500 text-xs text-white px-2 py-1 rounded">FOLDED</div>
                ) : null}
              </div>
  
              <div className="flex justify-center gap-2">
                {['🂠', '🂠'].map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="bg-white h-12 w-8 rounded-md flex items-center justify-center text-md"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
              Next Stage ({gameStage === 'pre-flop' ? 'Flop' : gameStage === 'flop' ? 'Turn' : gameStage === 'turn' ? 'River' : 'Showdown'})
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
}  

export default Home;