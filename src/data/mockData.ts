export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
}

export interface Complaint {
  id: string;
  category: string;
  subCategory?: string;
  description: string;
  incidentDate: string;
  suspectInfo: {
    platform?: string;
    username?: string;
    phone?: string;
    email?: string;
    url?: string;
  };
  status: 'submitted' | 'assigned' | 'investigating' | 'pending_evidence' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'urgent';
  assignedOfficer?: {
    name: string;
    badgeNumber: string;
    rank: string;
    phone: string;
  };
  firNumber?: string;
  aiRiskScore: number;
  createdAt: string;
  updatedAt: string;
  evidenceFiles: {
    id: string;
    name: string;
    size: string;
    type: string;
    hash: string;
    url: string;
    uploadedAt: string;
    deepfakeScore?: number;
  }[];
  messages: {
    id: string;
    sender: 'user' | 'officer';
    text: string;
    timestamp: string;
  }[];
  firDraft?: {
    text: string;
    ipcSections: string[];
  };
}

export interface LiveIncident {
  id: string;
  userName: string;
  phone: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  triggerType: 'button' | 'silent' | 'voice' | 'sms';
  status: 'active' | 'responding' | 'resolved';
  createdAt: string;
  assignedOfficerId?: string;
}

export const initialGuardians: Guardian[] = [
  { id: 'g1', name: 'Rajesh Sharma', phone: '+91 98765 43210', relation: 'Father', priority: 1 },
  { id: 'g2', name: 'Sunita Sharma', phone: '+91 98765 43211', relation: 'Mother', priority: 2 },
  { id: 'g3', name: 'Amit Verma', phone: '+91 98765 43212', relation: 'Husband/Partner', priority: 3 }
];

export const cybercrimeCategories = [
  { id: 'cyberstalking', title: 'Cyberstalking', desc: 'Monitoring, harassing, or stalking you online via social media or messengers.', icon: 'Eye' },
  { id: 'harassment', title: 'Online Harassment', desc: 'Obscene messages, comments, threat emails, or digital bullying.', icon: 'MessageSquareOff' },
  { id: 'blackmail', title: 'Blackmail / Sextortion', desc: 'Threats to release sensitive photos/videos unless money or favors are given.', icon: 'Key' },
  { id: 'deepfake', title: 'Deepfake Misuse', desc: 'AI-generated fake images or videos of your face used maliciously.', icon: 'ScanFace' },
  { id: 'financial_fraud', title: 'Financial Fraud / UPI Scam', desc: 'Scammed out of money via Google Pay, PhonePe, credit cards, or fake job offers.', icon: 'DollarSign' },
  { id: 'phishing', title: 'Phishing / Malware Link', desc: 'Suspicious links promising rewards, prizes, or asking for logins.', icon: 'Link2' },
  { id: 'identity_theft', title: 'Identity Theft', desc: 'Fake profiles created in your name to defame you or scam others.', icon: 'UserX' },
  { id: 'account_hacking', title: 'Account Hacking', desc: 'Loss of access to your Instagram, WhatsApp, Facebook, or Gmail.', icon: 'Lock' },
  { id: 'other', title: 'Other Cyber Crime', desc: 'Any other safety threats or cyberattacks that do not fit above.', icon: 'HelpCircle' }
];

