import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const moods = [
  { emoji: "😔", label: "Down", value: 1 },
  { emoji: "😐", label: "Okay", value: 2 },
  { emoji: "🙂", label: "Good", value: 3 },
  { emoji: "😊", label: "Great", value: 4 },
  { emoji: "🤩", label: "Amazing", value: 5 }
];

interface MoodSliderProps {
  onMoodChange?: (mood: number) => void;
}

export const MoodSlider = ({ onMoodChange }: MoodSliderProps) => {
  const [selectedMood, setSelectedMood] = useState(3);

  const handleMoodChange = (value: number[]) => {
    const mood = value[0];
    setSelectedMood(mood);
    onMoodChange?.(mood);
  };

  const currentMoodEmoji = moods.find(m => m.value === selectedMood)?.emoji || "🙂";

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{currentMoodEmoji}</div>
        <p className="text-sm text-muted-foreground">How are you feeling?</p>
      </div>
      
      <div className="px-2">
        <Slider
          value={[selectedMood]}
          onValueChange={handleMoodChange}
          max={5}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {moods.map((mood) => (
            <span key={mood.value} className="text-center">
              <div>{mood.emoji}</div>
              <div className="mt-1">{mood.label}</div>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
};