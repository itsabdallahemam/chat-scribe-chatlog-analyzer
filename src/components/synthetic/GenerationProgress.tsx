import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { PlayCircle, PauseCircle, StopCircle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface GenerationProgressProps {
  isGenerating: boolean;
  isPaused: boolean;
  progress: number;
  generationStep: string;
  error: string | null;
  estimatedTimeRemaining: string;
  onStartGeneration: () => void;
  onPauseResume: () => void;
  onStop: () => void;
}

export function GenerationProgress({
  isGenerating,
  isPaused,
  progress,
  generationStep,
  error,
  estimatedTimeRemaining,
  onStartGeneration,
  onPauseResume,
  onStop,
}: GenerationProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{generationStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              {isGenerating && !isPaused && (
                <p className="text-sm text-muted-foreground">
                  Estimated time remaining: {estimatedTimeRemaining}
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              {!isGenerating ? (
                <Button
                  onClick={onStartGeneration}
                  className="flex-1"
                  disabled={isGenerating}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Generation
                </Button>
              ) : (
                <>
                  <Button
                    onClick={onPauseResume}
                    variant="outline"
                    className="flex-1"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={onStop}
                    variant="destructive"
                    className="flex-1"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </div>

            {isGenerating && !isPaused && (
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 