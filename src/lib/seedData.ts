import { Issue } from '../types';

export const SEED_ISSUES: Partial<Issue>[] = [
  // New Delhi - North Zone
  {
    title: "Severe water logging under Minto Bridge",
    description: "During heavy pre-monsoon showers, the underpass has filled up with almost 3 feet of water, stalling several DTC buses.",
    category: "Drainage & Flooding",
    severity: 5,
    status: "reported",
    location: {
      lat: 28.6272,
      lng: 77.2238,
      ward: "Delhi - New Delhi - Connaught Place",
      address: "Minto Bridge Underpass, Connaught Place, New Delhi, Delhi 110001"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "anonymous",
    reportedByName: "Anonymous Citizen",
    upvotes: ["demo-user-1", "demo-user-2"],
    priorityScore: 12,
    source: "app",
    statusHistory: [
      { status: "reported", changedBy: "Citizen (Anonymous)", note: "Issue logged with photo proof.", timestamp: "2026-06-25T10:00:00Z" }
    ]
  },
  {
    title: "Hazardous open waste burning near Old Delhi",
    description: "Huge pile of dry leaves and plastic commercial garbage is being set on fire behind the market gates, causing thick smog.",
    category: "Garbage & Sanitation",
    severity: 4,
    status: "under_review",
    location: {
      lat: 28.6562,
      lng: 77.2410,
      ward: "Delhi - New Delhi - Karol Bagh",
      address: "Near Old Delhi Railway Station, S P Mukherjee Marg, Delhi 110006"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-1",
    reportedByName: "Ramesh Gowda",
    upvotes: ["demo-user-1", "demo-user-2", "demo-user-3", "demo-user-4"],
    priorityScore: 11,
    source: "app",
    statusHistory: [
      { status: "reported", changedBy: "Ramesh Gowda", note: "Dangerous air quality index impacts near schools.", timestamp: "2026-06-24T18:30:00Z" },
      { status: "under_review", changedBy: "MCD Ward Officer", note: "Awaiting municipal inspection van.", timestamp: "2026-06-25T09:15:00Z" }
    ]
  },

  // Mumbai - West Zone
  {
    title: "Deep pothole craters on Western Express Highway",
    description: "At least four massive potholes have emerged on the flyover lane. Multiple two-wheelers have met with accidents.",
    category: "Pothole & Roads",
    severity: 5,
    status: "assigned",
    location: {
      lat: 19.1176,
      lng: 72.8560,
      ward: "Maharashtra - Mumbai - Andheri",
      address: "Western Express Hwy Flyover, Andheri East, Mumbai, Maharashtra 400069"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-2",
    reportedByName: "Sita Hegde",
    upvotes: ["demo-user-1", "demo-user-2", "demo-user-3"],
    priorityScore: 14.5,
    source: "app",
    assignedTo: "BMC Road Contractor Team",
    department: "BBMP - PWD (Roads)",
    slaDue: "2026-07-02T12:00:00Z",
    statusHistory: [
      { status: "reported", changedBy: "Sita Hegde", note: "Very dark stretch, severe risk at night.", timestamp: "2026-06-23T20:00:00Z" },
      { status: "under_review", changedBy: "BMC PWD Desk", note: "Work order raised successfully.", timestamp: "2026-06-24T11:00:00Z" },
      { status: "assigned", changedBy: "BMC Assistant Engineer", note: "Assigned to Ward K-East patch crew.", timestamp: "2026-06-25T14:30:00Z" }
    ]
  },
  {
    title: "Broken streetlights near Marine Drive",
    description: "A continuous stretch of three streetlights is fully blacked out, rendering the pedestrian crossing unsafe.",
    category: "Streetlight & Electricity",
    severity: 3,
    status: "resolved",
    location: {
      lat: 18.9415,
      lng: 72.8235,
      ward: "Maharashtra - Mumbai - Colaba",
      address: "Marine Drive Promenade, Netaji Subhash Chandra Bose Rd, Mumbai, Maharashtra 400021"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1509024644558-2f56ce76c090?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-3",
    reportedByName: "Ananya S.",
    upvotes: ["demo-user-1", "demo-user-2"],
    priorityScore: 8.5,
    source: "app",
    department: "BESCOM (Electricity)",
    resolvedProofUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    statusHistory: [
      { status: "reported", changedBy: "Ananya S.", note: "Stray animals gather under the dark poles.", timestamp: "2026-06-20T08:00:00Z" },
      { status: "assigned", changedBy: "BEST Electrical Inspector", note: "BEST repair van dispatched.", timestamp: "2026-06-20T12:00:00Z" },
      { status: "in_progress", changedBy: "BEST Crew", note: "Replacing fused high-pressure sodium bulbs.", timestamp: "2026-06-21T09:00:00Z" },
      { status: "resolved", changedBy: "BEST Supervisor", note: "Bulbs replaced. Tested and working properly.", timestamp: "2026-06-21T16:00:00Z" }
    ]
  },

  // Bengaluru - South Zone
  {
    title: "Sewage overflow on Outer Ring Road",
    description: "A blocked sewer pipeline has ruptured, flooding the service road near Bellandur with foul water.",
    category: "Water Leakage & Sewage",
    severity: 4,
    status: "verified",
    location: {
      lat: 12.9304,
      lng: 77.6784,
      ward: "Karnataka - Bengaluru - Bellandur",
      address: "Outer Ring Rd near Intel, Bellandur, Bengaluru, Karnataka 560103"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-4",
    reportedByName: "Vikram Sen",
    upvotes: ["demo-user-1", "demo-user-2", "demo-user-3", "demo-user-4", "demo-user-5"],
    priorityScore: 12.5,
    source: "app",
    statusHistory: [
      { status: "reported", changedBy: "Vikram Sen", note: "Severe health hazard for pedestrians.", timestamp: "2026-06-26T11:00:00Z" },
      { status: "under_review", changedBy: "BWSSB Desk", note: "Verifying pipe diameter blueprints.", timestamp: "2026-06-27T10:00:00Z" },
      { status: "verified", changedBy: "BWSSB Ward Engineer", note: "Blockage verified. Issuing jetting vehicle work order.", timestamp: "2026-06-28T14:00:00Z" }
    ]
  },
  {
    title: "Footpath encroachment by commercial setups",
    description: "Two local restaurants have built illegal structures on the pedestrian footpath, forcing walkers onto 80 Feet Road.",
    category: "Encroachment & Footpaths",
    severity: 3,
    status: "in_progress",
    location: {
      lat: 12.9352,
      lng: 77.6245,
      ward: "Karnataka - Bengaluru - Koramangala",
      address: "80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1530124566582-a61a1275b1ae?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-5",
    reportedByName: "Sneha Nair",
    upvotes: ["demo-user-1", "demo-user-2"],
    priorityScore: 9.5,
    source: "app",
    department: "Traffic Police (Encroachment)",
    slaDue: "2026-06-29T18:00:00Z",
    statusHistory: [
      { status: "reported", changedBy: "Sneha Nair", note: "Extremely difficult for children and elders.", timestamp: "2026-06-27T07:30:00Z" },
      { status: "assigned", changedBy: "BBMP Estate Officer", note: "Forwarded to encroachment clearing task force.", timestamp: "2026-06-27T11:30:00Z" },
      { status: "in_progress", changedBy: "Task Force #2", note: "Notice served. Scheduled clearance with traffic squad.", timestamp: "2026-06-28T09:00:00Z" }
    ]
  },

  // Kolkata - East Zone
  {
    title: "Damaged paving blocks at Howrah approach",
    description: "More than 20 pavement stones have crumbled away or are missing, leaving dangerous holes on the pathway.",
    category: "Encroachment & Footpaths",
    severity: 3,
    status: "reported",
    location: {
      lat: 22.5855,
      lng: 88.3512,
      ward: "West Bengal - Kolkata - Howrah",
      address: "Howrah Bridge Approach Rd, Kolkata, West Bengal 700001"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1530124566582-a61a1275b1ae?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "whatsapp",
    reportedByName: "WhatsApp User",
    upvotes: ["demo-user-1"],
    priorityScore: 7,
    source: "whatsapp",
    statusHistory: [
      { status: "reported", changedBy: "WhatsApp Bot", note: "Grievance compiled automatically.", timestamp: "2026-06-28T18:00:00Z" }
    ]
  },
  {
    title: "Clogged drainage canal near Salt Lake Sector V",
    description: "Silt and plastic waste are blocking the drainage outlet. Water starts logging with just 15 minutes of light rain.",
    category: "Drainage & Flooding",
    severity: 4,
    status: "under_review",
    location: {
      lat: 22.5735,
      lng: 88.4331,
      ward: "West Bengal - Kolkata - Salt Lake",
      address: "Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal 700091"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-6",
    reportedByName: "Kiran Mazumdar",
    upvotes: ["demo-user-1", "demo-user-2", "demo-user-3", "demo-user-4"],
    priorityScore: 11,
    source: "app",
    statusHistory: [
      { status: "reported", changedBy: "Kiran Mazumdar", note: "Severe mosquito breeding ground.", timestamp: "2026-06-26T06:00:00Z" },
      { status: "under_review", changedBy: "KMDA Sanitary Inspector", note: "Assessing requirements for machine de-silting.", timestamp: "2026-06-27T15:00:00Z" }
    ]
  },

  // Hyderabad - Central Zone
  {
    title: "Open electrical DP transformer cabinet",
    description: "A high-voltage DP box door is hanging wide open with naked live cables exposed on a busy sidewalk.",
    category: "Streetlight & Electricity",
    severity: 5,
    status: "resolved",
    location: {
      lat: 17.4483,
      lng: 78.3741,
      ward: "Telangana - Hyderabad - Gachibowli",
      address: "Gachibowli Road near DLF, Hyderabad, Telangana 500032"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1509024644558-2f56ce76c090?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-4",
    reportedByName: "Vikram Sen",
    upvotes: ["demo-user-1", "demo-user-2", "demo-user-3", "demo-user-4", "demo-user-5"],
    priorityScore: 15,
    source: "app",
    department: "BESCOM (Electricity)",
    resolvedProofUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    statusHistory: [
      { status: "reported", changedBy: "Vikram Sen", note: "Extremely life-threatening near bus shelter.", timestamp: "2026-06-20T17:00:00Z" },
      { status: "assigned", changedBy: "TSSPDCL Emergency Team", note: "Dispatched emergency crew.", timestamp: "2026-06-20T17:30:00Z" },
      { status: "resolved", changedBy: "TSSPDCL Crew", note: "Wiring insulated and box safely locked up.", timestamp: "2026-06-20T19:00:00Z" }
    ]
  },
  {
    title: "Garbage black spot near Charminar pathway",
    description: "Tons of commercial plastic bags and organic fruit waste are piled up right next to the heritage walk trail.",
    category: "Garbage & Sanitation",
    severity: 4,
    status: "assigned",
    location: {
      lat: 17.3616,
      lng: 78.4747,
      ward: "Telangana - Hyderabad - Banjara Hills",
      address: "Charminar Rd, Hyderabad, Telangana 500002"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-7",
    reportedByName: "Mohit Juneja",
    upvotes: ["demo-user-1"],
    priorityScore: 8,
    source: "app",
    department: "BBMP - Solid Waste Management",
    slaDue: "2026-07-03T18:00:00Z",
    statusHistory: [
      { status: "reported", changedBy: "Mohit Juneja", note: "Unbearable smell and eye sore for tourists.", timestamp: "2026-06-25T21:00:00Z" },
      { status: "assigned", changedBy: "GHMC Sanitary Supervisor", note: "Allocated auto-tipper vehicle to clear the area.", timestamp: "2026-06-26T14:00:00Z" }
    ]
  },

  // Guwahati - Northeast Zone
  {
    title: "Severe road soil erosion on hilly bypass road",
    description: "The road shoulder has completely caved in due to heavy rainfall, making the single lane narrow and hazardous.",
    category: "Pothole & Roads",
    severity: 4,
    status: "reported",
    location: {
      lat: 26.1154,
      lng: 91.7085,
      ward: "Assam - Guwahati - Dispur",
      address: "VIP Rd near Hill View, Guwahati, Assam 781036"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "citizen-8",
    reportedByName: "Divya Rao",
    upvotes: ["demo-user-1", "demo-user-2"],
    priorityScore: 9,
    source: "app",
    statusHistory: [
      { status: "reported", changedBy: "Divya Rao", note: "Risk of vehicle rolling down. Needs urgent barricades.", timestamp: "2026-06-28T21:30:00Z" }
    ]
  },
  {
    title: "Drinking water main line burst near Paltan Bazaar",
    description: "A major water supply pipe has burst under the pavement, sending a fountain of clean water onto the street.",
    category: "Water Leakage & Sewage",
    severity: 3,
    status: "reported",
    location: {
      lat: 26.1751,
      lng: 91.7539,
      ward: "Assam - Guwahati - Paltan Bazaar",
      address: "Paltan Bazaar Road, Guwahati, Assam 781008"
    },
    media: [
      { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80", type: "image" }
    ],
    reportedBy: "whatsapp",
    reportedByName: "WhatsApp User",
    upvotes: [],
    priorityScore: 6,
    source: "whatsapp",
    statusHistory: [
      { status: "reported", changedBy: "WhatsApp Bot", note: "Grievance auto-logged.", timestamp: "2026-06-28T14:00:00Z" }
    ]
  }
];
