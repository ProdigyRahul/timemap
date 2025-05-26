// Quotes management for TimeMap extension

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const quoteTextElement = document.getElementById('quote-text');
  const quoteAuthorElement = document.getElementById('quote-author');
  const quoteSection = document.querySelector('.quote-section');

  // Check if quotes should be displayed
  chrome.storage.sync.get(['showQuotes'], (result) => {
    if (result.showQuotes === 'never') {
      quoteSection.style.display = 'none';
    } else {
      loadQuote(result.showQuotes);
    }
  });

  // Functions
  function loadQuote(quotePreference = 'daily') {
    // Check if we need to refresh the quote
    chrome.storage.sync.get(['currentQuote', 'quoteLastUpdated'], (result) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastUpdated = result.quoteLastUpdated || 0;
      
      // If it's a new day or we always show a new quote, or we don't have a quote yet
      if (quotePreference === 'always' || !result.currentQuote || (quotePreference === 'daily' && lastUpdated < today)) {
        // Get a random quote
        const randomQuote = getRandomQuote();
        quoteTextElement.textContent = `"${randomQuote.text}"`;
        quoteAuthorElement.textContent = `— ${randomQuote.author}`;
        
        // Save the current quote
        chrome.storage.sync.set({ 
          currentQuote: randomQuote,
          quoteLastUpdated: now.getTime()
        });
      } else if (result.currentQuote) {
        // Use the saved quote
        quoteTextElement.textContent = `"${result.currentQuote.text}"`;
        quoteAuthorElement.textContent = `— ${result.currentQuote.author}`;
      }
    });
  }

  function getRandomQuote() {
    // Collection of motivational quotes
    const quotes = [
      {
        text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
        author: "Stephen Covey"
      },
      {
        text: "Time is what we want most, but what we use worst.",
        author: "William Penn"
      },
      {
        text: "The bad news is time flies. The good news is you're the pilot.",
        author: "Michael Altshuler"
      },
      {
        text: "Time is the most valuable thing a man can spend.",
        author: "Theophrastus"
      },
      {
        text: "Lost time is never found again.",
        author: "Benjamin Franklin"
      },
      {
        text: "Time is the scarcest resource and unless it is managed nothing else can be managed.",
        author: "Peter Drucker"
      },
      {
        text: "Yesterday is gone. Tomorrow has not yet come. We have only today. Let us begin.",
        author: "Mother Teresa"
      },
      {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
      },
      {
        text: "Don't count the days, make the days count.",
        author: "Muhammad Ali"
      },
      {
        text: "Time is a created thing. To say 'I don't have time' is like saying 'I don't want to'.",
        author: "Lao Tzu"
      },
      {
        text: "The two most powerful warriors are patience and time.",
        author: "Leo Tolstoy"
      },
      {
        text: "It's not about having time, it's about making time.",
        author: "Anonymous"
      },
      {
        text: "Time has a wonderful way of showing us what really matters.",
        author: "Margaret Peters"
      },
      {
        text: "Time is the wisest counselor of all.",
        author: "Pericles"
      },
      {
        text: "One day or day one. You decide.",
        author: "Anonymous"
      },
      {
        text: "The best time to plant a tree was 20 years ago. The second best time is now.",
        author: "Chinese Proverb"
      },
      {
        text: "If you spend too much time thinking about a thing, you'll never get it done.",
        author: "Bruce Lee"
      },
      {
        text: "Your time is limited, so don't waste it living someone else's life.",
        author: "Steve Jobs"
      },
      {
        text: "Time is free, but it's priceless. You can't own it, but you can use it. You can't keep it, but you can spend it.",
        author: "Harvey MacKay"
      },
      {
        text: "No matter how busy you are, or how busy you think you are, the work will always be there tomorrow, but your friends might not be.",
        author: "Anonymous"
      }
    ];
    
    // Return a random quote
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  
  // Add event listener for refresh quote button if it exists
  const refreshQuoteBtn = document.getElementById('refresh-quote');
  if (refreshQuoteBtn) {
    refreshQuoteBtn.addEventListener('click', () => loadQuote('always'));
  }
}); 