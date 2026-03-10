import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, Copy, CheckCheck, ChevronDown, ChevronUp,
  Globe, Sparkles, Clock, Code, BookOpen, FileCode
} from 'lucide-react';

export default function ApiView() {
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('service-list');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    {
      id: 'service-list',
      title: 'Service List',
      description: 'Get list of all available services',
      parameters: [
        { name: 'key', explanation: 'Your API Key' },
        { name: 'action', explanation: 'services' }
      ],
      sampleReturn: `[
    {
        "service": 1,
        "name": "Followers",
        "type": "Default",
        "category": "First Category",
        "rate": "0.90",
        "min": "50",
        "max": "10000"
    },
    {
        "service": 2,
        "name": "Comments",
        "type": "Custom Comments",
        "category": "Second Category",
        "rate": "8",
        "min": "10",
        "max": "1500"
    }
]`
    },
    {
      id: 'new-order',
      title: 'New Order',
      description: 'Create a new order',
      parameters: [
        { name: 'key', explanation: 'Your API Key' },
        { name: 'action', explanation: 'add' },
        { name: 'service', explanation: 'Service ID' },
        { name: 'link', explanation: 'Service connection' },
        { name: 'quantity', explanation: 'Quantity' },
        { name: 'runs', explanation: 'Runs to deliver (optional)' },
        { name: 'interval', explanation: 'Interval in minutes (optional)' }
      ],
      sampleReturn: `{
    "order": 23501
}`
    },
    {
      id: 'order-status',
      title: 'Order Status',
      description: 'Check order status',
      parameters: [
        { name: 'key', explanation: 'Your API Key' },
        { name: 'action', explanation: 'status' },
        { name: 'order', explanation: 'Order ID' }
      ],
      sampleReturn: `{
    "charge": "0.27819",
    "start_count": "3572",
    "status": "Partial",
    "remains": "157",
    "currency": "USD"
}`
    },
    {
      id: 'user-balance',
      title: 'User Balance',
      description: 'Check your account balance',
      parameters: [
        { name: 'key', explanation: 'Your API Key' },
        { name: 'action', explanation: 'balance' }
      ],
      sampleReturn: `{
    "balance": "100.84292",
    "currency": "USD"
}`
    }
  ];

  // Sample PHP code
  const samplePhpCode = `<?php
// Sample PHP code for API integration
$api_key = 'YOUR_API_KEY';
$api_url = 'https://makemetrend.online/api/v2';

// Get service list
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'key' => $api_key,
    'action' => 'services'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$services = json_decode($response, true);
print_r($services);
?>`;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="relative overflow-hidden glass border border-white/10 p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-transparent">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 rounded-full blur-[120px] -mr-40 -mt-40" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/20 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">API</h1>
              <p className="text-gray-400 text-sm">Documentation & Integration</p>
            </div>
          </div>

          {/* API Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="glass p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">HTTP Method</div>
              <div className="text-xl font-black text-brand">POST</div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">API URL</div>
              <div className="text-sm font-mono text-green-400 break-all">https://makemetrend.online/api/v2</div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Return format</div>
              <div className="text-xl font-black text-brand">JSON</div>
            </div>
          </div>

          {/* API Key Note */}
          <div className="mt-6 glass p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
            <p className="text-sm text-yellow-500 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              API Key: Get an API key on the Account page
            </p>
          </div>
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border border-white/10 rounded-[2rem] overflow-hidden"
          >
            {/* Section Header */}
            <div
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="p-6 cursor-pointer hover:bg-white/5 transition-all flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-black mb-1">{section.title}</h2>
                <p className="text-sm text-gray-400">{section.description}</p>
              </div>
              {expandedSection === section.id ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>

            {/* Expanded Content */}
            {expandedSection === section.id && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-6 space-y-6"
              >
                {/* Parameters */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4 text-brand" />
                    Parameters
                  </h3>
                  <div className="glass p-4 rounded-xl border border-white/5">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-500 uppercase">
                          <th className="text-left pb-2">Parameter</th>
                          <th className="text-left pb-2">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {section.parameters.map((param, idx) => (
                          <tr key={idx} className="border-t border-white/5">
                            <td className="py-2 font-mono text-brand">{param.name}</td>
                            <td className="py-2 text-gray-400">{param.explanation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Return */}
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand" />
                    Sample Return
                  </h3>
                  <div className="relative">
                    <pre className="bg-black/40 p-4 rounded-xl text-xs font-mono text-green-400 overflow-x-auto">
                      {section.sampleReturn}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(section.sampleReturn)}
                      className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Sample PHP File Button */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Create and download PHP file
            const element = document.createElement('a');
            const file = new Blob([samplePhpCode], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = 'sample-api-integration.php';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
          className="glass px-8 py-4 rounded-2xl border border-brand/30 bg-brand/5 hover:bg-brand/10 transition-all flex items-center gap-3 group"
        >
          <FileCode className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
          <span className="font-bold text-sm">Sample PHP File</span>
          <span className="text-[10px] text-gray-500">(Download)</span>
        </motion.button>
      </div>

      {/* Footer Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Globe className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">Best & Trusted SMM Service Provider</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Sparkles className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">#1 Sri Lanka</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 text-brand" />
          <span className="text-xs font-bold">24/7 Support</span>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 pt-4">
        © 2026 MAKE ME TREND. All Rights Reserved.
      </div>
    </div>
  );
}