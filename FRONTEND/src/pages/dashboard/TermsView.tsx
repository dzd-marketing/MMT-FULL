import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  Ban, 
  Lock, 
  CreditCard, 
  Info, 
  ChevronRight, 
  Globe, 
  Clock, 
  Sparkles, 
  BookOpen,
  CheckCircle
} from 'lucide-react';

export default function TermsView() {
  const termsSections = [
    {
      icon: Shield,
      title: "Terms & Conditions",
      emoji: "✔",
      content: "Using our services means you fully accept all terms. SMMPanel is not responsible for any loss caused by not reading these terms.",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400"
    },
    {
      icon: Zap,
      title: "Delivery Policy",
      emoji: "⚡",
      content: [
        "All orders automatically mean acceptance of these terms.",
        "Terms may change anytime without notice.",
        "You must follow all social media platform rules.",
        "Rates may change without notice.",
        "Delivery time is estimated—not guaranteed.",
        "Service type may be modified if needed.",
        "SMMPanel is not responsible for follower drops due to platform updates."
      ],
      color: "bg-orange-100 text-orange-600 dark:bg-orange-500/10",
      borderColor: "border-orange-500/20",
      textColor: "text-orange-400"
    },
    {
      icon: AlertTriangle,
      title: "Disclaimer",
      emoji: "⚠",
      content: "SMMPanel is not responsible for any business or personal damages.",
      color: "bg-red-100 text-red-600 dark:bg-red-500/10",
      borderColor: "border-red-500/20",
      textColor: "text-red-400"
    },
    {
      icon: Ban,
      title: "Liabilities",
      emoji: "🚫",
      content: "SMMPanel is not liable for account bans or content removals by any social media platform.",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-500/10",
      borderColor: "border-purple-500/20",
      textColor: "text-purple-400"
    },
    {
      icon: Lock,
      title: "Privacy Policy",
      emoji: "🔒",
      content: [
        "Your information is only used to complete orders.",
        "We do not sell or share your information.",
        "All data is encrypted and stored securely."
      ],
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      textColor: "text-emerald-400"
    },
    {
      icon: CreditCard,
      title: "Refund Policy",
      emoji: "💳",
      content: [
        "No refunds after deposit.",
        "Chargebacks/disputes → permanent ban.",
        "Orders cannot be canceled after placement.",
        "Non-deliverable orders → balance refund only.",
        "Wrong/Private account orders are not refundable.",
        "Multiple servers used on same link → no refund.",
        "Fraud = instant account termination."
      ],
      color: "bg-pink-100 text-pink-600 dark:bg-pink-500/10",
      borderColor: "border-pink-500/20",
      textColor: "text-pink-400"
    },
    {
      icon: Info,
      title: "About Our Services",
      emoji: "📢",
      content: [
        "Services only boost appearance.",
        "No guarantee of engagement.",
        "Not all accounts have profile photos or posts.",
        "No prohibited/nude content allowed.",
        "Pages with 100k+ followers before order do not get refill protection."
      ],
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      textColor: "text-indigo-400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-brand overflow-x-hidden">
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="space-y-12">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-brand/10 text-brand text-sm font-black uppercase tracking-[0.2em] border border-brand/20">
              <BookOpen className="w-4 h-4" />
              <span>📜 Terms & Policy</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight">
              By using <span className="text-brand">SMMPanel</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
              you agree to all terms listed on this page. Please read everything carefully.
            </p>
          </motion.div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {termsSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass p-8 rounded-3xl border ${section.borderColor} hover:border-opacity-100 hover:shadow-xl hover:shadow-${section.textColor.replace('text-', '')}/5 transition-all group`}
              >
                {/* Header with Emoji and Icon */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`${section.color} w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <section.icon className="w-7 h-7" />
                  </div>
                  <span className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">
                    {section.emoji}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black mb-4 break-words flex items-center">
                  {section.title}
                  {index === 0 && (
                    <span className="ml-2 text-xs bg-brand/20 text-brand px-3 py-1 rounded-full font-bold">
                      ✔
                    </span>
                  )}
                </h3>

                {/* Content */}
                {Array.isArray(section.content) ? (
                  <ul className="space-y-3">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start space-x-3">
                        <ChevronRight className={`w-4 h-4 ${section.textColor} shrink-0 mt-0.5`} />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {section.content}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Thank You Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-20 glass rounded-[3rem] p-12 md:p-16 text-center border border-brand/10 relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-brand/5 rounded-full blur-[80px]" />
            
            <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand/10 mx-auto">
                <span className="text-5xl">🚀</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                Thank you for choosing{' '}
                <span className="text-brand">SMMPanel</span>
              </h2>
              
              <p className="text-xl text-gray-400 font-medium">
                We're dedicated to providing fast & high-quality service.
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center gap-8 pt-8">
                <div className="flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <Globe className="w-5 h-5 text-brand" />
                  <span className="text-sm font-bold">Best & Trusted SMM Service Provider</span>
                </div>
                <div className="flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <Sparkles className="w-5 h-5 text-brand" />
                  <span className="text-sm font-bold">#1 Sri Lanka</span>
                </div>
                <div className="flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                  <Clock className="w-5 h-5 text-brand" />
                  <span className="text-sm font-bold">24/7 Support</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Copyright */}
          <div className="text-center pt-12">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">
              © 2026 MAKE ME TREND. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}