export const initialComplaints: Complaint[] = [
  {
    id: 'SH-2026-8902',
    category: 'cyberstalking',
    description: 'An anonymous Instagram user is continuously sending threatening and stalker-like direct messages to my private account. They know details about my daily college schedule and have posted pictures of me taken from a distance without my consent. Despite blocking 3 accounts, they keep creating new ones to message me.',
    incidentDate: '2026-06-08',
    suspectInfo: {
      platform: 'Instagram',
      username: '@dark_shadow_666',
      url: 'https://instagram.com/dark_shadow_666'
    },
    status: 'investigating',
    priority: 'urgent',
    assignedOfficer: {
      name: 'Inspector M. Patel',
      badgeNumber: 'CC-4902',
      rank: 'Senior Investigator',
      phone: '+91 79263 01930'
    },
    firNumber: 'FIR/2026/CYBER/9041',
    aiRiskScore: 0.82,
    createdAt: '2026-06-08T14:32:00Z',
    updatedAt: '2026-06-09T10:15:00Z',
    evidenceFiles: [
      {
        id: 'ev1',
        name: 'stalking_chats_1.png',
        size: '1.2 MB',
        type: 'image/png',
        hash: 'a58f7e21b069d35f4422e11a2f4c66708e92c21ff285310034a8e2bc13efd89a',
        url: '#',
        uploadedAt: '2026-06-08T14:30:00Z',
        deepfakeScore: 0.05
      },
      {
        id: 'ev2',
        name: 'unauthorized_photo.png',
        size: '2.4 MB',
        type: 'image/png',
        hash: 'b69f7e22c079e36f4523e12b2f5c77709e93c31ff385410035a9e3bc23efd89b',
        url: '#',
        uploadedAt: '2026-06-08T14:31:00Z',
        deepfakeScore: 0.12
      }
    ],
    messages: [
      { id: 'm1', sender: 'officer', text: 'Hello Priya, I have reviewed your case files. We have requested the registration logs from Meta for the suspect handle. Please keep your account settings set to private.', timestamp: '2026-06-09T09:30:00Z' },
      { id: 'm2', sender: 'user', text: 'Thank you Inspector. They sent another message today from @dark_shadow_777. I have screenshotted it, should I upload it here?', timestamp: '2026-06-09T10:10:00Z' },
      { id: 'm3', sender: 'officer', text: 'Yes, please upload the new screenshot using the Add Evidence button so it is linked to this case file with a secure hash.', timestamp: '2026-06-09T10:15:00Z' }
    ],
    firDraft: {
      text: 'FIRST INFORMATION REPORT\nUnder Section 154 CrPC\n\n1. District: Ahmedabad City\n2. Police Station: Cyber Crime Branch\n3. FIR Number: FIR/2026/CYBER/9041\n4. Date & Time of Occurrence: 08/06/2026 14:32 Hours\n\n5. Details of Complainant:\n   Name: Priya Sharma\n   Address: Vastrapur, Ahmedabad\n\n6. Description of Incident:\n   The complainant reports persistent cyberstalking and online harassment by an unidentified individual operating under the Instagram handle @dark_shadow_666. The suspect has demonstrated knowledge of the complainant\'s offline whereabouts and college schedules, generating severe emotional distress and raising safety alarms.\n\n7. Suspect Handles / Accounts:\n   Instagram Profile: https://instagram.com/dark_shadow_666\n\n8. Applicable Sections:\n   - Section 354D IPC (Cyberstalking)\n   - Section 66C Information Technology Act (Identity Theft/Impersonation)\n   - Section 66E IT Act (Violation of Privacy)',
      ipcSections: ['Section 354D IPC', 'Section 66C IT Act', 'Section 66E IT Act']
    }
  },
  {
    id: 'SH-2026-7612',
    category: 'financial_fraud',
    description: 'I received a message on Telegram offering a part-time job doing product reviews. They asked me to deposit Rs. 5000 initially, promising Rs. 8000 return. After the first transfer, they locked me out of the channel and blocked my number. The UPI ID used for payment was quick-pay@icici.',
    incidentDate: '2026-06-02',
    suspectInfo: {
      platform: 'Telegram / UPI',
      username: '@earn_cash_parttime',
      phone: '+91 99887 76655'
    },
    status: 'resolved',
    priority: 'normal',
    assignedOfficer: {
      name: 'Sub-Inspector R. Sen',
      badgeNumber: 'CC-5120',
      rank: 'Fraud Specialist',
      phone: '+91 79263 01931'
    },
    firNumber: 'FIR/2026/CYBER/7612',
    aiRiskScore: 0.35,
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-05T16:00:00Z',
    evidenceFiles: [
      {
        id: 'ev3',
        name: 'payment_screenshot.png',
        size: '850 KB',
        type: 'image/png',
        hash: 'c70f7e23d089f36g4523e12c2f5c77709e93c31ff385410035a9e3bc23efd89c',
        url: '#',
        uploadedAt: '2026-06-02T10:05:00Z'
      }
    ],
    messages: [
      { id: 'm4', sender: 'officer', text: 'UPI transaction has been flagged and the beneficiary bank account in Bihar has been frozen. Refund process initiated.', timestamp: '2026-06-04T12:00:00Z' },
      { id: 'm5', sender: 'user', text: 'Thank you for the quick action! I will be more careful now.', timestamp: '2026-06-05T15:30:00Z' }
    ]
  }
];

