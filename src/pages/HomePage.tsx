// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  FileText, 
  BarChart2, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  Github, 
  Twitter, 
  Linkedin, 
  Gauge,
  UserCircle,
  LineChart,
  PieChart,
  Award,
  MessageSquare
} from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [animateHero, setAnimateHero] = useState(false);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Key features of the product
  const features = [
    {
      title: "AI-Powered Insights",
      description: "Instantly see what matters most in every conversation. Our AI highlights strengths and areas to improve, so you can focus on what counts.",
      icon: <Sparkles className="h-6 w-6" />, 
      gradient: "from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500"
    },
    {
      title: "Live Performance Dashboards",
      description: "Beautiful, real-time charts make it easy to track your progress and spot trends at a glance.",
      icon: <BarChart2 className="h-6 w-6" />, 
      gradient: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400"
    },
    {
      title: "Resolution Analytics",
      description: "See what leads to happier customers and faster resolutions. Get clear, actionable feedback every time.",
      icon: <CheckCircle className="h-6 w-6" />, 
      gradient: "from-emerald-500 to-green-500 dark:from-emerald-400 dark:to-green-400"
    },
    {
      title: "Personalized Experience",
      description: "Whether you’re an agent or a team leader, get a tailored view with the insights you need to succeed.",
      icon: <Users className="h-6 w-6" />, 
      gradient: "from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400"
    }
  ];

  // Role-specific benefits
  const roleBenefits = [
    {
      role: "Support Agents",
      description: "Unlock your potential with a personal dashboard, clear feedback, and easy-to-follow improvement tips.",
      features: [
        "Personal dashboard with your stats", 
        "Conversation quality breakdown", 
        "Step-by-step improvement tips",
        "Track your progress over time"
      ],
      icon: <UserCircle className="h-8 w-8" />, 
      color: "bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500",
      action: () => navigate('/test-login')
    },
    {
      role: "Team Leaders",
      description: "See your team’s strengths, spot coaching opportunities, and celebrate wins—all in one place.",
      features: [
        "Team overview at a glance", 
        "Compare agent performance", 
        "Find coaching opportunities",
        "Download reports and trends"
      ],
      icon: <Users className="h-8 w-8" />, 
      color: "bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500",
      action: () => navigate('/test-login')
    }
  ];

  // CPR metrics explanation
  const cprMetrics = [
    {
      title: "Coherence",
      description: "Is the conversation logical and easy to follow?",
      icon: <LineChart className="h-5 w-5" />, 
      color: "text-indigo-500 dark:text-indigo-400"
    },
    {
      title: "Politeness",
      description: "Is the tone friendly, helpful, and professional?",
      icon: <MessageSquare className="h-5 w-5" />, 
      color: "text-purple-500 dark:text-purple-400"
    },
    {
      title: "Relevance",
      description: "Are responses on-topic and directly helpful?",
      icon: <PieChart className="h-5 w-5" />, 
      color: "text-emerald-500 dark:text-emerald-400"
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 transition-colors duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden transition-colors duration-500">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden transition-colors duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent dark:from-blue-400/10 transition-colors duration-500" />
          {/* Animated gradient orbs */}
          <div 
            className={`absolute top-20 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 blur-3xl opacity-0 transition-all duration-1000 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(-30%, -30%)', transition: 'background 0.5s, box-shadow 0.5s' }}
          />
          <div 
            className={`absolute bottom-20 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 dark:from-cyan-400/30 dark:to-emerald-400/30 blur-3xl opacity-0 transition-all duration-1000 delay-300 ease-in-out ${animateHero ? 'opacity-100' : ''}`} 
            style={{ transform: 'translate(20%, 20%)', transition: 'background 0.5s, box-shadow 0.5s' }}
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-5 dark:opacity-10 transition-opacity duration-500" />
        </div>
        <div className="container mx-auto px-4 py-16 sm:py-24 lg:py-32 relative z-10 transition-colors duration-500">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-700 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Chat-Scribe Analyzer
              </h1>
            </div>
            
            <div className={`transform transition-all duration-700 delay-200 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed">
                Elevate your customer service with AI-powered conversation analysis that provides actionable insights for agents and team leaders.
              </p>
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-400 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Button 
                size="lg"
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            {/* Key metrics */}
            <div className={`mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center transition-all duration-700 delay-600 ease-out ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">95%</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Evaluation Accuracy</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2">+42%</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Customer Satisfaction</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-md border border-gray-200 dark:border-gray-700">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1 sm:mb-2">3.5x</div>
                <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Agent Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What is Chat-Scribe Section */}
      <div className="container mx-auto px-4 py-16 sm:py-20 transition-colors duration-500">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">What is Chat-Scribe?</h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
                Chat-Scribe is an advanced analytics platform that evaluates customer service conversations using our proprietary CPR methodology: Coherence, Politeness, and Relevance.
              </p>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6">
                Our AI-powered system provides actionable insights to customer support teams, helping agents improve their communication skills and enabling team leaders to identify coaching opportunities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {cprMetrics.map((metric, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 rounded-xl bg-white/90 dark:bg-gray-800/50 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-500">
                    <div className={`${metric.color} mb-2`}>
                      {metric.icon}
                    </div>
                    <h3 className="font-medium mb-1">{metric.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl p-4 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Conversation Analysis</h3>
                      <p className="text-sm text-gray-500">Customer chat with Agent #1242</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm">
                      <p className="text-gray-800 dark:text-gray-200">Hello, I'm having trouble resetting my password on your website. Can you help?</p>
                      <p className="text-xs text-gray-500 mt-1">Customer - 10:15 AM</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                      <p className="text-gray-800 dark:text-gray-200">Hi there! I'd be happy to help you reset your password. Could you tell me which page you're having trouble with specifically?</p>
                      <p className="text-xs text-gray-500 mt-1">Agent - 10:16 AM</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coherence</p>
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">92%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Politeness</p>
                      <p className="font-medium text-purple-600 dark:text-purple-400">95%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Relevance</p>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">90%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-gray-900/70 py-16 sm:py-20 transition-colors duration-500">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive tools to analyze, measure, and improve customer interactions
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800/50 h-full flex flex-col transition-colors duration-500"
              >
                <div className={`h-2 w-full bg-gradient-to-r ${feature.gradient}`}></div>
                <CardHeader className="pt-6">
                  <div className={`mb-4 p-3 rounded-xl inline-flex bg-gradient-to-r ${feature.gradient} text-white`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Role-based Cards Section */}
      <div className="container mx-auto px-4 py-16 sm:py-20 transition-colors duration-500">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Tailored For Your Role</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Chat-Scribe provides role-specific experiences that deliver exactly what you need
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {roleBenefits.map((roleBenefit, index) => (
            <Card 
              key={index} 
              className="overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-gray-800/50 h-full flex flex-col relative transition-colors duration-500"
            >
              <div className={`${roleBenefit.color} text-white p-6`}>
                <div className="flex items-center gap-3 mb-3">
                  {roleBenefit.icon}
                  <h3 className="text-2xl font-bold">{roleBenefit.role}</h3>
                </div>
                <p className="text-white/90 text-lg">{roleBenefit.description}</p>
              </div>
              <CardContent className="pt-6 pb-4 flex-grow">
                <ul className="space-y-3">
                  {roleBenefit.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6">
                {/* Removed Try Demo button */}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 py-16 sm:py-20 transition-colors duration-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white dark:text-white mb-6 transition-colors duration-500 drop-shadow-lg">
            Ready to transform your customer service?
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-8 transition-colors duration-500 text-white/90 dark:text-white/80">
            Join thousands of customer service teams using Chat-Scribe to improve conversation quality
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/signup')}
              className="bg-white text-indigo-700 dark:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full font-medium py-6 px-8 shadow-md border border-indigo-100 dark:border-indigo-700 transition-colors duration-500"
            >
              Get Started Today
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              className="rounded-full font-medium py-6 px-8 mt-2 sm:mt-0 border-white dark:border-indigo-400 text-indigo-700 dark:text-indigo-100 hover:bg-white/10 dark:hover:bg-indigo-900/20 transition-colors duration-500"
            >
              Already have an account?
            </Button>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-12 transition-colors duration-500 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">Chat-Scribe</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Elevating customer service through AI-powered conversation analytics.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Features</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Pricing</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Demo</Button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">About</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Blog</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Careers</Button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Documentation</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Help Center</Button></li>
                  <li><Button variant="link" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">API</Button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Connect</h4>
                <div className="flex gap-4 justify-center sm:justify-start">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition-colors duration-500">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition-colors duration-500">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition-colors duration-500">
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 Chat-Scribe. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Button variant="link" className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Privacy Policy</Button>
              <Button variant="link" className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white p-0 h-auto">Terms of Service</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
