import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "app_title": "OmniSight AI",
      "app_subtitle": "Multi-Modal Video Intelligence",
      "upload_video": "Upload Video",
      "ingest_new": "Ingest New Video Stream",
      "ingest_desc": "Upload a surveillance, dashboard, or traffic video feed. The local AI model extracts frames and calculates velocities completely locally.",
      "drag_drop": "Drag and drop video file, or click to browse",
      "supports": "Supports MP4, MKV, AVI, etc.",
      "uploading": "Uploading video payload...",
      "extracting": "Extracting keyframes & tracking objects...",
      "ingestion_completed": "Ingestion Completed",
      "ingestion_failed": "Ingestion Failed",
      "upload_another": "Upload another video",
      "cancel": "Cancel",
      "start_ingestion": "Start Ingestion",
      "analytics_dashboard": "Analytics Dashboard",
      "recent_captures": "Recent Keyframe Captures",
      "search_placeholder": "Search keyframes across all videos... (e.g. 'red car', 'person in yellow shirt')",
      "search": "Search",
      "total_videos": "Total Videos",
      "total_keyframes": "Total Keyframes",
      "active_streams": "Active Streams",
      "system_status": "System Status",
      "ai_assistant": "AI Video Assistant",
      "ask_ai_placeholder": "Ask AI about the video content...",
      "send": "Send",
      "use_local_ai": "Use Local AI (Ollama)",
      "use_online_ai": "Use Online AI (BYOK)",
      "api_key_placeholder": "Enter your API Key (Optional)",
      "online": "Online"
    }
  },
  hi: {
    translation: {
      "app_title": "ओमनीसाइट एआई",
      "app_subtitle": "मल्टी-मोडल वीडियो इंटेलिजेंस",
      "upload_video": "वीडियो अपलोड करें",
      "ingest_new": "नई वीडियो स्ट्रीम डालें",
      "ingest_desc": "निगरानी, डैशबोर्ड या ट्रैफ़िक वीडियो फ़ीड अपलोड करें। स्थानीय एआई मॉडल फ़्रेम निकालता है और पूरी तरह से स्थानीय स्तर पर गति की गणना करता है।",
      "drag_drop": "वीडियो फ़ाइल खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें",
      "supports": "MP4, MKV, AVI आदि का समर्थन करता है।",
      "uploading": "वीडियो पेलोड अपलोड हो रहा है...",
      "extracting": "कीफ्रेम निकाला जा रहा है और ऑब्जेक्ट्स को ट्रैक किया जा रहा है...",
      "ingestion_completed": "पूरा हुआ",
      "ingestion_failed": "विफल रहा",
      "upload_another": "एक और वीडियो अपलोड करें",
      "cancel": "रद्द करें",
      "start_ingestion": "शुरू करें",
      "analytics_dashboard": "एनालिटिक्स डैशबोर्ड",
      "recent_captures": "हालिया कीफ्रेम कैप्चर",
      "search_placeholder": "सभी वीडियो में कीफ्रेम खोजें... (जैसे 'लाल कार', 'पीली शर्ट में व्यक्ति')",
      "search": "खोजें",
      "total_videos": "कुल वीडियो",
      "total_keyframes": "कुल कीफ्रेम",
      "active_streams": "सक्रिय स्ट्रीम",
      "system_status": "सिस्टम स्थिति",
      "ai_assistant": "एआई वीडियो सहायक",
      "ask_ai_placeholder": "वीडियो सामग्री के बारे में एआई से पूछें...",
      "send": "भेजें",
      "use_local_ai": "स्थानीय एआई का उपयोग करें (Ollama)",
      "use_online_ai": "ऑनलाइन एआई का उपयोग करें (BYOK)",
      "api_key_placeholder": "अपनी API कुंजी दर्ज करें (वैकल्पिक)",
      "online": "ऑनलाइन"
    }
  },
  ta: {
    translation: {
      "app_title": "ஆம்னிசைட் ஏஐ",
      "app_subtitle": "மல்டி-மோடல் வீடியோ இன்டலிஜென்ஸ்",
      "upload_video": "வீடியோவைப் பதிவேற்றவும்",
      "ingest_new": "புதிய வீடியோ ஸ்ட்ரீமை உள்ளிடவும்",
      "ingest_desc": "கண்காணிப்பு, டாஷ்போர்டு அல்லது டிராஃபிக் வீடியோவை பதிவேற்றவும். உள்ளூர் ஏஐ மாதிரி ஃப்ரேம்களை பிரித்தெடுத்து முழுமையாக உள்ளூரிலேயே வேகத்தை கணக்கிடுகிறது.",
      "drag_drop": "வீடியோ கோப்பை இழுத்து விடவும் அல்லது உலாவ கிளிக் செய்யவும்",
      "supports": "MP4, MKV, AVI போன்றவற்றை ஆதரிக்கிறது.",
      "uploading": "வீடியோ பேலோட் பதிவேற்றப்படுகிறது...",
      "extracting": "கீஃப்ரேம்களை பிரித்தெடுக்கிறது & பொருள்களைக் கண்காணிக்கிறது...",
      "ingestion_completed": "பதிவேற்றம் முடிந்தது",
      "ingestion_failed": "பதிவேற்றம் தோல்வியடைந்தது",
      "upload_another": "மற்றொரு வீடியோவைப் பதிவேற்றவும்",
      "cancel": "ரத்துசெய்",
      "start_ingestion": "தொடங்கு",
      "analytics_dashboard": "பகுப்பாய்வு டாஷ்போர்டு",
      "recent_captures": "சமீபத்திய கீஃப்ரேம் பிடிப்புகள்",
      "search_placeholder": "அனைத்து வீடியோக்களிலும் கீஃப்ரேம்களைத் தேடவும்... (உதாரணமாக 'சிவப்பு கார்', 'மஞ்சள் சட்டையில் உள்ள நபர்')",
      "search": "தேடு",
      "total_videos": "மொத்த வீடியோக்கள்",
      "total_keyframes": "மொத்த கீஃப்ரேம்கள்",
      "active_streams": "செயலில் உள்ள ஸ்ட்ரீம்கள்",
      "system_status": "கணினி நிலை",
      "ai_assistant": "ஏஐ வீடியோ உதவியாளர்",
      "ask_ai_placeholder": "வீடியோ உள்ளடக்கம் பற்றி ஏஐ யிடம் கேளுங்கள்...",
      "send": "அனுப்பு",
      "use_local_ai": "உள்ளூர் ஏஐ பயன்படுத்தவும் (Ollama)",
      "use_online_ai": "ஆன்லைன் ஏஐ பயன்படுத்தவும் (BYOK)",
      "api_key_placeholder": "உங்கள் API விசையை உள்ளிடவும் (விருப்பத்தேர்வு)",
      "online": "ஆன்லைனில்"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
