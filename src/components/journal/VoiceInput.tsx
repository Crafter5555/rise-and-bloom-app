import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          const arrayBuffer = await audioBlob.arrayBuffer();
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(arrayBuffer))
          );
          
          // This would typically call a speech-to-text API
          // For now, we'll show a placeholder message
          toast({
            title: "Voice input received",
            description: "Voice-to-text feature coming soon! For now, please type your entry.",
          });
          
          // Placeholder transcription
          onTranscription("Voice recording processed - text transcription coming soon!");
          
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Processing failed",
            description: "Could not process audio recording.",
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
      <Button disabled variant="outline" size="sm">
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
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
        className="animate-pulse"
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
    >
      <Mic className="w-4 h-4 mr-2" />
      Voice Input
    </Button>
  );
};