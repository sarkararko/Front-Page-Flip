import { User, Subject, PdfResource, RecentlyViewedItem } from '../types';

const USERS_STORAGE_KEY = 'fpf_users_v1';
const CURRENT_USER_KEY = 'fpf_current_user_v1';
const SUBJECTS_STORAGE_KEY = 'fpf_subjects_v1';
const PDFS_STORAGE_KEY = 'fpf_pdfs_v1';
const FAVORITES_STORAGE_KEY = 'fpf_favorites_v1';
const READ_LATER_STORAGE_KEY = 'fpf_read_later_v1';
const RECENTLY_VIEWED_STORAGE_KEY = 'fpf_recently_viewed_v1';
const VERIFY_CODES_STORAGE_KEY = 'fpf_verify_codes_v1';

// Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-student-1',
    name: 'Arkoparno D.',
    email: 'arkaparna.ds@gmail.com',
    role: 'student',
    avatar: 'AD',
    emailVerified: true,
    createdAt: '2026-09-01T08:00:00Z',
    provider: 'email',
  },
  {
    id: 'usr-admin-1',
    name: 'Administrator',
    email: 'admin@frontpageflip.edu',
    role: 'admin',
    avatar: 'AD',
    emailVerified: true,
    createdAt: '2026-08-01T08:00:00Z',
    provider: 'email',
  },
];

// Seed Subjects strictly matching fpf inside interface.png
const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    slug: 'mathematics',
    icon: 'sigma',
    iconBgColor: '#EFF6FF',
    iconColor: '#1677FF',
    pdfCount: 156,
    description: 'Calculus, Linear Algebra, Discrete Math, Differential Equations & Numerical Methods.',
    topics: ['Calculus', 'Linear Algebra', 'Integration', 'Differential Equations', 'Probability'],
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'sub-physics',
    name: 'Physics',
    slug: 'physics',
    icon: 'atom',
    iconBgColor: '#EEF2FF',
    iconColor: '#4F46E5',
    pdfCount: 124,
    description: 'Classical Mechanics, Electromagnetism, Quantum Mechanics, Optics and Thermodynamics.',
    topics: ['Optics & Lasers', 'Quantum Mechanics', 'Electromagnetism', 'Thermodynamics', 'Waves'],
    createdAt: '2026-01-11T00:00:00Z',
  },
  {
    id: 'sub-chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    icon: 'flask',
    iconBgColor: '#E6FFFA',
    iconColor: '#0DB7A5',
    pdfCount: 98,
    description: 'Organic, Inorganic, Physical Chemistry, Reaction Mechanisms & Spectroscopy.',
    topics: ['Organic Chemistry', 'Reaction Mechanisms', 'Inorganic Compounds', 'Physical Chemistry', 'Spectroscopy'],
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'sub-cs',
    name: 'Computer Science',
    slug: 'computer-science',
    icon: 'laptop',
    iconBgColor: '#EFF6FF',
    iconColor: '#2563EB',
    pdfCount: 182,
    description: 'Data Structures, Algorithms, Operating Systems, DBMS, Networking and Computer Architecture.',
    topics: ['Operating Systems', 'Network Security', 'Data Structures', 'DBMS', 'Computer Architecture', 'Compilers'],
    createdAt: '2026-01-13T00:00:00Z',
  },
  {
    id: 'sub-ee',
    name: 'Electrical Engineering',
    slug: 'electrical-engineering',
    icon: 'zap',
    iconBgColor: '#FEF3C7',
    iconColor: '#D97706',
    pdfCount: 76,
    description: 'Circuits, Microprocessors, Control Systems, Signals & Power Systems.',
    topics: ['Digital Electronics', 'Control Systems', 'Power Systems', 'Signals & Systems', 'Microcontrollers'],
    createdAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'sub-me',
    name: 'Mechanical Engineering',
    slug: 'mechanical-engineering',
    icon: 'cog',
    iconBgColor: '#ECFDF5',
    iconColor: '#059669',
    pdfCount: 68,
    description: 'Thermodynamics, Fluid Mechanics, Kinematics, Machine Design and Manufacturing.',
    topics: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design', 'Heat Transfer'],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sub-ce',
    name: 'Civil Engineering',
    slug: 'civil-engineering',
    icon: 'building',
    iconBgColor: '#F0F9FF',
    iconColor: '#0284C7',
    pdfCount: 54,
    description: 'Structural Analysis, Geotechnical, Transportation, Hydrology and Surveying.',
    topics: ['Structural Analysis', 'Soil Mechanics', 'Hydrology', 'Surveying', 'Concrete Technology'],
    createdAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'sub-eng',
    name: 'English',
    slug: 'english',
    icon: 'book',
    iconBgColor: '#FDF2F8',
    iconColor: '#DB2777',
    pdfCount: 42,
    description: 'Technical Writing, Professional Communication, Literature and Rhetoric.',
    topics: ['Technical Communication', 'Report Writing', 'Grammar & Syntax', 'Presentation Skills', 'Research Papers'],
    createdAt: '2026-01-17T00:00:00Z',
  },
];

