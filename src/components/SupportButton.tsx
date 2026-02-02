import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupportButton = () => {
    // ⬇️ CHANGE THIS TO YOUR REAL WHATSAPP NUMBER
    const phoneNumber = "2347000000000";
    const message = "Hello, I am having an issue with AremzonTag. Can you help?";

    // State to toggle the help bubble
    const [showLabel, setShowLabel] = useState(true);

    const handleClick = () => {
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

            {/* The "Need Help?" Bubble */}
            {showLabel && (
                <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-xl border border-slate-100 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-500 mb-1 mr-1 relative">
                    <span className="text-sm font-semibold">Need Help? Chat with us! 👋</span>
                    <button
                        onClick={() => setShowLabel(false)}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-3 h-3" />
                    </button>

                    {/* Little triangle pointing down */}
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
                </div>
            )}

            {/* The Button */}
            <Button
                onClick={handleClick}
                className="rounded-full w-14 h-14 shadow-xl bg-[#25D366] hover:bg-[#128C7E] border-none transition-all hover:scale-110 flex items-center justify-center"
                size="icon"
                title="Chat with Support"
            >
                <MessageCircle className="w-7 h-7 text-white" />
            </Button>
        </div>
    );
};

export default SupportButton;