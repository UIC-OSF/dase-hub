/**
 * Team data migrated from Jemma's prototype pages (a11ydoer.github.io/uic: project-portfolio.html and raci.html).
 * Edit here to change the Project Portfolio and RACI pages.
 */

export interface Project { title: string; tags: string[]; description: string; items: string[]; team: string[] }

// Names, order and tags are Jemma's (Nov 12, 2026). "Equalify Platform Integration and Training" combines the
// former "Equalify Transition and Training" and "Equalify Integration" cards. Tags are listed alphabetically.
// Scope doc, Nov 23, 2026: teams list full-time members only; Helen's edits renamed the Title II card, rewrote
// Partnership and Outreach, and added "Accessibility Evaluation and Exception Review" (its tags and team are a best guess).
export const PROJECT_TAGS = ['Compliance', 'Cost reduction', 'Engineering', 'Flagship', 'Ongoing', 'Partnership', 'Services', 'Sustainability'] as const;
export type ProjectTag = typeof PROJECT_TAGS[number];

export const PROJECTS: Project[] = [
    {
        "title": "ADA Title II Compliance Preparation",
        "tags": [
            "Compliance",
            "Engineering",
            "Partnership",
            "Services"
        ],
        "description": "Strategic preparation to ensure full compliance with ADA Title II regulations by upcoming deadlines.",
        "items": [
            "Gap Analysis",
            "Policy Updates",
            "Remediation Priority Plan",
            "UIC Accessibility Report"
        ],
        "team": [
            "Jemma Ku",
            "Helen Zhou",
            "Blake Bertuccelli-Booth"
        ]
    },
    {
        "title": "Accessibility Training and Consultation Services",
        "tags": [
            "Compliance",
            "Ongoing",
            "Services"
        ],
        "description": "Comprehensive training programs designed to empower faculty and staff with the knowledge to create accessible content.",
        "items": [
            "Instructor-Led Workshops",
            "Self-Paced Online Modules",
            "Department-Specific Sessions",
            "One-on-One Consultation Services"
        ],
        "team": [
            "Helen Zhou",
            "Michael Fu"
        ]
    },
    {
        "title": "Accessibility Partnership and Outreach",
        "tags": [
            "Flagship",
            "Ongoing",
            "Partnership",
            "Services"
        ],
        "description": "Building campus partnerships and engaging the university community through the Accessibility Liaison Program, collaborative events, and outreach activities.",
        "items": [
            "Campus Engagement and Collaborative Initiatives",
            "Onsite Faculty Workshops",
            "Annual Accessibility Liaison Workshop",
            "Accessibility Liaison Program"
        ],
        "team": [
            "Helen Zhou",
            "Michael Fu"
        ]
    },
    {
        "title": "Accessibility Evaluation and Exception Review",
        "tags": [
            "Compliance",
            "Ongoing",
            "Services"
        ],
        "description": "Upon request, evaluating UIC-developed applications and third-party platforms and applications adopted for campus-wide use. Reviewing accessibility documentation and providing guidance to support accessibility assessments and exception decisions.",
        "items": [
            "Accessibility Exception Review and Recommendations",
            "Document Accessibility Evaluation Guidance",
            "VPAT/ACR Review and Assessment",
            "Third-Party Platform and Application Evaluations",
            "UIC-Developed Application Evaluations"
        ],
        "team": [
            "Helen Zhou",
            "Michael Fu",
            "Jemma Ku"
        ]
    },
    {
        "title": "Equalify Accessibility Dashboard",
        "tags": [
            "Compliance",
            "Engineering",
            "Flagship"
        ],
        "description": "Deployment and integration of the Equalify platform to automate scanning and reporting across university digital assets.",
        "items": [
            "System-wide Rollout",
            "Integration with CMS",
            "User Feedback Loop",
            "Accessibility Manual Testing",
            "Roadmap"
        ],
        "team": [
            "Blake Bertuccelli-Booth",
            "Christopher Aitken",
            "Daniel (Trey) Samuel"
        ]
    },
    {
        "title": "Equalify Iris (Accessible PDF generation)",
        "tags": [
            "Cost reduction",
            "Engineering",
            "Flagship"
        ],
        "description": "AI-driven solution for automated PDF accessibility remediation and tagging.",
        "items": [
            "Automated Document Tagging",
            "Structural Analysis",
            "Iris Integration"
        ],
        "team": [
            "Blake Bertuccelli-Booth",
            "Jemma Ku"
        ]
    },
    {
        "title": "Equalify Platform Integration and Training",
        "tags": [
            "Cost reduction",
            "Engineering",
            "Flagship",
            "Ongoing",
            "Services"
        ],
        "description": "Bringing campus units onto Equalify with migration support and training, and integrating the platform with core university systems.",
        "items": [
            "Platform Migration Support",
            "User Onboarding Sessions",
            "Documentation & Guides",
            "Content management system integration and utilities (e.g., WordPress)",
            "Learning management system integration (e.g., Canvas)"
        ],
        "team": [
            "Helen Zhou",
            "Jemma Ku",
            "Michael Fu",
            "Blake Bertuccelli-Booth",
            "Daniel (Trey) Samuel",
            "Christopher Aitken"
        ]
    },
    {
        "title": "UIC Open-source fund",
        "tags": [
            "Cost reduction",
            "Flagship",
            "Partnership",
            "Sustainability"
        ],
        "description": "Supporting open-source projects that contribute to the digital accessibility ecosystem.",
        "items": [
            "Grant Applications",
            "Project Selection",
            "Community Collaboration"
        ],
        "team": [
            "Jemma Ku",
            "Blake Bertuccelli-Booth"
        ]
    },
    {
        "title": "AI Literacy Education program",
        "tags": [
            "Cost reduction",
            "Flagship",
            "Partnership",
            "Sustainability"
        ],
        "description": "Educational initiatives to improve understanding and ethical use of Artificial Intelligence in accessibility.",
        "items": [
            "Foundational Workshops",
            "Tool Evaluation Guidelines",
            "Accessibility Implications",
            "Professional Development"
        ],
        "team": [
            "Blake Bertuccelli-Booth",
            "Jemma Ku"
        ]
    }
];

