export const CONTACT = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'speumat@example.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '+233 00 000 0000',
  address: 'Petroleum Engineering Department, University of Mines and Technology, Tarkwa, Ghana',
  whatsapp: import.meta.env.VITE_WHATSAPP_URL || 'https://wa.me/233000000000',
  telegram: import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/speumat',
  linkedin: import.meta.env.VITE_LINKEDIN_URL || 'https://www.linkedin.com/company/spe',
}

export const USERS = [
  {
    email: 'member@speumat.edu.gh',
    password: 'demo-member',
    name: 'Ama Boateng',
    role: 'member',
    memberId: 'umat-001',
  },
  {
    email: 'comms@speumat.edu.gh',
    password: 'demo-comms',
    name: 'Kwesi Mensah',
    role: 'communications',
    memberId: 'umat-002',
  },
  {
    email: 'org@speumat.edu.gh',
    password: 'demo-org',
    name: 'Efua Owusu',
    role: 'organization',
    memberId: 'umat-003',
  },
  {
    email: 'tech@speumat.edu.gh',
    password: 'demo-tech',
    name: 'Yaw Asante',
    role: 'technical',
    memberId: 'umat-004',
  },
]

export const MEMBERS = [
  {
    id: 'umat-001',
    name: 'Ama Boateng',
    email: 'member@speumat.edu.gh',
    programme: 'Petroleum Engineering',
    year: 'Level 300',
    code: '24018321',
    joined: '2024-09-12',
  },
  {
    id: 'umat-002',
    name: 'Kwesi Mensah',
    email: 'comms@speumat.edu.gh',
    programme: 'Petroleum Engineering',
    year: 'Level 400',
    code: '24018322',
    joined: '2023-10-02',
  },
  {
    id: 'umat-003',
    name: 'Efua Owusu',
    email: 'org@speumat.edu.gh',
    programme: 'Natural Gas Engineering',
    year: 'Level 400',
    code: '24018323',
    joined: '2023-10-02',
  },
  {
    id: 'umat-004',
    name: 'Yaw Asante',
    email: 'tech@speumat.edu.gh',
    programme: 'Petroleum Engineering',
    year: 'Level 300',
    code: '24018324',
    joined: '2024-01-18',
  },
  {
    id: 'umat-005',
    name: 'Akosua Darko',
    email: 'akosua.darko@example.com',
    programme: 'Geomatic Engineering',
    year: 'Level 200',
    code: '24018325',
    joined: '2025-02-04',
  },
  {
    id: 'umat-006',
    name: 'Kojo Appiah',
    email: 'kojo.appiah@example.com',
    programme: 'Mechanical Engineering',
    year: 'Level 300',
    code: '24018326',
    joined: '2024-11-09',
  },
]

export const EVENTS = [
  {
    id: 'evt-field-trip',
    title: 'Jubilee Field Technical Visit',
    date: '2026-11-08',
    time: '07:30',
    venue: 'Tarkwa Campus / Field departure',
    type: 'Field trip',
    summary: 'A guided technical visit focused on offshore operations, HSE, and production systems.',
    feeGhs: 30,
  },
  {
    id: 'evt-workshop',
    title: 'Petrel Fundamentals Workshop',
    date: '2026-10-28',
    time: '14:00',
    venue: 'Petroleum Computer Lab',
    type: 'Workshop',
    summary: 'Hands-on introduction to subsurface modelling for members preparing for internships.',
    feeGhs: 20,
  },
  {
    id: 'evt-induction',
    title: 'New Member Induction Night',
    date: '2026-11-21',
    time: '17:00',
    venue: 'Auditorium Annex',
    type: 'Chapter event',
    summary: 'Welcome session for new SPE UMaT members, executives briefing, and networking.',
    feeGhs: 0,
  },
]

export const NEWS = [
  {
    id: 'news-1',
    title: 'SPE UMaT opens 2026/27 membership window',
    date: '2026-10-10',
    body: 'Membership dues can now be paid online. New members receive a unique attendance code and QR card after registration.',
  },
  {
    id: 'news-2',
    title: 'Paper contest coaching starts this month',
    date: '2026-10-05',
    body: 'The Technical Committee will host weekly coaching for students preparing SPE paper contest abstracts.',
  },
]

export const MEDIA = [
  {
    id: 'media-1',
    kind: 'youtube',
    title: 'SPE International: Who we are',
    url: 'https://www.youtube.com/embed/oY59wE3N1nM',
    caption: 'Introduction to SPE as a global professional society.',
  },
  {
    id: 'media-2',
    kind: 'image',
    title: 'Campus briefing',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    caption: 'Members after a technical briefing on campus.',
  },
  {
    id: 'media-3',
    kind: 'image',
    title: 'Lab session',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    caption: 'Workshop practice in the engineering lab.',
  },
  {
    id: 'media-4',
    kind: 'image',
    title: 'Field conversations',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    caption: 'Industry engagement during a site visit.',
  },
  {
    id: 'media-5',
    kind: 'recording',
    title: 'HSE toolbox talk recording',
    url: 'https://www.youtube.com/embed/Scxs7L0vhZ4',
    caption: 'Recording of the last health, safety and environment session.',
  },
]

export const ATTENDANCE = [
  { id: 'att-1', eventId: 'evt-workshop', memberId: 'umat-001', date: '2026-09-20' },
  { id: 'att-2', eventId: 'evt-workshop', memberId: 'umat-002', date: '2026-09-20' },
  { id: 'att-3', eventId: 'evt-workshop', memberId: 'umat-003', date: '2026-09-20' },
  { id: 'att-4', eventId: 'evt-induction', memberId: 'umat-001', date: '2026-09-01' },
  { id: 'att-5', eventId: 'evt-field-trip', memberId: 'umat-004', date: '2026-08-15' },
]

export const MERIT = [
  { id: 'm-1', memberId: 'umat-001', type: 'event', points: 10, note: 'Workshop attendance', date: '2026-09-20' },
  { id: 'm-2', memberId: 'umat-001', type: 'volunteer', points: 15, note: 'Registration desk', date: '2026-09-01' },
  { id: 'm-3', memberId: 'umat-002', type: 'contribution', points: 20, note: 'Newsfile editing', date: '2026-10-05' },
  { id: 'm-4', memberId: 'umat-003', type: 'event', points: 10, note: 'Workshop attendance', date: '2026-09-20' },
  { id: 'm-5', memberId: 'umat-003', type: 'volunteer', points: 25, note: 'Event logistics lead', date: '2026-08-15' },
  { id: 'm-6', memberId: 'umat-004', type: 'contribution', points: 18, note: 'Dashboard prototype', date: '2026-10-01' },
]

export const PAYMENTS = [
  {
    id: 'pay-1',
    memberId: 'umat-001',
    item: 'Annual membership dues',
    amountGhs: 50,
    status: 'success',
    date: '2026-09-12',
    reference: 'SPE-DEMO-001',
  },
]

export const COMMITTEES = [
  { id: 'communications', name: 'Communications', blurb: 'Media, newsfile, website copy, and chapter visibility.' },
  { id: 'organization', name: 'Organization', blurb: 'Events, logistics, attendance, and member experience.' },
  { id: 'technical', name: 'Technical', blurb: 'Workshops, paper contest, and technical programmes.' },
]