export const mockLiveIncidents: LiveIncident[] = [
  {
    id: 'inc-9921',
    userName: 'Kriti Sen',
    phone: '+91 91234 56789',
    latitude: 23.0305,
    longitude: 72.5624, // Near Mithakhali, Ahmedabad
    accuracy: 8,
    triggerType: 'button',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString() // 3 mins ago
  },
  {
    id: 'inc-9922',
    userName: 'Nisha Vyas',
    phone: '+91 92345 67890',
    latitude: 23.0125,
    longitude: 72.5914, // Near Maninagar, Ahmedabad
    accuracy: 12,
    triggerType: 'silent',
    status: 'active',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString() // 8 mins ago
  },
  {
    id: 'inc-9920',
    userName: 'Pooja Patel',
    phone: '+91 93456 78901',
    latitude: 23.0225,
    longitude: 72.5714, // CG Road, Ahmedabad
    accuracy: 4,
    triggerType: 'voice',
    status: 'responding',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    assignedOfficerId: 'CC-4902'
  }
];

export const mockSuspects = [
  { id: 's1', handle: '@dark_shadow_666', phone: '+91 90123 45678', email: 'shadow@gmail.com', linkedCasesCount: 3, riskScore: 0.89, matchType: 'Handle & Phone match' },
  { id: 's2', handle: '@earn_cash_parttime', phone: '+91 99887 76655', email: 'parttime_job@scam.co.in', linkedCasesCount: 8, riskScore: 0.95, matchType: 'Telegram Account' },
  { id: 's3', handle: 'spencer_12', phone: '+91 88990 01122', email: 'spencerv@outlook.com', linkedCasesCount: 1, riskScore: 0.45, matchType: 'Email match' }
];


export const getProfileScanResult = (profileUrl: string) => {
  return {
    url: profileUrl,
    fakeScore: 78,
    riskLevel: 'HIGH RISK',
    reasons: [
      'Account was created very recently (under 15 days).',
      'Extremely high follower-to-following ratio (Following 2000, 12 Followers).',
      'Profile image reverse-search matches stock photography.',
      'Profile biography contains high-risk harassment keywords.'
    ]
  };
};

export interface GirlLocationVisit {
  id: string;
  locationName: string;
  area: string;
  enteredAt: string;
  exitedAt?: string;
  durationMinutes?: number;
}

export interface MonitoredGirl {
  id: string;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: 'safe' | 'warning' | 'danger';
  lastSeen: string;
  avatarColor: string;
  history: GirlLocationVisit[];
}

