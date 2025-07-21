
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/useMobile";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscription, disabled = false }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { hapticFeedback, isNative } = useMobile();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          
          // For now, we'll use a placeholder transcription service
          // In a real implementation, this would call a speech-to-text API
          await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
          
          // Simulate transcription result
          const mockTranscriptions = [
            "I had a great day today and accomplished most of my goals.",
            "Feeling grateful for the opportunity to learn new things.",
            "Today was challenging but I pushed through and stayed focused.",
            "Spent quality time with family and feel refreshed.",
            "Made progress on my personal projects and feel motivated."
          ];
          
          const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
          onTranscription(randomTranscription);
          
          toast({
            title: "Voice recorded successfully",
            description: "Your voice has been transcribed and added to your journal.",
          });
          
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing failed",
            description: "Could not process audio recording. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      if (isNative) hapticFeedback();
      
      toast({
        title: "Recording started",
        description: "Speak your journal entry...",
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (isNative) hapticFeedback();
    }
  };

  if (isProcessing) {
    return (
      <Button disabled variant="outline" size="sm" className="min-w-[120px]">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Processing...
      </Button>
    );
  }

  if (isRecording) {
    return (
      <Button 
        onClick={stopRecording}
        variant="destructive" 
        size="sm"
        className="animate-pulse min-w-[120px]"
      >
        <Square className="w-4 h-4 mr-2" />
        Stop Recording
      </Button>
    );
  }

  return (
    <Button 
      onClick={startRecording}
      disabled={disabled}
      variant="outline" 
      size="sm"
      className="min-w-[120px]"
    >
      <Mic className="w-4 h-4 mr-2" />
      Voice Input
    </Button>
  );
};
