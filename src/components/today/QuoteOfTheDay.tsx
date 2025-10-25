import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const quotes = [
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Life is what happens to you while you're busy making other plans.",
    author: "John Lennon"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi"
  }
];

export const QuoteOfTheDay = () => {
  const [dailyQuote, setDailyQuote] = useState(quotes[0]);

  useEffect(() => {
    // Get a consistent quote for the day based on the date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % quotes.length;
    setDailyQuote(quotes[quoteIndex]);
  }, []);

  return (
    <Card className="p-6 mb-6 bg-card border-primary/30 shadow-medium">
      <div className="text-center space-y-4">
        <h3 className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">
          QUOTE OF THE DAY
        </h3>
        <blockquote className="text-lg font-semibold text-foreground leading-relaxed">
          "{dailyQuote.text}"
        </blockquote>
        <cite className="text-sm text-muted-foreground font-medium block">
          — {dailyQuote.author}
        </cite>
      </div>
    </Card>
  );
};