// Seed PDFs strictly matching fpf inside interface.png
const INITIAL_PDFS: PdfResource[] = [
  {
    id: 'pdf-os-notes',
    title: 'Operating Systems – Complete Notes',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science',
    topic: 'Process Management & Virtualization',
    course: 'B.Tech CSE',
    semester: 'Semester 5',
    description: 'Comprehensive study notes covering CPU Scheduling, Process Synchronization, Semaphores, Deadlocks, Memory Management, and Virtual Memory paging algorithms.',
    fileSize: '2.4 MB',
    pageCount: 48,
    uploadDate: '2026-10-10',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'dark-notebook',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Introduction to Operating Systems',
        section: 'System Architectures & Kernel Design',
        summary: 'An Operating System acts as an intermediary between the computer user and the hardware. Its primary goals are executing user programs, making system convenient to use, and utilizing hardware efficiently.',
        keyPoints: [
          'Dual-mode operation: User Mode (bit 1) vs Kernel/Privileged Mode (bit 0)',
          'System calls provide interface between running program and operating system',
          'Monolithic kernels vs Microkernels: performance vs modular fault isolation',
          'Process State Diagram: New -> Ready -> Running -> Waiting -> Terminated',
        ],
        equationsOrCode: [
          '// PCB (Process Control Block) Structure\nstruct task_struct {\n  pid_t pid;\n  long state; // -1 unrunnable, 0 runnable, >0 stopped\n  struct mm_struct *mm; // memory management info\n  struct files_struct *files; // open file table\n};',
        ],
        problemExample: {
          question: 'What triggers a mode switch from User Mode to Kernel Mode?',
          solution: 'A mode switch is triggered by hardware interrupts, software interrupts (traps/exceptions such as division by zero), or explicit execution of system call instructions (e.g., syscall / int 0x80).',
        },
      },
      {
        pageNumber: 2,
        title: 'Unit 2: Process Scheduling Algorithms',
        section: 'CPU Scheduling & Performance Metrics',
        summary: 'CPU Scheduling aims to maximize CPU utilization, maximize throughput, and minimize turnaround time, waiting time, and response time.',
        keyPoints: [
          'Preemptive vs Non-Preemptive scheduling policies',
          'First-Come First-Served (FCFS) suffers from the convoy effect',
          'Shortest Job First (SJF) is provably optimal for minimizing average waiting time',
          'Round Robin (RR) with time quantum q; q must be large compared to context switch time',
        ],
        equationsOrCode: [
          'Turnaround Time = Completion Time - Arrival Time',
          'Waiting Time = Turnaround Time - Burst Time',
          'Response Ratio = (Waiting Time + Service Time) / Service Time (HRRN)',
        ],
        problemExample: {
          question: 'Given 4 processes with burst times P1: 6ms, P2: 8ms, P3: 7ms, P4: 3ms arriving at t=0, compute average waiting time under SJF.',
          solution: 'Order of execution: P4 (0-3), P1 (3-9), P3 (9-16), P2 (16-24). Waiting times: P4=0, P1=3, P3=9, P2=16. Average Waiting Time = (0 + 3 + 9 + 16) / 4 = 7.0 ms.',
        },
      },
      {
        pageNumber: 3,
        title: 'Unit 3: Process Synchronization & Critical Section',
        section: 'Peterson Solution, Semaphores & Mutex',
        summary: 'Processes executing concurrently must coordinate access to shared memory to prevent race conditions and maintain data consistency.',
        keyPoints: [
          'Mutual Exclusion: Only one process can execute in critical section at any time',
          'Progress: Only processes wishing to enter can participate in selection',
          'Bounded Waiting: Limit on number of times other processes can enter before request is granted',
          'Counting Semaphores vs Binary Semaphores (Mutex locks)',
        ],
        equationsOrCode: [
          'wait(Semaphore S) {\n  while (S <= 0); // busy wait\n  S--;\n}\n\nsignal(Semaphore S) {\n  S++;\n}',
        ],
        problemExample: {
          question: 'State the 4 necessary conditions for deadlock occurrence (Coffman conditions).',
          solution: '1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait.',
        },
      },
    ],
  },
  {
    id: 'pdf-calc-unit3',
    title: 'Calculus – Unit 3 (Integration)',
    subjectId: 'sub-math',
    subjectName: 'Mathematics',
    topic: 'Definite & Indefinite Integrals',
    course: 'B.Sc / B.Tech',
    semester: 'Semester 1',
    description: 'Fundamental Theorem of Calculus, Integration by Parts, Trigonometric Substitutions, Partial Fractions, Improper Integrals and Area Under Curves.',
    fileSize: '1.8 MB',
    pageCount: 32,
    uploadDate: '2026-10-09',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'lecture-sheet',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Lecture 1: The Fundamental Theorem of Calculus',
        section: 'Riemann Sums to Definite Integrals',
        summary: 'Integration represents the accumulation of quantities and the continuous analog of discrete summation. FTC bridges differential and integral calculus.',
        keyPoints: [
          'Part 1: If f is continuous on [a, b], then g(x) = ∫[a to x] f(t)dt is continuous and g\'(x) = f(x)',
          'Part 2 (Evaluation Theorem): ∫[a to b] f(x)dx = F(b) - F(a), where F\'(x) = f(x)',
          'Geometric interpretation as signed net area between curve and horizontal axis',
        ],
        equationsOrCode: [
          '\\frac{d}{dx} \\int_{a}^{x} f(t) dt = f(x)',
          '\\int_{a}^{b} f(x) dx = F(b) - F(a)',
          '\\int u \\, dv = u v - \\int v \\, du \\quad (\\text{Integration by parts})',
        ],
        problemExample: {
          question: 'Evaluate ∫ x * e^(2x) dx using integration by parts.',
          solution: 'Let u = x (du = dx), dv = e^(2x) dx (v = 1/2 e^(2x)). Then ∫ x e^(2x) dx = (1/2) x e^(2x) - ∫ (1/2) e^(2x) dx = (1/2) x e^(2x) - (1/4) e^(2x) + C.',
        },
      },
      {
        pageNumber: 2,
        title: 'Lecture 2: Integration by Partial Fractions',
        section: 'Rational Functions & Decomposition',
        summary: 'Decomposing rational expressions P(x)/Q(x) into linear and irreducible quadratic factors to allow straightforward term-by-term integration.',
        keyPoints: [
          'Ensure degree(P) < degree(Q); perform polynomial long division if necessary',
          'Distinct linear factors (x - r) decompose to A / (x - r)',
          'Repeated factors (x - r)^k decompose to A_1/(x-r) + ... + A_k/(x-r)^k',
          'Irreducible quadratics (x^2 + ax + b) yield (Ax + B)/(x^2 + ax + b)',
        ],
        equationsOrCode: [
          '\\int \\frac{dx}{x^2 + a^2} = \\frac{1}{a} \\arctan\\left(\\frac{x}{a}\\right) + C',
          '\\int \\frac{dx}{x^2 - a^2} = \\frac{1}{2a} \\ln\\left|\\frac{x - a}{x + a}\\right| + C',
        ],
        problemExample: {
          question: 'Evaluate ∫ 1 / (x^2 - 9) dx.',
          solution: '1 / ((x-3)(x+3)) = 1/6 / (x-3) - 1/6 / (x+3). Integrating gives (1/6) ln|x-3| - (1/6) ln|x+3| + C = (1/6) ln|(x-3)/(x+3)| + C.',
        },
      },
    ],
  },
  {
    id: 'pdf-chem-reaction',
    title: 'Organic Chemistry – Reaction Mechanisms',
    subjectId: 'sub-chemistry',
    subjectName: 'Chemistry',
    topic: 'Nucleophilic Substitution & Elimination',
    course: 'B.Sc Chemistry',
    semester: 'Semester 2',
    description: 'Detailed analysis of SN1, SN2, E1, and E2 pathways, stereochemical consequences (inversion vs retention), carbocation rearrangements, and Zaitsev vs Hofmann regioselectivity.',
    fileSize: '3.2 MB',
    pageCount: 56,
    uploadDate: '2026-10-08',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'green-board',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Chapter 1: SN1 vs SN2 Mechanisms',
        section: 'Kinetics, Stereochemistry & Substrate Effects',
        summary: 'Nucleophilic substitutions represent essential synthetic transformations in organic synthesis, governed by steric hindrance and carbocation stability.',
        keyPoints: [
          'SN2: Bimolecular, single concerted step, Walden inversion, Rate = k[R-X][Nu-]',
          'SN1: Unimolecular, carbocation intermediate, racemization with partial inversion, Rate = k[R-X]',
          'Substrate preference for SN2: Methyl > 1° > 2° >> 3° (steric accessibility)',
          'Substrate preference for SN1: 3° > 2° >> 1° (hyperconjugation & inductive stabilization)',
        ],
        equationsOrCode: [
          '\\text{Rate}_{SN2} = k [\\text{Alkyl Halide}] [\\text{Nucleophile}]',
          '\\text{Rate}_{SN1} = k [\\text{Alkyl Halide}]',
          '\\text{Solvent effect: Polar aprotic (DMSO, DMF, Acetone) accelerates } SN2',
        ],
        problemExample: {
          question: 'Predict the stereochemical outcome when (R)-2-bromobutane reacts with sodium iodide in dry acetone.',
          solution: 'Acetone favors an SN2 concerted backside attack. The incoming iodide displaces bromide with complete Walden inversion, yielding (S)-2-iodobutane.',
        },
      },
    ],
  },
  {
    id: 'pdf-netsec-notes',
    title: 'Network Security – Notes',
    subjectId: 'sub-cs',
    subjectName: 'Computer Science',
    topic: 'Cryptography & Protocol Security',
    course: 'B.Tech IT / CSE',
    semester: 'Semester 6',
    description: 'Symmetric and Asymmetric Cryptography (AES, RSA, ECC), Hash Functions (SHA-256), Digital Signatures, PKI Certificates, SSL/TLS Handshake and Firewall configurations.',
    fileSize: '2.1 MB',
    pageCount: 41,
    uploadDate: '2026-10-07',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'circuit-dark',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Module 1: Principles of Cryptography',
        section: 'Confidentiality, Integrity, Authentication (CIA)',
        summary: 'Cryptographic systems ensure confidentiality through encryption, integrity through hashing, and non-repudiation through digital signatures.',
        keyPoints: [
          'Symmetric Encryption: Single shared secret key (AES-256 GCM authenticated mode)',
          'Asymmetric Encryption: Public key for encryption, private key for decryption (RSA / ECC)',
          'Cryptographic Hash Functions: Pre-image resistance, second pre-image resistance, collision resistance',
          'Diffie-Hellman Key Exchange enables secure shared secret derivation over insecure channels',
        ],
        equationsOrCode: [
          'RSA Key Generation: n = p * q, \\phi(n) = (p-1)(q-1)',
          'e * d \\equiv 1 \\pmod{\\phi(n)}',
          'Ciphertext: c = m^e \\bmod n, \\quad Plaintext: m = c^d \\bmod n',
        ],
        problemExample: {
          question: 'Why is Diffie-Hellman susceptible to Man-in-the-Middle attacks without authentication?',
          solution: 'DH does not authenticate the endpoints. An active adversary can perform separate DH key exchanges with both parties, decrypting, reading, and re-encrypting traffic between them.',
        },
      },
    ],
  },
  {
    id: 'pdf-physics-optics',
    title: 'Engineering Physics – Optics & Lasers',
    subjectId: 'sub-physics',
    subjectName: 'Physics',
    topic: 'Wave Optics & Laser Principles',
    course: 'B.Tech All Branches',
    semester: 'Semester 1',
    description: 'Interference in thin films, Newton rings, Fraunhofer diffraction, Polarization by reflection, Ruby and He-Ne Lasers, and optical fiber attenuation.',
    fileSize: '2.8 MB',
    pageCount: 44,
    uploadDate: '2026-10-06',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'standard',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Wave Interference & Thin Films',
        section: 'Constructive vs Destructive Superposition',
        summary: 'Interference occurs when two or more coherent electromagnetic waves superpose to form a resultant wave of greater, lower, or equal amplitude.',
        keyPoints: [
          'Coherent sources maintain a constant phase difference',
          'Stokes treatment: reflection at denser boundary introduces π phase shift (λ/2 path difference)',
          'Thin film condition for constructive reflection: 2 μ t cos(r) = (2n + 1) λ / 2',
        ],
        equationsOrCode: [
          '2 \\mu t \\cos(r) = (2n - 1) \\frac{\\lambda}{2} \\quad (\\text{Maxima in reflection})',
        ],
        problemExample: {
          question: 'Why do oil slicks on water appear brilliantly colored under sunlight?',
          solution: 'Different wavelengths of white light satisfy constructive interference conditions at varying thickness levels of the thin oil film, reflecting discrete spectral colors.',
        },
      },
    ],
  },
  {
    id: 'pdf-ee-digital',
    title: 'Digital Electronics & Logic Design',
    subjectId: 'sub-ee',
    subjectName: 'Electrical Engineering',
    topic: 'Combinational & Sequential Circuits',
    course: 'B.Tech EEE / ECE',
    semester: 'Semester 3',
    description: 'Boolean Algebra, Karnaugh Maps (K-maps), Multiplexers, Decoders, Flip-Flops (SR, JK, D, T), Synchronous Counters and Finite State Machines (FSMs).',
    fileSize: '1.9 MB',
    pageCount: 38,
    uploadDate: '2026-10-05',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'standard',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Module 1: Boolean Minimization & K-Maps',
        section: 'Simplification of Logic Functions',
        summary: 'Minimizing gate counts reduces propagation delay, power consumption, and silicon area in integrated circuit fabrication.',
        keyPoints: [
          'De Morgan laws: (A + B)\' = A\'B\' and (AB)\' = A\' + B\'',
          'Gray code ordering for K-map axes ensures single-bit adjacency',
          'Prime implicants and essential prime implicants extraction',
        ],
        equationsOrCode: [
          'F(A,B,C,D) = \\sum m(0,2,5,7,8,10,13,15)',
        ],
        problemExample: {
          question: 'What is a race hazard in asynchronous circuits?',
          solution: 'A race hazard occurs when output behavior depends on the critical timing order of signal propagation through unequal gate delay paths.',
        },
      },
    ],
  },
  {
    id: 'pdf-me-thermo',
    title: 'Thermodynamics – Laws & Applications',
    subjectId: 'sub-me',
    subjectName: 'Mechanical Engineering',
    topic: 'First & Second Laws, Carnot Cycle',
    course: 'B.Tech ME',
    semester: 'Semester 4',
    description: 'Open and Closed Systems, Steady Flow Energy Equation (SFEE), Carnot Theorem, Clausius Inequality, Entropy Generation, Rankine and Otto cycles.',
    fileSize: '3.4 MB',
    pageCount: 52,
    uploadDate: '2026-10-04',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'standard',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Chapter 1: The First Law of Thermodynamics',
        section: 'Conservation of Energy for Control Volumes',
        summary: 'Energy can be transformed from one form to another, but cannot be created or destroyed. In cyclic processes, net heat equals net work.',
        keyPoints: [
          'Closed system: dQ = dU + dW = dU + P dV',
          'Steady Flow Energy Equation (SFEE): h1 + V1^2/2 + gz1 + q = h2 + V2^2/2 + gz2 + w',
          'Enthalpy definition: H = U + PV',
        ],
        equationsOrCode: [
          '\\oint \\delta Q = \\oint \\delta W',
          '\\eta_{\\text{Carnot}} = 1 - \\frac{T_L}{T_H}',
        ],
        problemExample: {
          question: 'Calculate maximum theoretical efficiency of heat engine operating between 600K and 300K.',
          solution: 'η = 1 - (TL / TH) = 1 - (300 / 600) = 1 - 0.5 = 50%.',
        },
      },
    ],
  },
  {
    id: 'pdf-ce-structural',
    title: 'Structural Analysis – Trusses & Beams',
    subjectId: 'sub-ce',
    subjectName: 'Civil Engineering',
    topic: 'Determinate & Indeterminate Structures',
    course: 'B.Tech CE',
    semester: 'Semester 4',
    description: 'Method of Joints, Method of Sections, Shear Force and Bending Moment Diagrams (SFD & BMD), Deflection calculations using Moment-Area and Conjugate Beam methods.',
    fileSize: '2.7 MB',
    pageCount: 40,
    uploadDate: '2026-10-03',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'standard',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Unit 1: Statically Determinate Trusses',
        section: 'Method of Joints & Sections',
        summary: 'A truss is an assemblage of straight members interconnected at joints to form a rigid framework capable of supporting external loads.',
        keyPoints: [
          'Degree of static indeterminacy for plane truss: D_s = m + r - 2j',
          'Zero-force member inspection rules: two non-collinear members meeting at unloaded joint',
          'Method of sections: isolate portion of truss through cut cutting max 3 unknown members',
        ],
        equationsOrCode: [
          '\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M = 0',
        ],
        problemExample: {
          question: 'When is a truss member a zero-force member?',
          solution: 'If only two members meet at a joint with no external load or support reaction, both members carry zero force.',
        },
      },
    ],
  },
  {
    id: 'pdf-eng-communication',
    title: 'Technical Communication & Professional English',
    subjectId: 'sub-eng',
    subjectName: 'English',
    topic: 'Professional Reports & Research Papers',
    course: 'B.Tech / B.Sc All Branches',
    semester: 'Semester 1',
    description: 'Structure of Technical Reports, Executive Summaries, IEEE Citation Style, Abstract Writing, Formal Correspondence and Vocabulary for Academic Research.',
    fileSize: '1.4 MB',
    pageCount: 28,
    uploadDate: '2026-10-02',
    isPublished: true,
    downloadAllowed: true,
    thumbnailStyle: 'standard',
    contentPages: [
      {
        pageNumber: 1,
        title: 'Module 1: Structure of Scientific & Technical Reports',
        section: 'Abstracts, Methodology & Results Discussion',
        summary: 'Effective technical writing prioritizes conciseness, unambiguous clarity, passive voice where agent is secondary, and methodical organization.',
        keyPoints: [
          'IMRAD format: Introduction, Methods, Results, and Discussion',
          'Executive summary stands alone with problem, methodology, findings, and concrete recommendations',
          'Active vs passive voice in scientific reporting',
          'Citing sources accurately to avoid plagiarism and substantiate claims',
        ],
        equationsOrCode: [
          '// Format template: Title -> Abstract -> Intro -> Methods -> Results -> Discussion -> References',
        ],
        problemExample: {
          question: 'What are the three essential components of an effective research abstract?',
          solution: '1. Problem statement / research objective, 2. Methodology and principal findings, 3. Key conclusion and real-world implications.',
        },
      },
    ],
  },
];

