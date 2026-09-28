/* ==========================================================================
   OptiRelief — Multilingual Notification & Localization Engine
   SIH 26002 Compliance: Support for English, Hindi, and Assamese (NER)
   ========================================================================== */

const I18N = {
  currentLang: localStorage.getItem('optirelief_lang') || 'en',
  listeners: new Set(),

  languages: [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'as', label: 'Assamese (NER)', native: 'অসমীয়া', flag: '🚩' }
  ],

  translations: {
    en: {
      // Header & Navigation
      app_title: 'OptiRelief',
      tagline: 'Logistics Engine',
      dashboard: 'Dashboard',
      optimizer: 'Optimizer',
      zonemap: 'Zone Map',
      fleet: 'Fleet Assets',
      inventory: 'Inventory',
      sites: 'Disaster Sites',
      dispatch: 'Dispatch Log',
      system: 'System & Sync',
      run_solver: 'Run Solver',
      sync: 'Sync',
      compliance_badge: 'SIH 26002 Verified',

      // District Connectivity
      district_connectivity: 'District-Wise Connectivity (NER)',
      district_connectivity_sub: 'Real-time accessibility, road status, vehicle presence and incident monitoring across North-Eastern Region districts',
      select_district: 'Select NER District',
      total_routes: 'Total Routes',
      open_routes: 'Open Routes',
      partial_routes: 'Partially Blocked',
      closed_routes: 'Closed / Impassable',
      high_risk_routes: 'High-Risk Corridors',
      connectivity_pct: 'Connectivity Score',
      active_incidents: 'Active Incidents',
      vehicles_operating: 'Operating Vehicles',
      avg_delay: 'Average Transit Delay',
      normal_flow: 'Normal Flow',
      single_lane: 'Single-Lane Bypass Only',
      washed_out: 'Road Washout / Bridge Damage',
      landslide_alert: 'Active Landslide & Rockfall Hazard',

      // Logistics Bottlenecks & Supply Gap
      bottleneck_analysis: 'Logistics Bottlenecks & Supply-Chain Gap Analysis',
      bottleneck_sub: 'Real-time inventory deficit, blocked corridors, and vehicle shortage detection',
      critical_supply_gap: 'CRITICAL SUPPLY GAP',
      location: 'Location',
      commodity: 'Commodity',
      required: 'Required',
      available: 'Available',
      gap: 'Supply Gap',
      priority: 'Priority',
      high_demand_sites: 'High-Demand Locations',
      low_stock_depots: 'Low-Stock Depots',
      delayed_corridors: 'Delayed Corridors',
      vehicle_shortages: 'Vehicle Deficits',
      auto_bridge_gap: 'Auto-Plan Relief for Gaps',
      resolve_with_solver: 'Load into 3D Optimizer',

      // Roles & Auth
      role: 'Role',
      admin: 'Command Administrator',
      field_official: 'NER Field Official',
      logistics_operator: 'Logistics Operator',
      viewer: 'Public / Viewer',
      role_badge: 'Active Role',
      field_report_btn: 'Report Road Incident',
      photo_upload: 'Damage Photo Upload',
      geotag_auto: 'Auto-Geotagged via GPS',

      // Alerts & Notifications
      live_alerts: 'Multilingual Disaster & Corridor Alerts',
      alert_critical: 'CRITICAL',
      alert_high: 'HIGH',
      alert_moderate: 'MODERATE',
      alert_stable: 'STABLE',
      route_warning: 'Route Warning',
      delivery_notification: 'Delivery Notification',
      system_msg: 'System Notification',

      // Integrations
      data_source: 'Data Source',
      simulated: 'SIMULATED (Offline Demo)',
      live: 'LIVE ADAPTERS (GCP/APIs)',
      switch_source: 'Toggle Source'
    },

    hi: {
      // Header & Navigation
      app_title: 'ऑप्टिरिलीफ़',
      tagline: 'आपदा रसद इंजन',
      dashboard: 'डैशबोर्ड',
      optimizer: 'अनुकूलक एवं पैकिंग',
      zonemap: 'आपदा क्षेत्र मानचित्र',
      fleet: 'वाहन बेड़ा',
      inventory: 'गोदाम भंडार',
      sites: 'आपदा स्थल',
      dispatch: 'रवानगी लॉग',
      system: 'सिस्टम व सिंक',
      run_solver: 'समाधान चलाएं',
      sync: 'सिंक करें',
      compliance_badge: 'SIH 26002 अनुपालित',

      // District Connectivity
      district_connectivity: 'जिला-वार कनेक्टिविटी (पूर्वोत्तर भारत)',
      district_connectivity_sub: 'पूर्वोत्तर जिलों में रीयल-टाइम सड़क स्थिति, मार्ग संपर्कता, सक्रिय वाहन व आपदा निगरानी',
      select_district: 'पूर्वोत्तर जिला चुनें',
      total_routes: 'कुल उपलब्ध मार्ग',
      open_routes: 'खुले मार्ग',
      partial_routes: 'आंशिक अवरुद्ध',
      closed_routes: 'पूर्ण बंद / अगम्य',
      high_risk_routes: 'उच्च जोखिम गलियारे',
      connectivity_pct: 'संपर्कता प्रतिशत',
      active_incidents: 'सक्रिय घटनाएं',
      vehicles_operating: 'सक्रिय राहत वाहन',
      avg_delay: 'औसत पारगमन विलंब',
      normal_flow: 'सामान्य आवागमन',
      single_lane: 'केवल एक लेन वैकल्पिक मार्ग',
      washed_out: 'सड़क कटाव / पुल क्षतिग्रस्त',
      landslide_alert: 'सक्रिय भूस्खलन व मलबे का खतरा',

      // Logistics Bottlenecks & Supply Gap
      bottleneck_analysis: 'रसद अड़चनें एवं आपूर्ति-श्रृंखला अंतर विश्लेषण',
      bottleneck_sub: 'रीयल-टाइम स्टॉक कमी, अवरुद्ध मार्ग एवं वाहन की अनुपलब्धता का त्वरित विश्लेषण',
      critical_supply_gap: 'गंभीर आपूर्ति अंतर',
      location: 'राहत स्थल',
      commodity: 'राहत सामग्री',
      required: 'आवश्यक',
      available: 'उपलब्ध',
      gap: 'सामग्री कमी (अंतर)',
      priority: 'प्राथमिकता',
      high_demand_sites: 'उच्च मांग वाले क्षेत्र',
      low_stock_depots: 'अल्प भंडार वाले गोदाम',
      delayed_corridors: 'विलंबित आपूर्ति गलियारे',
      vehicle_shortages: 'वाहन की कमी',
      auto_bridge_gap: 'अंतर पाटने हेतु योजना बनाएं',
      resolve_with_solver: '3D सॉल्वर में लोड करें',

      // Roles & Auth
      role: 'उपयोगकर्ता भूमिका',
      admin: 'कमांड व्यवस्थापक (Admin)',
      field_official: 'क्षेत्रीय अधिकारी (Field Official)',
      logistics_operator: 'रसद संचालक (Logistics Operator)',
      viewer: 'दर्शक (Viewer)',
      role_badge: 'सक्रिय भूमिका',
      field_report_btn: 'सड़क अवरोध रिपोर्ट करें',
      photo_upload: 'क्षतिग्रस्त सड़क की तस्वीर अपलोड करें',
      geotag_auto: 'जीपीएस द्वारा स्वचालित रूप से टैग',

      // Alerts & Notifications
      live_alerts: 'बहुभाषी आपदा व मार्ग चेतावनी',
      alert_critical: 'अति गंभीर (CRITICAL)',
      alert_high: 'उच्च (HIGH)',
      alert_moderate: 'मध्यम (MODERATE)',
      alert_stable: 'स्थिर (STABLE)',
      route_warning: 'मार्ग चेतावनी',
      delivery_notification: 'सामग्री वितरण सूचना',
      system_msg: 'सिस्टम संदेश',

      // Integrations
      data_source: 'डेटा स्रोत',
      simulated: 'सिम्युलेटेड (ऑफ़लाइन मॉडल)',
      live: 'लाइव एडेप्टर (APIs/GCP)',
      switch_source: 'स्रोत बदलें'
    },

    as: {
      // Header & Navigation (Assamese)
      app_title: 'অপ্টিৰিলিফ',
      tagline: 'দুৰ্যোগ সাহায্য পৰিবহণ ব্যৱস্থা',
      dashboard: 'ডেশ্ববৰ্ড',
      optimizer: 'অনুকূলন আৰু পেকিং',
      zonemap: 'দুৰ্যোগ এলেকা মানচিত্ৰ',
      fleet: 'যানবাহনৰ বহৰ',
      inventory: 'সামগ্ৰীৰ ভঁৰাল',
      sites: 'সাহায্য শিবিৰ',
      dispatch: 'প্ৰেৰণ অভিলেখ',
      system: 'ব্যৱস্থা আৰু সমন্বয়',
      run_solver: 'সমাধানকাৰী চলাওক',
      sync: 'সমন্বয় কৰক',
      compliance_badge: 'SIH 26002 স্বীকৃতিপ্ৰাপ্ত',

      // District Connectivity
      district_connectivity: 'জিলাভিত্তিক পথ সংযোগ (উত্তৰ-পূৰ্বাঞ্চল)',
      district_connectivity_sub: 'উত্তৰ-পূৰ্বাঞ্চলৰ জিলাসমূহৰ বাস্তৱ-সময়ৰ পথৰ অৱস্থা, উপলব্ধ পথ আৰু বাহনৰ নিৰীক্ষণ',
      select_district: 'উত্তৰ-পূবৰ জিলা নিৰ্বাচন কৰক',
      total_routes: 'মুঠ পথ',
      open_routes: 'খোলা পথ',
      partial_routes: 'আংশিকভাৱে বন্ধ',
      closed_routes: 'সম্পূৰ্ণ বন্ধ / দুৰ্গম',
      high_risk_routes: 'অতি বিপদসংকুল পথ',
      connectivity_pct: 'সংযোগৰ হাৰ',
      active_incidents: 'সক্ৰিয় দুৰ্যোগ',
      vehicles_operating: 'কাৰ্যৰত সাহায্য যান',
      avg_delay: 'গড় পৰিবহণ পলম',
      normal_flow: 'স্বাভাৱিক যাতায়াত',
      single_lane: 'কেৱল একক লেনৰ বিকল্প পথ',
      washed_out: 'পথ খহি যোৱা / দলং ক্ষতিগ্ৰস্ত',
      landslide_alert: 'সক্ৰিয় ভূমিস্খলনৰ সতৰ্কবাৰ্তা',

      // Logistics Bottlenecks & Supply Gap
      bottleneck_analysis: 'যোগান শৃংখলাৰ সীমাবদ্ধতা আৰু সামগ্ৰীৰ নাটনি বিশ্লেষণ',
      bottleneck_sub: 'বাস্তৱ সময়ৰ সাহায্য নাটনি, বন্ধ পথ আৰু বাহনৰ অভাৱ নিৰূপণ',
      critical_supply_gap: 'জৰুৰী সাহায্য নাটনি',
      location: 'সাহায্য শিবিৰ',
      commodity: 'সাহায্য সামগ্ৰী',
      required: 'প্ৰয়োজনীয়',
      available: 'মজুত থকা',
      gap: 'নাটনি (ঘাটি)',
      priority: 'অগ্রাধিকাৰ',
      high_demand_sites: 'অধিক প্ৰয়োজনীয় এলেকা',
      low_stock_depots: 'নূন্যতম মজুত ভঁৰাল',
      delayed_corridors: 'বিলম্বিত পৰিবহণ পথ',
      vehicle_shortages: 'বাহনৰ নাটনি',
      auto_bridge_gap: 'নাটনি দূৰ কৰিবলৈ পৰিকল্পনা',
      resolve_with_solver: '৩D অপ্টিমাইজাৰলৈ পঠিয়াওক',

      // Roles & Auth
      role: 'ব্যৱহাৰকাৰীৰ ভূমিকা',
      admin: 'মুখ্য প্ৰশাসক (Admin)',
      field_official: 'ক্ষেত্ৰভিত্তিক বিষয়া (Field Official)',
      logistics_operator: 'পৰিবহণ পৰিচালক (Logistics Operator)',
      viewer: 'পৰ্যবেক্ষক (Viewer)',
      role_badge: 'সক্ৰিয় পদবী',
      field_report_btn: 'পথৰ অৱস্থাৰ প্ৰতিবেদন দিয়ক',
      photo_upload: 'ক্ষতিগ্ৰস্ত পথৰ ছবি আপলোড কৰক',
      geotag_auto: 'জিপিএছ দ্বাৰা স্থান সংলগ্ন',

      // Alerts & Notifications
      live_alerts: 'বহুভাষিক দুৰ্যোগ আৰু পথ সতৰ্কবাৰ্তা',
      alert_critical: 'জৰুৰী (CRITICAL)',
      alert_high: 'উচ্চ (HIGH)',
      alert_moderate: 'মধ্যম (MODERATE)',
      alert_stable: 'স্থিৰ (STABLE)',
      route_warning: 'পথ সতৰ্কবাৰ্তা',
      delivery_notification: 'সামগ্ৰী বিতৰণ বাৰ্তা',
      system_msg: 'ব্যৱস্থাৰ জাননী',

      // Integrations
      data_source: 'তথ্যৰ উৎস',
      simulated: 'অনুকৰণ কৰা (Simulated)',
      live: 'প্ৰত্যক্ষ উৎস (Live APIs)',
      switch_source: 'উৎস সলনি কৰক'
    }
  },

  setLanguage(lang) {
    if (!this.translations[lang]) lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('optirelief_lang', lang);
    this.listeners.forEach((fn) => {
      try { fn(lang); } catch (e) { console.warn(e); }
    });
    if (window.App && App.state && App.state.loaded) {
      App.reroute();
    }
  },

  getLanguage() {
    return this.currentLang;
  },

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  t(key, fallback = '') {
    const dict = this.translations[this.currentLang] || this.translations.en;
    if (dict[key] !== undefined) return dict[key];
    const enDict = this.translations.en;
    return enDict[key] !== undefined ? enDict[key] : (fallback || key);
  },

  /** Translate dynamic alerts depending on language */
  translateAlert(alert) {
    if (this.currentLang === 'en') return alert;
    
    // Hindi translation templates
    if (this.currentLang === 'hi') {
      let msg = alert.message;
      if (msg.includes('avalanche') || msg.includes('landslide')) {
        msg = `अति गंभीर: भूस्खलन और मलबे के कारण मार्ग अवरुद्ध। प्रभावित नागरिकों को तत्काल आपातकालीन सामग्री व दवाइयों की आवश्यकता।`;
      } else if (msg.includes('hypothermia') || msg.includes('oxygen')) {
        msg = `गंभीर: ऑक्सीजन कंसंट्रेटर और पोर्टेबल मेडिकल किट की तत्काल आवश्यकता। हवाई मार्ग से सहायता अपेक्षित।`;
      } else if (msg.includes('corridor cleared') || msg.includes('transit')) {
        msg = `सूचना: राहत आपूर्ति गलियारे को 4x4 वाहनों और पैक खच्चरों हेतु सुगम बना दिया गया है।`;
      }
      return {
        ...alert,
        level: alert.level === 'Critical' ? 'अति गंभीर' : (alert.level === 'High' ? 'उच्च' : 'मध्यम'),
        message: msg
      };
    }

    // Assamese translation templates
    if (this.currentLang === 'as') {
      let msg = alert.message;
      if (msg.includes('avalanche') || msg.includes('landslide')) {
        msg = `জৰুৰী: ভূমিস্খলনৰ বাবে মূল পথ বন্ধ। সাহায্য শিবিৰত তৎকালীনভাৱে ঔষধ আৰু খাদ্য সামগ্ৰী যোগান ধৰাৰ প্ৰয়োজন।`;
      } else if (msg.includes('hypothermia') || msg.includes('oxygen')) {
        msg = `উচ্চ সতৰ্কতা: অক্সিজেন আৰু চিকিৎসা সঁজুলিৰ অতি প্ৰয়োজন। জৰুৰী সাহায্য প্ৰেৰণৰ নিৰ্দেশ।`;
      } else if (msg.includes('corridor cleared') || msg.includes('transit')) {
        msg = `তথ্য: সাহায্য পৰিবহণৰ মূল পথ মুকলি কৰা হৈছে। যানবাহন চলাচল আৰম্ভ হৈছে।`;
      }
      return {
        ...alert,
        level: alert.level === 'Critical' ? 'জৰুৰী' : (alert.level === 'High' ? 'উচ্চ' : 'তথ্য'),
        message: msg
      };
    }

    return alert;
  }
};

window.I18N = I18N;
