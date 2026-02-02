import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupportButton = () => {
    // ⬇️ CHANGE THIS TO YOUR REAL WHATSAPP NUMBER
    const phoneNumber = "+234707495097";
    const message = "Hello, I am having an issue with AremzonTag. Can you help?";

    const handleClick = () => {
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                onClick={handleClick}
                className="rounded-full w-14 h-14 shadow-xl bg-[#25D366] hover:bg-[#128C7E] border-none transition-all hover:scale-110"
                size="icon"
                title="Chat with Support"
            >
                <MessageCircle className="w-7 h-7 text-white" />
            </Button>
        </div>
    );
};

export default SupportButton;