export const RACI_MEMBERS: { id: string; name: string }[] = [
    {
        "id": "jemma",
        "name": "Jemma"
    },
    {
        "id": "helen",
        "name": "Helen"
    },
    {
        "id": "blake",
        "name": "Blake"
    },
    {
        "id": "chris-a",
        "name": "Chris A"
    },
    {
        "id": "michael",
        "name": "Michael"
    },
    {
        "id": "michelle",
        "name": "Michelle"
    },
    {
        "id": "dylan",
        "name": "Dylan"
    },
    {
        "id": "chris-k",
        "name": "Christopher K"
    },
    {
        "id": "trey",
        "name": "Trey"
    },
    {
        "id": "lucy",
        "name": "Lucy"
    },
    {
        "id": "brother-j",
        "name": "Brother J"
    },
    {
        "id": "stefin",
        "name": "Stefin"
    }
];

/** The RACI page lists full-time team members only (Jemma, Nov 12, 2026). The other columns stay in the data. */
export const RACI_FULL_TIME = ['jemma', 'helen', 'blake', 'chris-a', 'michael', 'trey'];
/** Their "Informed" lists were long, so those are left off their cards (scope doc, Nov 23, 2026). */
export const RACI_HIDE_INFORMED = ['chris-a', 'michael', 'trey'];

