import React, { useState, useEffect } from 'react';

const Home = () => {

  const initialPlayers = [
    { id: 1, name: 'Player 1', balance: 1000, bet: 0, cards: ['🂠', '🂠'] },
    { id: 2, name: 'Player 2', balance: 1000, bet: 0, cards: ['🂠', '🂠'] },
    { id: 3, name: 'Player 3', balance: 1000, bet: 0, cards: ['🂠', '🂠'] },
    { id: 4, name: 'Player 4', balance: 1000, bet: 0, cards: ['🂠', '🂠'] },
    { id: 5, name: 'Player 5', balance: 1000, bet: 0, cards: ['🂠', '🂠'] }
  ];

  
  const [communityCards, setCommunityCards] = useState(['🂠', '🂠', '🂠', '🂠', '🂠']);
  
  
  const [players, setPlayers] = useState(initialPlayers);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [potAmount, setPotAmount] = useState(0);
  const [gameStage, setGameStage] = useState('pre-flop'); 
  const [betAmount, setBetAmount] = useState('');
  const [gameMessage, setGameMessage] = useState('Game starting, place your bets!');
  

  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  

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
      return { ...player, cards };
    });
    
    setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
    setPlayers(newPlayers);
    
    return { remainingDeck: deck.slice(index), dealtPlayers: newPlayers };
  };

  const placeBet = () => {
    if (!betAmount || isNaN(betAmount) || parseInt(betAmount) <= 0) {
      setGameMessage('Please enter a valid bet amount');
      return;
    }
    
    const bet = parseInt(betAmount);
    if (bet > players[currentPlayer].balance) {
      setGameMessage(`You can't bet more than your balance ($${players[currentPlayer].balance})`);
      return;
    }
    
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer].bet += bet;
    updatedPlayers[currentPlayer].balance -= bet;
    
    setPotAmount(potAmount + bet);
    
   
    setBetAmount('');
    
    const nextPlayer = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextPlayer);
   
    setGameMessage(`${players[currentPlayer].name} bet $${bet}. ${players[nextPlayer].name}'s turn.`);
    
    setPlayers(updatedPlayers);
  };

  
  const check = () => {
   
    const nextPlayer = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextPlayer);
    
   
    setGameMessage(`${players[currentPlayer].name} checked. ${players[nextPlayer].name}'s turn.`);
  };

 
  const fold = () => {
   
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayer].cards = ['🂠', '🂠'];
    
   
    const nextPlayer = (currentPlayer + 1) % players.length;
    setCurrentPlayer(nextPlayer);
    
    
    setGameMessage(`${players[currentPlayer].name} folded. ${players[nextPlayer].name}'s turn.`);
    
    setPlayers(updatedPlayers);
  };

  
  const advanceStage = () => {
    const deck = generateDeck();
    
    switch (gameStage) {
      case 'pre-flop':

        setCommunityCards([deck[0], deck[1], deck[2], '🂠', '🂠']);
        setGameStage('flop');
        break;
      case 'flop':

        setCommunityCards(prevCards => [prevCards[0], prevCards[1], prevCards[2], deck[3], '🂠']);
        setGameStage('turn');
        break;
      case 'turn':
        setCommunityCards(prevCards => [prevCards[0], prevCards[1], prevCards[2], prevCards[3], deck[4]]);
        setGameStage('river');
        break;
      case 'river':
        const updatedPlayers = players.map(player => {
          if (player.cards.includes('🂠')) {
            return player; 
          }
          return {
            ...player,
            cards: [deck[5 + 2 * player.id - 2], deck[5 + 2 * player.id - 1]],
          };
        });
        setPlayers(updatedPlayers);
        setGameStage('showdown');
        setGameMessage('Showdown! Winner takes the pot.');
        break;
      case 'showdown':
        resetGame();
        break;
      default:
        break;
    }
  };

  const resetGame = () => {
    setPlayers(initialPlayers);
    setCommunityCards(['🂠', '🂠', '🂠', '🂠', '🂠']);
    setCurrentPlayer(0);
    setPotAmount(0);
    setGameStage('pre-flop');
    setBetAmount('');
    setGameMessage('New round! Place your bets.');
    dealCards();
  };

  useEffect(() => {
    dealCards();
  }, []);

  return (
    <div className="min-h-screen bg-green-800 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">Poker Table</h1>
      <div className="bg-green-900 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xl">Current Stage: {gameStage}</p>
            <p className="text-lg">Current Player: {players[currentPlayer].name}</p>
          </div>
          <div>
            <p className="text-xl">Pot: ${potAmount}</p>
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
            className={`bg-green-900 p-4 rounded-lg ${currentPlayer === index ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-bold">{player.name}</h3>
              <p>Balance: ${player.balance}</p>
            </div>
            
            <div className="flex justify-between mb-3">
              <p>Current Bet: ${player.bet}</p>
              {currentPlayer === index && (
                <div className="bg-yellow-500 text-xs text-black px-2 py-1 rounded">
                  ACTIVE
                </div>
              )}
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
        
        {gameStage !== 'showdown' ? (
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder="Bet amount"
                className="px-3 py-2 rounded text-black w-32"
              />
              <button 
                onClick={placeBet}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Bet
              </button>
            </div>
            
            <button 
              onClick={check}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
            >
              Check
            </button>
            
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
              New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;