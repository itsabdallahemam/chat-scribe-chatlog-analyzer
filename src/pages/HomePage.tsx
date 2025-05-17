// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  UploadCloud, 
  BarChart2, 
  CheckCircle, 
  ArrowRight, 
  MessageSquare, 
  User,
  Gauge,
  FileText,
  Users,
  LineChart,
  Settings,
  ChevronRight,
  Sparkles,
  Bot,
  PieChart,
  Activity,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [animateHero, setAnimateHero] = useState(false);
  
  // Start animation after component mounts
  useEffect(() => {
    setAnimateHero(true);
  }, []);

  // Main product benefits
  const benefits = [
    {
      title: "AI-Powered Analysis",
      description: "Our advanced AI evaluates conversations using the CPR methodology: Coherence, Politeness, and Relevance",
      icon: <Sparkles className="h-6 w-6" />,
      color: "bg-[#4582ff]/10 text-[#4582ff] dark:bg-[#4582ff]/20 dark:text-[#4582ff]"
    },
    {
      title: "Actionable Insights",
      description: "Get detailed metrics and practical suggestions to improve customer service quality",
      icon: <Activity className="h-6 w-6" />,
      color: "bg-[#22c55e]/10 text-[#22c55e] dark:bg-[#22c55e]/20 dark:text-[#22c55e]"
    },
    {
      title: "Role-Based Analytics",
      description: "Customized dashboards and reports for both agents and team leaders",
      icon: <Users className="h-6 w-6" />,
      color: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-500"
    }
  ];

  // Key features by user role
  const roleFeatures = {
    agent: [
    {
        name: "Upload & Analyze",
        description: "Upload customer conversations and get immediate feedback on your performance",
        icon: <UploadCloud className="h-5 w-5" />,
        action: () => navigate('/evaluate'),
        color: "from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30"
      },
      {
        name: "CPR Dashboard",
        description: "Track your Coherence, Politeness, and Relevance scores over time",
        icon: <Gauge className="h-5 w-5" />,
        action: () => navigate('/cpr-details'),
        color: "from-green-100 to-purple-100 dark:from-green-900/30 dark:to-purple-900/30"
      },
      {
        name: "Resolution Tracking",
        description: "See how often your conversations lead to successful resolutions",
        icon: <CheckCircle className="h-5 w-5" />,
        action: () => navigate('/resolution'),
        color: "from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
      },
      {
        name: "Performance Reports",
        description: "Generate detailed reports on your communication strengths and areas for improvement",
        icon: <FileText className="h-5 w-5" />,
        action: () => navigate('/report'),
        color: "from-purple-100 to-green-100 dark:from-purple-900/30 dark:to-green-900/30"
      }
    ],
    leader: [
      {
        name: "Team Analytics",
        description: "Get an overview of your entire team's performance metrics and trends",
        icon: <BarChart2 className="h-5 w-5" />,
        action: () => navigate('/agents-dashboard'),
        color: "from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30"
    },
    {
        name: "Agent Comparison",
        description: "Compare metrics across agents to identify top performers and coaching needs",
        icon: <Users className="h-5 w-5" />,
        action: () => navigate('/agents-dashboard'),
        color: "from-green-100 to-purple-100 dark:from-green-900/30 dark:to-purple-900/30"
      },
      {
        name: "Conversation Insights",
        description: "Identify patterns in successful conversations to develop best practices",
        icon: <MessageSquare className="h-5 w-5" />,
        action: () => navigate('/evaluate'),
        color: "from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
      },
      {
        name: "Performance Reports",
        description: "Generate team reports and share insights with your broader organization",
        icon: <FileText className="h-5 w-5" />,
        action: () => navigate('/report'),
        color: "from-purple-100 to-green-100 dark:from-purple-900/30 dark:to-green-900/30"
      }
    ]
  };

  // How it works steps
  const workflowSteps = [
    {
      step: 1,
      title: "Upload Conversations",
      description: "Upload your customer service chatlogs in CSV format",
      icon: <UploadCloud className="h-6 w-6" />,
      color: "bg-[#4582ff]"
    },
    {
      step: 2,
      title: "AI Analysis",
      description: "Our AI evaluates conversations using the CPR methodology",
      icon: <Bot className="h-6 w-6" />,
      color: "bg-purple-500"
    },
    {
      step: 3,
      title: "View Insights",
      description: "Access detailed metrics and actionable recommendations",
      icon: <BarChart2 className="h-6 w-6" />,
      color: "bg-[#22c55e]"
    },
    {
      step: 4,
      title: "Improve Performance",
      description: "Implement feedback and track your progress over time",
      icon: <Activity className="h-6 w-6" />,
      color: "bg-amber-500"
    }
  ];

  // CPR metrics explanation
  const cprMetrics = [
    {
      title: "Coherence",
      score: "93%",
      description: "Measures logical flow and consistency throughout conversations",
      icon: <LineChart className="h-6 w-6" />,
      color: "text-[#4582ff] dark:text-[#4582ff]",
      bg: "bg-[#4582ff]/10 dark:bg-[#4582ff]/20"
    },
    {
      title: "Politeness",
      score: "96%",
      description: "Evaluates tone, courtesy, and professional language usage",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "text-purple-500 dark:text-purple-500",
      bg: "bg-purple-500/10 dark:bg-purple-500/20"
    },
    {
      title: "Relevance",
      score: "91%",
      description: "Assesses how directly responses address customer needs",
      icon: <PieChart className="h-6 w-6" />,
      color: "text-[#22c55e] dark:text-[#22c55e]",
      bg: "bg-[#22c55e]/10 dark:bg-[#22c55e]/20"
    }
  ];

  // Sample conversation with metrics
  const sampleConversation = {
    messages: [
      {
        role: "customer",
        text: "I've been charged twice for my last order (#12345). Can you help me get this resolved?",
        time: "10:14"
      },
      {
        role: "agent",
        text: "I'm sorry to hear about the double charge. I'll look into this right away for you. Let me check your order #12345 in our system.",
        time: "10:15"
      },
      {
        role: "customer",
        text: "Thank you. The duplicate charge is really causing me problems with my bank account.",
        time: "10:16"
      },
      {
        role: "agent",
        text: "I understand how frustrating this must be. I can see the duplicate charge in our system. I'll process a refund for the extra charge right now, and it should be back in your account within 3-5 business days. Would you like me to send you a confirmation email once the refund is processed?",
        time: "10:18"
    }
    ],
    metrics: {
      coherence: 94,
      politeness: 96,
      relevance: 92,
      resolution: "Resolved"
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Edge-to-edge background pattern */}
      <div className="fixed inset-0 -z-10 bg-[url('/grid-pattern.svg')] bg-center opacity-10 pointer-events-none" />
      {/* Main content container */}
      <div className="max-w-screen-xl mx-auto px-2 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl shadow-xl bg-white dark:bg-neutral-900 mt-8 mb-12 border border-gray-100 dark:border-neutral-800 transition-colors duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-blue-900/10 dark:to-purple-900/10" />
          <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center mb-6">
                <Badge className="bg-[#4582ff]/10 text-[#4582ff] hover:bg-[#4582ff]/20 border-0 py-1.5 px-3 rounded-full text-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> AI-POWERED ANALYSIS
                </Badge>
              </div>
              <div className="text-center mb-10">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  CHAT<span className="relative inline-block">
                    <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-[#4582ff] to-purple-500">SCRIBE</span>
                  </span>
                </h1>
                <p className="mt-6 text-lg md:text-2xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">
                  AI-POWERED CUSTOMER SERVICE EVALUATOR
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-8">
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-[#4582ff] hover:bg-[#1e293b] text-white dark:bg-[#4582ff] dark:hover:bg-blue-700 rounded-full px-8 py-6 text-lg font-medium shadow-md"
                  size="lg"
                >
                  Get Started
                </Button>
                <Button
                  onClick={() => navigate('/test-login')}
                  variant="outline"
                  className="border-[#4582ff] text-[#4582ff] hover:bg-blue-50 dark:border-[#4582ff] dark:text-[#4582ff] dark:hover:bg-blue-900/10 rounded-full px-8 py-6 text-lg font-medium shadow-md"
                  size="lg"
                >
                  Already have an account
                </Button>
              </div>
              <div className="flex justify-center gap-x-12 gap-y-4 flex-wrap text-center">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">MORE THAN</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">1,000+</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SUPPORT TEAMS</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">UP TO</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">42%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">EFFICIENCY GAIN</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AVERAGE</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">94%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ACCURACY</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="relative py-16 px-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-gray-100 dark:border-neutral-800 mb-12 transition-colors duration-300">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-500 text-sm mb-3 font-medium">Simple Process</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">How ChatScribe Works</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">A seamless workflow for actionable insights</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {workflowSteps.map((step, idx) => (
                <div key={idx} className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow p-8 flex flex-col items-center text-center">
                  <div className={`mb-5 w-16 h-16 flex items-center justify-center rounded-full ${step.color} bg-opacity-10`}>{React.cloneElement(step.icon, { className: 'h-8 w-8 text-[#4582ff] dark:text-blue-400' })}</div>
                  <div className="text-xs text-gray-400 mb-1">Step {step.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CPR Methodology & Demo Section */}
        <section className="relative py-16 px-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-gray-100 dark:border-neutral-800 mb-12 transition-colors duration-300">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <Badge className="mb-3 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-0">See It In Action</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Analyze Customer Conversations</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Our CPR methodology evaluates customer service conversations across three key dimensions</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* CPR Metrics Cards */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  {cprMetrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-5 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow">
                      <div className="rounded-full p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                        {React.cloneElement(metric.icon, { className: 'h-6 w-6 text-[#4582ff] dark:text-blue-400' })}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{metric.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{metric.description}</p>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.score}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <Button onClick={() => navigate('/cpr-details')} className="border-[#4582ff] text-[#4582ff] bg-[#4582ff]/5 hover:bg-[#4582ff]/10 dark:bg-[#4582ff]/10 dark:hover:bg-[#4582ff]/20 rounded-full px-6 py-3 font-medium">Learn More About CPR Methodology <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
              {/* Sample Conversation Card */}
              <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow p-8">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-100 dark:border-neutral-700 pb-4">
                  <MessageSquare className="h-5 w-5 text-[#4582ff]" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sample Conversation</h3>
                </div>
                <div className="space-y-4 max-h-80 overflow-y-auto mb-6">
                  {sampleConversation.messages.map((message, idx) => (
                    <div key={idx} className={`p-3 rounded-lg text-sm ${message.role === 'customer' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}> 
                      <p className="text-gray-800 dark:text-gray-200">{message.text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{message.role === 'customer' ? 'Customer' : 'Agent'} - {message.time}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 dark:border-neutral-700 pt-4">
                  <div className="text-center mb-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">{sampleConversation.metrics.resolution}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coherence</p>
                      <p className="font-medium text-[#4582ff] dark:text-[#4582ff]">{sampleConversation.metrics.coherence}%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Politeness</p>
                      <p className="font-medium text-purple-500 dark:text-purple-400">{sampleConversation.metrics.politeness}%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Relevance</p>
                      <p className="font-medium text-[#22c55e] dark:text-green-400">{sampleConversation.metrics.relevance}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Role-Based Features */}
        <section className="relative py-16 px-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-gray-100 dark:border-neutral-800 mb-12 transition-colors duration-300">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400 text-sm mb-3 font-medium">Role-Based Experience</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Tools For Your Role</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Whether you're a customer service agent or team leader, ChatScribe offers features designed specifically for your needs</p>
            </div>
            <Tabs defaultValue="agent" className="w-full">
              <TabsList className="flex justify-center space-x-4 mb-10 bg-transparent">
                <TabsTrigger value="agent" className="rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 data-[state=active]:bg-white data-[state=active]:border-gray-300 data-[state=active]:shadow-sm font-medium"> <User className="mr-2 h-4 w-4" /> Customer Service Agents </TabsTrigger>
                <TabsTrigger value="leader" className="rounded-full border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 data-[state=active]:bg-white data-[state=active]:border-gray-300 data-[state=active]:shadow-sm font-medium"> <Users className="mr-2 h-4 w-4" /> Team Leaders </TabsTrigger>
              </TabsList>
              <TabsContent value="agent" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {roleFeatures.agent.map((feature, idx) => (
                    <div key={idx} className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow-md p-7 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center rounded-full p-2 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900/40 dark:to-green-900/40">
                          {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-[#4582ff] dark:text-blue-400' })}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">{feature.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 flex-1">{feature.description}</p>
                      <button className="inline-flex items-center text-sm text-[#4582ff] dark:text-blue-400 hover:underline focus:outline-none font-medium" onClick={feature.action}>Explore Feature <ChevronRight className="h-4 w-4 ml-0.5" /></button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="leader" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {roleFeatures.leader.map((feature, idx) => (
                    <div key={idx} className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow-md p-7 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center rounded-full p-2 bg-gradient-to-r from-purple-100 to-green-100 dark:from-purple-900/40 dark:to-green-900/40">
                          {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-purple-500 dark:text-purple-400' })}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0">{feature.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 flex-1">{feature.description}</p>
                      <button className="inline-flex items-center text-sm text-[#4582ff] dark:text-blue-400 hover:underline focus:outline-none font-medium" onClick={feature.action}>Explore Feature <ChevronRight className="h-4 w-4 ml-0.5" /></button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
        {/* Call to Action */}
        <section className="relative py-16 px-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-gray-100 dark:border-neutral-800 mb-12 transition-colors duration-300">
          <div className="max-w-2xl mx-auto relative z-10">
            <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl shadow-md p-12 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Ready to improve your Customer Service?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Start analyzing your customer service conversations today and see the difference in customer satisfaction and resolution rates</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-[#4582ff] hover:bg-[#1e293b] text-white dark:bg-[#4582ff] dark:hover:bg-blue-700 rounded-full font-medium py-6 px-8">Get Started</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/test-login')} className="border-[#4582ff] text-[#4582ff] hover:bg-blue-50 dark:border-[#4582ff] dark:text-[#4582ff] dark:hover:bg-blue-900/10 rounded-full font-medium py-6 px-8">Already have an account</Button>
              </div>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-6">Sign Up for free! No credit card required.</p>
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 py-12 mt-10 rounded-3xl shadow-lg transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <div className="bg-gradient-to-r from-[#22c55e] to-[#4582ff] p-2 rounded-lg shadow-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">ChatScribe</h3>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-300 max-w-md">AI-powered conversation analysis for better customer service</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-center sm:text-left">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Features</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Pricing</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Demo</Button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Documentation</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">API</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Help Center</Button></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">About</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Contact</Button></li>
                    <li><Button variant="link" className="text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Blog</Button></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-xs text-gray-400 dark:text-gray-300">© 2025 ChatScribe. All rights reserved.</p>
              <div className="flex items-center gap-6 mt-4 sm:mt-0">
                <Button variant="link" className="text-xs text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Privacy Policy</Button>
                <Button variant="link" className="text-xs text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] p-0 h-auto">Terms of Service</Button>
                <div className="flex gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] rounded-full p-0"><Github className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] rounded-full p-0"><Twitter className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-300 hover:text-[#4582ff] dark:hover:text-[#4582ff] rounded-full p-0"><Linkedin className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