/** One row per activity; values are R, A, C, I or a combination like 'A/R', keyed by member id. */
export const RACI_ACTIVITIES: { activity: string; raci: Record<string, string> }[] = [
    {"activity": "Accessibility Training and Consultation Services", "raci": {"jemma": "C", "helen": "A", "blake": "C", "chris-a": "I", "michael": "R", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "R", "brother-j": "I", "stefin": "I"}},
    {"activity": "Equalify Accessibility Dashboard", "raci": {"jemma": "A", "helen": "C", "blake": "A/R", "chris-a": "R", "michael": "C", "michelle": "I", "dylan": "R", "chris-k": "R", "trey": "R", "lucy": "R", "brother-j": "R", "stefin": "I"}},
    {"activity": "Equalify Platform Integration and Training", "raci": {"jemma": "A", "helen": "R", "blake": "R", "chris-a": "C", "michael": "R", "michelle": "I", "dylan": "C", "chris-k": "C", "trey": "C", "lucy": "R", "brother-j": "I", "stefin": "I"}},
    {"activity": "UIC Open Source Fund", "raci": {"jemma": "A", "helen": "C", "blake": "R", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "R"}},
    {"activity": "ADA Title II Preparation", "raci": {"jemma": "A/R", "helen": "R", "blake": "R", "chris-a": "C", "michael": "C", "michelle": "I", "dylan": "C", "chris-k": "C", "trey": "C", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "AI Literacy", "raci": {"jemma": "A", "helen": "C", "blake": "A", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "R"}},
    {"activity": "Accessibility Outreach", "raci": {"jemma": "C", "helen": "A", "blake": "C", "chris-a": "I", "michael": "R", "michelle": "R", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Scaling Accessibility Impact Beyond UIC", "raci": {"jemma": "A", "helen": "C", "blake": "R", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "R"}},
    {"activity": "Accessibility Resources and Tools", "raci": {"jemma": "I", "helen": "A", "blake": "R", "chris-a": "I", "michael": "C", "michelle": "I", "dylan": "C", "chris-k": "C", "trey": "C", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Equalify Iris", "raci": {"jemma": "I", "helen": "I", "blake": "R", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "R", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Equalify Roadmap", "raci": {"jemma": "", "helen": "C", "blake": "R", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Equalify Manual testing", "raci": {"jemma": "I", "helen": "C", "blake": "A", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "R", "trey": "I", "lucy": "R", "brother-j": "R", "stefin": "I"}},
    {"activity": "UIC Accessibility Maturity Model", "raci": {"jemma": "R", "helen": "C", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "R", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "UIC Accessibility Report", "raci": {"jemma": "C", "helen": "R", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "DASE Team Support", "raci": {"jemma": "I", "helen": "A", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "R", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Equalify Infrastructure", "raci": {"jemma": "I", "helen": "C", "blake": "C", "chris-a": "R", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Exception Review Process", "raci": {"jemma": "A", "helen": "R", "blake": "C", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "UIC Stakeholder Management", "raci": {"jemma": "A/R", "helen": "I", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Budget Planning", "raci": {"jemma": "A", "helen": "I", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Accessibility Technology Procurement", "raci": {"jemma": "C", "helen": "R", "blake": "C", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Accessibility Evaluation", "raci": {"jemma": "A", "helen": "R", "blake": "I", "chris-a": "I", "michael": "R", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "R", "brother-j": "R", "stefin": "I"}},
    {"activity": "Scheduling Team Meetings", "raci": {"jemma": "", "helen": "I", "blake": "I", "chris-a": "I", "michael": "I", "michelle": "R", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    {"activity": "Managing the Engineering Team and Open Source Fund Communication", "raci": {"jemma": "C", "helen": "I", "blake": "C", "chris-a": "I", "michael": "I", "michelle": "R", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "C"}},
    {"activity": "Broadening Accessibility Through Open and Shared Initiatives", "raci": {"jemma": "C", "helen": "I", "blake": "A", "chris-a": "I", "michael": "I", "michelle": "I", "dylan": "I", "chris-k": "I", "trey": "I", "lucy": "I", "brother-j": "I", "stefin": "I"}},
    // Added from the scope doc, Nov 23, 2026. Only the named person's role was given.
    {"activity": "DASE Hub", "raci": {"chris-a": "R"}},
    {"activity": "Strategic Planning", "raci": {"jemma": "R"}},
    {"activity": "Accessibility Litigation", "raci": {"jemma": "A"}},
];

/**
 * OKRA Objective 7 as submitted in 2025 (source: the OKRA submission Jemma shared, Nov 2026).
 * `percent` is the "% Complete" reported there, not a live figure.
 */
export const OKRA_OBJECTIVE = {
    number: 7,
    statement: 'Ensure compliance with ADA Title II changes with specific focus on course materials and public websites, including the Red platform.',
    owner: 'Matthew Riley',
    keyResults: [
        { title: 'Public websites scanned', metric: 'Improve accessibility of public websites in compliance with ADA Title II. Scanning sites provides actionable information to site owners and content managers.', baseline: '770 sites (original) / 1,121 (current)', target: '1,200 sites', cycle: 'May 2026', percent: 90, owner: 'Jason Maslanka' },
        { title: 'Remediation training opportunities', metric: 'Provide 120 training opportunities on how to remediate digital content.', baseline: '72 training opportunities', target: '120 trainings by April 2027', cycle: 'Current year', percent: 0, owner: 'Jemma Ku' },
        { title: 'Guides, videos and workshops', metric: 'Provide guides, videos, and workshops to demonstrate how to create accessible digital content for teaching and learning.', baseline: '24 workshops offered', target: 'Guides for 50% of teaching and learning applications; 45 workshops by end of 2026; a video and guide library by end of 2027; 50 workshops in 2027', cycle: 'Current year', percent: 25, owner: 'Bryan Libbin' },
        { title: 'Red PDFs remediated', metric: 'Remediate inaccessible PDF documents in the Red website platform.', baseline: '2,775 (57% of 4,895 inaccessible PDFs)', target: '65%', cycle: 'Current year', percent: 87, owner: 'Jason Maslanka' },
        { title: 'Accessible YouTube videos', metric: 'Make publicly available UIC YouTube videos accessible (24,594 public videos).', baseline: '754 accessible videos', target: '12,000 accessible videos', cycle: 'Current year (of a multi-year effort)', percent: 6, owner: 'Jemma Ku' },
    ],
};

// Testimonials, from Jemma's prototype site (a11ydoer.github.io/uic/testimonials.html) and the team's
// "Team Testimonials" document (Nov 12, 2026). All are anonymous until consent is obtained.
// To add one, append an entry. `category` groups quotes under a heading once any entry has one;
// `source` is an optional attribution line (a role or unit, not a person's name unless they agreed).
export interface Testimonial { quote: string; source?: string; category?: string }
export const TESTIMONIALS: Testimonial[] = [
    { category: "General Services & Websites", quote: "Your homepage shows the community of folks who have invested in training, and it's like, wow, this is a lot of people who really believe in supporting digital accessibility. That drew me to your site and implies that UIC is doing some incredible things." },
    { category: "General Services & Websites", quote: "I looked around your website, the documents, the support, and everything you offer is really impressive. It allows for your community to have self-service—first you're training them, and then you are offering those support elements very openly." },
    { category: "General Services & Websites", quote: "I get the sense that your work is [authentic] and not a look-alike... I can see that you truly are doing the work by the community members who are there, and really, the thought and effort that has been placed into all of the resources that you're providing." },
    { category: "General Services & Websites", quote: "We love your accessibility site! I am the co-chair of the Oklahoma Council of Excellence Accessibility Committee and we are doing a presentation and sharing your site as a resource... Your site is amazing!" },
    { category: "Training & Consultations", quote: "...really good session today. Lots of learning for me. Your team was 100% spot on! The presentation, the answered questions and feedback. All stellar!" },
    { category: "Training & Consultations", quote: "...your team was on fire today. Presentation, instructions, Q&A. You all did an amazing job with excellence, intelligence, and grace! Thank you." },
    { category: "Training & Consultations", quote: "Very informative workshops! Thanks for all your hard work in making this happen + for the training sessions!" },
    { category: "Training & Consultations", quote: "Thanks so much! I've learned a lot from this training!" },
    { category: "Training & Consultations", quote: "THANK YOU for meeting with me today! The Dean was very impressed with the work done and I gave all the credit to you all!" },
    { category: "Training & Consultations", quote: "...you have guided me over the past few consultations which allowed me to figure it out! I was able to submit my dissertation, and it was approved by the graduate college! Thank you sooo much for your help!" },
];