export const initialMonitoredGirls: MonitoredGirl[] = [
  // Ahmedabad Monitored Girls (10)
  {
    id: 'girl-1',
    name: 'Ananya Rao',
    phone: '+91 98980 12345',
    latitude: 23.0370,
    longitude: 72.5280,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-emerald-500 to-teal-605',
    history: [
      {
        id: 'v-101',
        locationName: 'Lal Darwaja Bus Stand',
        area: 'Lal Darwaja',
        enteredAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        exitedAt: new Date(Date.now() - 3.6 * 3600000).toISOString(),
        durationMinutes: 24
      },
      {
        id: 'v-102',
        locationName: 'Vastrapur Residential Lanes',
        area: 'Vastrapur',
        enteredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        exitedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        durationMinutes: 60
      }
    ]
  },
  {
    id: 'girl-2',
    name: 'Kriti Sen',
    phone: '+91 91234 56789',
    latitude: 23.0305,
    longitude: 72.5624,
    status: 'danger',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-rose-500 to-red-600',
    history: [
      {
        id: 'v-201',
        locationName: 'Mithakhali Area Stretch',
        area: 'Mithakhali',
        enteredAt: new Date(Date.now() - 30 * 60000).toISOString(),
        durationMinutes: 30
      }
    ]
  },
  {
    id: 'girl-3',
    name: 'Nisha Vyas',
    phone: '+91 92345 67890',
    latitude: 23.0125,
    longitude: 72.5914,
    status: 'danger',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-pink-500 to-rose-600',
    history: [
      {
        id: 'v-301',
        locationName: 'Maninagar Station Back Lanes',
        area: 'Maninagar',
        enteredAt: new Date(Date.now() - 8 * 60000).toISOString(),
        durationMinutes: 8
      }
    ]
  },
  {
    id: 'girl-4',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    latitude: 23.0338,
    longitude: 72.5250,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-violet-500 to-purple-600',
    history: [
      {
        id: 'v-401',
        locationName: 'Shahpur Residential Lanes',
        area: 'Shahpur',
        enteredAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        exitedAt: new Date(Date.now() - 4.3 * 3600000).toISOString(),
        durationMinutes: 42
      }
    ]
  },
  {
    id: 'girl-5',
    name: 'Meera Mehta',
    phone: '+91 94567 89012',
    latitude: 23.0185,
    longitude: 72.6185,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-amber-500 to-orange-600',
    history: [
      {
        id: 'v-501',
        locationName: 'Gomtipur Industrial Zone',
        area: 'Gomtipur',
        enteredAt: new Date(Date.now() - 15 * 60000).toISOString(),
        durationMinutes: 15
      }
    ]
  },
  {
    id: 'girl-6',
    name: 'Riddhi Patel',
    phone: '+91 95678 90123',
    latitude: 23.02686,
    longitude: 72.59900,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-yellow-500 to-amber-600',
    history: [
      {
        id: 'v-601',
        locationName: 'Kalupur Railway Station Surroundings',
        area: 'Kalupur',
        enteredAt: new Date(Date.now() - 40 * 60000).toISOString(),
        durationMinutes: 40
      }
    ]
  },
  {
    id: 'girl-7',
    name: 'Sneha Gupta',
    phone: '+91 96789 01234',
    latitude: 23.02140,
    longitude: 72.58640,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-orange-500 to-red-500',
    history: [
      {
        id: 'v-701',
        locationName: 'Lal Darwaja Bus Stand',
        area: 'Lal Darwaja',
        enteredAt: new Date(Date.now() - 25 * 60000).toISOString(),
        durationMinutes: 25
      }
    ]
  },
  {
    id: 'girl-8',
    name: 'Aditi Shah',
    phone: '+91 97890 12345',
    latitude: 22.98200,
    longitude: 72.62450,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-yellow-400 to-orange-500',
    history: [
      {
        id: 'v-801',
        locationName: 'Isanpur Night Market Area',
        area: 'Isanpur',
        enteredAt: new Date(Date.now() - 12 * 60000).toISOString(),
        durationMinutes: 12
      }
    ]
  },
  {
    id: 'girl-9',
    name: 'Diya Sharma',
    phone: '+91 98901 23456',
    latitude: 23.03000,
    longitude: 72.58100,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-amber-650 to-rose-500',
    history: [
      {
        id: 'v-901',
        locationName: 'Shahpur Residential Lanes',
        area: 'Shahpur',
        enteredAt: new Date(Date.now() - 30 * 60000).toISOString(),
        durationMinutes: 30
      }
    ]
  },
  {
    id: 'girl-10',
    name: 'Tanvi Joshi',
    phone: '+91 99012 34567',
    latitude: 22.96800,
    longitude: 72.64200,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-orange-600 to-rose-600',
    history: [
      {
        id: 'v-1001',
        locationName: 'Vatva GIDC Industrial Area',
        area: 'Vatva',
        enteredAt: new Date(Date.now() - 50 * 60000).toISOString(),
        durationMinutes: 50
      }
    ]
  },

  // Surat Monitored Girls (10)
  {
    id: 'girl-11',
    name: 'Kavya Desai',
    phone: '+91 91111 22222',
    latitude: 21.1980,
    longitude: 72.8170,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-amber-500 to-orange-600',
    history: [
      {
        id: 'v-1101',
        locationName: 'Chowk Bazaar Market',
        area: 'Chowk Bazaar',
        enteredAt: new Date(Date.now() - 15 * 60000).toISOString(),
        durationMinutes: 15
      }
    ]
  },
  {
    id: 'girl-12',
    name: 'Kiara Shah',
    phone: '+91 92222 33333',
    latitude: 21.2050,
    longitude: 72.8400,
    status: 'danger',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-rose-500 to-red-600',
    history: [
      {
        id: 'v-1201',
        locationName: 'Surat Railway Station Surroundings',
        area: 'Surat Station',
        enteredAt: new Date(Date.now() - 10 * 60000).toISOString(),
        durationMinutes: 10
      }
    ]
  },
  {
    id: 'girl-13',
    name: 'Nehal Patel',
    phone: '+91 93333 44444',
    latitude: 21.0750,
    longitude: 72.7150,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-yellow-500 to-amber-600',
    history: [
      {
        id: 'v-1301',
        locationName: 'Dumas Beach Stretch',
        area: 'Dumas Beach',
        enteredAt: new Date(Date.now() - 45 * 60000).toISOString(),
        durationMinutes: 45
      }
    ]
  },
  {
    id: 'girl-14',
    name: 'Shruti Verma',
    phone: '+91 94444 55555',
    latitude: 21.2080,
    longitude: 72.8700,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-orange-500 to-red-500',
    history: [
      {
        id: 'v-1401',
        locationName: 'Varachha Diamond Market',
        area: 'Varachha',
        enteredAt: new Date(Date.now() - 30 * 60000).toISOString(),
        durationMinutes: 30
      }
    ]
  },
  {
    id: 'girl-15',
    name: 'Aaradhya Mishra',
    phone: '+91 95555 66666',
    latitude: 21.1850,
    longitude: 72.7950,
    status: 'warning',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-amber-600 to-rose-600',
    history: [
      {
        id: 'v-1501',
        locationName: 'Adajan Isolated Lanes',
        area: 'Adajan',
        enteredAt: new Date(Date.now() - 22 * 60000).toISOString(),
        durationMinutes: 22
      }
    ]
  },
  {
    id: 'girl-16',
    name: 'Payal Solanki',
    phone: '+91 96666 77777',
    latitude: 21.2250,
    longitude: 72.8250,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-emerald-500 to-teal-600',
    history: [
      {
        id: 'v-1601',
        locationName: 'Adajan Isolated Lanes',
        area: 'Adajan',
        enteredAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        exitedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
        durationMinutes: 30
      }
    ]
  },
  {
    id: 'girl-17',
    name: 'Isha Joshi',
    phone: '+91 97777 88888',
    latitude: 21.1550,
    longitude: 72.8450,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-indigo-500 to-blue-600',
    history: [
      {
        id: 'v-1701',
        locationName: 'Chowk Bazaar Market',
        area: 'Chowk Bazaar',
        enteredAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        exitedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
        durationMinutes: 30
      }
    ]
  },
  {
    id: 'girl-18',
    name: 'Mansi Singhal',
    phone: '+91 98888 99999',
    latitude: 21.1350,
    longitude: 72.7850,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-teal-500 to-cyan-600',
    history: []
  },
  {
    id: 'girl-19',
    name: 'Gauri Trivedi',
    phone: '+91 99999 00000',
    latitude: 21.1650,
    longitude: 72.7750,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-violet-500 to-purple-600',
    history: []
  },
  {
    id: 'girl-20',
    name: 'Rhea Kapoor',
    phone: '+91 90000 11111',
    latitude: 21.2150,
    longitude: 72.7850,
    status: 'safe',
    lastSeen: new Date().toISOString(),
    avatarColor: 'from-pink-500 to-rose-600',
    history: []
  }
];


