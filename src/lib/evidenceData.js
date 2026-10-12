// Canonical evidence data for Round 1 — ANALYZE: The Evidence Room

export const CASE_OVERVIEW = {
  title: "The Theft of The Aurora",
  location: "Aethelgard Royal Museum — High Security Vault Gallery",
  timeOfCrime: "Between 11:47 PM and 11:52 PM",
  value: "$45,000,000 USD",
  description:
    "The Aurora, a priceless gemstone on display in the museum's exhibition room, was stolen sometime between 11:47 PM and 11:52 PM. CCTV footage confirmed it was present in its display case at 11:46 PM; by 11:52 PM it was gone. A brief sensor interruption and a suspicious pattern of access-card grants in the minutes before the theft suggest a coordinated inside operation."
};

export const SUSPECTS = [
  {
    id: "ryan-dsouza",
    name: "Ryan D'Souza",
    role: "Chief Security Director",
    clearance: "Level 5 (Master Access)",
    photo: "/ryan.png",
    alibi:
      "Claims he was in the Central Security Control Room overseeing routine server maintenance from 10:00 PM to 11:30 PM.",
    motive:
      "Was seen near the Aurora diamond display at 10:45 PM. Later sent a private message: 'If they don't sell it tonight, I'll find another way.' Heavy losses in offshore accounts; holds master override codes."
  },
  {
    id: "kabir-shah",
    name: "Kabir Shah",
    role: "Senior Systems Engineer",
    clearance: "Level 4 (Technical Admin)",
    photo: "/kabir.png",
    alibi:
      "Claims he was updating firmware on Basement Server Rack B-4 when the network dropped.",
    motive:
      "Passed over for promotion twice; deep technical knowledge of security systems. Personally logged a manual E-03 check at 10:58 PM. Was asked by Maya to check E-03 before closing — yet the sensor went offline minutes after."
  },
  {
    id: "maya-thomas",
    name: "Maya Thomas",
    role: "Restoration & Conservation Lead",
    clearance: "Level 2 (Lab & Display Access)",
    photo: "/maya.png",
    alibi:
      "Claims she was in the 2nd Floor Restoration Lab cleaning 18th-century silver artifacts. Left the administration area at 11:46:50 PM — just seconds before the E-03 sensor cut out.",
    motive:
      "Left the admin area at 11:46:50 PM — right as the sensor went offline. Directed Kabir to check E-03, potentially as a diversion. Had access to specialized chemical solvents."
  },
  {
    id: "dev-malhotra",
    name: "Dev Malhotra",
    role: "Night Security Supervisor",
    clearance: "Level 3 (Gallery Patrol)",
    photo: "/dev.png",
    alibi:
      "Claims he was conducting physical perimeter checks on the North Wing balcony. Received an electrical panel maintenance request at 11:35 PM.",
    motive:
      "Access card DEV-118 granted in Service Corridor B at 11:42 PM and 11:44 PM — then granted Exhibition Room access at 11:47:05 PM, only 3 seconds after E-03 cut out and 1 second before the display-case sensor went offline. Unexplained cash deposits in overseas accounts."
  },
  {
    id: "nisha-varma",
    name: "Nisha Varma",
    role: "Head Curator of Antiquities",
    clearance: "Level 3 (Vault Access)",
    photo: "/nisha.png",
    alibi:
      "Claims she left the museum building at 9:45 PM after finalizing the weekend display inventory.",
    motive:
      "Faced severe budget cuts for her research foundation; primary contact for private art brokers. Her early departure cannot be independently verified."
  }
];

export const CCTV_EVIDENCE = [
  {
    id: "CAM-01",
    camera: "CAM-01 — Diamond Display Gallery",
    timestamp: "10:45 PM",
    caption: "Ryan is near a diamond display in the gallery.",
    note: "Observed proximity to high-value display. Cross-reference with Ryan's private message at 11:05 PM.",
    type: "recorded"
  },
  {
    id: "CAM-02",
    camera: "CAM-02 — Service Corridor B (Electrical Panel)",
    timestamp: "11:42 PM",
    caption: "Dev is in Service Corridor B near an electrical panel.",
    note: "DEV-118 access card logged entry at 11:42:17 PM and again at 11:44:03 PM. Repeated access to electrical panel area is unusual.",
    type: "recorded"
  },
  {
    id: "CAM-03",
    camera: "CAM-03 — Administration Area",
    timestamp: "11:46:50 PM",
    caption: "Maya leaves the administration area.",
    note: "Departure timed 12 seconds before E-03 connection interrupted at 11:47:02 PM.",
    type: "recorded"
  },
  {
    id: "CAM-04A",
    camera: "CAM-04 — Exhibition Room Display Case",
    timestamp: "11:46 PM",
    caption: "The Aurora is visible inside its display case.",
    note: "Confirmed present. Display case sensor was functional at this time.",
    type: "recorded"
  },
  {
    id: "CAM-04B",
    camera: "CAM-04 — Exhibition Room Display Case",
    timestamp: "11:52 PM",
    caption: "The display case is visible, but The Aurora is missing.",
    note: "⚠ CRITICAL: Theft window confirmed between 11:46 PM and 11:52 PM.",
    type: "critical"
  }
];

