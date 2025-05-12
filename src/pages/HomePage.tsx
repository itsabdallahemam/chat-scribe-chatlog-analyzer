// src/pages/HomePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, BarChart2, Settings, MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users, Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const features = [
    {
      title: "Chatlog Evaluation",
      description: "Upload or paste chatlogs to analyze their quality and effectiveness using advanced AI models.",
      icon: <FileText className="h-6 w-6" />,
      path: "/evaluate",
      color: "from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300"
    },
    {
      title: "Dashboard",
      description: "View comprehensive analytics and insights from your evaluations with interactive visualizations.",
      icon: <BarChart2 className="h-6 w-6" />,
      path: "/dashboard",
      color: "from-purple-500 to-pink-400 dark:from-purple-400 dark:to-pink-300"
    },
    {
      title: "Reports",
      description: "Generate detailed reports and export your analysis results in various formats.",
      icon: <MessageSquare className="h-6 w-6" />,
      path: "/reports",
      color: "from-green-500 to-emerald-400 dark:from-green-400 dark:to-emerald-300"
    },
    {
      title: "Settings",
      description: "Configure your API keys, models, and evaluation criteria to customize your experience.",
      icon: <Settings className="h-6 w-6" />,
      path: "/settings",
      color: "from-orange-500 to-amber-400 dark:from-orange-400 dark:to-amber-300"
    }
  ];

  const benefits = [
    {
      title: "AI-Powered Analysis",
      description: "Leverage state-of-the-art AI models to analyze chat interactions with high accuracy.",
      icon: <Sparkles className="h-5 w-5" />
    },
    {
      title: "Secure & Private",
      description: "Your data is encrypted and processed securely, ensuring complete privacy.",
      icon: <Shield className="h-5 w-5" />
    },
    {
      title: "Real-time Processing",
      description: "Get instant feedback and analysis with our efficient processing system.",
      icon: <Zap className="h-5 w-5" />
    },
    {
      title: "Team Collaboration",
      description: "Share insights and collaborate with your team members seamlessly.",
      icon: <Users className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/90">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 dark:from-blue-400 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent">
              Chat-Scribe Clarity Analyzer
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform your customer service interactions with AI-powered insights and analytics.
              Evaluate, analyze, and improve your chat interactions with precision.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/evaluate')}
                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 dark:from-blue-400 dark:to-cyan-300 dark:hover:from-blue-300 dark:hover:to-cyan-200 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Analyzing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="border-2 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all duration-300"
              >
                View Dashboard
              </Button>
              </div>
                  </div>
                        </div>
        {/* Decorative Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent dark:from-blue-400/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-400/20 rounded-full blur-3xl" />
                          </div>
                        </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Powerful Features</h2>
          <p className="text-muted-foreground">
            Everything you need to analyze and improve your chat interactions
                    </p>
                  </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 dark:bg-gray-900/50 dark:border-gray-800 dark:hover:border-gray-700 flex flex-col h-full">
              <div className={`flex flex-col items-center justify-center rounded-lg bg-gradient-to-r ${feature.color} text-white mb-6 p-6 min-h-44`}>
                {feature.icon}
                <h3 className="text-xl font-bold mt-2 mb-1 text-center">{feature.title}</h3>
                <p className="text-sm text-center opacity-90">{feature.description}</p>
              </div>
              <div className="flex-1" />
              <div className="px-4 pb-4">
                <Button 
                  onClick={() => navigate(feature.path)}
                  variant="ghost"
                  className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-cyan-400 group-hover:text-white dark:group-hover:from-blue-400 dark:group-hover:to-cyan-300 transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/30 dark:bg-gray-900/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose Chat-Scribe?</h2>
            <p className="text-muted-foreground">
              Experience the power of advanced chat analysis
                    </p>
                  </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground mb-4 shadow-lg">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground dark:text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
                </div>
              </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-500 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Chat Analysis?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start analyzing your chat interactions today and unlock valuable insights
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/evaluate')}
            className="bg-white text-blue-600 hover:bg-white/90 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
