import React, { useState, useEffect } from "react";
import { ExternalLink, ShoppingBag, Zap, Loader2 } from "lucide-react";
import { api } from "../services/api.ts";

// Environment variables for AdSense
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID;

export default function AdBanner({ subscriptionStatus, dark = false, showUpgradeButtons = true }: { subscriptionStatus?: string, dark?: boolean, showUpgradeButtons?: boolean }) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Reference to track if ad has been initialized for this component instance
  const adInitialized = React.useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID || adInitialized.current) return;

    const pushAd = () => {
      try {
        const insElements = document.querySelectorAll('ins.adsbygoogle');
        const unprocessed = Array.from(insElements).filter(el => !el.getAttribute('data-adsbygoogle-status'));
        
        if (unprocessed.length > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adInitialized.current = true;
        }
      } catch (e: any) {
        if (e && e.message && e.message.includes("already have ads")) {
          adInitialized.current = true;
          return;
        }
        console.error("AdSense error:", e);
      }
    };

    // Update global script if it has dummy ID
    const script = document.getElementById('adsense-script');
    if (script && script.getAttribute('src')?.includes('ca-pub-0000000000000000')) {
      script.setAttribute('src', `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`);
    }

    if (!window.adsbygoogle) {
      const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
      if (existingScript) {
        existingScript.addEventListener('load', pushAd);
        return () => existingScript.removeEventListener('load', pushAd);
      } else {
        const script = document.createElement("script");
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = pushAd;
        document.head.appendChild(script);
      }
    } else {
      const timeout = setTimeout(pushAd, 200);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { checkoutUrl } = await api.payments.createCheckout();
      window.open(checkoutUrl, "_blank");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar checkout.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const ads = [
    {
      title: "Pomadas King Shave",
      desc: "Linha profissional para acabamentos perfeitos. Compre com 30% OFF.",
      icon: <ShoppingBag size={20} className="text-amber-500" />
    },
    {
      title: "Navaletes Titanium Pro",
      desc: "Precisão absoluta para o seu dia a dia na barbearia.",
      icon: <Zap size={20} className="text-blue-500" />
    }
  ];

  const randomAd = ads[Math.floor(Math.random() * ads.length)];

  if (ADSENSE_CLIENT_ID && ADSENSE_SLOT_ID) {
    return (
      <div className={`${dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'} p-4 rounded-[2rem] border-2 shadow-sm overflow-hidden flex flex-col gap-4`}>
        <div className="flex items-center justify-between px-2">
           <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Patrocinado</span>
           {showUpgradeButtons && (
             <button 
               onClick={handleUpgrade}
               disabled={isUpgrading}
               className={`text-xs font-bold ${dark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'} flex items-center gap-1 transition-colors disabled:opacity-50`}
             >
               {isUpgrading ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
               Remover Anúncios
             </button>
           )}
        </div>
        <div className={`min-h-[100px] w-full ${dark ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-2xl flex items-center justify-center overflow-hidden`}>
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%' }}
                 data-ad-client={ADSENSE_CLIENT_ID}
                 data-ad-slot={ADSENSE_SLOT_ID}
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>
      </div>
    );
  }

  return (
    <div className={`${dark ? 'bg-neutral-900 border-neutral-800 group-hover:border-neutral-700' : 'bg-white border-neutral-100 group-hover:border-neutral-200'} p-5 rounded-[2rem] border-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group transition-all duration-300`}>
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        {randomAd.icon}
      </div>
      
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-14 h-14 ${dark ? 'bg-neutral-800' : 'bg-neutral-50'} rounded-2xl flex items-center justify-center shadow-inner ${dark ? 'group-hover:bg-neutral-700' : 'group-hover:bg-white'} transition-colors`}>
          {randomAd.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm border border-neutral-800">Ad</span>
            <h4 className={`text-base font-bold ${dark ? 'text-white' : 'text-neutral-900'} leading-none`}>{randomAd.title}</h4>
          </div>
          <p className={`text-sm ${dark ? 'text-neutral-400' : 'text-neutral-500'} font-medium`}>{randomAd.desc}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full sm:w-auto">
        {showUpgradeButtons && (
          <button 
            className="w-full sm:w-auto px-6 py-3 bg-white text-black text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-white/5 disabled:opacity-50"
            onClick={handleUpgrade}
            disabled={isUpgrading}
          >
            {isUpgrading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="fill-black" />}
            Vire Premium
          </button>
        )}

        <button 
          className={`w-full sm:w-auto px-6 py-3 ${dark ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700' : 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50'} border text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm`}
          onClick={() => window.open("https://example.com/partners", "_blank")}
        >
          Ver Parceria
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