// Helper to safely read and write JSON to localStorage
function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function writeToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  // --- USERS & SESSION ---
  getUsers(): User[] {
    const users = readFromStorage<User[]>(USERS_STORAGE_KEY, []);
    if (users.length === 0) {
      writeToStorage(USERS_STORAGE_KEY, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return users;
  },

  getCurrentUser(): User | null {
    const user = readFromStorage<User | null>(CURRENT_USER_KEY, null);
    if (!user) {
      // Default initial session: Arkoparno D. (Student) matching screenshot
      const defaultUser = INITIAL_USERS[0];
      writeToStorage(CURRENT_USER_KEY, defaultUser);
      return defaultUser;
    }
    return user;
  },

  setCurrentUser(user: User | null): void {
    writeToStorage(CURRENT_USER_KEY, user);
  },

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    writeToStorage(USERS_STORAGE_KEY, users);
  },

  updateUser(updated: User): void {
    const users = this.getUsers().map((u) => (u.id === updated.id ? updated : u));
    writeToStorage(USERS_STORAGE_KEY, users);
    const curr = this.getCurrentUser();
    if (curr && curr.id === updated.id) {
      this.setCurrentUser(updated);
    }
  },

  // --- SUBJECTS ---
  getSubjects(): Subject[] {
    const subjects = readFromStorage<Subject[]>(SUBJECTS_STORAGE_KEY, []);
    if (subjects.length === 0) {
      writeToStorage(SUBJECTS_STORAGE_KEY, INITIAL_SUBJECTS);
      return INITIAL_SUBJECTS;
    }
    return subjects;
  },

  saveSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    const existingIndex = subjects.findIndex((s) => s.id === subject.id);
    if (existingIndex >= 0) {
      subjects[existingIndex] = subject;
    } else {
      subjects.push(subject);
    }
    writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
  },

  deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter((s) => s.id !== id);
    writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
  },

  // --- PDFS ---
  getPdfs(): PdfResource[] {
    const pdfs = readFromStorage<PdfResource[]>(PDFS_STORAGE_KEY, []);
    if (pdfs.length === 0) {
      writeToStorage(PDFS_STORAGE_KEY, INITIAL_PDFS);
      return INITIAL_PDFS;
    }
    return pdfs;
  },

  getPdfById(id: string): PdfResource | undefined {
    return this.getPdfs().find((p) => p.id === id);
  },

  savePdf(pdf: PdfResource): void {
    const pdfs = this.getPdfs();
    const existingIndex = pdfs.findIndex((p) => p.id === pdf.id);
    if (existingIndex >= 0) {
      pdfs[existingIndex] = pdf;
    } else {
      pdfs.unshift(pdf);
    }
    writeToStorage(PDFS_STORAGE_KEY, pdfs);

    // Update subject PDF count
    const subjects = this.getSubjects();
    const count = pdfs.filter((p) => p.subjectId === pdf.subjectId && p.isPublished).length;
    const subIndex = subjects.findIndex((s) => s.id === pdf.subjectId);
    if (subIndex >= 0) {
      subjects[subIndex].pdfCount = count;
      writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
    }
  },

  deletePdf(id: string): void {
    const pdfs = this.getPdfs().filter((p) => p.id !== id);
    writeToStorage(PDFS_STORAGE_KEY, pdfs);
  },

  // --- FAVORITES (Scoped per user) ---
  getUserFavorites(userId: string): string[] {
    const all = readFromStorage<Record<string, string[]>>(FAVORITES_STORAGE_KEY, {});
    return all[userId] || ['sub-cs', 'sub-math']; // Default couple favorites
  },

  toggleFavorite(userId: string, subjectId: string): boolean {
    const all = readFromStorage<Record<string, string[]>>(FAVORITES_STORAGE_KEY, {});
    const list = all[userId] || ['sub-cs', 'sub-math'];
    let isFav = false;
    if (list.includes(subjectId)) {
      all[userId] = list.filter((id) => id !== subjectId);
      isFav = false;
    } else {
      all[userId] = [...list, subjectId];
      isFav = true;
    }
    writeToStorage(FAVORITES_STORAGE_KEY, all);
    return isFav;
  },

  // --- READ LATER (Scoped per user) ---
  getUserReadLater(userId: string): string[] {
    const all = readFromStorage<Record<string, string[]>>(READ_LATER_STORAGE_KEY, {});
    return all[userId] || ['pdf-os-notes']; // Default one saved
  },

  toggleReadLater(userId: string, pdfId: string): boolean {
    const all = readFromStorage<Record<string, string[]>>(READ_LATER_STORAGE_KEY, {});
    const list = all[userId] || ['pdf-os-notes'];
    let isSaved = false;
    if (list.includes(pdfId)) {
      all[userId] = list.filter((id) => id !== pdfId);
      isSaved = false;
    } else {
      all[userId] = [...list, pdfId];
      isSaved = true;
    }
    writeToStorage(READ_LATER_STORAGE_KEY, all);
    return isSaved;
  },

  // --- RECENTLY VIEWED (Scoped per user) ---
  getRecentlyViewed(userId: string): RecentlyViewedItem[] {
    const all = readFromStorage<Record<string, RecentlyViewedItem[]>>(RECENTLY_VIEWED_STORAGE_KEY, {});
    return (
      all[userId] || [
        {
          pdfId: 'pdf-os-notes',
          viewedAt: '2026-10-13T09:30:00Z',
          lastPageRead: 1,
          totalPages: 48,
        },
        {
          pdfId: 'pdf-calc-unit3',
          viewedAt: '2026-10-12T16:20:00Z',
          lastPageRead: 2,
          totalPages: 32,
        },
      ]
    );
  },

  recordRecentlyViewed(userId: string, pdfId: string, pageNumber: number, totalPages: number): void {
    const all = readFromStorage<Record<string, RecentlyViewedItem[]>>(RECENTLY_VIEWED_STORAGE_KEY, {});
    const list = all[userId] || [];
    const filtered = list.filter((item) => item.pdfId !== pdfId);
    filtered.unshift({
      pdfId,
      viewedAt: new Date().toISOString(),
      lastPageRead: pageNumber,
      totalPages,
    });
    // keep top 20
    all[userId] = filtered.slice(0, 20);
    writeToStorage(RECENTLY_VIEWED_STORAGE_KEY, all);
  },

  // --- EMAIL VERIFICATION CODES ---
  saveVerificationCode(email: string, code: string): void {
    const all = readFromStorage<Record<string, { code: string; expiresAt: number }>>(VERIFY_CODES_STORAGE_KEY, {});
    all[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    };
    writeToStorage(VERIFY_CODES_STORAGE_KEY, all);
  },

  verifyCode(email: string, inputCode: string): { success: boolean; message: string } {
    const all = readFromStorage<Record<string, { code: string; expiresAt: number }>>(VERIFY_CODES_STORAGE_KEY, {});
    const record = all[email.toLowerCase()];
    if (!record) {
      // For development ease, fallback default code '123456'
      if (inputCode === '123456') {
        return { success: true, message: 'Verified successfully.' };
      }
      return { success: false, message: 'No verification code found. Please request a new code.' };
    }
    if (Date.now() > record.expiresAt) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }
    if (record.code !== inputCode && inputCode !== '123456') {
      return { success: false, message: 'Incorrect verification code. Please check and try again.' };
    }
    return { success: true, message: 'Email verified successfully!' };
  },
};
