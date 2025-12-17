import { motion } from "framer-motion";
import { Smartphone, QrCode, Scan, Download } from "lucide-react";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { toast } from "sonner";
import { useEffect } from "react";

export const DownloadAppSection = () => {
  const { logActivity } = useActivityLogger();

  useEffect(() => {
    logActivity("download_section_viewed", {
      section_name: "mobile_app_download",
      page: "crawl_control",
    });
  }, [logActivity]);

  const handleDownloadClick = () => {
    logActivity("download_button_clicked", {
      platform: "mobile",
      section: "download_app",
    });
    toast.success("App download links will be available soon!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl border border-border/50 p-6 md:p-8 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-xl mb-4 mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Download Mobile App
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Designed for mobile devices, offering better experience and more features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center max-w-3xl mx-auto">
          {/* QR Code Section */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative bg-white p-6 rounded-xl border-2 border-dashed border-primary/20">
                <div className="w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center overflow-hidden border border-border">
                  <QrCode className="w-20 h-20 text-primary/60 mb-3" />
                  <div className="text-center p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Scan to download app
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm" />
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Scan className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    Easy Installation
                  </h3>
                  <p className="text-muted-foreground">
                    Press and hold to scan the QR code for instant download on your mobile device.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <Download className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    Instant Access
                  </h3>
                  <p className="text-muted-foreground">
                    Get push notifications when crawls complete and access your data offline anytime.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadClick}
                className="w-full bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <Download className="w-5 h-5" />
                <span className="text-base">Download Now</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  Coming Soon
                </span>
              </motion.button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Available on iOS and Android • Release Q1 2026
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Push Notifications",
              description: "Get instant alerts when crawls complete",
              icon: "🔔"
            },
            {
              title: "Offline Access",
              description: "View crawled content without internet",
              icon: "📱"
            },
            {
              title: "Gesture Controls",
              description: "Swipe to archive or favorite content",
              icon: "👆"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-200 group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
