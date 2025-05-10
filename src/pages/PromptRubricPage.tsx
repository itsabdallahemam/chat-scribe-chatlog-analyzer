
import React from 'react';
import PageTitle from '@/components/PageTitle';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChatlog } from '@/contexts/ChatlogContext';
import { useToast } from '@/hooks/use-toast';

const PromptRubricPage: React.FC = () => {
  const { toast } = useToast();
  const {
    promptTemplate,
    setPromptTemplate,
    rubricText,
    setRubricText,
  } = useChatlog();

  const handleSavePrompt = () => {
    if (!promptTemplate.trim()) {
      toast({
        title: "Error",
        description: "Prompt template cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setPromptTemplate(promptTemplate);
    toast({
      title: "Success",
      description: "Prompt template saved successfully"
    });
  };

  const handleSaveRubric = () => {
    if (!rubricText.trim()) {
      toast({
        title: "Error",
        description: "Rubric text cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setRubricText(rubricText);
    toast({
      title: "Success",
      description: "Rubric saved successfully"
    });
  };

  return (
    <div>
      <PageTitle 
        title="Prompt & Rubric Management" 
        description="Configure the evaluation prompt templates and scoring rubrics."
      />

      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Evaluation Prompt Template</h2>
          <p className="text-sm text-gray-600 mb-4">
            This template will be used when evaluating chatlogs. Use {'{chatlog_text}'} and {'{rubric_text}'} as placeholders.
          </p>
          
          <Textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="min-h-[250px] font-mono text-sm"
            placeholder="Enter prompt template..."
          />
          
          <Button 
            onClick={handleSavePrompt}
            className="mt-4 bg-app-blue hover:bg-app-blue-light"
          >
            Save Prompt Template
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Scoring Rubric</h2>
          <p className="text-sm text-gray-600 mb-4">
            Define the scoring rubric that will be included in the prompt sent to the model.
          </p>
          
          <Textarea
            value={rubricText}
            onChange={(e) => setRubricText(e.target.value)}
            className="min-h-[250px] font-mono text-sm"
            placeholder="Enter scoring rubric..."
          />
          
          <Button 
            onClick={handleSaveRubric}
            className="mt-4 bg-app-blue hover:bg-app-blue-light"
          >
            Save Rubric
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PromptRubricPage;
