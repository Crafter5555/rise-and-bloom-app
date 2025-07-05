import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const reflectionPrompts = [
  "What are you proud of today?",
  "What drained your energy?",
  "What made you smile?",
  "What would you do differently?",
];

export const EveningCheckIn = () => {
  const [dayRating, setDayRating] = useState(3);
  const [reflection, setReflection] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(0);

  const handleSubmit = () => {
    console.log("Evening check-in:", { dayRating, reflection });
    // Save to storage or send to backend
  };

  const dayEmojis = ["😔", "😐", "🙂", "😊", "🤩"];

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          How was your day?
        </h3>
        <div className="text-4xl mb-4">{dayEmojis[dayRating - 1]}</div>
        
        <Slider
          value={[dayRating]}
          onValueChange={(value) => setDayRating(value[0])}
          max={5}
          min={1}
          step={1}
          className="w-full max-w-xs mx-auto"
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">
            {reflectionPrompts[currentPrompt]}
          </Label>
          <Textarea
            placeholder="Write your thoughts..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPrompt((prev) => (prev + 1) % reflectionPrompts.length)}
          >
            Next prompt
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Save reflection
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium mb-2">Today's recap</h4>
        <div className="flex gap-2 text-2xl">
          <span title="Energy level">⚡</span>
          <span title="Productivity">📈</span>
          <span title="Screen time">📱</span>
          <span title="Sleep quality">💤</span>
          <span title="Mood">✨</span>
        </div>
      </div>
    </Card>
  );
};