// ─── TIMELINE ────────────────────────────────────────────────────────────────
// Events are listed exactly as provided, in chronological order.
// type: "recorded" = direct observation | "interpreted" = inference / flag
export const TIMELINE_EVENTS = [
  { time: "10:45 PM", event: "Ryan is seen near Aurora.", type: "recorded" },
  { time: "10:58 PM", event: "Kabir records a manual E-03 check.", type: "recorded" },
  { time: "11:05 PM", event: "Ryan sends a private message.", type: "recorded" },
  { time: "11:18 PM", event: "Maya asks Kabir to check E-03 before closing.", type: "recorded" },
  { time: "11:25 PM", event: "Scheduled security maintenance starts.", type: "recorded" },
  { time: "11:29 PM", event: "Scheduled maintenance ends.", type: "recorded" },
  { time: "11:30 PM", event: "Security system reported normal.", type: "recorded" },
  { time: "11:31 PM", event: "Exhibition closes.", type: "recorded" },
  { time: "11:35 PM", event: "Dev receives an electrical panel maintenance request.", type: "recorded" },
  { time: "11:42:17 PM", event: "DEV-118 access granted in Service Corridor B.", type: "recorded" },
  { time: "11:44:03 PM", event: "DEV-118 access granted in Service Corridor B.", type: "recorded" },
  { time: "11:46 PM", event: "Aurora visible in CAM-04.", type: "recorded" },
  { time: "11:46:50 PM", event: "Maya leaves the administration area.", type: "recorded" },
  { time: "11:47:02 PM", event: "E-03 connection interrupted.", type: "recorded" },
  { time: "11:47:05 PM", event: "DEV-118 access granted in Exhibition Room.", type: "recorded" },
  { time: "11:47:06 PM", event: "Display-case sensor temporarily unavailable.", type: "recorded" },
  { time: "11:47:09 PM", event: "E-03 connection restored.", type: "recorded" },
  { time: "11:52 PM", event: "Aurora reported missing.", type: "critical" }
];

// ─── INTERCEPTED MESSAGES ────────────────────────────────────────────────────
export const INTERCEPTED_MESSAGES = [
  {
    id: "M-01",
    sender: "Kabir",
    recipient: "Security Log",
    time: "10:58 PM",
    text: "Manual check of E-03 completed."
  },
  {
    id: "M-02",
    sender: "Ryan",
    recipient: "Private Contact",
    time: "11:05 PM",
    text: "If they don't sell it tonight, I'll find another way."
  },
  {
    id: "M-03",
    sender: "Maya",
    recipient: "Kabir",
    time: "11:18 PM",
    text: "Can you make sure E-03 is checked before closing?"
  },
  {
    id: "M-04",
    sender: "Dev",
    recipient: "Maintenance Desk",
    time: "11:35 PM",
    text: "Electrical panel warning received."
  }
];

// ─── TECHNICAL & SECURITY LOGS ────────────────────────────────────────────────
export const TECHNICAL_LOGS = [
  {
    system: "Security Maintenance Log",
    detail: "Scheduled security maintenance: 11:25–11:29 PM. System operated within normal parameters during window."
  },
  {
    system: "Security System Status",
    detail: "Security system status reported normal at 11:30 PM."
  },
  {
    system: "Access Log — DEV-118",
    detail: "11:42:17 PM — Access GRANTED: Service Corridor B. 11:44:03 PM — Access GRANTED: Service Corridor B (repeat). 11:47:05 PM — Access GRANTED: Exhibition Room."
  },
  {
    system: "Sensor Log — E-03",
    detail: "11:47:02 PM — E-03 connection interrupted. 11:47:09 PM — E-03 connection restored. Window: ~7 seconds."
  },
  {
    system: "Display Case Sensor Log",
    detail: "11:47:06 PM — Display-case sensor temporarily unavailable. Resumed after E-03 restored."
  }
];
