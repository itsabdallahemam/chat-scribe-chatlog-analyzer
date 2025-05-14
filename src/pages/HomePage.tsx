// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  FileText, 
  BarChart2, 
  Settings, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  ExternalLink,
  ChevronRight,
  Star,
  Gauge,
  Check
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [animateHero, setAnimateHero] = useState(false);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  const features = [
    {
      title: "Chatlog Evaluation",
      description: "Upload chatlogs to analyze quality using advanced AI models that measure coherence, politeness and relevance.",
      icon: <FileText className="h-6 w-6" />,
      path: "/evaluate",
      gradient: "from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500"
    },
    {
      title: "Interactive Dashboard",
      description: "View comprehensive analytics with interactive visualizations to track performance metrics over time.",
      icon: <BarChart2 className="h-6 w-6" />,
      path: "/dashboard",
      gradient: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400"
    },
    {
      title: "Resolution Analysis",
      description: "Track resolution rates and understand what factors contribute to successful customer interactions.",
      icon: <MessageSquare className="h-6 w-6" />,
      path: "/resolution-details",
      gradient: "from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400"
    },
    {
      title: "CPR Detail Insights",
      description: "Deep dive into Coherence, Politeness, and Relevance metrics to understand customer satisfaction.",
      icon: <Gauge className="h-6 w-6" />,
      path: "/cpr-details",
      gradient: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400"
    }
  ];

  const benefits = [
    {
      title: "AI-Powered Analysis",
      description: "Leverage state-of-the-art language models to analyze conversations with unprecedented accuracy.",
      icon: <Sparkles className="h-5 w-5" />,
      color: "text-purple-500 dark:text-purple-400"
    },
    {
      title: "Secure & Private",
      description: "All data is processed securely and stored with enterprise-grade encryption.",
      icon: <Shield className="h-5 w-5" />,
      color: "text-blue-500 dark:text-blue-400"
    },
    {
      title: "Real-time Insights",
      description: "Get instant feedback on chat quality with our efficient processing system.",
      icon: <Zap className="h-5 w-5" />,
      color: "text-amber-500 dark:text-amber-400"
    },
    {
      title: "Team Collaboration",
      description: "Share insights across your organization to improve customer service quality.",
      icon: <Users className="h-5 w-5" />,
      color: "text-emerald-500 dark:text-emerald-400"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section with Animation */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent dark:from-blue-400/10" />
          
          {/* Animated gradient orbs */}
          <div 
            className={`absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 blur-3xl opacity-0 transition-opacity duration-1000 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(-30%, -30%)' }}
          />
          <div 
            className={`absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 dark:from-cyan-400/30 dark:to-emerald-400/30 blur-3xl opacity-0 transition-opacity duration-1000 delay-300 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(20%, 20%)' }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10" />
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-700 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Chat-Scribe Chatlog Analyzer
              </h1>
            </div>
            
            <div className={`transform transition-all duration-700 delay-200 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
                Transform customer service with AI-powered conversation analysis that measures coherence, politeness, and relevance.
              </p>
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-400 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Button 
                size="lg"
                onClick={() => navigate('/evaluate')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full text-lg py-6 px-8"
              >
                Start Analyzing
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="text-lg py-6 px-8 border-2 border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600 rounded-full"
              >
                View Demo
              </Button>
            </div>
            
            {/* Key metrics */}
            <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center transition-all duration-700 delay-600 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">95%</div>
                <div className="text-gray-600 dark:text-gray-300">Accuracy Rate</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">+40%</div>
                <div className="text-gray-600 dark:text-gray-300">Customer Satisfaction</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">3x</div>
                <div className="text-gray-600 dark:text-gray-300">Faster Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive tools to analyze, measure, and improve your customer interactions
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800/50 h-full flex flex-col"
            >
              <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient}`}></div>
              <CardHeader className="pt-8">
                <div className={`mb-6 p-3 rounded-xl inline-flex bg-gradient-to-r ${feature.gradient} text-white`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-6">
                <Link 
                  to={feature.path}
                  className="group px-0 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center font-medium"
                >
                  <span>Learn more</span>
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section with Animation */}
      <div className="bg-gray-50 dark:bg-gray-900/70 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left side - Image */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/dashboard-preview.svg" 
                    alt="Dashboard Preview" 
                    className="w-full h-auto rounded-2xl"
                    onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400/e4e8f0/1e293b?text=Dashboard+Preview'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Actionable Insights</h3>
                      <p className="text-sm text-gray-200">Make data-driven decisions with clear visualizations</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating element */}
                <div className="absolute -top-8 -right-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 hidden md:block">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                      <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Quick Analysis</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Results in seconds</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Benefits list */}
              <div className="lg:col-span-7">
                <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Why Choose Chat-Scribe?</h2>
                
                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-4 items-start p-4 rounded-xl bg-white dark:bg-gray-800/50 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
                      <div className={`shrink-0 p-3 rounded-xl ${benefit.color} bg-opacity-10 dark:bg-opacity-20`}>
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{benefit.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900/70 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Chat-Scribe</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">© 2025 Chat-Scribe. All rights reserved.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
